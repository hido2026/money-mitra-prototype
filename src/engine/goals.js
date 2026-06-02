// goals.js — pure goal progress computation.
// Progress is computed from current balance via priority waterfall.
// NEVER from a stored goal.saved — that was the source of the 0% bug.
//
// Waterfall: priority 1 fills first, then 2, etc.
// Example: balance ₹2,200, goals [school ₹5,000 p1, electric ₹2,000 p2]
//   → school: 2200/5000 = 44%  |  electric: 0% (nothing left)

/**
 * computeGoalProgress
 * @param {number}  balance  current running balance (can be negative)
 * @param {Array}   goals    [{id, name, target, priority}]
 * @returns Array of goals with: allocated, pct, achieved, remaining
 */
export function computeGoalProgress(balance, goals) {
  if (!goals?.length) return [];
  const sorted = [...goals].sort((a, b) => a.priority - b.priority);
  let pool = Math.max(0, balance); // negative balance → 0 allocation
  return sorted.map(g => {
    const allocated = Math.min(pool, g.target);
    pool = Math.max(0, pool - allocated);
    const pct      = g.target > 0 ? Math.min(100, Math.round((allocated / g.target) * 100)) : 0;
    const achieved = allocated >= g.target;
    return { ...g, allocated, pct, achieved, remaining: Math.max(0, g.target - allocated) };
  });
}

/** Returns the highest-priority goal with its progress, or null. */
export function topGoalWithProgress(balance, goals) {
  return computeGoalProgress(balance, goals)[0] ?? null;
}

/** Next available priority number (max + 1). */
export function nextPriority(goals) {
  if (!goals?.length) return 1;
  return Math.max(...goals.map(g => g.priority)) + 1;
}
