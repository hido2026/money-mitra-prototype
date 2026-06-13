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

const _key = import.meta.env.VITE_GROQ_API_KEY;
const groq = _key ? new Groq({ apiKey: _key, dangerouslyAllowBrowser: true }) : null;
export const hasKey = !!groq;

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const EXTRACT_PROMPT =
  "You are a document-extraction engine for an Indian money app. Extract ONLY what is literally visible in the image. " +
  "Never guess, estimate, or fabricate any number, merchant, or date. " +
  "If the image is not a financial document, or is too blurry to read, set readable=false and stop. " +
  "If a field is not present, return null for it. " +
  "tax_amount is the total GST / tax / service charge shown on the document (numbers only); null if not shown. " +
  "direction: 'out' for a bill/receipt the user pays; 'in' ONLY for a salary slip / earnings / money-received screenshot; 'ambiguous' if you cannot tell. " +
  "Return JSON ONLY, no prose, matching exactly: " +
  "{\"readable\":true|false,\"doc_type\":\"restaurant_bill|electricity_bill|kirana_receipt|salary_slip|upi_receipt|phone_recharge|other|null\"," +
  "\"merchant\":string|null,\"total_amount\":number|null,\"tax_amount\":number|null,\"currency\":\"INR\"|null,\"date\":string|null," +
  "\"direction\":\"out|in|ambiguous\",\"category\":\"खाना-पीना|बिजली|राशन|तनख्वाह|फ़ोन रिचार्ज|अन्य|null\",\"confidence\":0.0-1.0}";

function toNumber(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) || n <= 0 ? null : Math.round(n);
}

// Deterministic categoriser — maps common merchants/keywords to the right bucket,
// overriding the model so a Jio bill never lands in "अन्य".
const CAT_RULES = [
  { cat: 'फ़ोन रिचार्ज', kw: ['jio', 'airtel', 'vodafone', 'vi ', 'idea', 'bsnl', 'recharge', 'prepaid', 'postpaid', 'रिचार्ज', 'मोबाइल'] },
  { cat: 'बिजली',        kw: ['electric', 'adani', 'tata power', 'bses', 'mseb', 'torrent power', 'units', 'kwh', 'energy charge', 'बिजली'] },
  { cat: 'खाना-पीना',    kw: ['restaurant', 'cafe', 'hotel', 'dine', 'dhaba', 'food', 'swiggy', 'zomato', 'रेस्तरां', 'कैफे', 'भोजन'] },
  { cat: 'राशन',         kw: ['kirana', 'grocery', 'supermarket', 'mart', 'provision', 'reliance fresh', 'dmart', 'big bazaar', 'राशन', 'किराना'] },
  { cat: 'तनख्वाह',      kw: ['salary', 'payslip', 'pay slip', 'net pay', 'earnings', 'wages', 'तनख्वाह', 'सैलरी', 'वेतन'] },
];
function categorise(merchant, docType, raw) {
  const hay = `${merchant || ''} ${docType || ''} ${raw || ''}`.toLowerCase();
  for (const r of CAT_RULES) if (r.kw.some(k => hay.includes(k))) return r.cat;
  if (docType === 'salary_slip')      return 'तनख्वाह';
  if (docType === 'electricity_bill') return 'बिजली';
  if (docType === 'restaurant_bill')  return 'खाना-पीना';
  if (docType === 'kirana_receipt')   return 'राशन';
  if (docType === 'phone_recharge')   return 'फ़ोन रिचार्ज';
  const known = ['खाना-पीना', 'बिजली', 'राशन', 'तनख्वाह', 'फ़ोन रिचार्ज', 'अन्य'];
  return known.includes(raw) ? raw : 'अन्य';
}

const CAT_ICON = {
  'बिजली': 'zap', 'फ़ोन रिचार्ज': 'phone', 'तनख्वाह': 'salary',
  'खाना-पीना': 'receipt', 'राशन': 'receipt', 'अन्य': 'receipt',
};
export const iconForCategory = (cat) => CAT_ICON[cat] || 'receipt';

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
 */
export async function extractFromFile(file) {
  if (!groq) throw new Error('no_key');
  const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  const b64 = isPDF ? await pdfFirstPageToBase64(file) : await compressToBase64(file);

  const resp = await groq.chat.completions.create({
    model: VISION_MODEL,
    temperature: 0,
    max_tokens: 320,
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
  return {
    readable:   j.readable === true,
    docType,
    merchant,
    amount:     toNumber(j.total_amount),
    tax:        toNumber(j.tax_amount),
    date:       typeof j.date === 'string' ? j.date : null,
    direction:  ['in', 'out', 'ambiguous'].includes(j.direction) ? j.direction : 'ambiguous',
    category:   categorise(merchant, docType, typeof j.category === 'string' ? j.category : null),
    confidence: typeof j.confidence === 'number' ? j.confidence : 0,
  };
}

// ── Render helpers (labels/icons from extracted doc_type only) ────────────────
const DOC_LABEL = {
  restaurant_bill: 'रेस्तरां बिल', electricity_bill: 'बिजली बिल',
  kirana_receipt: 'किराना रसीद', salary_slip: 'तनख्वाह पर्ची',
  upi_receipt: 'UPI रसीद', phone_recharge: 'फ़ोन रिचार्ज', other: 'कागज़',
};
export const docLabel = (d) => DOC_LABEL[d] || 'कागज़';

const DOC_ICON = {
  electricity_bill: 'zap', salary_slip: 'salary', upi_receipt: 'phone',
  restaurant_bill: 'receipt', kirana_receipt: 'receipt',
};
export const iconFor = (d) => DOC_ICON[d] || 'receipt';

/**
 * insightFor — one grounded Hindi line built ONLY from extracted fields.
 * Educate-not-advise. References no number that isn't `amount`. Neutral if no amount.
 */
export function insightFor(data) {
  const amt = data.amount ? `₹${data.amount.toLocaleString('en-IN')}` : null;
  if (data.direction === 'in') {
    return amt ? `कमाई आई — ${amt}। थोड़ा अलग रखें तो आगे काम आए।` : 'कमाई का कागज़ पढ़ लिया।';
  }
  switch (data.docType) {
    case 'electricity_bill': return amt ? `बिजली बिल — ${amt}। समय पर भर दें तो लेट फ़ीस नहीं लगती।` : 'बिजली बिल पढ़ लिया।';
    case 'restaurant_bill':  return amt ? `रेस्तरां का बिल — ${amt}। इसमें टैक्स/सर्विस चार्ज भी जुड़ता है — आम बात।` : 'रेस्तरां का बिल पढ़ लिया।';
    case 'kirana_receipt':   return amt ? `किराना का खर्च — ${amt}।` : 'किराना रसीद पढ़ ली।';
    case 'upi_receipt':      return amt ? `UPI से ${amt} का लेन-देन — रसीद संभाल कर रखें।` : 'UPI रसीद पढ़ ली।';
    default:                 return amt ? `${docLabel(data.docType)} — ${amt}।` : 'कागज़ पढ़ लिया।';
  }
}
