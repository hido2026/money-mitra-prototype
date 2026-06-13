// decoder-samples.js — canned data for the visual decoder + हिसाब (no live AI, no OCR).
// All numbers are SAMPLE data. Latin numerals only. Direction: 'in' (पैसा आया) | 'out' (पैसा गया).

export const JACKPOT_POINTS = 1000;   // 1,000 अंक = ₹10
export const JACKPOT_RUPEES = 10;
export const REDEEM_PARTNER = 'Reliance Retail';

// Auto-built history feed (newest-first), held in memory only (resets on reload).
// Totals → आया 18,000 · गया 4,146 · बचे 13,854 · कुल इनाम 720
// After the demo restaurant decode (+2,254 / +120) → गया 6,400 · बचे 11,600 · इनाम 840.
export const SEED_DOCS = [
  { id: 'd1', docType: 'तनख्वाह पर्ची',   category: 'तनख्वाह', dir: 'in',  amount: 18000, points: 300, icon: 'salary' },
  { id: 'd2', docType: 'बिजली बिल',       category: 'बिजली',   dir: 'out', amount: 1340,  points: 120, icon: 'zap' },
  { id: 'd3', docType: 'किराना रसीद',     category: 'राशन',    dir: 'out', amount: 1200,  points: 100, icon: 'receipt' },
  { id: 'd4', docType: 'मोबाइल रिचार्ज',  category: 'फ़ोन',    dir: 'out', amount: 1606,  points: 200, icon: 'phone' },
];

// Each "फ़ोटो लें" yields the next canned decode. First = restaurant (matches the brief).
export const DECODE_CYCLE = [
  { docType: 'रेस्तरां बिल',  category: 'खाना-पीना', dir: 'out', amount: 2254, points: 120, icon: 'receipt',
    insight: 'इसमें सर्विस चार्ज और टैक्स भी जुड़ा है — आम बात।' },
  { docType: 'बिजली बिल',     category: 'बिजली',    dir: 'out', amount: 1450, points: 110, icon: 'zap',
    insight: 'पिछली बार से ₹110 ज़्यादा — दोपहर में पंखा रखें तो अगली बार बच सकता है।' },
  { docType: 'किराना रसीद',   category: 'राशन',     dir: 'out', amount: 860,  points: 80,  icon: 'receipt',
    insight: 'राशन का खर्च इस हफ़्ते ठीक-ठाक है।' },
  { docType: 'तनख्वाह पर्ची', category: 'तनख्वाह',  dir: 'in',  amount: 18000, points: 300, icon: 'salary',
    insight: 'इस महीने तनख्वाह आ गई — थोड़ा अलग रखें तो आगे काम आएगा।' },
];

export const directionLabel = (dir) => (dir === 'in' ? 'पैसा आया' : 'पैसा गया');
