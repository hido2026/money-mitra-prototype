// summary.js — compute the morning summary text shown on the home screen.
// Pure arithmetic from localStorage entries. ZERO API calls.
// Returns a string, or null if no data (caller shows default).

const f    = n => Math.abs(Math.round(n)).toLocaleString('en-IN');  // entry amounts (always positive)
const fBal = n => (n < 0 ? '-₹' : '₹') + Math.abs(Math.round(n)).toLocaleString('en-IN'); // balance (signed)

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
  return list
    .filter(e => e.type === type)
    .reduce((s, e) => s + (e.amount ?? 0), 0);
}

/**
 * computeMorningSummary
 * @param {Array}  entries  from AppContext state
 * @param {object|null} goal
 * @param {number} balance  running total
 * @returns {string|null}  null → caller shows default subtitle
 */
export function computeMorningSummary(entries, goal, balance) {
  if (!entries || entries.length === 0) return null;

  const goalSuffix =
    goal && goal.target > goal.saved && goal.target > 0
      ? ` · ${goal.label} में ₹${f(goal.target - goal.saved)} बाकी।`
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

  // Entries exist but none from today / yesterday — show balance + goal only
  return `बैलेंस: ${fBal(balance)}${goalSuffix}`;
}
