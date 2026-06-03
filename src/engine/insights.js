// insights.js — "where to save money" engine.
//
// Computes from the user's OWN in-memory data:
//   entries      [{type:in|out, amount, category, timestamp}]
//   sessionDecodes [{bill_type, amount}]
//   goals        [{name, target, priority}]
//   balance      number
//
// RULES:
//   - Every number arithmetically verified — never hardcoded totals.
//   - "Save ₹X" always shows HOW (public-pricing or behaviour-change).
//   - Never recommend a specific product or brand.
//   - If not enough data → return null (better silent than wrong).
//   - Max one insight per session (caller enforces).
//   - Fire AFTER an input (contextual) — never on open.
//
// Five types (priority order — first match returned):
//   1. RECURRING_SAVING  — strongest: detect recurring expense, show public-price saving
//   2. GOAL_CONNECTION   — tie a saving opportunity to an active goal
//   3. LEAK              — category spike vs its own recent norm
//   4. TOP_SPEND         — largest category this week
//   5. INCOME_MOMENT     — on large income, gentle save prompt

const r = n => Math.abs(Math.round(n)).toLocaleString('en-IN');

const DAY  = 86_400_000;
const WEEK = 7 * DAY;

function ts(e) {
  if (!e?.timestamp) return null;
  try { return new Date(e.timestamp).getTime(); } catch { return null; }
}
function inRange(e, from, to) {
  const t = ts(e);
  return t !== null && t >= from && t <= to;
}
function sumOut(entries, cat, from, to) {
  return entries
    .filter(e => e.type === 'out' && (!cat || e.category === cat) && inRange(e, from, to))
    .reduce((s, e) => s + (e.amount ?? 0), 0);
}

// ── 1. RECURRING SAVING ───────────────────────────────────────────────────────
function recurringSaving(entries, sessionDecodes) {
  // Strongest signal: a recharge bill decoded this session
  const rechargeDecode = sessionDecodes.find(d => d.bill_type === 'recharge');
  if (rechargeDecode) {
    const monthly    = rechargeDecode.amount;
    const annual     = monthly * 12;
    const yearlyPlan = 2800;
    const saving     = annual - yearlyPlan;
    if (saving > 0) {
      return {
        type: 'recurring_saving',
        text: `Aap har mahine ₹${r(monthly)} recharge karti hain — saal ka ₹${r(annual)}. Saal bhar ka plan ₹${r(yearlyPlan)} — ₹${r(saving)} bachte hain.`,
        savings_amount: saving,
        had_goal: false, // caller updates
      };
    }
  }

  // Passbook signal: 2+ phone/recharge entries → infer monthly average
  const phoneEntries = entries.filter(e => e.type === 'out' && e.category === 'फ़ोन');
  if (phoneEntries.length >= 2) {
    const avg  = phoneEntries.reduce((s, e) => s + e.amount, 0) / phoneEntries.length;
    if (avg >= 200 && avg <= 500) {
      const annual     = Math.round(avg) * 12;
      const yearlyPlan = 2800;
      const saving     = annual - yearlyPlan;
      if (saving > 0) {
        return {
          type: 'recurring_saving',
          text: `Har mahine lagbhag ₹${r(Math.round(avg))} phone pe jata hai — saal ka ₹${r(annual)}. Saal bhar ka plan ₹${r(yearlyPlan)} aata hai — ₹${r(saving)} bachte hain.`,
          savings_amount: saving,
          had_goal: false,
        };
      }
    }
  }
  return null;
}

