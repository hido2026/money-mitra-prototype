// Nuskha bank — the shared content asset behind both Ask (reactive) and Paisa
// Gyaan (proactive). This is the starter set of 5 reviewed nuskhe from
// paisa-gyaan/content/nuskha-bank.sample.json, ported verbatim (reviewed:true
// means these already cleared the CONTENT_PLAN.md §5 compliance pass — do not
// paraphrase or invent additional nuskhe here without the same review step).
//
// Every user-facing field has a reviewed English counterpart (_en suffix) —
// PaisaGyaan.jsx switches between them on the app's EN/hi toggle, same
// pattern as money-questions.js.
//
// MVP build sequence (TECHNICAL_PLAN.md §5, steps 1-2): static JSON in-repo,
// client-side rotation + streak via localStorage. No backend, no live LLM call.

export const NUSKHA_BANK = [
  {
    id: 'fd-vs-rd-01',
    tag_category: 'savings-instruments',
    hook_question: 'FD aur RD mein farak kya?',
    hook_question_en: 'What\'s the difference between FD and RD?',
    viz_body: '<b>FD</b> — ek baar paisa rakho, byaaj pao.<br><b>RD</b> — har mahine thoda-thoda jodo.<br><br>Salary aati hai? RD aasaan. Ek-mushth paisa hai? FD.',
    viz_body_en: '<b>FD</b> — deposit money once, earn interest.<br><b>RD</b> — add a little every month.<br><br>Get a salary? RD is easier. Have a lump sum? Go with FD.',
    micro_action: 'Apne phone mein check karo — pichle mahine kitna bacha tha, ek-mushth ya thoda-thoda?',
    micro_action_en: 'Check your phone — last month, did you save a lump sum or a little at a time?',
    follow_up_prompt: 'Toh RD kahan kholun?',
    follow_up_prompt_en: 'So where do I open an RD?',
    personas: ['general', 'priya', 'lakshmi'],
    language: 'hinglish',
    reviewed: true,
  },
  {
    id: 'sip-basics-01',
    tag_category: 'savings-instruments',
    hook_question: 'SIP kaise kaam karta hai?',
    hook_question_en: 'How does a SIP work?',
    viz_body: 'Har mahine <b>₹500</b> bhi invest karo. Daam upar-neeche ho — aap aaram se units jodte jaate ho. Lambi race jeetne ka tareeka.',
    viz_body_en: 'Invest even <b>₹500</b> every month. Prices go up and down — you keep steadily adding units. A way to win the long race.',
    micro_action: 'Socho — ₹500 mahine ka matlab din ka kitna paisa hai?',
    micro_action_en: 'Think about it — ₹500 a month works out to how much a day?',
    follow_up_prompt: 'SIP shuru karne ke liye mujhe kya chahiye?',
    follow_up_prompt_en: 'What do I need to start a SIP?',
    personas: ['general', 'priya'],
    language: 'hinglish',
    reviewed: true,
  },
  {
    id: 'scam-urgency-01',
    tag_category: 'scams-fraud',
    hook_question: 'Scam wale aise phasaate hain',
    hook_question_en: 'This is how scammers trap you',
    viz_body: '<b>Darr + jaldi</b> = scam. "Account band ho jaayega, abhi karo."<br><br>Asli bank kabhi jaldi nahi karwaata. Ruko, socho, dobara check karo.',
    viz_body_en: '<b>Fear + urgency</b> = scam. "Your account will be closed, act now."<br><br>A real bank never rushes you. Stop, think, and check again.',
    micro_action: 'Agar koi message aapko jaldi karne bole, ek baar ruk kar dobara padho.',
    micro_action_en: 'If a message tells you to act fast, stop and read it again first.',
    follow_up_prompt: 'Yeh message scam hai ya sach — kaise pata karu?',
    follow_up_prompt_en: 'How do I know if this message is a scam or real?',
    personas: ['general', 'lakshmi', 'suresh'],
    language: 'hinglish',
    reviewed: true,
  },
  {
    id: 'shopowner-supplier-discount-01',
    tag_category: 'budgeting-cashflow',
    hook_question: 'Aaj dukan par bheed kam hai, Ramesh bhai?',
    hook_question_en: 'Shop a little quiet today, Ramesh bhai?',
    viz_body: 'Fursat ke time ko paise bachane ka time banaiye. Jab counter par shanti ho, tab check kar lijiye ki kis supplier ko jaldi pay karne se aapko acha discount mil sakta hai.',
    viz_body_en: 'Turn free time into money-saving time. When the counter\'s quiet, check which supplier gives you a good discount for paying early.',
    micro_action: 'Aaj sirf 2 minute nikaal kar apni khata-book check kijiye aur apna agla bada payment mark kar lijiye.',
    micro_action_en: 'Just take 2 minutes today to check your khata-book and mark your next big payment.',
    follow_up_prompt: 'Apne dukaan ke cash-flow aur udhaar ko easily kaise manage karu?',
    follow_up_prompt_en: 'How do I easily manage my shop\'s cash flow and credit?',
    personas: ['ramesh'],
    language: 'hinglish',
    reviewed: true,
  },
  {
    id: 'itr-folder-01',
    tag_category: 'tax-paperwork',
    hook_question: 'Salary aayi, ITR wala folder khola kya?',
    hook_question_en: 'Salary\'s in — did you start your ITR folder?',
    viz_body: 'July me sab ITR file karte hain, isliye website slow ho jaati hai aur tension badhta hai. Abhi se papers ek jagah rakhoge, toh end me line me nahi phasoge.',
    viz_body_en: 'Everyone files ITR in July, so the website slows down and stress builds up. Keep your papers together from now, and you won\'t get stuck in the last-minute rush.',
    micro_action: "Bas ek minute — phone me 'ITR 2026' folder banao, pehli salary slip daal do.",
    micro_action_en: "Just a minute — make an 'ITR 2026' folder on your phone and add your first salary slip.",
    follow_up_prompt: 'Mujhe ITR file karne ke liye kaunse documents ready rakhne chahiye?',
    follow_up_prompt_en: 'Which documents should I keep ready to file my ITR?',
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
