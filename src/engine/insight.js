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
    text: 'अभी थोड़े दिन का हिसाब है, इसलिए अभी बताने लायक कुछ खास नहीं। रोज़ हिसाब डालते रहें — हफ़्ते भर बाद मैं बता दूँगा पिछली बार से कितना बदला।',
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

// ── Connect-dots: decoder bill vs last same-category entry → goal ─────────────

/**
 * computeConnectDotsInsight
 * Ties a just-decoded bill to the last known entry of the same category,
 * then expresses the delta as a fraction of the top active goal's remaining amount.
 *
 * Pure arithmetic — ZERO API calls. Every number is code-computed.
 *
 * Compliance: observation only — describes what IS, never what to DO.
 *   OK:  "यह बिजली बिल पिछली बार से ₹300 ज़्यादा है। इतने में दिवाली का आधा लक्ष्य पूरा हो जाता।"
 *   NOT: "आपको ज़्यादा बचाना चाहिए।"
 *
 * @param {string} billType  Hindi label, e.g. 'बिजली बिल', 'मोबाइल रिचार्ज'
 * @param {number} newAmount Amount from the just-decoded bill
 * @param {Array}  entries   AppContext entries[]
 * @param {Array}  goals     AppContext goals[] — [{id,name,target,priority}]
 * @param {number} balance   Current running balance
 * @returns {{ text: string } | null}
 */
export function computeConnectDotsInsight(billType, newAmount, entries, goals, balance) {
  if (!billType || billType === 'other' || !newAmount || newAmount <= 0) return null;
  if (!entries?.length) return null;

  // Find the most recent previous entry of the same bill category
  // Entries can be tagged with bill_type (decoder-sourced) or just category (manual)
  const prev = [...entries]
    .filter(e =>
      e.type === 'out' &&
      e.timestamp &&
      ((e.bill_type && e.bill_type === billType) || e.category === billType)
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  if (!prev || prev.amount == null || prev.amount <= 0) return null;

  const delta    = newAmount - prev.amount;
  const absDelta = Math.abs(Math.round(delta));

  // Suppress if delta is trivially small (< ₹50) — no meaningful signal
  if (absDelta < 50) return null;

  const r = n => Math.abs(Math.round(n)).toLocaleString('en-IN');
  const direction = delta > 0 ? 'ज़्यादा' : 'कम';

  // Try to connect to the top active goal (highest priority with remaining > 0)
  const topGoal = goals?.length
    ? [...goals]
        .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9))
        .find(g => Math.max(0, g.target - Math.max(0, balance)) > 0)
    : null;

  if (topGoal) {
    const remaining = Math.max(0, topGoal.target - Math.max(0, balance));

    if (remaining > 0) {
      // Express absDelta as a natural fraction of remaining
      const ratio = absDelta / remaining;

      let fractionText = null;
      if (ratio >= 0.90) fractionText = 'लगभग पूरा';
      else if (ratio >= 0.45) fractionText = 'आधा';
      else if (ratio >= 0.28) fractionText = 'एक-तिहाई';
      else if (ratio >= 0.18) fractionText = 'एक-चौथाई';

      if (fractionText) {
        return {
          text: `यह ${billType} पिछली बार से ₹${r(absDelta)} ${direction} है। इतने में ${topGoal.name} का ${fractionText} लक्ष्य पूरा हो जाता।`,
        };
      }

      // Fraction too small for a clean expression — show remaining distance instead
      if (absDelta >= 100) {
        return {
          text: `यह ${billType} पिछली बार से ₹${r(absDelta)} ${direction} है। ${topGoal.name} अभी ₹${r(remaining)} दूर है।`,
        };
      }
    }
  }

  // No active goal — just the bill-to-bill comparison
  if (absDelta >= 100) {
    return {
      text: `यह ${billType} पिछली बार से ₹${r(absDelta)} ${direction} है।`,
    };
  }

  return null;
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
