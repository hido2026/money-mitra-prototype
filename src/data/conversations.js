// Scripted conversations for deck showcases.
// Three-beat template: worry (one clarifying question) → for-her (mechanism only,
// no specific figures, no advice, no product recommendation) → next step (official channel).
// Compliance: mechanism/process only; route to official channel; no "aapko karna chahiye."
// Key design pattern: Mukund asks ONE clarifying question BEFORE answering.
//
// Message shapes:
//   { from: 'user', voice: 'Hinglish transcript', time: '2:14 PM' }
//   { from: 'mukund', text: 'Devanagari', time: '2:14 PM' }
//   { from: 'separator', label: '7 दिन बाद' }
//   { from: 'mukund', text: '...', action: { label: 'JFS पर खोलें →', sub: '...' } }

export const samjhaoPriya = {
  route: 'samjhao-priya',
  title: 'Samjhao',
  subtitle: 'Explain in plain Hindi',
  userName: 'Priya',
  accent: '#6D17CE',      // purple
  accentSoft: '#EDE7FF',  // soft fill for Mukund bubbles
  messages: [
    { from: 'user',   voice: 'Mujhe apne paise rakhna hai thoda', time: '2:14 PM' },
    { from: 'mukund', text:  'बिल्कुल। पहले एक बात बताओ — अपने नाम पे रखना है, या परिवार के साथ?', time: '2:14 PM' },
    { from: 'user',   voice: 'Apne naam pe', time: '2:14 PM' },
    { from: 'mukund', text:  'समझ गया। आपके लिए महिला सम्मान सेविंग सर्टिफिकेट है — सिर्फ औरत के नाम पे। ₹1,000 से ₹2 लाख तक, 7.5% ब्याज। 2 साल में। पति का साइन नहीं चाहिए — सिर्फ आपका आधार और पैन।', time: '2:15 PM' },
    { from: 'user',   voice: 'Haan detail batao', time: '2:15 PM' },
    { from: 'mukund', text:  'पोस्ट ऑफिस में खुलता है। हर महीने ₹2,000 डाल सकती हो। 2 साल में लगभग ₹52,000 हो जाएगा ब्याज के साथ। सब कुछ आपके नाम पे।', time: '2:15 PM' },
  ],
};

export const bachaoRavi = {
  route: 'bachao-ravi',
  title: 'Bachao',
  subtitle: 'Protect the surplus',
  userName: 'Ravi',
  accent: '#D85A30',
  accentSoft: '#FBE9DF',
  messages: [
    { from: 'user',      voice: 'Bhai ka 15 hazaar UPI fraud mein chala gaya raat ko', time: '11:42 PM' },
    { from: 'mukund',    text:  'रुको। पहले बताओ — पैसा बैंक के UPI से गया, या किसी app से (PhonePe, GPay)?', time: '11:42 PM' },
    { from: 'user',      voice: 'Bank ka UPI tha', time: '11:43 PM' },
    { from: 'mukund',    text:  'ठीक है। अभी 1930 पे call करना है। मैं हिंदी में script दे रहा हूँ। भाई को पढ़ के बोलना है — amount, time, और जिसको पैसा गया उसकी UPI ID। तैयार?', time: '11:43 PM' },
    { from: 'user',      voice: 'Haan ready', time: '11:43 PM' },
    { from: 'mukund',    text:  '1930 पे call करते ही ये बोलो: "मेरे भाई का UPI से ₹15,000 fraud हुआ है, [date और time], [UPI ID जिसको पैसा गया]। Complaint register करना है।" 2 मिनट में हो जाएगा।', time: '11:44 PM' },
    { from: 'separator', label: '7 दिन बाद' },
    { from: 'mukund',    text:  'रवि भाई, भाई के केस का अपडेट मिला? NCRP पे complaint number generate हुआ था?', time: '6:30 PM' },
    { from: 'user',      voice: 'Haan bank ne 8 hazaar wapas kar diya, baki ke liye RBI Ombudsman me jana hoga', time: '6:32 PM' },
    { from: 'mukund',    text:  'अच्छा। Ombudsman का deadline 30 दिन बाद है। मैं escalation letter draft कर देता हूँ — भाई बस sign करके send करना।', time: '6:32 PM' },
  ],
};

