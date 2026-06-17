# CLAUDE.md — Money Mitra design + product contract (canonical)

Drop this at the **repo root of BOTH**: `money-mitra-prototype` (github.io) and
`intelligence-prototype` (`apps/shell/src/app/finance/`). Claude Code auto-reads it.
It encodes the design system AND every product decision we've validated. When in
doubt, **validate with the a2ui MCP — don't guess.**

## Sources of truth (read / query, never invent)
- **a2ui MCP** `https://a2ui-jbiq-library.vercel.app/api/mcp` — `search` · `get_section` · **`check_classes` on every component you touch**.
- **DESIGN.md** (in `intelligence-prototype`) — canonical JDS spec. Browse: https://a2ui-jbiq-library.vercel.app/
- Reference repo: https://github.com/akshayborhaderil/intelligence-prototype · live: https://intelligence-prototype.vercel.app/
- `finance_companion_language_rulebook.md` (language) · `money_mitra_rules_schema.sql` (the only facts the AI may quote) · chat-story-playbook.md.

## North star
Voice-first, Hindi-first money companion for Bharat ("Sunita": tier 2/3, low formal-finance
confidence, low-to-mid literacy, prefers speaking, anxious about money paper). Assistant: **Mukund**.
The job: **take the fear out of any financial document** → read it → explain simply → build the हिसाब.
**Educate, never advise. Never judgmental. Grounded — never invent a number.**

## Universal shell (EVERY screen)
- A **persistent bottom dock on every screen**: `+` (attach) · chat input · voice (बोलिए). Matches Health/News/all JBIQ.
- **The home is itself a working chat** — a question asked from the dock is answered **inline**, on the same screen.
- **`+`, the Document card, and the हिसाब "add" all open the same JBIQ attach sheet**: कैमरा / गैलरी / फ़ाइल-PDF.
- An attachment from anywhere is read and routed (see Document routing). Cards are **shortcuts, not gates** — you never *have* to enter a card.

## Home
- **Hindi default, EN toggle.** No "Mukund identity" block. Lead line: **"नमस्ते, आज मैं किसमें मदद करूँ?"**
- Three scoped cards: **पैसे की बात पूछिए** (scope shown: बिल · सरकारी योजना · ठगी · बचत; + 2 example prompts; tapping in reveals more pre-empted questions) · **Document समझिए** (benefit-led: "फ़ोटो दिखाइए — आसान भाषा में समझा दूँगा") · **आपका हिसाब** ("फ़ोटो से अपने आप बने" + "अंक मिलते रहेंगे").
- **Never "ask me anything."** Scope to money. Example prompts must be: answerable **without her data**, **empowering not panic**, and **span the range**. Default pair: "सरकारी योजना का पैसा कैसे मिलता है?" + "ठगी से कैसे बचूँ?" (EMI / insurance-vs-savings live on the deeper screen).
- Card titles use **"Document"** (the understood loanword), not "कागज़"; body copy may use कागज़.

## Document routing (core logic)
On decode, classify by **confidence that a real money movement happened to THIS user**:
1. **Confirmed transaction** (paid bill, UPI "paid ₹X", salary credit, kirana receipt, subsidy received) → **auto-add to हिसाब + points**; show "हिसाब में जुड़ गया ✓ · **मेरा हिसाब देखें →**".
2. **Money involved but unsure it happened to her** (insurance policy, loan offer, quote, brochure) → **explain simply (educate), then ASK**: "क्या यह आपने लिया है? हिसाब में जोड़ूँ?" → **"हाँ, जोड़ें" / "सिर्फ़ समझना था"**. Add only on confirm.
3. **No money in/out** (ID, KYC form, notice with no amount) → **explain only**; "हिसाब में नहीं जोड़ा — सिर्फ़ जानकारी।"
- **Multiple docs at once** → read **together**, one combined summary ("3 कागज़ पढ़े — 2 खर्च जुड़े, 1 के बारे में पूछना है"), auto-add confirmed, batch-ask uncertain.
- **Recurring docs** (credit card, monthly bill) → **ask once, remember the choice**, then auto-add subsequent ones.