// ── 2. GOAL CONNECTION ────────────────────────────────────────────────────────
function goalConnection(sessionDecodes, goals, balance) {
  if (!goals?.length) return null;
  const top       = goals[0];
  const remaining = top.target - Math.max(0, balance);
  if (remaining <= 0) return null;

  const rechargeDecode = sessionDecodes.find(d => d.bill_type === 'recharge');
  if (rechargeDecode) {
    const monthly = rechargeDecode.amount;
    const saving  = monthly * 12 - 2800;
    if (saving > 0) {
      return {
        type: 'goal_connection',
        text: `Yeh ₹${r(saving)} jo recharge se bach sakta hai — aapke ${top.name} goal ko paas le aata hai.`,
        savings_amount: saving,
        had_goal: true,
      };
    }
  }

  const electricityDecode = sessionDecodes.find(d => d.bill_type === 'electricity');
  if (electricityDecode) {
    const saving = 168; // 20 units × ₹8.40/month
    return {
      type: 'goal_connection',
      text: `Bijli mein jo ₹${r(saving)}/mahine bach sakta hai — woh ${top.name} goal ki taraf rakhein?`,
      savings_amount: saving,
      had_goal: true,
    };
  }
  return null;
}

// ── 3. LEAK / SPIKE ───────────────────────────────────────────────────────────
function leakDetect(entries) {
  const now = Date.now();
  const cats = [...new Set(entries.filter(e => e.type === 'out').map(e => e.category))];

  for (const cat of cats) {
    const thisWeek  = sumOut(entries, cat, now - WEEK, now);
    const lastWeek  = sumOut(entries, cat, now - 2 * WEEK, now - WEEK);
    const diff      = thisWeek - lastWeek;
    if (lastWeek > 0 && thisWeek > 1.5 * lastWeek && diff > 200) {
      return {
        type: 'leak',
        text: `Is hafte '${cat}' pe ₹${r(thisWeek)} — pichhle hafte se ₹${r(diff)} zyada. Dekh lijiye.`,
        savings_amount: null,
        had_goal: false,
      };
    }
  }
  return null;
}

// ── 4. TOP SPEND ──────────────────────────────────────────────────────────────
function topSpend(entries) {
  const now      = Date.now();
  const thisWeekOut = entries.filter(e => e.type === 'out' && inRange(e, now - WEEK, now));
  if (thisWeekOut.length < 3) return null;

  const byCat = {};
  for (const e of thisWeekOut) byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;

  const [[cat, total]] = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const lastWeekTotal  = sumOut(entries, cat, now - 2 * WEEK, now - WEEK);

  let text;
  if (lastWeekTotal > 0) {
    const diff = total - lastWeekTotal;
    text = `Is hafte sabse zyada ${cat} pe gaya — ₹${r(total)}. Pichhle hafte se ₹${r(Math.abs(diff))} ${diff > 0 ? 'zyada' : 'kam'}.`;
  } else {
    text = `Is hafte sabse zyada ${cat} pe gaya — ₹${r(total)}.`;
  }

  return { type: 'top_spend', text, savings_amount: null, had_goal: false };
}

// ── 5. INCOME MOMENT ──────────────────────────────────────────────────────────
function incomeMoment(lastEntry, goals) {
  if (!lastEntry || lastEntry.type !== 'in' || lastEntry.amount < 1000) return null;

  const text = goals?.length
    ? `Aaj ₹${r(lastEntry.amount)} aaya — thoda alag rakh dein apne ${goals[0].name} goal ke liye?`
    : `Aaj ₹${r(lastEntry.amount)} aaya — thoda alag rakh dein kisi goal ke liye?`;

  return { type: 'income_moment', text, savings_amount: null, had_goal: !!goals?.length };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * computeInsight — call AFTER a user input. Returns first matching insight or null.
 * Caller enforces the "max one per session" gate.
 *
 * @param {object} state      AppContext state slice
 * @param {object} lastEntry  the entry just committed (for income_moment)
 * @returns {{ type, text, savings_amount, had_goal } | null}
 */
export function computeInsight(state, lastEntry = null) {
  const { entries = [], sessionDecodes = [], goals = [], balance = 0 } = state;

  const checks = [
    () => recurringSaving(entries, sessionDecodes),
    () => goalConnection(sessionDecodes, goals, balance),
    () => leakDetect(entries),
    () => topSpend(entries),
    () => incomeMoment(lastEntry, goals),
  ];

  for (const fn of checks) {
    const result = fn();
    if (result) return result;
  }
  return null;
}
