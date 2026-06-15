// extract.js — REAL document extraction (vision), render-from-data.
// The model EXTRACTS structured JSON; it never narrates numbers. The UI renders
// strictly from this object, so nothing reaches the screen that wasn't read off
// the document. Images → Groq vision; PDFs → first page rendered → same vision path.
//
// 🚩 DEMO-ONLY KEY: this calls the vision API from the browser with a client-side
// VITE_GROQ_API_KEY — that key is EXPOSED in the static github.io bundle. Acceptable
// ONLY with a throwaway, rate-limited key for the demo. For anything real this MUST
// move behind a server proxy.

import Groq from 'groq-sdk';
import _pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { getDocType, docTitle, docIconKey, isBorrowed as _isBorrowed, isTrapLabel } from './docTypes';

const _key = import.meta.env.VITE_GROQ_API_KEY;
const groq = _key ? new Groq({ apiKey: _key, dangerouslyAllowBrowser: true }) : null;
export const hasKey = !!groq;

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const EXTRACT_PROMPT =
  "You are a document-extraction engine for an Indian money app. Extract ONLY what is literally visible in the image. " +
  "Never guess, estimate, or fabricate any number, merchant, or date. " +
  "Read ANY financial document — bill, insurance policy, loan statement/EMI, bank notice, salary slip, " +
  "UPI receipt, subsidy letter, investment/FD statement — including Hindi/regional languages, handwriting, faded print. " +
  "AMOUNT RULES (critical — the most common extraction bug): " +
  "total_amount = the money that ACTUALLY MOVED in this transaction. " +
  "For an EMI or instalment: total_amount = the EMI/instalment amount, NEVER the loan principal or outstanding balance. " +
  "For an insurance premium: total_amount = the premium paid, NEVER the sum assured or IDV. " +
  "For a gold loan statement: total_amount = the EMI/instalment shown, or outstanding if no EMI is shown; NEVER gold weight or gold market value. " +
  "For a credit card bill: total_amount = total/minimum amount due, NEVER the credit limit. " +
  "If the actual transaction amount is not clearly readable, return null for total_amount. " +
  "LINE ITEMS: include only actual charges/fees paid — EXCLUDE principal, outstanding balance, sum assured, IDV, credit limit, gold weight, gold value. " +
  "BORROWED FIELD: set borrowed=true ONLY when money came IN but must be repaid — " +
  "i.e. loan disbursals (personal/home/gold), credit card credits, BNPL. " +
  "Salary, subsidies, FD maturity, mutual fund redemption are NOT borrowed (borrowed=false). " +
  "GOLD LOAN STATEMENT: look for EMI, interest, outstanding — set total_amount to EMI if shown. " +
  "If image is not a financial document or too blurry, set readable=false and stop. " +
  "If a field is not present, return null. " +
  "tax_amount = total GST/tax/service charge shown; null if absent. " +
  "due_date = payment due date if shown; null otherwise. " +
  "alarming = true for notice/penalty/overdue/legal-sounding letters. " +
  "direction: 'out' for bills/premiums/EMI the user pays; 'in' for salary/subsidy/FD maturity/loan disbursal/MF redemption; 'ambiguous' if unclear. " +
  "Return JSON ONLY, no prose: " +
  "{\"readable\":true|false," +
  "\"doc_type\":\"restaurant_bill|electricity_bill|kirana_receipt|salary_slip|upi_receipt|phone_recharge|" +
  "credit_card_bill|credit_card_credit|bank_notice|" +
  "health_insurance|term_insurance|vehicle_insurance|" +
  "personal_loan_disbursal|personal_loan_emi|microfinance_emi|" +
  "gold_loan_disbursal|gold_loan_statement|" +
  "lpg_subsidy|bank_subsidy|mutual_fund_redemption|fixed_deposit_maturity|other|null\"," +
  "\"merchant\":string|null,\"total_amount\":number|null,\"tax_amount\":number|null,\"due_date\":string|null," +
  "\"line_items\":[{\"label\":string,\"amount\":number}]|null," +
  "\"alarming\":true|false,\"borrowed\":true|false," +
  "\"currency\":\"INR\"|null,\"date\":string|null,\"direction\":\"out|in|ambiguous\"," +
  "\"category\":\"खाना-पीना|बिजली|राशन|तनख्वाह|फ़ोन|बीमा|ऋण|सब्सिडी|निवेश|बचत|आमदनी|अन्य|null\"," +
  "\"confidence\":0.0-1.0}";

