// insights.js — the insight ENGINE. Pure, deterministic functions over the
// in-memory feed. Insights are COMPUTED, never generated: no number appears that
// wasn't extracted or computed from extracted numbers. Educate-not-advise only.
//
// entry shape (from Decoder logDecode): { id, docType, merchant, category, dir, amount, points, icon }

import { inr } from './motion';
import { isTrapLabel } from './docTypes';

// General literacy nudges — TRUE, non-numeric, non-advisory (used only as last resort).
const GENERAL = {
  'फ़ोन रिचार्ज': {
    hi: 'हर महीने का रिचार्ज है — सालाना प्लान अक्सर सस्ता पड़ता है।',
    en: 'Monthly recharge — an annual plan is often cheaper.',
  },
  'बिजली': {
    hi: 'बिजली का बिल हर महीने आता है — मीटर रीडिंग पर नज़र रखना अच्छा रहता है।',
    en: 'Electricity bill comes every month — keeping track of meter readings helps.',
  },
  'खाना-पीना': {
    hi: 'बाहर का खाना कभी-कभार ठीक है — हिसाब में दिखता रहे तो समझ बनी रहती है।',
    en: 'Eating out occasionally is fine — keeping track helps you stay aware.',
  },
  'राशन': {
    hi: 'राशन ज़रूरी खर्च है — रसीद रखने से महीने का हिसाब साफ़ रहता है।',
    en: 'Groceries are essential — keeping receipts helps track your monthly spend.',
  },
  'तनख्वाह': {
    hi: 'कमाई का कागज़ संभाल कर रखें — हिसाब में काम आता है।',
    en: 'Keep your pay slip safe — it comes in handy for records.',
  },
};

/**
 * insightEngine — ONE grounded line for the just-decoded document (Screen 2).
 * @param doc    the freshly extracted doc { merchant, category, dir, amount, tax, docType }
 * @param prior  entries already in the feed (newest-first), NOT including `doc`
 * @param lang   'hi' | 'en'
 */
export function insightEngine(doc, prior = [], lang = 'hi') {
  const L = lang === 'en';
  const amt = doc.amount;
  if (!amt) return L
    ? (doc.direction === 'in' ? 'Income document read.' : 'Document read.')
    : (doc.direction === 'in' ? 'कमाई का कागज़ पढ़ लिया।' : 'कागज़ पढ़ लिया।');

  // 0. CALMING — only when the document looks alarming (notice / penalty)
  if (doc.alarming) {
    return doc.dueDate
      ? (L ? `No need to worry — this is just a notice. It mentions ${inr(amt)}, check it by ${doc.dueDate}.`
           : `घबराइए मत — यह सिर्फ़ एक सूचना है। इसमें ${inr(amt)} का ज़िक्र है, ${doc.dueDate} तक देख लीजिए।`)
      : (L ? `No need to worry — this is just a notice. It mentions ${inr(amt)} — take your time.`
           : `घबराइए मत — यह सिर्फ़ एक सूचना है। इसमें ${inr(amt)} का ज़िक्र है — आराम से समझ लीजिए।`);
  }

  // 1. ACTIONABLE — real due date + amount (how the bill works, not advice)
  if (doc.dueDate && doc.direction === 'out') {
    return L ? `Pay ${inr(amt)} by ${doc.dueDate} to avoid interest / late fees.`
             : `${doc.dueDate} तक पूरा ${inr(amt)} भर दें तो ब्याज/लेट फ़ीस नहीं लगती।`;
  }

  // 2. BIGGEST line-item spend (expenses only) — a real extracted item, trap labels excluded (A2)
  if (doc.direction === 'out' && Array.isArray(doc.lineItems) && doc.lineItems.length) {
    const safeLI = doc.lineItems.filter(li => li && li.amount && !isTrapLabel(li.label));
    const big = safeLI.sort((a, b) => b.amount - a.amount)[0];
    if (big && big.amount) {
      return L ? `Biggest item: ${big.label} — ${inr(big.amount)}.`
               : `सबसे बड़ा हिस्सा ${big.label} — ${inr(big.amount)}।`;
    }
  }

  const dir = doc.direction;
  const byMerchant = doc.merchant
    ? prior.filter(e => e.merchant && e.merchant === doc.merchant && e.dir === dir)
    : [];
  // B1: never compare by category when category is 'अन्य' — too broad to be meaningful
  const byCat = doc.category && doc.category !== 'अन्य'
    ? prior.filter(e => e.category === doc.category && e.dir === dir)
    : [];
  const matches = byMerchant.length ? byMerchant : byCat;

  // 3. COMPARISON — real prior amount + real delta
  if (matches.length) {
    const last = matches[0];
    const delta = amt - last.amount;
    if (delta !== 0) {
      const who = byMerchant.length ? doc.merchant : doc.category;
      return L
        ? `Last time ${who} was ${inr(last.amount)} — this time ${inr(Math.abs(delta))} ${delta > 0 ? 'more' : 'less'}.`
        : `पिछली बार ${who} ${inr(last.amount)} था — इस बार ${inr(Math.abs(delta))} ${delta > 0 ? 'ज़्यादा' : 'कम'}।`;
    }
  }

  // 4. COMPOSITION — extracted tax/service charge
  if (doc.tax && doc.tax > 0 && doc.tax < amt) {
    return L ? `This includes ${inr(doc.tax)} in tax / service charge — normal.`
             : `इसमें ${inr(doc.tax)} टैक्स/सर्विस चार्ज भी जुड़ा है — आम बात।`;
  }

  // 5. CUMULATIVE — needs ≥1 prior in this category
  if (byCat.length) {
    const total = byCat.reduce((s, e) => s + e.amount, 0) + amt;
    return L
      ? `${inr(amt)} on ${doc.category} — total ${doc.category} this month: ${inr(total)} ${dir === 'in' ? 'received' : 'spent'}.`
      : `${inr(amt)} का ${doc.category} — इस महीने ${doc.category} पे अब तक ${inr(total)} ${dir === 'in' ? 'आया' : 'गया'}।`;
  }

  // 6. GENERAL literacy nudge (no specific ₹ claim) — or a neutral factual line
  const gen = GENERAL[doc.category];
  if (gen) return L ? gen.en : gen.hi;
  return L ? (dir === 'in' ? `Income received — ${inr(amt)}.` : `${doc.category} — ${inr(amt)}.`)
           : (dir === 'in' ? `कमाई आई — ${inr(amt)}।` : `${doc.category} — ${inr(amt)}।`);
}

