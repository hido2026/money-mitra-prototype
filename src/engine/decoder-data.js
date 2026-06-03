// decoder-data.js — canned bill data for simulated OCR.
//
// ELECTRICITY: ₹1,562 = ₹50 fixed + 180 units × ₹8.40 = ₹1,512 + ₹50 ✓
// RECHARGE:    ₹300 × 12 = ₹3,600 annual; yearly plan ₹2,800 → saves ₹800 ✓
//
// Simulated OCR returns ONLY {bill_type, amount} — no image stored, no upload.
// "Save ₹X" always shows HOW (public-pricing comparison or behaviour change).

const r = n => n.toLocaleString('en-IN');

export const SIMULATED_BILLS = {
  electricity: {
    id:          'electricity',
    labelHi:     'बिजली बिल',
    provider:    'BESCOM / UPPCL / MSEDCL जैसा',
    amount:      1562,
    // Transparent "reading" narration — 3 steps shown one at a time
    reading_steps: [
      'bill padh raha hoon…',
      'bijli ka bill hai…',
      `₹${r(1562)} ka।`,
    ],
    line_items: [
      {
        label:  'फ़िक्स्ड चार्ज',
        amount: 50,
        note:   'हर महीने यही रहता है — बदलता नहीं।',
      },
      {
        label:  'यूनिट चार्ज (180 यूनिट × ₹8.40)',
        amount: 1512,
        note:   'जितने यूनिट, उतना बिल। 180 × ₹8.40 = ₹1,512।',
      },
    ],
    money_point: {
      // Behaviour-change saving: 20 units fewer × ₹8.40 = ₹168/month
      text:    '20 यूनिट कम जलाएं (LED बल्ब + पंखा बंद जब बाहर जाएं) — अगले महीने करीब ₹168 बच सकते हैं।',
      savings: 168,
      how:     'LED बल्ब लगाएं, कमरे से निकलते वक़्त पंखा बंद करें।',
    },
  },

  recharge: {
    id:          'recharge',
    labelHi:     'मोबाइल रिचार्ज',
    provider:    'Jio / Airtel / Vi',
    amount:      300,
    reading_steps: [
      'bill padh raha hoon…',
      'mobile recharge ka bill hai…',
      `₹${r(300)} ka।`,
    ],
    line_items: [
      {
        label:  'मासिक प्लान',
        amount: 300,
        note:   '28 दिन · Unlimited calls · 1.5 GB/day',
      },
      {
        label:  'साल भर में (× 12)',
        amount: 3600,
        note:   '₹300 × 12 = ₹3,600 हर साल।',
      },
    ],
    money_point: {
      // Public-pricing comparison: ₹3,600 annual vs ₹2,800 yearly plan = ₹800 saving
      text:    'आप हर महीने ₹300 रिचार्ज करती हैं — साल का ₹3,600। साल भर का plan ₹2,800 में आता है — ₹800 बचते हैं।',
      savings: 800,
      how:     'एक बार में ₹2,800 का सालाना plan लें — पूरे साल की टेंशन खत्म।',
    },
  },

  gas: {
    id:          'gas',
    labelHi:     'गैस सिलेंडर',
    provider:    'Indane / HP / Bharat Gas',
    amount:      900,
    reading_steps: [
      'bill padh raha hoon…',
      'gas cylinder ka bill hai…',
      `₹${r(900)} ka।`,
    ],
    line_items: [
      {
        label:  'LPG सिलेंडर (14.2 kg)',
        amount: 900,
        note:   'सरकारी दर पर — यह सही लग रहा है।',
      },
    ],
    money_point: {
      text:    'इस बिल में कोई extra charge नहीं दिख रहा — ठीक लग रहा है।',
      savings: 0,
      how:     '',
    },
  },

  credit_card: {
    id:          'credit_card',
    labelHi:     'क्रेडिट कार्ड स्टेटमेंट',
    provider:    'SBI / HDFC / Axis',
    amount:      4200,
    reading_steps: [
      'bill padh raha hoon…',
      'credit card ka statement hai…',
      `₹${r(4200)} due।`,
    ],
    line_items: [
      {
        label:  'Total Due',
        amount: 4200,
        note:   'Due date तक भर दें — late fee और interest से बचें।',
      },
    ],
    money_point: {
      text:    'Due date से पहले पूरा भरें — minimum pay mat karein, interest 36–42% सालाना होता है।',
      savings: 0,
      how:     'अगर full payment मुश्किल है, पहले बताएं — देखते हैं क्या हो सकता है।',
    },
  },
};

export const BILL_OPTIONS = [
  { id: 'electricity', icon: '⚡', label: 'बिजली बिल',          sub: 'BESCOM / UPPCL / MSEDCL' },
  { id: 'recharge',    icon: '📱', label: 'मोबाइल रिचार्ज',    sub: 'Jio / Airtel / Vi' },
  { id: 'gas',         icon: '🔥', label: 'गैस सिलेंडर',        sub: 'Indane / HP / Bharat Gas' },
  { id: 'credit_card', icon: '💳', label: 'क्रेडिट कार्ड',      sub: 'SBI / HDFC / Axis' },
];
