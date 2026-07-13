# Money Mitra — Backend Onboarding

Hi Shailendra, welcome to the project. This doc gives you everything you need to get oriented and start contributing.

---

## What we're building

**Money Mitra** is a voice-first, Hindi-first financial companion for Bharat (tier 2/3 users). The assistant is called **Mukund**. Core job: take the fear out of any financial document — read it, explain it simply, build a running ledger (हिसाब).

Three screens today:
- **समझो** — live chat with Mukund (Groq LLM + Sarvam voice)
- **कागज़ समझें** — document decoder (photo → vision extraction → insight)
- **मेरा हिसाब** — auto-built ledger from decoded docs

Live prototype: https://hido2026.github.io/money-mitra-prototype

---

## Repos

| Repo | Branch | What's in it |
|---|---|---|
| `github.com/hido2026/money-mitra-prototype` | `main` | React + Vite prototype (live on GitHub Pages) |
| `github.com/akshayborhaderil/intelligence-prototype` | `vertical/finance` | Next.js shell — the production path |

---

## Tech stack (current prototype)

- **Frontend**: React 18, Vite, Tailwind, HashRouter, in-memory state (useReducer + localStorage)
- **Chat LLM**: Groq SDK — `llama-3.3-70b-versatile` (dangerouslyAllowBrowser — needs to move server-side)
- **Vision/extraction**: Groq — `meta-llama/llama-4-scout-17b-16e-instruct` (temp 0, strict JSON output)
- **TTS**: Sarvam AI — `bulbul:v2`, speaker `abhilash`, `hi-IN`, 500-char input cap
- **STT**: Sarvam AI — `saarika:v2.5`
- **Deploy**: GitHub Actions → GitHub Pages

---

## Key source files

```
src/
  utils/
    tts.js          — Mukund's voice (Sarvam TTS + transliterate)
    extract.js      — vision extraction, strict JSON, anti-hallucination
    insights.js     — deterministic insight engine (no LLM, pure computed)
    motion.js       — useCountUp, inr() formatter
  hooks/
    useVoiceInput.js — Sarvam STT (mic → WAV → transcript)
  config/
    system-prompts.js — MUKUND_PROMPT (Devanagari-only, educate-not-advise)
  pages/
    Chat.jsx        — समझो (live chat)
    Decoder.jsx     — document decoder (voice-first, 4 stages)
    Passbook.jsx    — मेरा हिसाब (auto ledger)
  context/
    AppContext.jsx  — in-memory docs feed (useReducer)
  rules/
    rules.json      — first rules slice (PM-Kisan)
    ORCHESTRATOR.md — orchestrator contract spec
```

---

## Product rules (non-negotiable)

Read `CLAUDE.md` at the repo root — it's the full product + design contract. Key rules:

- **Educate, never advise** — no "you should", no product picks, no investment advice
- **Grounded** — every ₹ figure must come from extracted or computed data, never invented
- **Fraud keywords → fixed 1930 response** — model bypassed entirely
- **PII / payment never in chat** → generic payment-partner handoff stub (no named partner)
- **Voice-first** — auto-speak every Mukund bubble via Sarvam TTS

---

## Backend work needed (priority order)

### 1. API proxy layer (most urgent)
Both Groq and Sarvam API keys currently live in the browser (`dangerouslyAllowBrowser: true`). This needs to move to a server-side proxy so keys never reach the client.

- POST `/api/chat` → proxies to Groq
- POST `/api/tts` → proxies to Sarvam TTS
- POST `/api/stt` → proxies to Sarvam STT
- POST `/api/extract` → proxies to Groq vision

### 2. Rules DB (grounded retrieval)
`money_mitra_rules_schema.sql` defines the schema. Mukund must only quote facts that exist in this DB — no hallucinated scheme names, amounts, or eligibility criteria.

The LLM should be retrieval-only: query the rules DB → fill a template → speak. No free-form generation for factual claims.

### 3. Data persistence
Currently everything is in-memory — decoded docs are lost on page refresh. Needs:
- User session store
- Decoded docs feed persisted per user
- हिसाब (ledger) entries with add/edit/delete

---

## API keys

Ask Himen for the keys securely (WhatsApp). Do not commit them anywhere.

Set locally in `.env.local`:
```
VITE_GROQ_API_KEY=...
VITE_SARVAM_API_KEY=...
```

---

## Schema reference

See `money_mitra_rules_schema.sql` — shared separately.

---

## First things to read

1. `CLAUDE.md` — product contract (start here)
2. `src/rules/ORCHESTRATOR.md` — orchestrator design
3. `src/utils/extract.js` — how documents are parsed (understand the data shape)
4. `src/context/AppContext.jsx` — current in-memory state shape (what persistence needs to replace)

---

## Questions?

Ping Himen. The product brief, design system, and all constraints are in `CLAUDE.md` — if something seems wrong or missing, that doc is the source of truth.