/**
 * hisaabInsights — cumulative cards for मेरा हिसाब (Screen 3). Each card appears
 * only when its data condition is met, so insights "unlock" as docs accumulate.
 * @param entries  the full in-memory feed
 * @param lang     'hi' | 'en'
 * @returns [{ id, text }]
 */
export function hisaabInsights(entries = [], lang = 'hi') {
  const L = lang === 'en';
  const out = entries.filter(e => e.dir === 'out');
  const ins = entries.filter(e => e.dir === 'in');
  const outSum = out.reduce((s, e) => s + e.amount, 0);
  const inSum = ins.reduce((s, e) => s + e.amount, 0);
  const cards = [];

  // In vs out (≥1 income + ≥1 expense)
  // B4: only show "कम पड़े" when we have ≥1 salary/subsidy/FD entry (real income);
  // never cry deficit when the user has only uploaded expense docs.
  if (ins.length && out.length) {
    const net = inSum - outSum;
    const hasRealIncome = ins.some(e =>
      e.docType && ['salary_slip','lpg_subsidy','bank_subsidy','fixed_deposit_maturity','mutual_fund_redemption'].includes(e.docType)
    );
    if (net >= 0 || hasRealIncome) {
      cards.push({ id: 'inout', text: L
        ? `${inr(inSum)} in, ${inr(outSum)} out — ${inr(Math.abs(net))} ${net >= 0 ? 'saved' : 'short'}.`
        : `${inr(inSum)} आया, ${inr(outSum)} गया — ${inr(Math.abs(net))} ${net >= 0 ? 'बचे' : 'कम पड़े'}।`
      });
    } else {
      // income present but may be partial — only show what went out
      cards.push({ id: 'inout', text: L
        ? `${inr(outSum)} spent this month.`
        : `इस महीने ${inr(outSum)} गया।`
      });
    }
  }

  // Top spend (≥2 expenses)
  if (out.length >= 2) {
    const byCat = {};
    out.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const [cat, sum] = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    cards.push({ id: 'top', text: L
      ? `Highest spend: ${cat} — ${inr(sum)}.`
      : `सबसे ज़्यादा ${cat} पे — ${inr(sum)}।`
    });
  }

  // Biggest change (same category appears ≥2× among expenses)
  let best = null;
  for (const c of [...new Set(out.map(e => e.category))]) {
    const es = out.filter(e => e.category === c); // newest-first
    if (es.length >= 2) {
      const d = es[0].amount - es[1].amount;
      if (d !== 0 && (!best || Math.abs(d) > Math.abs(best.d))) best = { c, d };
    }
  }
  if (best) cards.push({ id: 'change', text: L
    ? `${best.c} is ${inr(Math.abs(best.d))} ${best.d > 0 ? 'more' : 'less'} than last time.`
    : `${best.c} पिछली बार से ${inr(Math.abs(best.d))} ${best.d > 0 ? 'ज़्यादा' : 'कम'}।`
  });

  // This-month total (always, once ≥1 expense)
  if (out.length) cards.push({ id: 'total', text: L
    ? `Total spent so far this month: ${inr(outSum)}.`
    : `इस महीने अब तक ${inr(outSum)} गया।`
  });

  return cards;
}