// ── Samjhao seed cards v2 — compliance-checked + vernacular-QA'd (Jun 2026) ──
// Template: Beat 1 (clarify) → Beat 2 (for-her: mechanism only) → Beat 3 (official channel)
// Hard rules: no return/growth figures; explain don't advise; route to official channel only.

// Card 1 — scheme-status
// Compliance: PASS. Vernacular fix: "CSC" expanded to "CSC (जन सेवा केंद्र)".
export const samjhaoSchemeStatus = {
  route: 'samjhao-scheme-status',
  title: 'Samjhao',
  subtitle: 'सरकारी योजना का पैसा',
  userName: 'Sunita',
  accent: '#6D17CE',
  accentSoft: '#EDE7FF',
  messages: [
    { from: 'user',   voice: 'Sarkari yojana ka paisa aaya ya nahi — kaise dekhu?', time: '10:30 AM' },
    // Beat 1 — one clarifying question
    { from: 'mukund', text:  'कौन सी योजना — पीएम किसान, लाडली बहना, पेंशन, या कोई और?', time: '10:30 AM' },
    { from: 'user',   voice: 'PM Kisan ka paisa nahi aaya',                          time: '10:31 AM' },
    // Beat 2 — for-her: mechanism (DBT, common reasons)
    { from: 'mukund', text:  'ज़्यादातर योजनाओं का पैसा सीधे बैंक खाते में आता है — इसे DBT कहते हैं। अगर नहीं आया, तो अक्सर वजह यह होती है: आधार-बैंक लिंक न होना, या पहचान-जाँच (eKYC) अधूरी होना।', time: '10:31 AM' },
    // Beat 3 — official channel
    { from: 'mukund', text:  'pmkisan.gov.in पर "Beneficiary Status" देखें — वहाँ reason लिखा होगा। नाम या खाता गलत हो तो नजदीकी CSC (जन सेवा केंद्र) या बैंक में ठीक कराएं।', time: '10:31 AM' },
  ],
};

// Card 2 — paisa-kat-gaya
// Compliance: PASS. "रुक या वापस हो सकता है" is conditional — not a promise.
export const samjhaoPaisaKata = {
  route: 'samjhao-paisa-kata',
  title: 'Samjhao',
  subtitle: 'पैसे कट गए — अब क्या करूँ?',
  userName: 'Sunita',
  accent: '#6D17CE',
  accentSoft: '#EDE7FF',
  messages: [
    { from: 'user',   voice: 'Paise kat gaye — ab kya karu?',                        time: '2:15 PM' },
    // Beat 1 — one clarifying question
    { from: 'mukund', text:  'किसी को OTP या PIN बताया था, या किसी link पर click किया था?', time: '2:15 PM' },
    { from: 'user',   voice: 'Haan link pe click kiya tha',                           time: '2:16 PM' },
    // Beat 2 — for-her: how speed matters, what the system can do
    { from: 'mukund', text:  'घबराएं नहीं — जितनी जल्दी रिपोर्ट करेंगी, बैंक के पास पैसा रोकने का मौका उतना ज़्यादा होता है। पैसा रुक या वापस हो सकता है।', time: '2:16 PM' },
    // Beat 3 — official channels, no promise of recovery
    { from: 'mukund', text:  'अभी यह करें: 1930 (साइबर हेल्पलाइन) पर call करें, और बैंक को बताकर कार्ड या खाता block कराएं। शिकायत दर्ज करने के लिए: cybercrime.gov.in', time: '2:16 PM' },
  ],
};