function toNumber(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) || n <= 0 ? null : Math.round(n);
}

// Deterministic categoriser — maps merchants/keywords to the right bucket,
// overriding the model so a Jio bill never lands in "अन्य".
const CAT_RULES = [
  { cat: 'फ़ोन',       kw: ['jio', 'airtel', 'vodafone', 'vi ', 'idea', 'bsnl', 'recharge', 'prepaid', 'postpaid', 'रिचार्ज', 'मोबाइल'] },
  { cat: 'बिजली',      kw: ['electric', 'adani', 'tata power', 'bses', 'mseb', 'torrent power', 'units', 'kwh', 'energy charge', 'बिजली'] },
  { cat: 'खाना-पीना',  kw: ['restaurant', 'cafe', 'hotel', 'dine', 'dhaba', 'food', 'swiggy', 'zomato', 'रेस्तरां', 'कैफे', 'भोजन'] },
  { cat: 'राशन',       kw: ['kirana', 'grocery', 'supermarket', 'mart', 'provision', 'reliance fresh', 'dmart', 'big bazaar', 'राशन', 'किराना'] },
  { cat: 'आमदनी',      kw: ['salary', 'payslip', 'pay slip', 'net pay', 'earnings', 'wages', 'तनख्वाह', 'सैलरी', 'वेतन'] },
  { cat: 'बीमा',       kw: ['insurance', 'premium', 'lic', 'policy', 'insured', 'बीमा', 'प्रीमियम', 'पॉलिसी'] },
  { cat: 'ऋण',         kw: ['loan', ' emi', 'instalment', 'repayment', 'gold loan', 'microfinance', 'लोन', 'किस्त', 'ऋण'] },
  { cat: 'सब्सिडी',    kw: ['subsidy', 'lpg', 'pm kisan', 'सब्सिडी', 'गैस सब्सिडी', 'रसोई गैस'] },
  { cat: 'निवेश',      kw: ['mutual fund', 'redemption', 'sip', 'म्यूचुअल', 'फंड'] },
  { cat: 'बचत',        kw: ['fixed deposit', 'fd maturity', 'recurring deposit', 'एफडी', 'परिपक्वता'] },
];

function categorise(merchant, docType, raw) {
  const hay = `${merchant || ''} ${docType || ''} ${raw || ''}`.toLowerCase();
  for (const r of CAT_RULES) if (r.kw.some(k => hay.includes(k))) return r.cat;
  // docType-level fallback via docTypes.js
  const dtCat = getDocType(docType).category;
  if (dtCat && dtCat !== 'अन्य') return dtCat;
  // raw model category — accept only known values
  const known = ['खाना-पीना', 'बिजली', 'राशन', 'तनख्वाह', 'फ़ोन', 'बीमा', 'ऋण', 'सब्सिडी', 'निवेश', 'बचत', 'आमदनी', 'अन्य'];
  return known.includes(raw) ? raw : 'अन्य';
}

// ── Public label / icon helpers ───────────────────────────────────────────────

/**
 * Hindi title for a doc type. Never returns generic "कागज़" for a recognised type.
 * Backward-compatible export (was docLabel in v1).
 */
export function docLabel(typeKey) {
  return docTitle(typeKey);
}

/** Icon key from category string (used for legacy passbook entries). */
export function iconForCategory(cat) {
  const CAT_ICON = {
    'बिजली':      'zap',     'फ़ोन':     'phone',  'आमदनी':  'wallet',
    'तनख्वाह':    'wallet',  'खाना-पीना':'fork',   'राशन':   'cart',
    'बीमा':        'shield',  'ऋण':       'coin',   'सब्सिडी':'gas',
    'निवेश':      'chart',   'बचत':      'lock',   'अन्य':   'receipt',
  };
  return CAT_ICON[cat] || 'receipt';
}

/** Re-export docIconKey so callers can get the per-type icon (more specific). */
export { docIconKey };

/** Re-export isBorrowed for Decoder.jsx and Passbook.jsx use. */
export { isBorrowed } from './docTypes';

