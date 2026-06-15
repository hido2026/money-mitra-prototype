// rewards.js — pure, deterministic variable reward engine.
// awardPoints() replaces the hardcoded REWARD_POINTS = 100.
// Returns { total, reasons } so the UI can show a count-up + bonus chip.

import cfg from '../data/rewards.config.json';

export { cfg as REWARDS_CFG };

/**
 * awardPoints — compute points for a capture event.
 *
 * @param {string} event  — currently only 'doc_captured'
 * @param {object} ctx    — { seenTypes: Set<string>, docType: string,
 *                            hasIncome: boolean, hasExpense: boolean }
 * @returns {{ total: number, reasons: Array<{pts: number, why: string}> }}
 */
export function awardPoints(event, ctx = {}) {
  const reasons = [];
  let total = 0;

  const e = cfg.events[event];
  if (!e) return { total: 0, reasons };

  // Base random band (3–12 for a normal capture)
  if (e.base) {
    const [lo, hi] = e.base;
    const pts = lo + Math.floor(Math.random() * (hi - lo + 1));
    total += pts;
    reasons.push({ pts, why: 'फ़ोटो जोड़ी' });
  }

  if (event === 'doc_captured') {
    const { seenTypes = new Set(), docType, hasIncome = false, hasExpense = false } = ctx;

    // First-of-type bonus
    const isNew = docType && !seenTypes.has(docType);
    if (isNew) {
      const pts = cfg.events.first_of_type.bonus;
      total += pts;
      reasons.push({ pts, why: 'नया दस्तावेज़' });
      seenTypes.add(docType); // mutates caller's Set intentionally
    }

    // Variety milestone — every N distinct types
    const { everyNTypes, bonus: vBonus } = cfg.events.variety_milestone;
    if (seenTypes.size > 0 && seenTypes.size % everyNTypes === 0) {
      total += vBonus;
      reasons.push({ pts: vBonus, why: 'अलग-अलग कागज़' });
    }

    // Completeness bonus — both income and expense present
    if (hasIncome && hasExpense) {
      const pts = cfg.events.completeness.bonus;
      total += pts;
      reasons.push({ pts, why: 'पूरा हिसाब' });
    }
  }

  return { total, reasons };
}

/** Convenience: how many points needed to earn ₹1 */
export const pointsPerRupee = cfg.redeem.pointsPerRupee;

/** Redemption partner label */
export const redeemPartner = cfg.redeem.partner;
