// patterns.js — weekly pattern detection for home screen insight bubble.
// Pure arithmetic from localStorage entries. ZERO API calls.
// A wrong number here kills trust — every figure is code-computed.
//
// Priority order: a) category_spike → b) saving_streak → c) goal_proximity
//                 → d) goal_projection → e) decode_comparison → f) top_category
//
// Cooldown: last_pattern_type stored in localStorage — skip same type twice in a row.
// Session gate: caller (Home.jsx) checks sessionStorage to cap at one per session.

const LAST_TYPE_KEY = 'last_pattern_type';
const f = n => Math.abs(Math.round(n)).toLocaleString('en-IN');

// ── Date helpers ───────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const WEEK = 7 * DAY;

function ts(e) {
  if (!e.timestamp) return null;
  try { return new Date(e.timestamp).getTime(); } catch { return null; }
}

function inRange(entry, fromMs, toMs) {
  const t = ts(entry);
  return t !== null && t >= fromMs && t <= toMs;
}

// ── Pattern checks ─────────────────────────────────────────────────────────────

// a) CATEGORY SPIKE
function checkCategorySpike(entries) {
  const now = Date.now();
  const outNow  = entries.filter(e => e.type === 'out' && inRange(e, now - WEEK,     now));
  const outPrev = entries.filter(e => e.type === 'out' && inRange(e, now - 2 * WEEK, now - WEEK));

  if (!outNow.length || !outPrev.length) return null;

  const sumByCat = (list) => {
    const m = {};
    for (const e of list) m[e.category] = (m[e.category] ?? 0) + (e.amount ?? 0);
    return m;
  };

  const thisW = sumByCat(outNow);
  const lastW = sumByCat(outPrev);

  let best = null;
  for (const [cat, thisAmt] of Object.entries(thisW)) {
    const lastAmt = lastW[cat] ?? 0;
    if (lastAmt === 0) continue;
    const diff = thisAmt - lastAmt;
    if (thisAmt > 1.5 * lastAmt && diff > 100) {
      if (!best || diff > best.diff) best = { cat, thisAmt, lastAmt, diff };
    }
  }
  if (!best) return null;
  return {
    type: 'category_spike',
    text: `${best.cat} पे इस हफ़्ते ₹${f(best.thisAmt)} गए — पिछले हफ़्ते ₹${f(best.lastAmt)} था। ₹${f(best.diff)} ज़्यादा।`,
  };
}

// b) SAVING STREAK — 3+ consecutive days with net > 0
function checkSavingStreak(entries) {
  const byDate = {};
  for (const e of entries) {
    if (!e.timestamp) continue;
    const d = e.timestamp.split('T')[0];
    if (!byDate[d]) byDate[d] = { in: 0, out: 0 };
    if (e.type === 'in')  byDate[d].in  += e.amount ?? 0;
    else                  byDate[d].out += e.amount ?? 0;
  }
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)); // desc
  if (dates.length < 3) return null;

  let streak = 0;
  for (const d of dates) {
    if ((byDate[d].in - byDate[d].out) > 0) streak++;
    else break;
  }
  if (streak < 3) return null;
  return {
    type: 'saving_streak',
    text: `लगातार ${streak} दिन बचत हो रही है — इसी रफ़्तार से चलें।`,
  };
}

// c) GOAL PROXIMITY — saved > 80% of target
function checkGoalProximity(entries, goal) {
  if (!goal || goal.target <= 0) return null;
  if (goal.saved / goal.target <= 0.8) return null;
  const remaining = goal.target - goal.saved;
  return {
    type: 'goal_proximity',
    text: `${goal.label} लगभग पूरा — सिर्फ़ ₹${f(remaining)} बाकी!`,
  };
}

// d) GOAL PROJECTION — compute weekly surplus, project weeks
function checkGoalProjection(entries, goal) {
  if (!goal || goal.target <= 0) return null;
  const remaining = goal.target - goal.saved;
  if (remaining <= 0) return null;

  const now = Date.now();
  const last14 = entries.filter(e => inRange(e, now - 14 * DAY, now));
  if (last14.length < 3) return null; // too little data to project honestly

  const totalIn  = last14.filter(e => e.type === 'in' ).reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalOut = last14.filter(e => e.type === 'out').reduce((s, e) => s + (e.amount ?? 0), 0);
  const weeklyRate = (totalIn - totalOut) / 2; // 14 days ≈ 2 weeks

  if (weeklyRate <= 0) return null;
  const weeks = Math.ceil(remaining / weeklyRate);
  if (weeks > 52) return null; // don't project > 1 year (not credible)

  return {
    type: 'goal_projection',
    text: `इसी रफ़्तार से ${goal.label} करीब ${weeks} हफ़्ते में पूरा हो जाएगा।`,
  };
}

// e) DECODE COMPARISON — two or more decoded bills of the same bill_type
function checkDecodeComparison(entries) {
  const tagged = entries.filter(e => e.source === 'decoder' && e.bill_type && e.bill_type !== 'other');
  if (tagged.length < 2) return null;

  const byType = {};
  for (const e of tagged) {
    if (!byType[e.bill_type]) byType[e.bill_type] = [];
    byType[e.bill_type].push(e);
  }

  for (const [billType, list] of Object.entries(byType)) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const older   = sorted[sorted.length - 2];
    const current = sorted[sorted.length - 1];
    const diff = (current.amount ?? 0) - (older.amount ?? 0);
    if (diff === 0) continue;
    return {
      type: 'decode_comparison',
      text: `पिछली बार ${billType} ₹${f(older.amount)} था, इस बार ₹${f(current.amount)} — ₹${f(Math.abs(diff))} ${diff > 0 ? 'ज़्यादा' : 'कम'}।`,
    };
  }
  return null;
}

// f) TOP CATEGORY — 10+ entries, find highest spending category this week
function checkTopCategory(entries) {
  if (entries.length < 10) return null;
  const now = Date.now();
  const thisWeekOut = entries.filter(e => e.type === 'out' && inRange(e, now - WEEK, now));
  if (thisWeekOut.length < 3) return null;

  const byCat = {};
  for (const e of thisWeekOut) byCat[e.category] = (byCat[e.category] ?? 0) + (e.amount ?? 0);

  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;
  const [cat, total] = sorted[0];
  return {
    type: 'top_category',
    text: `सबसे ज़्यादा खर्च: ${cat} पे ₹${f(total)} गए इस हफ़्ते।`,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * computePattern
 * Returns the first matching pattern (respecting type cooldown), or null.
 * Caller (Home.jsx) handles session gate via sessionStorage.
 *
 * @param {Array}       entries  from AppContext state
 * @param {object|null} goal
 * @returns {{ type: string, text: string } | null}
 */
export function computePattern(entries, goal) {
  if (!entries || entries.length < 5) return null;

  const lastType = localStorage.getItem(LAST_TYPE_KEY);

  const checks = [
    () => checkCategorySpike(entries),
    () => checkSavingStreak(entries),
    () => checkGoalProximity(entries, goal),
    () => checkGoalProjection(entries, goal),
    () => checkDecodeComparison(entries),
    () => checkTopCategory(entries),
  ];

  // First pass — skip lastType to avoid immediate repeat
  for (const fn of checks) {
    const r = fn();
    if (r && r.type !== lastType) return r;
  }

  // Second pass — allow lastType if nothing else fires (prevents total blackout)
  for (const fn of checks) {
    const r = fn();
    if (r) return r;
  }

  return null;
}

/** Call after showing a pattern to persist the cooldown key. */
export function recordPatternShown(type) {
  localStorage.setItem(LAST_TYPE_KEY, type);
}