// Card 3 — bina-bataye-kata
// Compliance: PASS. Vernacular fix: "प्रीमियम" → "सालाना पैसा".
// "₹436 अक्सर" is factual (PMJJBY current rate) with correct qualifier.
export const samjhaoBinaBataye = {
  route: 'samjhao-bina-bataye',
  title: 'Samjhao',
  subtitle: 'बिना बताए पैसा क्यों कटा?',
  userName: 'Sunita',
  accent: '#6D17CE',
  accentSoft: '#EDE7FF',
  messages: [
    { from: 'user',   voice: 'Bina bataye khate se paisa kyun kata?',                time: '11:45 AM' },
    // Beat 1 — one clarifying question
    { from: 'mukund', text:  'कटौती कितने की थी, और SMS में क्या नाम लिखा था?',      time: '11:45 AM' },
    { from: 'user',   voice: '₹436 kata, PMJJBY likha tha',                          time: '11:46 AM' },
    // Beat 2 — for-her: explain what it likely is, and what to check
    { from: 'mukund', text:  '₹436 अक्सर PMJJBY बीमा का सालाना पैसा होता है — धोखा नहीं। यह एक सरकारी बीमा है जो हादसे में काम आता है। अगर आपने यह लिया है तो ठीक; अगर नहीं लिया तो जाँचना ज़रूरी है।', time: '11:46 AM' },
    // Beat 3 — official route
    { from: 'mukund', text:  'पासबुक या SMS में कटौती का पूरा नाम देखें। पहचान न आए या गलत लगे तो बैंक से पूछें। धोखा लगे तो: 1930', time: '11:46 AM' },
  ],
};

// Card 4 — beti-savings
// Compliance: PASS. Does NOT say Sukanya is "best" vs other instruments.
// "टैक्स में छूट" is a scheme feature, not financial advice.
// Vernacular fix: added indiapost.gov.in to next_step.
export const samjhaoBeti = {
  route: 'samjhao-beti',
  title: 'Samjhao',
  subtitle: 'बेटी के लिए बचत',
  userName: 'Sunita',
  accent: '#6D17CE',
  accentSoft: '#EDE7FF',
  messages: [
    { from: 'user',   voice: 'Beti ke liye sabse acchi bachat kaun si?',              time: '9:20 AM' },
    // Beat 1 — one clarifying question (age matters for Sukanya eligibility)
    { from: 'mukund', text:  'बेटी की उम्र क्या है? यह जानना ज़रूरी है क्योंकि एक योजना 10 साल तक ही खुलती है।', time: '9:20 AM' },
    { from: 'user',   voice: '5 saal ki hai',                                         time: '9:21 AM' },
    // Beat 2 — for-her: Sukanya mechanism, no returns figures, no comparison-advice
    { from: 'mukund', text:  'बेटी के लिए सरकार की एक ख़ास योजना है — सुकन्या समृद्धि। थोड़ी-थोड़ी रकम सालों में जुड़कर बेटी की पढ़ाई के काम आती है। इसमें टैक्स में छूट भी मिलती है। बेटी के नाम पर खुलता है — सिर्फ आपके दस्तावेज़ चाहिए।', time: '9:21 AM' },
    // Beat 3 — official channel
    { from: 'mukund', text:  'पोस्ट ऑफिस या बैंक में, बेटी के जन्म प्रमाण और आपके आधार से खाता खुलता है। पोस्ट ऑफिस ढूंढें: indiapost.gov.in', time: '9:21 AM' },
  ],
};

export const aageBadhoRavi = {
  route: 'aage-badho-ravi',
  title: 'Aage Badho',
  subtitle: 'Grow the surplus',
  userName: 'Ravi',
  accent: '#3B6D11',
  accentSoft: '#E7F0DC',
  messages: [
    { from: 'user',   voice: 'Mujhe beti ki padhai ke liye plan banana hai', time: '9:12 AM' },
    { from: 'mukund', text:  'बढ़िया। रिया कितने साल की है, और engineering सोच रहे हो, medical, या कुछ और?', time: '9:12 AM' },
    { from: 'user',   voice: '2 saal. Engineering ya commerce.', time: '9:13 AM' },
    { from: 'mukund', text:  '16 साल में ₹15-18 लाख चाहिए — अच्छे engineering कॉलेज के लिए। आज कितना बचा पाते हो हर महीने?', time: '9:13 AM' },
    { from: 'user',   voice: '8 hazaar mahine ka', time: '9:14 AM' },
    { from: 'mukund', text:  '₹4,500/month SIP comfortable है आपके लिए — emergency के लिए भी पैसा रहेगा। JFS पे options देखने के लिए ले चलूँ?', time: '9:14 AM' },
    { from: 'user',   voice: 'Haan le chalo', time: '9:14 AM' },
    { from: 'mukund', text:  'JFS पे आपका My Money already है, KYC हो गया हुआ है। 2 minute में SIP शुरू हो जाएगा।', time: '9:15 AM', action: { label: 'JFS पर खोलें →', sub: 'Multi-provider comparison · User-best-fit' } },
  ],
};
