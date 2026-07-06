// Nuskha bank — the shared content asset behind both Ask (reactive) and Paisa
// Gyaan (proactive). This is the starter set of 5 reviewed nuskhe from
// paisa-gyaan/content/nuskha-bank.sample.json, ported verbatim (reviewed:true
// means these already cleared the CONTENT_PLAN.md §5 compliance pass — do not
// paraphrase or invent additional nuskhe here without the same review step).
//
// MVP build sequence (TECHNICAL_PLAN.md §5, steps 1-2): static JSON in-repo,
// client-side rotation + streak via localStorage. No backend, no live LLM call.

export const NUSKHA_BANK = [
  {
    id: 'fd-vs-rd-01',
    tag_category: 'savings-instruments',
    hook_question: 'FD aur RD mein farak kya?',
    viz_body: '<b>FD</b> — ek baar paisa rakho, byaaj pao.<br><b>RD</b> — har mahine thoda-thoda jodo.<br><br>Salary aati hai? RD aasaan. Ek-mushth paisa hai? FD.',
    micro_action: 'Apne phone mein check karo — pichle mahine kitna bacha tha, ek-mushth ya thoda-thoda?',
    follow_up_prompt: 'Toh RD kahan kholun?',
    personas: ['general', 'priya', 'lakshmi'],
    language: 'hinglish',
    reviewed: true,
  },
  {
    id: 'sip-basics-01',
    tag_category: 'savings-instruments',
    hook_question: 'SIP kaise kaam karta hai?',
    viz_body: 'Har mahine <b>₹500</b> bhi invest karo. Daam upar-neeche ho — aap aaram se units jodte jaate ho. Lambi race jeetne ka tareeka.',
    micro_action: 'Socho — ₹500 mahine ka matlab din ka kitna paisa hai?',
    follow_up_prompt: 'SIP shuru karne ke liye mujhe kya chahiye?',
    personas: ['general', 'priya'],
    language: 'hinglish',
    reviewed: true,
  },
  {
    id: 'scam-urgency-01',
    tag_category: 'scams-fraud',
    hook_question: 'Scam wale aise phasaate hain',
    viz_body: '<b>Darr + jaldi</b> = scam. "Account band ho jaayega, abhi karo."<br><br>Asli bank kabhi jaldi nahi karwaata. Ruko, socho, dobara check karo.',
    micro_action: 'Agar koi message aapko jaldi karne bole, ek baar ruk kar dobara padho.',
    follow_up_prompt: 'Yeh message scam hai ya sach — kaise pata karu?',
    personas: ['general', 'lakshmi', 'suresh'],
    language: 'hinglish',
    reviewed: true,
  },
  {
    id: 'shopowner-supplier-discount-01',
    tag_category: 'budgeting-cashflow',
    hook_question: 'Aaj dukan par bheed kam hai, Ramesh bhai?',
    viz_body: 'Fursat ke time ko paise bachane ka time banaiye. Jab counter par shanti ho, tab check kar lijiye ki kis supplier ko jaldi pay karne se aapko acha discount mil sakta hai.',
    micro_action: 'Aaj sirf 2 minute nikaal kar apni khata-book check kijiye aur apna agla bada payment mark kar lijiye.',
    follow_up_prompt: 'Apne dukaan ke cash-flow aur udhaar ko easily kaise manage karu?',
    personas: ['ramesh'],
    language: 'hinglish',
    reviewed: true,
  },
  {
    id: 'itr-folder-01',
    tag_category: 'tax-paperwork',
    hook_question: 'Salary aayi, ITR wala folder khola kya?',
    viz_body: 'July me sab ITR file karte hain, isliye website slow ho jaati hai aur tension badhta hai. Abhi se papers ek jagah rakhoge, toh end me line me nahi phasoge.',
    micro_action: "Bas ek minute — phone me 'ITR 2026' folder banao, pehli salary slip daal do.",
    follow_up_prompt: 'Mujhe ITR file karne ke liye kaunse documents ready rakhne chahiye?',
    personas: ['general', 'priya'],
    language: 'hinglish',
    reviewed: true,
  },
];

const STREAK_KEY = 'paisaGyaanStreak';
const SET_SIZE = 3; // matches the mock — 3 cards per session

function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current_streak: 0, last_completed_date: null, seen_nuskha_ids: [] };
    return JSON.parse(raw);
  } catch {
    return { current_streak: 0, last_completed_date: null, seen_nuskha_ids: [] };
  }
}

function saveStreak(s) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch { /* best-effort */ }
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// Anti-repeat rotation (CONTENT_PLAN.md §4): prefer nuskhe not in the caller's
// seen list. With only 5 reviewed nuskhe in this starter bank, a 3-a-day
// serving exhausts "unseen" fast — that's a content-volume limit of the
// sample set, not a rotation bug, so we top up from least-recently-seen
// rather than crash or repeat within the same session.
export function getTodaysSet(seenIds = []) {
  const unseen = NUSKHA_BANK.filter((n) => !seenIds.includes(n.id));
  const pool = unseen.length >= SET_SIZE ? unseen : [...unseen, ...NUSKHA_BANK.filter((n) => seenIds.includes(n.id))];
  return pool.slice(0, SET_SIZE);
}

export function getStreak() {
  return loadStreak();
}

// Hard-reset on a missed day (PRD §12 leaves grace-period TBD — this is the
// simplest correct default, not a final product decision).
export function completeToday(shownIds) {
  const s = loadStreak();
  const today = todayStr();
  if (s.last_completed_date === today) return s; // already completed today, no double-increment
  const gap = s.last_completed_date ? daysBetween(s.last_completed_date, today) : 1;
  const next = {
    current_streak: gap <= 1 ? s.current_streak + 1 : 1,
    last_completed_date: today,
    seen_nuskha_ids: [...new Set([...(s.seen_nuskha_ids || []), ...shownIds])].slice(-30),
  };
  saveStreak(next);
  return next;
}
