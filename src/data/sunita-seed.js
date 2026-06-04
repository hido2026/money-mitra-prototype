// sunita-seed.js — Sunita-scale test data for Himen's demo (phone 7977099345).
//
// Designed to surface all three derived insights simultaneously:
//
//   goal_pacing:   दिवाली ₹2,000 target · balance ₹1,831 · ₹169 remaining
//                  Last-7-days daily rate ≈ ₹69/day → ~3 दिन और
//
//   biggest_mover: खाना this week ₹720 vs last week ₹430 → +₹290 (67% spike)
//
//   connect_dots:  फ़ोन entry ₹99 last week · if user decodes ₹199 recharge →
//                  "पिछली बार से ₹100 ज़्यादा। दिवाली का आधा लक्ष्य पूरा हो जाता।"
//
// Every number is code-verified below — do NOT edit without re-checking sums.
//
// GATE: only loads when user.phone === '7977099345'. Hard-coded in DevPanel.

const AUTHORISED_PHONE = '7977099345';

function ago(days) {
  const d = new Date(Date.now() - days * 86_400_000);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function entry(type, amount, category, daysAgo, extra = {}) {
  return {
    id:        `seed_${daysAgo}_${category}`,
    type,
    amount,
    category,
    timestamp: ago(daysAgo),
    time:      '10:00 AM',
    src:       'manual',
    source:    'manual',
    bill_type: null,
    ...extra,
  };
}

// ── Entries ────────────────────────────────────────────────────────────────────
//
// Previous week (days 8–14 ago)
//   in:  तनख़्वाह  ₹2,800
//   out: घर ₹800 · खाना ₹250+₹180=₹430 · फ़ोन ₹99 · यात्रा ₹120
//   net: ₹2,800 – ₹1,449 = +₹1,351
//
// This week (days 0–7 ago)
//   in:  उपहार ₹500 · तनख़्वाह ₹1,000
//   out: खाना ₹500+₹220=₹720 · यात्रा ₹80 · दवाई ₹150 · बच्चे ₹70
//   net: ₹1,500 – ₹1,020 = +₹480
//
// Running balance: ₹1,351 + ₹480 = ₹1,831  ✓
// Goal target:     ₹2,000  →  remaining ₹169
// Daily rate:      ₹480/7 ≈ ₹69/day  →  ceil(169/69) = 3 days  ✓
// खाना spike:     ₹720 vs ₹430 → +₹290, 67% increase, >₹100 ✓

export const SUNITA_ENTRIES = [
  // ── Previous week ──────────────────────────────────────────────────────────
  entry('in',  2800, 'तनख़्वाह', 14),
  entry('out',  800, 'घर',       12),
  entry('out',  250, 'खाना',     11),
  entry('out',   99, 'फ़ोन',     10, {   // decoder comparison target: ₹99 → ₹199 decode = +₹100
    bill_type: 'मोबाइल रिचार्ज',
    src: 'decoder', source: 'decoder',
  }),
  entry('out',  120, 'यात्रा',    9),
  entry('out',  180, 'खाना',      8),

  // ── This week ──────────────────────────────────────────────────────────────
  entry('in',   500, 'उपहार',     7),
  entry('out',  500, 'खाना',      6),   // spike start
  entry('out',   80, 'यात्रा',    5),
  entry('out',  220, 'खाना',      4),   // spike continues → ₹720 total this week
  entry('out',  150, 'दवाई',      3),
  entry('in',  1000, 'तनख़्वाह',  2),
  entry('out',   70, 'बच्चे',     1),
];

// ── Goal ──────────────────────────────────────────────────────────────────────
export const SUNITA_GOALS = [
  { id: 'seed_diwali', name: 'दिवाली', target: 2000, priority: 1 },
];

// ── Loader ────────────────────────────────────────────────────────────────────
export function loadSunitaSeed(dispatch) {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  if (user.phone !== AUTHORISED_PHONE) {
    console.warn('[seed] Not authorised for this phone number.');
    return false;
  }

  dispatch({ type: 'SEED_DATA', payload: { entries: SUNITA_ENTRIES, goals: SUNITA_GOALS } });
  // Clear session flags so insights fire fresh
  sessionStorage.removeItem('pattern_shown');
  return true;
}
