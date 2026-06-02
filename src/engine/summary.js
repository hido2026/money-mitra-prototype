// summary.js — morning summary text for the home screen.
// Uses computeGoalProgress so "remaining" is balance-based, never goal.saved.

import { topGoalWithProgress } from './goals';

const f    = n => Math.abs(Math.round(n)).toLocaleString('en-IN');
const fBal = n => (n < 0 ? '-₹' : '₹') + Math.abs(Math.round(n)).toLocaleString('en-IN');

function dateStr(isoOrLegacy) {
  if (!isoOrLegacy) return null;
  try {
    const d = new Date(isoOrLegacy);
    if (isNaN(d)) return null;
    return d.toISOString().split('T')[0];
  } catch { return null; }
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function sumEntries(list, type) {
  return list.filter(e => e.type === type).reduce((s, e) => s + (e.amount ?? 0), 0);
}

/**
 * computeMorningSummary
 * @param {Array}   entries
 * @param {Array}   goals    goals[] array (v2)
 * @param {number}  balance
 * @returns {string|null}  null → caller shows default subtitle
 */
export function computeMorningSummary(entries, goals, balance) {
  if (!entries || entries.length === 0) return null;

  // Goal suffix — show highest-priority goal progress
  const top = topGoalWithProgress(balance, goals);
  const goalSuffix = top
    ? top.achieved
      ? ` · ${top.name} पूरा! 🎉`
      : ` · ${top.name} में ₹${f(top.remaining)} बाकी।`
    : '';

  const today     = daysAgoStr(0);
  const yesterday = daysAgoStr(1);

  const todayE = entries.filter(e => dateStr(e.timestamp) === today);
  if (todayE.length > 0) {
    const inc = sumEntries(todayE, 'in');
    const exp = sumEntries(todayE, 'out');
    return `आज: ₹${f(inc)} मिले, ₹${f(exp)} गए। बैलेंस: ${fBal(balance)}${goalSuffix}`;
  }

  const yesterE = entries.filter(e => dateStr(e.timestamp) === yesterday);
  if (yesterE.length > 0) {
    const inc = sumEntries(yesterE, 'in');
    const exp = sumEntries(yesterE, 'out');
    return `कल: ₹${f(inc)} मिले, ₹${f(exp)} गए। बैलेंस: ${fBal(balance)}${goalSuffix}`;
  }

  return `बैलेंस: ${fBal(balance)}${goalSuffix}`;
}