## Result screen (voice-first chat)
- Render as a **chat**, multi-bubble. **Auto-speak each bubble via Sarvam TTS (bulbul:v2, hi-IN) as it appears** (text + voice together); **सुनें** replay; बोलिए dock present.
- Order: **recognition** (real doc type — never "कागज़") → **breakdown widget** (line items + due date; total-only fallback) → **insight bubble leading with the SPECIFIC extracted fact** (due date + amount, biggest spend) — clean, conversational, **never judgmental**, educate-not-advise; a brief calming line **only** if the doc looks alarming → **reward** ("X अंक मिले"; "इनाम" only at the 1,000 milestone; **no Reliance/₹ here**) → auto-log or ask (per routing) → **clear हिसाब link**.
- **₹ + Indian commas + Latin digits** (₹1,180, never १,१८०). Explanations: **simplest possible**, one idea per line.

## मेरा हिसाब (ledger)
- Auto-built **आया / गया / बचे** (negative → "कम पड़े ₹X", never a bare minus) + **कुल इनाम** (the redeem "1,000 अंक = ₹10 · Reliance Retail · सिर्फ़ डेमो" lives **only here**) + the auto-logged feed + **cumulative insight cards that unlock with data** + nudge "जितनी ज़्यादा फ़ोटो, उतना साफ़ हिसाब".
- **Manage controls:** every entry supports **Add** (manual entry — correction/top-up only), **Edit** ("सही करें" sheet: रकम · आया/गया · उधार-ऋण toggle), **Delete** ("भूल जाओ"). **Photo-first stays primary; manual add/edit is the correction layer, not the main input.**

## Language (rulebook)
Live AI **mirrors the user's language AND script every turn** (Roman-Hindi in → Roman out; never Devanagari to a Roman user); static copy stays Devanagari default. Warm, plain, **non-judgmental**, short, **answer-first**. Spell out acronyms ("Jio Financial (JFS)"). Keep it the simplest a low-literacy user understands aloud.

## Compliance (non-negotiable)
Educate-not-advise (no "best"/"you should"/product picks); save tips **general + true + non-prescriptive**; **grounded** (every ₹ extracted or computed); fraud keywords → fixed **1930** response (model bypassed); PII / payment never in chat → **JFS handoff stub**; the document image is read by an AI → privacy copy says **"we don't keep the photo"** (not "never leaves your phone"); points are **free, non-lottery**; demo-only API key flagged in the PR; storing extracted financial data = Legal-review item.

## JDS (validate every change with check_classes)
Tokens only (**no raw hex**); **violet brand** (no green/orange CTAs); **no gradients, no shadows**; pills (`rounded-full`) + cards (`rounded-xl`, confirm via check_classes); **JDS SVG icons only — never emoji**; **skeleton shimmer, never spinners**; **JioType** (Black `font-black tracking-tight` headings / Medium body); `px-4` margins, `max-w-md`, **44px** tap targets; light mode; **respect `prefers-reduced-motion`**; animate **transform/opacity only**; entrance `opacity:0,y:8 → 1,0`.
- Repo tokens: `intelligence-prototype` uses shell tokens (`dock-accent`, `chip-surface`, `surface-1/2`, `text-high/low`); `money-mitra-prototype` uses its own — **both map to the JDS violet**; reconcile via check_classes, never hardcode hex.

## Before shipping any screen — checklist
1. check_classes clean (no hex/gradient/shadow/spinner/emoji)? · 2. Hindi default, scoped (never "ask anything")?
3. Persistent `+`/ask/voice dock; home answers inline? · 4. Document routing correct (auto-add / ask / explain-only)?
5. Voice-first (auto-speak + सुनें + बोलिए)? · 6. Insight specific + grounded + non-judgmental, educate-not-advise?
7. ₹ Indian commas + Latin digits; simplest wording? · 8. हिसाब add/edit/delete present; redeem only here?
9. prefers-reduced-motion + JioType + pills/cards + 44px taps? · 10. Flag anything off-system with `// 🚩 DEV FLAG`.
