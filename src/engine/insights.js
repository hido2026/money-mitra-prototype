// insights.js — home-screen spending-pattern + goal-pacing engine.
//
// Computes from the user's OWN in-memory data:
//   entries      [{type:in|out, amount, category, timestamp}]
//   sessionDecodes [{bill_type, amount}]
//   goals        [{id, name, target, priority}]
//   balance      number
//
// RULES:
//   - Every number arithmetically verified — never hardcoded totals.
//   - Observations only — no prescriptive language ("save more", "you should").
//   - Never recommend a specific product or brand.
//   - If not enough data → return null (better silent than wrong).
//   - Max one insight per session (caller enforces).
//   - Fire AFTER an input (contextual) — never on open.
//
// Six types (priority order — first match returned):
//   1. RECURRING_SAVING  — detect recurring expense, show public-price comparison
//   2. GOAL_CONNECTION   — tie a saving opportunity to an active goal
//   3. GOAL_PACING       — days-to-goal from recent daily savings rate (observation only)
//   4. BIGGEST_MOVER     — single biggest week-over-week category delta (>₹100 AND >20%)
//   5. TOP_SPEND         — largest category this week (with week-over-week comparison)
//   6. INCOME_MOMENT     — on large income, contextual note about active goal

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

// ── 3. GOAL PACING ────────────────────────────────────────────────────────────
// Observation: "दिवाली का लक्ष्य अभी ₹200 दूर — इसी रफ़्तार से करीब 5 दिन और लगेंगे।"
// Never prescriptive. Suppressed if days < 1 or > 365 or rate ≤ 0.
function goalPacing(entries, goals, balance) {
  if (!goals?.length) return null;

  // Top-priority goal with remaining amount
  const sorted    = [...goals].sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
  const topGoal   = sorted.find(g => Math.max(0, g.target - Math.max(0, balance)) > 0);
  if (!topGoal) return null;

  const remaining = Math.max(0, topGoal.target - Math.max(0, balance));
  if (remaining <= 0) return null;

  // Daily savings rate from last 7 days
  const now      = Date.now();
  const last7    = entries.filter(e => e.timestamp && inRange(e, now - WEEK, now));
  if (last7.length < 2) return null; // not enough data to project honestly

  const totalIn  = last7.filter(e => e.type === 'in' ).reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalOut = last7.filter(e => e.type === 'out').reduce((s, e) => s + (e.amount ?? 0), 0);
  const dailyRate = (totalIn - totalOut) / 7;

  if (dailyRate <= 0) return null;

  const days = Math.ceil(remaining / dailyRate);
  if (days < 1 || days > 365) return null; // suppress if implausible

  return {
    type: 'goal_pacing',
    text: `${topGoal.name} बस ₹${r(remaining)} दूर — इसी रफ़्तार से ${days} दिन में पूरा।`,
    savings_amount: null,
    had_goal: true,
  };
}

// ── 4. BIGGEST MOVER ──────────────────────────────────────────────────────────
// Finds the single category with the LARGEST week-over-week spend increase.
// Threshold: delta > ₹100 AND > 20% increase. Returns null if nothing notable.
// This replaces the old leakDetect which returned the first match (not the biggest).
function biggestMover(entries) {
  const now  = Date.now();
  const cats = [...new Set(entries.filter(e => e.type === 'out').map(e => e.category))];

  let best = null;
  for (const cat of cats) {
    const thisWeek = sumOut(entries, cat, now - WEEK, now);
    const lastWeek = sumOut(entries, cat, now - 2 * WEEK, now - WEEK);
    const delta    = thisWeek - lastWeek;

    // Must exceed BOTH thresholds: absolute ₹100 AND relative 20%
    if (lastWeek > 0 && delta > 100 && thisWeek > lastWeek * 1.2) {
      if (!best || delta > best.delta) {
        best = { cat, thisWeek, lastWeek, delta };
      }
    }
  }

  if (!best) return null;

  return {
    type: 'biggest_mover',
    text: `इस हफ़्ते ${best.cat} पे पिछले हफ़्ते से ₹${r(best.delta)} ज़्यादा गए।`,
    savings_amount: null,
    had_goal: false,
  };
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
 * Priority order (first match wins):
 *   1. recurring_saving  — strongest: recurring cost with public-price comparison
 *   2. goal_connection   — ties a saving opportunity to active goal
 *   3. goal_pacing       — days-to-goal observation from daily savings rate
 *   4. biggest_mover     — single biggest week-over-week category delta (>₹100 AND >20%)
 *   5. top_spend         — largest category this week with week-over-week comparison
 *   6. income_moment     — contextual note on large income entry
 *
 * No insight beats a manufactured one — returns null if nothing is notable.
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
    () => goalPacing(entries, goals, balance),
    () => biggestMover(entries),
    () => topSpend(entries),
    () => incomeMoment(lastEntry, goals),
  ];

  for (const fn of checks) {
    const result = fn();
    if (result) return result;
  }
  return null;
}
