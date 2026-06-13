// insights.js — the insight ENGINE. Pure, deterministic functions over the
// in-memory feed. Insights are COMPUTED, never generated: no number appears that
// wasn't extracted or computed from extracted numbers. Educate-not-advise only.
//
// entry shape (from Decoder logDecode): { id, docType, merchant, category, dir, amount, points, icon }

import { inr } from './motion';

// General literacy nudges — TRUE, non-numeric, non-advisory (used only as last resort).
const GENERAL = {
  'फ़ोन रिचार्ज': 'हर महीने का रिचार्ज है — सालाना प्लान अक्सर सस्ता पड़ता है।',
  'बिजली':        'बिजली का बिल हर महीने आता है — मीटर रीडिंग पर नज़र रखना अच्छा रहता है।',
  'खाना-पीना':    'बाहर का खाना कभी-कभार ठीक है — हिसाब में दिखता रहे तो समझ बनी रहती है।',
  'राशन':         'राशन ज़रूरी खर्च है — रसीद रखने से महीने का हिसाब साफ़ रहता है।',
  'तनख्वाह':      'कमाई का कागज़ संभाल कर रखें — हिसाब में काम आता है।',
};

/**
 * insightEngine — ONE grounded line for the just-decoded document (Screen 2).
 * @param doc    the freshly extracted doc { merchant, category, dir, amount, tax, docType }
 * @param prior  entries already in the feed (newest-first), NOT including `doc`
 */
export function insightEngine(doc, prior = []) {
  const amt = doc.amount;
  if (!amt) return doc.direction === 'in' ? 'कमाई का कागज़ पढ़ लिया।' : 'कागज़ पढ़ लिया।';

  const dir = doc.direction;
  const byMerchant = doc.merchant
    ? prior.filter(e => e.merchant && e.merchant === doc.merchant && e.dir === dir)
    : [];
  const byCat = prior.filter(e => e.category === doc.category && e.dir === dir);
  const matches = byMerchant.length ? byMerchant : byCat;

  // 1. COMPARISON — real prior amount + real delta
  if (matches.length) {
    const last = matches[0]; // newest prior
    const delta = amt - last.amount;
    if (delta !== 0) {
      const who = byMerchant.length ? doc.merchant : doc.category;
      return `पिछली बार ${who} ${inr(last.amount)} था — इस बार ${inr(Math.abs(delta))} ${delta > 0 ? 'ज़्यादा' : 'कम'}।`;
    }
  }

  // 2. COMPOSITION — extracted tax/service charge
  if (doc.tax && doc.tax > 0 && doc.tax < amt) {
    return `इसमें ${inr(doc.tax)} टैक्स/सर्विस चार्ज भी जुड़ा है — आम बात।`;
  }

  // 3. CUMULATIVE — needs ≥1 prior in this category (so the total > this amount)
  if (byCat.length) {
    const total = byCat.reduce((s, e) => s + e.amount, 0) + amt;
    const verb = dir === 'in' ? 'आया' : 'गया';
    return `${inr(amt)} का ${doc.category} — इस महीने ${doc.category} पे अब तक ${inr(total)} ${verb}।`;
  }

  // 4. GENERAL literacy nudge (no specific ₹ claim) — or a neutral factual line
  return GENERAL[doc.category] || (dir === 'in' ? `कमाई आई — ${inr(amt)}।` : `${doc.category} — ${inr(amt)}।`);
}

/**
 * hisaabInsights — cumulative cards for मेरा हिसाब (Screen 3). Each card appears
 * only when its data condition is met, so insights "unlock" as docs accumulate.
 * @param entries  the full in-memory feed
 * @returns [{ id, text }]
 */
export function hisaabInsights(entries = []) {
  const out = entries.filter(e => e.dir === 'out');
  const ins = entries.filter(e => e.dir === 'in');
  const outSum = out.reduce((s, e) => s + e.amount, 0);
  const inSum = ins.reduce((s, e) => s + e.amount, 0);
  const cards = [];

  // In vs out (≥1 income + ≥1 expense)
  if (ins.length && out.length) {
    const net = inSum - outSum;
    cards.push({ id: 'inout', text: `${inr(inSum)} आया, ${inr(outSum)} गया — ${inr(Math.abs(net))} ${net >= 0 ? 'बचे' : 'कम पड़े'}।` });
  }

  // Top spend (≥2 expenses)
  if (out.length >= 2) {
    const byCat = {};
    out.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const [cat, sum] = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    cards.push({ id: 'top', text: `सबसे ज़्यादा ${cat} पे — ${inr(sum)}।` });
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
  if (best) cards.push({ id: 'change', text: `${best.c} पिछली बार से ${inr(Math.abs(best.d))} ${best.d > 0 ? 'ज़्यादा' : 'कम'}।` });

  // This-month total (always, once ≥1 expense)
  if (out.length) cards.push({ id: 'total', text: `इस महीने अब तक ${inr(outSum)} गया।` });

  return cards;
}
