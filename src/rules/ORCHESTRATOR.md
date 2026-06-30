# Money Mitra — Orchestrator Contract (PM-Kisan slice)

This is the spec the runtime follows to turn a free-text user message into a
**grounded** Mukund reply. It sits *on top of* the existing Groq Mukund chat and
is flag-gated (`FLAGS.GROUNDED_MODE`) so today's free-gen chat is untouched until
we flip it on.

Data lives in [`rules.json`](./rules.json). The bot may quote a row **only** if
its `signoff_status === 'signed_off'`.

Loop: **fraud check → classify → resolve slots → retrieve → phrase**. Two LLM
calls per message (both Groq), everything between them is plain JS.

---

## 1. Supported intents (closed list)

The classifier MUST return exactly one of these. Anything it isn't sure about →
`out_of_scope`.

| intent | what it means | resolves with |
|---|---|---|
| `scheme_payment_status` | expected scheme money hasn't arrived | `scheme_id`, `state` |
| `pm_kisan_eligibility` | "am I eligible for PM-Kisan?" | `state` |
| `fraud_or_unauthorized` | money lost / unauthorized debit / OTP shared / scam | — (hard-stop) |
| `out_of_scope` | anything else | — (fallback) |

The catalog grows one row at a time; the loop never changes.

---

## 2. Call 1 — RESOLVE (LLM, JSON only)

**Input to the model:** the system prompt below + the full chat transcript +
the user's already-known slots from `users_context` (so it won't re-ask).

**The model returns JSON and nothing else:**

```json
{
  "intent": "scheme_payment_status | pm_kisan_eligibility | fraud_or_unauthorized | out_of_scope",
  "fraud": false,
  "scheme_id": "PM_KISAN | SUKANYA | APY | SCH_MINORITY | SCH_VIDYASIRI | null",
  "slots": { "state": "Karnataka | null" },
  "missing_slot": "scheme_id | state | null",
  "user_language": "hi | hinglish | en"
}
```

**Rules the prompt enforces:**
- Output JSON only. Never answer the user's question in this call.
- `intent` must be from the closed list. If unsure → `out_of_scope`.
- If there is **any** fraud signal (money lost, unauthorized debit, shared
  OTP/PIN/CVV, suspicious link) → `fraud: true` and `intent: fraud_or_unauthorized`.
  Fraud overrides every other classification.
- Extract slot values **only** if the user actually stated them. Never guess a
  state or scheme. Unknown → `null`.
- `missing_slot` = the highest-`priority` required slot for this intent that is
  still `null` after merging `users_context`. If all are filled → `null`.

---

## 3. The orchestrator (plain JS) — what it does with that JSON

```
1. Keyword safety net: if message matches fraud_triggers (en + hinglish),
   force fraud = true even if Call 1 missed it.

2. if (fraud) → return microcopy.fraud_stop + compliance 1930. STOP. (no Call 2)

3. Persist any newly-found slots to users_context (localStorage).

4. if (intent is fallback) → out-of-scope redirect. STOP.

5. if (missing_slot) → return that slot's clarify_prompt in user_language. STOP.
   (one question only — wait for the next message, then loop from step 1.)

6. Retrieve the row per the intent's `retrieval` mapping, filtered to
   signoff_status === 'signed_off'.

7. if (no signed-off row)  →  microcopy.not_verified + official helpline/office
   from the matched scheme/bank.  NEVER call the LLM to generate the fact. STOP.

8. else → Call 2 (phrase) with the retrieved row injected.
```

Steps **2** and **7** are the two non-negotiable guarantees. They live in code,
not in a prompt, because prompts leak.

---

## 4. Retrieval mapping

| intent | lookup |
|---|---|
| `scheme_payment_status` | `scheme_payment_status_facts[scheme_id]` |
| `pm_kisan_eligibility` | `state_scheme_rules["{state}\|PM_KISAN"]` |

A row is usable only if `signoff_status === 'signed_off'`.

> Note from the slice: `state_scheme_rules["Karnataka|PM_KISAN"]` is
> `signed_off`, but `scheme_payment_status_facts.PM_KISAN` is **`pending`**. So
> for the exact screenshot question ("paisa nahi aaya"), the bot will currently
> hit step 7 and give the official PM-Kisan helpline + "not verified" — it will
> NOT invent a status-check process. That is the correct, honest behaviour and a
> good demonstration of the guarantee. Sign that row off to enable the full answer.

---

## 5. Call 2 — PHRASE (LLM, Mukund's voice)

Same Mukund persona/tone/length rules as today (carried over verbatim), with a
hard fact-fence appended to the system prompt:

```
FACTS YOU MAY USE (do not add any number, helpline, office, eligibility,
or process that is not listed here):
- <each field of the retrieved row as a short line>

If the user asks for a detail that is not in FACTS, say you are not sure and
point them to the official source. Never fill gaps from your own knowledge.
Reply in the user's language. 2–3 sentences. End with one follow-up question.
```

The model phrases naturally but cannot introduce facts. Numbers the *user*
stated (e.g. "₹5000") are treated as their claim, never echoed as verified.

---

## 6. Worked example — the screenshot case

| turn | user | Call-1 JSON (key parts) | orchestrator action |
|---|---|---|---|
| 1 | "government se paise aane the, abhi tak nahi aaye" | `intent: scheme_payment_status, scheme_id: null, missing_slot: scheme_id` | ask: *"Kaunsi yojana — PM-Kisan, pension, ya scholarship?"* |
| 2 | "PM-Kisan" | `scheme_id: PM_KISAN, state: null, missing_slot: state` | ask: *"Aap kis state se hain?"* |
| 3 | "Karnataka" | `scheme_id: PM_KISAN, state: Karnataka, missing_slot: null` | retrieve `scheme_payment_status_facts.PM_KISAN` → **pending** → step 7: PM-Kisan helpline + not-verified copy |
| — | "kisi ne OTP poocha tha" (any turn) | `fraud: true` | step 2: 1930 hard-stop, no generation |

Once the payment-status row is signed off, turn 3 instead goes to Call 2 and
Mukund says (grounded): installment is ₹2,000; check status at pmkisan.gov.in;
common holds are e-KYC / land-record / Aadhaar mismatch; helpline 155261.

---

## 7. What needs a decision / sign-off before this is "real"

1. **Sign off `scheme_payment_status_facts.PM_KISAN`** (or correct it) — it's the
   answer the screenshot user actually needs, currently `pending`.
2. **Approve the Hinglish fraud keyword net** in `rules.json` (currently PROPOSED).
3. **`users_context` persistence:** localStorage for the prototype. Confirm we're
   OK storing `state` (and later `account_type`/`aadhaar_linked`, which are more
   sensitive) client-side — ties back to the earlier DPDP discussion.
4. **Slot inference:** do we pre-fill `state` from registration to skip the ask?
5. **Out-of-scope handling:** reuse the existing Mukund redirect lines, or a
   dedicated grounded fallback?
```
