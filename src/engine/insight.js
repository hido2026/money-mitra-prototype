// insight.js — Connect-the-dots insight engine.
//
// Pure function: (AppContext state) → InsightPayload | null
// ZERO Groq calls. Every rupee figure and week projection is arithmetic.
// A hallucinated number here is a stop-ship bug.
//
// Confidence tiers:
//   T0 — cold start (<5 entries, no goal)
//   T1 — enough entries, computable surplus, no goal yet
//   T2 — entries + goal, no fresh decode this session
//   T3 — entries + goal + recurring decode THIS session → full chain
//
// Rules:
//   - Fire at most once per session (insightFired gate)
//   - Must join ≥2 data sources or return null
//   - Suppress, never downgrade: if T3 data exists but T3 fails, return null
//   - Never name providers; never reference gold/FD/JFS products
//   - weeksToGoal < 1 → suppress, don't show negative or infinite projections

// ── Helpers ───────────────────────────────────────────────────────────────────

function r(n) {
  // Format as ₹ integer in Indian notation
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function periodSurplus(entries) {
  // Treat all entries as covering one ~weekly period (prototype simplification).
  // In production: filter by date range, compute rolling weekly average.
  // Uses e.amount (v2 schema) with fallback to e.amt (v1 migration shim).
  const amt = e => e.amount ?? e.amt ?? 0;
  const totalIn  = entries.filter(e => e.type === 'in' ).reduce((s, e) => s + amt(e), 0);
  const totalOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + amt(e), 0);
  return totalIn - totalOut;
}

/**
 * Weeks to reach goal from current saved amount at a given weekly rate.
 * Returns null if can't project honestly (rate ≤ 0, goal met, etc.).
 */
function weeksToGoal(weeklyRate, goal) {
  if (!goal || weeklyRate <= 0) return null;
  const remaining = goal.target - goal.saved;
  if (remaining <= 0) return null; // goal already met — nothing to project
  return Math.ceil(remaining / weeklyRate);
}

// ── Tier builders ─────────────────────────────────────────────────────────────

function buildT0() {
  return {
    tier: 0,
    text: 'अभी थोड़े दिन का हिसाब है, इसलिए अभी बताने लायक कुछ खास नहीं। रोज़ हिसाब डालते रहें — हफ़्ते भर बाद बता पाऊँगा पैसा कहाँ जा रहा है और कहाँ बच सकता है।',
    action: null,
  };
}

function buildT1(surplus) {
  return {
    tier: 1,
    text: `पिछले हफ़्ते करीब ${r(surplus)} बचे। कोई लक्ष्य सोचा है — त्योहार, सोना, या कुछ और? बता दें तो हर हफ़्ते हिसाब रखूँगा, लक्ष्य कितना बाकी है।`,
    action: 'set_goal',
  };
}

function buildT2(surplus, weeks, goal) {
  return {
    tier: 2,
    text: `इस हफ़्ते ${r(surplus)} बचे। इसी रफ़्तार से ${goal.label} का लक्ष्य करीब ${weeks} हफ़्ते में पूरा हो जाएगा।`,
    action: 'add_to_bahi',
  };
}

function tryT3(decode, surplus, weeks, goal) {
  // Extra weekly rate from redirecting this recurring cost's saving
  // month_saving / 4.33 ≈ weekly equivalent
  const extraWeekly = decode.monthly_saving / 4.33;
  const weeksWith   = weeksToGoal(surplus + extraWeekly, goal);

  // Must accelerate by at least 1 full week to be meaningful
  if (weeksWith === null || (weeks - weeksWith) < 1) return null;

  const weeksEarlier = weeks - weeksWith;

  let text;
  if (decode.bill_type === 'recharge' && decode.annual_plan_cost != null) {
    // Plan-switch saving: ₹300/mo → ₹2,800 annual plan → save ₹800
    const monthlyCost    = decode.amount;
    const yearlyCost     = monthlyCost * 12;
    const annualPlanCost = decode.annual_plan_cost;
    const saving         = decode.saveable;
    text = `${decode.labelHi} पे हर महीने करीब ${r(monthlyCost)} जाते हैं — साल का ${r(yearlyCost)}। सालाना प्लान ${r(annualPlanCost)} का पड़ता है (सार्वजनिक रेट के अनुसार), यानी ${r(saving)} बच सकते हैं। वो ${r(saving)} बही में डालें तो ${goal.label} का लक्ष्य लगभग ${weeksEarlier} हफ़्ते पहले पूरा।`;
  } else {
    // Behaviour-change saving (e.g., electricity — use fewer units)
    const monthlySaving = decode.saveable;
    const yearlySaving  = monthlySaving * 12;
    text = `${decode.labelHi} पे करीब ${r(monthlySaving)} हर महीने बच सकते हैं — साल में ${r(yearlySaving)}। वो बही में डालें तो ${goal.label} का लक्ष्य लगभग ${weeksEarlier} हफ़्ते पहले पूरा।`;
  }

  return { tier: 3, text, action: 'add_to_bahi' };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * computeInsight — call at a natural seam (post-log or post-decode).
 *
 * @param  {object} state  AppContext state slice
 * @returns InsightPayload | null
 *
 * InsightPayload: { tier: 0|1|2|3, text: string, action: 'set_goal'|'add_to_bahi'|null }
 */
export function computeInsight({ sessionDecodes, entries, goal, insightFired }) {
  // ── Gate: never fire twice ─────────────────────────────────────────────────
  if (insightFired) return null;

  const n       = entries.length;
  const surplus = periodSurplus(entries);
  const hasGoal = goal !== null;
  const recurringDecode = sessionDecodes.find(d => d.recurring) ?? null;

  // ── T0: cold start ─────────────────────────────────────────────────────────
  // Requires ≥1 entry so there's something to respond to, but <5 and no goal.
  // Joins ≥2 sources: entries (passbook) + time context (session start).
  if (n < 5 && !hasGoal) {
    if (n === 0) return null; // nothing at all — too early even for T0
    return buildT0();
  }

  // ── From here, all tiers need a positive surplus to project honestly ───────
  if (surplus <= 0) return null;

  // ── T1: enough entries, no goal ────────────────────────────────────────────
  // Joins: entries (min 5) + computed surplus → prompts goal-setting.
  if (!hasGoal) {
    return buildT1(surplus);
  }

  // ── T2 / T3: goal is set ───────────────────────────────────────────────────
  if (n < 5) return null; // edge: goal set before enough ledger data

  const weeks = weeksToGoal(surplus, goal);
  if (weeks === null) return null; // goal already met or can't project

  // ── T3: full chain — decode + ledger + goal ─────────────────────────────────
  // SUPPRESS, don't downgrade: if T3 data present but fails, return null.
  if (recurringDecode !== null) {
    const result = tryT3(recurringDecode, surplus, weeks, goal);
    if (result) return result;
    // T3 failed honest check (weeksEarlier < 1) → suppress entirely
    return null;
  }

  // ── T2: ledger + goal (no decode this session) ─────────────────────────────
  return buildT2(surplus, weeks, goal);
}