// Image → max-1024px JPEG base64 (keeps the upload small + fast).
function compressToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round((height / width) * MAX); width = MAX; }
        else { width = Math.round((width / height) * MAX); height = MAX; }
      }
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      c.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(c.toDataURL('image/jpeg', 0.82).split(',')[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// PDF first page → JPEG base64 (so PDFs flow through the same vision path).
async function pdfFirstPageToBase64(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = _pdfWorkerUrl;
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1);
  const scale = Math.min(1024 / page.getViewport({ scale: 1 }).width, 2);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
}

/**
 * extractFromFile — read a real image/PDF and return a normalized object.
 * Throws 'no_key' if no API key. Returns { readable:false } on parse failure.
 *
 * Shape: { readable, docType, merchant, amount, tax, dueDate, lineItems,
 *           alarming, date, direction, category, confidence, borrowed }
 */
export async function extractFromFile(file) {
  if (!groq) throw new Error('no_key');
  const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  const b64 = isPDF ? await pdfFirstPageToBase64(file) : await compressToBase64(file);

  const resp = await groq.chat.completions.create({
    model: VISION_MODEL,
    temperature: 0,
    max_tokens: 380,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: EXTRACT_PROMPT },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
      ],
    }],
  });

  let j = {};
  try { j = JSON.parse(resp.choices[0]?.message?.content ?? '{}'); } catch { j = {}; }

  const docType = j.doc_type ?? null;
  const merchant = typeof j.merchant === 'string' ? j.merchant.trim() : null;

  // Strip trap amounts from line items (A2): principal, outstanding, sum assured, etc.
  const lineItems = Array.isArray(j.line_items)
    ? j.line_items
        .map(li => (li && li.label ? { label: String(li.label), amount: toNumber(li.amount) } : null))
        .filter(li => li && li.amount && !isTrapLabel(li.label))
        .slice(0, 6)
    : [];

  // Borrowed: trust model flag; also force-true for known borrowed doc types (A3).
  const borrowed = _isBorrowed(docType) || j.borrowed === true;

  const rawCat = typeof j.category === 'string' ? j.category : null;
  const category = categorise(merchant, docType, rawCat);

  return {
    readable:   j.readable === true,
    docType,
    merchant,
    amount:     toNumber(j.total_amount),
    tax:        toNumber(j.tax_amount),
    dueDate:    typeof j.due_date === 'string' ? j.due_date : null,
    lineItems,
    alarming:   j.alarming === true || docType === 'bank_notice',
    date:       typeof j.date === 'string' ? j.date : null,
    direction:  ['in', 'out', 'ambiguous'].includes(j.direction) ? j.direction : 'ambiguous',
    category,
    confidence: typeof j.confidence === 'number' ? j.confidence : 0,
    borrowed,
  };
}

// ── Render helper (legacy — used in some screens for quick inline insight) ────

export function insightFor(data) {
  const amt = data.amount ? `₹${data.amount.toLocaleString('en-IN')}` : null;
  if (data.borrowed) return amt ? `यह उधार है — ${amt} मिले, जो वापस करना होगा।` : 'उधार मिला।';
  if (data.direction === 'in') return amt ? `कमाई आई — ${amt}।` : 'कमाई का कागज़ पढ़ लिया।';
  switch (data.docType) {
    case 'electricity_bill': return amt ? `बिजली बिल — ${amt}। समय पर भर दें तो लेट फ़ीस नहीं।` : 'बिजली बिल पढ़ लिया।';
    case 'restaurant_bill':  return amt ? `रेस्तरां बिल — ${amt}। टैक्स/सर्विस चार्ज जुड़ा है — आम बात।` : 'रेस्तरां बिल पढ़ लिया।';
    case 'kirana_receipt':   return amt ? `किराना खर्च — ${amt}।` : 'किराना रसीद पढ़ ली।';
    case 'personal_loan_emi':
    case 'microfinance_emi': return amt ? `लोन किस्त ${amt} — समय पर देना अच्छा।` : 'किस्त का कागज़ पढ़ लिया।';
    default: return amt ? `${docTitle(data.docType)} — ${amt}।` : 'कागज़ पढ़ लिया।';
  }
}
