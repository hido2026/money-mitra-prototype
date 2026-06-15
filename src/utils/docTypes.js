// docTypes.js — single source of truth: doc_type string → { title, category, direction, icon, borrowed? }
//
// "borrowed" = true ONLY for money-in that is a liability (loan disbursal, CC credit, BNPL).
// These entries are excluded from आया in the passbook; shown in a separate ऋण line.
//
// Icon keys are resolved by docIcon() in Decoder.jsx and Passbook.jsx.
// Category is the real Hindi bucket — never "अन्य" for a recognised type.

export const DOC_TYPE_MAP = {
  // ── Insurance (premium = always out) ─────────────────────────────────────────
  health_insurance:        { title: 'स्वास्थ्य बीमा',       category: 'बीमा',      direction: 'out',       icon: 'shield'    },
  term_insurance:          { title: 'जीवन बीमा',            category: 'बीमा',      direction: 'out',       icon: 'shield'    },
  vehicle_insurance:       { title: 'वाहन बीमा',             category: 'बीमा',      direction: 'out',       icon: 'shield'    },

  // ── Loans — disbursal = in-but-borrowed; EMI/statement = out ─────────────────
  personal_loan_disbursal: { title: 'लोन मिला',             category: 'ऋण',        direction: 'in',        icon: 'bank',     borrowed: true },
  gold_loan_disbursal:     { title: 'सोने पर लोन',           category: 'ऋण',        direction: 'in',        icon: 'gold-coin', borrowed: true },
  gold_loan_statement:     { title: 'सोने पर लोन',           category: 'ऋण',        direction: 'out',       icon: 'gold-coin' },
  personal_loan_emi:       { title: 'लोन की किस्त',          category: 'ऋण',        direction: 'out',       icon: 'coin'      },
  microfinance_emi:        { title: 'लोन की किस्त',          category: 'ऋण',        direction: 'out',       icon: 'coin'      },
  credit_card_bill:        { title: 'क्रेडिट कार्ड',         category: 'ऋण',        direction: 'out',       icon: 'card'      },
  credit_card_credit:      { title: 'क्रेडिट कार्ड जमा',    category: 'ऋण',        direction: 'in',        icon: 'card',     borrowed: true },

  // ── Utilities & payments ─────────────────────────────────────────────────────
  upi_receipt:             { title: 'UPI भुगतान',            category: null,        direction: 'out',       icon: 'upi'       },
  electricity_bill:        { title: 'बिजली बिल',             category: 'बिजली',     direction: 'out',       icon: 'zap'       },
  phone_recharge:          { title: 'फ़ोन रिचार्ज',           category: 'फ़ोन',       direction: 'out',       icon: 'phone'     },

  // ── Subsidies (always in — real income, not borrowed) ────────────────────────
  lpg_subsidy:             { title: 'रसोई गैस सब्सिडी',     category: 'सब्सिडी',   direction: 'in',        icon: 'gas'       },
  bank_subsidy:            { title: 'सब्सिडी',               category: 'सब्सिडी',   direction: 'in',        icon: 'gas'       },

  // ── Investments / savings (always in) ────────────────────────────────────────
  mutual_fund_redemption:  { title: 'म्यूचुअल फंड निकासी',  category: 'निवेश',     direction: 'in',        icon: 'chart'     },
  fixed_deposit_maturity:  { title: 'FD मैच्योरिटी',         category: 'बचत',       direction: 'in',        icon: 'lock'      },

  // ── Income ───────────────────────────────────────────────────────────────────
  salary_slip:             { title: 'तनख़्वाह',              category: 'आमदनी',     direction: 'in',        icon: 'wallet'    },

  // ── Food & grocery ───────────────────────────────────────────────────────────
  restaurant_bill:         { title: 'रेस्तरां का बिल',       category: 'खाना-पीना', direction: 'out',       icon: 'fork'      },
  kirana_receipt:          { title: 'किराना रसीद',            category: 'राशन',      direction: 'out',       icon: 'cart'      },

  // ── Fallback — only when type is genuinely unknown ───────────────────────────
  bank_notice:             { title: 'बैंक की सूचना',         category: 'अन्य',      direction: 'ambiguous', icon: 'bank'      },
  other:                   { title: 'कागज़',                   category: 'अन्य',      direction: 'ambiguous', icon: 'receipt'   },
};

/** Full info object; falls back to 'other' for unknown/null types. */
export function getDocType(typeKey) {
  return DOC_TYPE_MAP[typeKey] || DOC_TYPE_MAP['other'];
}

/** Hindi title — never "कागज़" for a recognised type. */
export function docTitle(typeKey) {
  return getDocType(typeKey).title;
}

/**
 * Real category for passbook. For UPI, falls through to the merchant-derived category.
 * Never returns "अन्य" when a real category is known.
 */
export function docCategory(typeKey, merchantCategory) {
  const { category } = getDocType(typeKey);
  if (!category && merchantCategory && merchantCategory !== 'अन्य') return merchantCategory;
  return category || merchantCategory || 'अन्य';
}

/** Icon key string for docIcon() lookup in components. */
export function docIconKey(typeKey) {
  return getDocType(typeKey).icon;
}

/**
 * True ONLY for money-in that is a liability:
 * loan disbursals, credit card credits, BNPL.
 * These must NEVER count toward आया (income).
 */
export function isBorrowed(typeKey) {
  return getDocType(typeKey).borrowed === true;
}

/**
 * TRAP labels — line-item labels that represent standing balances/limits, not
 * the actual amount paid in this transaction. Never cite these as "the biggest spend".
 * Covers: loan principal, outstanding balance, sum assured/IDV, credit limit,
 * gold weight/value, sanctioned amount.
 */
export const TRAP_LABEL_RE =
  /principal|outstanding|balance(?!\s*due)|sum[- ]?assured|sum[- ]?insured|\bidv\b|credit[- ]?limit|loan[- ]?amount|sanctioned|gold[- ]?weight|gold[- ]?value|मूलधन|बकाया|किश्त\s*राशि|बीमा[- ]?राशि|ऋण[- ]?राशि|क्रेडिट[- ]?सीमा|सोने|वज़न/i;

export function isTrapLabel(label = '') {
  return TRAP_LABEL_RE.test(label);
}
