// Answer Bank — the guided "Ask about money" drilldown (PRD v6 §4, §12.1 DS-1).
// 26 schema-complete rows across 8 buckets, bilingual (EN + real Devanagari),
// ported from MoneyMitra_Ask_Prototype_v4.html. Tapping through this data is
// fully deterministic (§5.1) — no LLM call, nothing for a matcher to get wrong.
//
// type: A universal fact · B varies by bank/state · C concept/process ·
//       D refusal (educate-not-advise) · E fraud/active harm (hard stop)
// verified: VERIFIED-with-figure · VERIFIED-no-figure · VARIES · CANNOT-VERIFY

export const TYPE_LABEL = {
  en: { A: 'Universal fact', B: 'Varies by bank / state', C: 'How-to / concept', D: "Can't recommend one product", E: 'Fraud — act now' },
  hi: { A: 'सबके लिए एक जैसा जवाब', B: 'बैंक/राज्य के हिसाब से अलग', C: 'तरीका / जानकारी', D: 'एक प्रोडक्ट सुझा नहीं सकते', E: 'धोखाधड़ी — तुरंत कदम उठाएं' },
};
export const TYPE_TONE = { A: 'success', B: 'warning', C: 'brand', D: 'muted', E: 'warning' };

export const VER_LABEL = {
  en: { 'VERIFIED-with-figure': 'Verified — exact figure', 'VERIFIED-no-figure': 'Verified — process confirmed', VARIES: 'Varies — stated honestly', 'CANNOT-VERIFY': 'Not confirmed yet' },
  hi: { 'VERIFIED-with-figure': 'वेरीफाइड — पक्का आंकड़ा', 'VERIFIED-no-figure': 'वेरीफाइड — तरीका कन्फर्म है', VARIES: 'अलग-अलग होता है', 'CANNOT-VERIFY': 'अभी कन्फर्म नहीं' },
};

export const ANSWER_BANK = [
  { id: 'upi', label: { en: 'UPI and payments', hi: 'यूपीआई और पेमेंट्स' }, icon: 'upi', items: [
    { rank: 2, type: 'A', verified: 'VERIFIED-with-figure', authority: 'RBI / NPCI', verifiedOn: '2 Jul 2026', kw: ['money deduct', 'payment fail', 'upi fail'], url: 'https://rbi.org.in',
      linkText: { en: "Report the issue in your app with the UTR number — rbi.org.in", hi: "ऐप में यूटीआर नंबर के साथ 'रिपोर्ट इशू' करें — rbi.org.in" },
      q: { en: 'Money deducted but payment failed', hi: 'पैसा कट गया, पेमेंट फेल हो गई' },
      empathy: { en: "I know it's unsettling when money leaves your account and the payment doesn't go through — let's sort this out together.", hi: 'पैसा कटना सच में परेशान कर देता है — मैं समझ सकती हूं, चलिए मिलकर देखते हैं।' },
      answer: { en: "Take a breath: in most cases this money comes back on its own within 1 working day. If your bank takes longer than RBI's set time, it must pay you ₹100 for every extra day until your money is back.", hi: 'एक गहरी सांस लें: ज़्यादातर मामलों में यह पैसा 1 कार्य दिवस में खुद वापस आ जाता है। अगर बैंक आरबीआई के तय समय से ज़्यादा देर करता है, तो उसे हर अतिरिक्त दिन के लिए आपको ₹100 देना पड़ता है, जब तक पैसा वापस न आए।' },
      followup: { en: 'Want me to show you how to find your UTR number?', hi: 'बताऊं, यूटीआर नंबर कैसे ढूंढें?' } },
    { rank: 14, type: 'C', verified: 'VERIFIED-no-figure', authority: 'NPCI', verifiedOn: '2 Jul 2026', kw: ['wrong upi', 'reverse money', 'sent wrong'], url: 'https://upihelp.npci.org.in',
      linkText: { en: 'NPCI UPI Help — upihelp.npci.org.in', hi: 'एनपीसीआई यूपीआई हेल्प — upihelp.npci.org.in' },
      q: { en: 'Sent money to the wrong UPI ID', hi: 'गलत यूपीआई आईडी पर पैसा चला गया' },
      empathy: { en: "Sending money to the wrong ID is a horrible feeling — you're not the only one this happens to.", hi: 'गलत यूपीआई आईडी पर पैसा जाना बहुत टेंशन देता है — ऐसा सिर्फ आपके साथ नहीं होता।' },
      answer: { en: "Because the transaction technically succeeded, there's no automatic reversal. Tap 'Report issue' in your app, then contact your bank or NPCI UPI Help at 1800-120-1740. Getting the money back depends on the other person agreeing to return it.", hi: "क्योंकि यह ट्रांज़ैक्शन तकनीकी रूप से सफल हुआ था, इसलिए ऑटोमैटिक वापसी नहीं होती। ऐप में 'रिपोर्ट इशू' दबाएं, फिर बैंक या एनपीसीआई यूपीआई हेल्प (1800-120-1740) से संपर्क करें। पैसा वापस मिलना दूसरे व्यक्ति की मर्ज़ी पर निर्भर करता है।" },
      followup: { en: 'Want me to show you how to file that complaint?', hi: 'बताऊं, कंप्लेंट कैसे फाइल करते हैं?' } },
    { rank: 81, type: 'C', verified: 'VERIFIED-no-figure', authority: 'NPCI', verifiedOn: '2 Jul 2026', kw: ['qr code', 'scan qr', 'refund qr'], url: 'https://cybercrime.gov.in',
      linkText: { en: 'If money is already gone, call 1930 or report at cybercrime.gov.in right away', hi: 'अगर पैसा कट चुका है तो तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें' },
      q: { en: 'Someone asked me to scan a QR to get a refund', hi: 'किसी ने रिफंड के लिए क्यूआर कोड स्कैन करने को कहा' },
      empathy: { en: "This trick catches a lot of people — it's not your fault, and it's good that you're checking.", hi: 'यह तरीका बहुत लोगों को फंसा चुका है — आपकी गलती नहीं है, अच्छा किया आप चेक कर रहे हैं।' },
      answer: { en: "Please remember this clearly: you never need to scan a QR code or enter your UPI PIN to RECEIVE money — a PIN is only ever needed when you're SENDING money. If anyone asks you to scan a 'refund QR' or share your PIN to get a payment, stop immediately — that is always a scam.", hi: 'यह बात अच्छी तरह याद रखें: पैसा पाने के लिए कभी क्यूआर कोड स्कैन या यूपीआई पिन डालने की ज़रूरत नहीं होती — पिन सिर्फ पैसा भेजने के लिए चाहिए होता है। अगर कोई ‘रिफंड क्यूआर’ स्कैन करवाकर पिन मांगे, तुरंत रुक जाएं — यह हमेशा धोखा होता है।' },
      followup: { en: 'Want me to show you how to spot a safe QR payment?', hi: 'बताऊं, सेफ क्यूआर पेमेंट कैसे पहचानें?' } },
    { rank: 23, type: 'B', verified: 'VARIES', authority: 'NPCI', verifiedOn: '2 Jul 2026', kw: ['upi limit', 'daily limit', 'gpay limit'], url: 'https://www.npci.org.in/what-we-do/upi/faqs',
      linkText: { en: "Check 'Limits' in your app — npci.org.in", hi: "ऐप में 'लिमिट्स' चेक करें — npci.org.in" },
      q: { en: 'UPI / Google Pay daily transaction limit', hi: 'यूपीआई/जीपे की डेली लिमिट' },
      empathy: { en: "Good to check this before a big payment, so there's no surprise mid-transaction.", hi: 'बड़े पेमेंट से पहले यह जानना अच्छा है, ताकि कोई परेशानी न हो।' },
      answer: { en: "NPCI's general UPI limit is ₹1,00,000 a day, but your bank can set it lower. Check 'Limits' inside your app for your exact number.", hi: "एनपीसीआई की सामान्य यूपीआई लिमिट ₹1,00,000 प्रतिदिन है, लेकिन आपका बैंक इसे कम भी रख सकता है। ऐप में 'लिमिट्स' चेक करके पक्की जानकारी मिलेगी।" },
      followup: { en: 'Want me to show you where to check your limit?', hi: 'बताऊं, अपनी लिमिट कैसे चेक करें?' } },
  ] },

  { id: 'bank', label: { en: 'Bank basics and ATMs', hi: 'बैंक बेसिक्स और एटीएम' }, icon: 'bank', items: [
    { rank: 1, type: 'C', verified: 'VERIFIED-no-figure', authority: 'General banking practice', verifiedOn: '2 Jul 2026', kw: ['check balance', 'bank balance'], url: null,
      linkText: { en: "Check your bank's official website or app for its number", hi: 'अपने बैंक की आधिकारिक वेबसाइट/ऐप से सही नंबर लें' },
      q: { en: 'How to check bank balance', hi: 'बैंक बैलेंस कैसे चेक करें' },
      empathy: { en: 'A simple, everyday need — nothing to worry about.', hi: 'यह रोज़ की ज़रूरत है, कोई बड़ी बात नहीं।' },
      answer: { en: "Give a missed call to your bank's number, use SMS banking, or open your mobile app — all three show your balance instantly. Each bank has its own number, so check your bank's official site or app for it.", hi: 'अपने रजिस्टर्ड मोबाइल से बैंक के नंबर पर मिस्ड कॉल दें, या एसएमएस बैंकिंग इस्तेमाल करें, या मोबाइल ऐप खोलें — तीनों तरीकों से बैलेंस तुरंत पता चल जाता है।' },
      followup: { en: "Want me to help you find your bank's missed-call number?", hi: 'बताऊं, अपने बैंक का मिस्ड-कॉल नंबर कैसे ढूंढें?' } },
    { rank: 7, type: 'A', verified: 'VERIFIED-with-figure', authority: 'RBI', verifiedOn: '2 Jul 2026', kw: ['card lost', 'atm card lost', 'lost card'], url: null,
      linkText: { en: "Use your bank's official app or website", hi: 'अपने बैंक की आधिकारिक ऐप/वेबसाइट' },
      q: { en: 'ATM card lost — what to do', hi: 'एटीएम कार्ड खो गया तो क्या करें' },
      empathy: { en: "Losing your card is scary, but acting quickly keeps your money safe — you're doing the right thing by asking.", hi: 'कार्ड खो जाना डरावना लगता है, लेकिन तुरंत कदम उठाने से पैसा सुरक्षित रहेगा — पूछना सही किया।' },
      answer: { en: "Block the card right away through your bank's helpline, app, or net banking. If you report it within 3 working days, you won't be held responsible for a transaction you didn't make.", hi: 'तुरंत अपने बैंक के हेल्पलाइन नंबर, ऐप, या नेट बैंकिंग से कार्ड ब्लॉक करें। 3 कार्य दिवसों के अंदर बता देने पर ज़िम्मेदारी आपकी नहीं होगी।' },
      followup: { en: "Want me to help you find your bank's card-blocking number?", hi: 'बताऊं, कार्ड ब्लॉक करने का नंबर कैसे पता करें?' } },
    { rank: 10, type: 'A', verified: 'VERIFIED-no-figure', authority: 'PMJDY / DFS', verifiedOn: '2 Jul 2026', kw: ['jan dhan', 'open account', 'new account'], url: 'https://pmjdy.gov.in',
      linkText: { en: 'pmjdy.gov.in', hi: 'pmjdy.gov.in' },
      q: { en: 'How to open a Jan Dhan account', hi: 'जन धन खाता कैसे खोलें' },
      empathy: { en: 'Opening your first bank account is a big step — well done.', hi: 'पहली बार बैंक खाता खोलना एक बड़ा कदम है — बधाई हो!' },
      answer: { en: 'Any Indian citizen aged 10 or above can open a zero-balance Jan Dhan account at any bank branch, or through a Bank Mitra — a trained local agent who helps people open and use bank accounts without visiting a branch. Aadhaar alone is enough; without it, a Voter ID, Driving Licence, or Passport also works.', hi: '10 साल या उससे ऊपर का कोई भी भारतीय नागरिक, किसी भी बैंक शाखा या बैंक मित्र — एक प्रशिक्षित स्थानीय एजेंट जो शाखा गए बिना बैंक खाता खोलने में मदद करता है — के पास ज़ीरो-बैलेंस जन धन खाता खोल सकता है। सिर्फ आधार काफी है; इसके बिना, वोटर आईडी, ड्राइविंग लाइसेंस, या पासपोर्ट भी काम करेगा।' },
      followup: { en: 'Want me to explain more about Bank Mitras and where to find one?', hi: 'बताऊं, बैंक मित्र कहां मिलेगा?' } },
    { rank: 93, type: 'A', verified: 'VERIFIED-with-figure', authority: 'RBI', verifiedOn: '2 Jul 2026', kw: ['neft', 'transfer timing', 'neft timing'], url: 'https://rbi.org.in',
      linkText: { en: 'rbi.org.in', hi: 'rbi.org.in' },
      q: { en: 'What is NEFT transfer timing', hi: 'एनईएफटी कब तक चलता है' },
      empathy: { en: 'Good to know the timing before you send money.', hi: 'पैसे ट्रांसफर करने से पहले टाइमिंग जानना अच्छा है।' },
      answer: { en: "Since December 2019, NEFT runs 24 hours a day, every day of the week, including holidays — money usually moves within minutes. On the rare occasion your bank has a system maintenance window, it will show a notice; if a transfer seems delayed beyond that, it's worth confirming directly with your bank.", hi: 'आरबीआई के नियम से, दिसंबर 2019 से एनईएफटी अब 24 घंटे, साल के सातों दिन चलता है — छुट्टी के दिन भी पैसा कुछ मिनट में ट्रांसफर हो जाता है। कभी-कभार सिस्टम मेंटेनेंस हो तो नोटिस दिखता है; देर लगे तो बैंक से सीधे कन्फर्म कर लें।' },
      followup: { en: 'Want to know the difference between NEFT and IMPS?', hi: 'बताऊं, एनईएफटी और आईएमपीएस में क्या फर्क है?' } },
  ] },

  { id: 'schemes', label: { en: 'Govt schemes and DBT', hi: 'सरकारी योजनाएं और DBT' }, icon: 'schemes', items: [
    { rank: 4, type: 'D', verified: 'VERIFIED-with-figure', authority: 'PM-Kisan / DAC&FW', verifiedOn: '2 Jul 2026', kw: ['pm kisan', 'kisan installment', 'kisan kist'], url: 'https://pmkisan.gov.in',
      linkText: { en: 'pmkisan.gov.in', hi: 'pmkisan.gov.in' },
      q: { en: 'When will the PM Kisan installment come', hi: 'पीएम किसान की किस्त कब आएगी' },
      empathy: { en: "Waiting on money you're counting on is genuinely stressful — let's find out exactly where things stand.", hi: 'जिस पैसे का भरोसा है उसका इंतज़ार करना सच में तनाव भरा होता है — चलिए ठीक से पता करते हैं।' },
      answer: { en: "We can't give a fixed date because each installment's timing varies. Check 'Know Your Status' on pmkisan.gov.in with your registration number or Aadhaar for your exact status. The full scheme pays ₹6,000 a year, in three installments of ₹2,000 each.", hi: "इसकी पक्की तारीख नहीं बता सकते क्योंकि हर किस्त का समय बदलता है। pmkisan.gov.in पर 'नो योर स्टेटस' में रजिस्ट्रेशन नंबर या आधार डालकर स्थिति देख सकते हैं। पूरी योजना ₹6,000 सालाना देती है, तीन किस्तों में ₹2,000 प्रत्येक।" },
      followup: { en: 'Want to know what you need to check your status?', hi: 'बताऊं, स्टेटस चेक करने के लिए क्या चाहिए?' } },
    { rank: 12, type: 'C', verified: 'VERIFIED-with-figure', authority: 'National Health Authority', verifiedOn: '2 Jul 2026', kw: ['ayushman', 'pmjay', 'ayushman card'], url: 'https://beneficiary.nha.gov.in',
      linkText: { en: 'beneficiary.nha.gov.in', hi: 'beneficiary.nha.gov.in' },
      q: { en: 'How to check my name in the Ayushman list', hi: 'आयुष्मान लिस्ट में नाम कैसे देखें' },
      empathy: { en: "Checking this in advance is smart, so there's no worry at treatment time.", hi: 'पहले से नाम चेक करना समझदारी है, ताकि इलाज के समय दिक्कत न हो।' },
      answer: { en: 'Enter your PMJAY ID, Family ID, or Aadhaar number plus your state on beneficiary.nha.gov.in, verify with OTP, and check your name. The scheme gives free treatment up to ₹5 lakh per family per year.', hi: 'beneficiary.nha.gov.in पर पीएमजेएवाई आईडी, फैमिली आईडी, या आधार नंबर और राज्य डालकर ओटीपी से नाम चेक कर सकते हैं। योजना ₹5 लाख तक का मुफ्त इलाज देती है प्रति परिवार प्रति वर्ष।' },
      followup: { en: "Want to know what to do if your name isn't on the list?", hi: 'बताऊं, अगर नाम लिस्ट में नहीं है तो क्या करें?' } },
    { rank: 17, type: 'B', needsState: true, kw: ['ladki bahin', 'ladli behna', 'women scheme', 'cash transfer', 'gruha lakshmi', 'annapurna bhandar', 'maiya samman', 'mahtari vandana'],
      q: { en: "Women's monthly cash-transfer scheme — when will the money come", hi: 'महिलाओं की मासिक नकद योजना का पैसा कब आएगा' },
      empathy: { en: "Waiting on money you rely on every month is hard — let's find your state's exact scheme so I don't guess.", hi: 'हर महीने जिस पैसे पर भरोसा है उसका इंतज़ार करना मुश्किल होता है — चलिए आपके राज्य की सही योजना ढूंढते हैं, ताकि हम अंदाज़ा न लगाएं।' },
      followup: { en: 'Want to know how to do the eKYC for it?', hi: 'बताऊं, ईकेवाईसी कैसे करें?' },
      // Population order (PRD v6 §11) — UP first (honest "not found"), then verified states.
      states: {
        'Uttar Pradesh': { fallback: true, url: 'https://myscheme.gov.in', linkText: { en: 'myscheme.gov.in', hi: 'myscheme.gov.in' },
          answer: { en: "We checked, but couldn't find a monthly cash-transfer scheme for women in Uttar Pradesh comparable to Maharashtra's or Madhya Pradesh's. If a new one has launched, please check myscheme.gov.in yourself, or ask your nearest anganwadi worker or Bank Mitra.", hi: 'हमने जांच की, लेकिन उत्तर प्रदेश में अभी महाराष्ट्र या मध्य प्रदेश जैसी कोई मासिक नकद ट्रांसफर योजना हमें नहीं मिली। अगर कोई नई योजना शुरू हुई है, तो कृपया myscheme.gov.in पर खुद जांच लें, या नज़दीकी आंगनवाड़ी/बैंक मित्र से पूछें।' } },
        Maharashtra: { verified: 'VARIES', authority: 'Maharashtra Women & Child Development Dept', verifiedOn: '2 Jul 2026', url: 'https://ladakibahin.maharashtra.gov.in', linkText: { en: 'ladakibahin.maharashtra.gov.in', hi: 'ladakibahin.maharashtra.gov.in' },
          answer: { en: "This is Maharashtra's Ladki Bahin scheme — you get ₹1,500 a month. You'll need to complete eKYC every year, or your name could be removed from the list.", hi: 'यह महाराष्ट्र सरकार की लाडकी बहीण योजना है — ₹1,500 महीना मिलता है। हर साल ईकेवाईसी करवाना ज़रूरी है, वरना नाम लिस्ट से हट सकता है।' } },
        'West Bengal': { verified: 'VERIFIED-with-figure', authority: 'WB Dept of Women & Child Development, Social Welfare', verifiedOn: '2 Jul 2026', url: 'https://socialsecurity.wb.gov.in', linkText: { en: 'socialsecurity.wb.gov.in', hi: 'socialsecurity.wb.gov.in' },
          answer: { en: "West Bengal replaced its Lakshmir Bhandar scheme with 'Annapurna Bhandar' from June 2026, paying ₹3,000 a month — existing beneficiaries were moved over automatically.", hi: 'पश्चिम बंगाल में जून 2026 से लक्ष्मी भंडार की जगह ‘अन्नपूर्णा भंडार’ योजना आ गई है, जिसमें ₹3,000 महीना मिलता है — पुराने लाभार्थियों को अपने आप नई योजना में जोड़ दिया गया।' } },
        'Madhya Pradesh': { verified: 'VERIFIED-with-figure', authority: 'MP Women & Child Development Dept', verifiedOn: '2 Jul 2026', url: 'https://cmladlibahna.mp.gov.in', linkText: { en: 'cmladlibahna.mp.gov.in', hi: 'cmladlibahna.mp.gov.in' },
          answer: { en: "This is Madhya Pradesh's Ladli Behna Yojana — you get ₹1,500 a month, credited on the 10th of every month.", hi: 'यह मध्य प्रदेश की लाडली बहना योजना है — ₹1,500 महीना मिलता है, हर महीने की 10 तारीख को खाते में आता है।' } },
        Jharkhand: { verified: 'VERIFIED-with-figure', authority: 'Jharkhand Women, Child Development & Social Security Dept', verifiedOn: '2 Jul 2026', url: 'https://mmmsy.jharkhand.gov.in', linkText: { en: 'mmmsy.jharkhand.gov.in', hi: 'mmmsy.jharkhand.gov.in' },
          answer: { en: "This is Jharkhand's Maiya Samman Yojana — currently ₹2,500 a month. Since the June 2026 installment, only verified beneficiaries are being paid, so make sure your verification (satyapan) is complete.", hi: 'यह झारखंड की मंईयां सम्मान योजना है — फिलहाल ₹2,500 महीना मिलता है। जून 2026 की किस्त से सिर्फ वेरिफाइड लाभार्थियों को पैसा मिल रहा है, अपना सत्यापन ज़रूर पूरा कर लें।' } },
        Karnataka: { verified: 'VARIES', authority: 'Karnataka Dept of Women and Child Development', verifiedOn: '2 Jul 2026', url: null, linkText: { en: 'Karnataka DBT app / Seva Sindhu', hi: 'कर्नाटक डीबीटी ऐप / सेवा सिंधु' },
          answer: { en: "This is Karnataka's Gruha Lakshmi scheme, paying ₹2,000 a month. Check your status through the Karnataka DBT app using Aadhaar login, or by SMS with your ration card number.", hi: 'यह कर्नाटक की गृह लक्ष्मी योजना है, जिसमें ₹2,000 महीना मिलता है। स्टेटस कर्नाटक डीबीटी ऐप में आधार लॉगिन से चेक कर सकते हैं।' } },
        Chhattisgarh: { verified: 'VERIFIED-with-figure', authority: 'Chhattisgarh Women & Child Development Dept', verifiedOn: '2 Jul 2026', url: 'https://mahtarivandan.cgstate.gov.in', linkText: { en: 'mahtarivandan.cgstate.gov.in', hi: 'mahtarivandan.cgstate.gov.in' },
          answer: { en: "This is Chhattisgarh's Mahtari Vandana Yojana, paying ₹1,000 a month. eKYC has been made mandatory from April to June 2026, or your next installment could be held up — complete it at your nearest Gram Panchayat.", hi: 'यह छत्तीसगढ़ की महतारी वंदन योजना है, जिसमें ₹1,000 महीना मिलता है। अप्रैल से जून 2026 तक ईकेवाईसी ज़रूरी कर दी गई है, वरना अगली किस्त रुक सकती है।' } },
        'Other state': { fallback: true, url: 'https://myscheme.gov.in', linkText: { en: 'myscheme.gov.in', hi: 'myscheme.gov.in' },
          answer: { en: "Good thinking to check by state — this scheme varies a lot and we don't have every state verified yet. Search myscheme.gov.in with your state name, or ask your nearest Bank Mitra or anganwadi worker.", hi: 'राज्य से चेक करना अच्छी सोच है — यह योजना राज्य दर राज्य बदलती है और हमारे पास हर राज्य का डेटा अभी वेरीफाई नहीं है। myscheme.gov.in पर अपना राज्य डालकर ढूंढें, या नज़दीकी बैंक मित्र या आंगनवाड़ी वर्कर से पूछें।' } },
      } },
  ] },

  { id: 'kyc', label: { en: 'KYC, Aadhaar and PAN', hi: 'केवाईसी, आधार और पैन' }, icon: 'kyc', items: [
    { rank: 3, type: 'A', verified: 'VERIFIED-with-figure', authority: 'Income Tax Department', verifiedOn: '2 Jul 2026', kw: ['aadhaar pan link', 'pan link'], url: 'https://incometax.gov.in',
      linkText: { en: 'incometax.gov.in', hi: 'incometax.gov.in' },
      q: { en: 'Check if Aadhaar and PAN are linked', hi: 'आधार-पैन लिंक है या नहीं' },
      empathy: { en: "Worth checking this now, so it doesn't cause trouble later.", hi: 'अभी चेक करना ज़रूरी है, वरना बाद में दिक्कत हो सकती है।' },
      answer: { en: "Check 'Link Aadhaar Status' on incometax.gov.in with your PAN and Aadhaar. If not linked, your PAN becomes 'inoperative' — no refunds, and higher TDS gets deducted. You can re-link by paying a ₹1,000 fee.", hi: "incometax.gov.in पर 'लिंक आधार स्टेटस' में पैन और आधार डालकर चेक करें। लिंक न होने पर पैन 'इनऑपरेटिव' हो जाता है — कोई रिफंड नहीं, और ज़्यादा टीडीएस कटेगा। ₹1,000 फीस देकर दोबारा लिंक कर सकते हैं।" },
      followup: { en: 'Want to know how to pay that ₹1,000 fee?', hi: 'बताऊं, ₹1,000 फीस कैसे भरें?' } },
    { rank: 80, type: 'B', verified: 'VARIES', authority: 'NFSA / State PDS', verifiedOn: '2 Jul 2026', kw: ['ration card', 'ration download'], url: 'https://nfsa.gov.in',
      linkText: { en: 'nfsa.gov.in', hi: 'nfsa.gov.in' },
      q: { en: 'How to download my ration card', hi: 'राशन कार्ड डाउनलोड कैसे करें' },
      empathy: { en: 'This is an important document, so good that you are keeping it handy.', hi: 'यह ज़रूरी दस्तावेज़ है, इसे संभालकर रखना अच्छी बात है।' },
      answer: { en: 'Every state runs its own Public Distribution System (PDS) portal for downloading a ration card. Select your state on the NFSA portal to reach your state portal directly.', hi: 'हर राज्य का अपना पीडीएस पोर्टल होता है, जहां से राशन कार्ड डाउनलोड हो सकता है। एनएफएसए पोर्टल पर राज्य चुनकर सीधे पहुंच सकते हैं।' },
      followup: { en: "Want help finding your state's portal?", hi: 'बताऊं, अपने राज्य का पोर्टल कैसे ढूंढें?' } },
    { rank: 26, type: 'C', verified: 'VERIFIED-no-figure', authority: 'Income Tax Department / Protean', verifiedOn: '2 Jul 2026', kw: ['pan card mobile', 'instant pan', 'e-pan'], url: 'https://incometax.gov.in',
      linkText: { en: 'incometax.gov.in', hi: 'incometax.gov.in' },
      q: { en: 'How to make a PAN card from mobile', hi: 'मोबाइल से पैन कार्ड कैसे बनाएं' },
      empathy: { en: "It's genuinely convenient that this can be done from a phone.", hi: 'मोबाइल से ही पैन बन जाए, कितना आसान है ना!' },
      answer: { en: "'Instant e-PAN' on incometax.gov.in is free — if your Aadhaar is linked to your mobile number, you get an e-PAN within minutes via Aadhaar OTP.", hi: "incometax.gov.in पर 'इंस्टेंट ई-पैन' मुफ्त है — आधार ओटीपी से कुछ मिनट में ई-पैन मिल जाता है।" },
      followup: { en: "Want to know what to do if your mobile isn't linked to Aadhaar?", hi: 'बताऊं, अगर मोबाइल नंबर आधार से लिंक नहीं है तो?' } },
  ] },

  { id: 'loans', label: { en: 'Loans and CIBIL', hi: 'लोन और सिबिल' }, icon: 'loans', items: [
    { rank: 5, type: 'A', verified: 'VERIFIED-no-figure', authority: 'RBI / CIBIL (TransUnion)', verifiedOn: '2 Jul 2026', kw: ['cibil score', 'free cibil', 'credit score'], url: 'https://www.cibil.com/freecibilscore',
      linkText: { en: 'cibil.com/freecibilscore', hi: 'cibil.com/freecibilscore' },
      q: { en: 'Check CIBIL score for free', hi: 'सिबिल स्कोर मुफ्त में कैसे चेक करें' },
      empathy: { en: 'Knowing your score is a great first step before applying for anything.', hi: 'अपना स्कोर जानना किसी भी लोन के लिए पहला कदम है।' },
      answer: { en: "By RBI rule, every credit bureau (like CIBIL) must give you one full, free credit report every year — get it directly at cibil.com/freecibilscore. Be a little cautious of apps that show a 'free score': many of these aren't the full official report, just a commercial tie-up, so the official site is the safest place to check.", hi: "आरबीआई के नियम से, हर क्रेडिट ब्यूरो साल में एक बार पूरी मुफ्त क्रेडिट रिपोर्ट देता है — cibil.com/freecibilscore पर। कई ऐप 'फ्री स्कोर' दिखाते हैं, लेकिन वह सिर्फ एक कमर्शियल टाई-अप होती है, आधिकारिक साइट ही सबसे सुरक्षित है।" },
      followup: { en: 'Want to know how to improve your score?', hi: 'बताऊं, स्कोर कैसे सुधारें?' } },
    { rank: 16, type: 'C', verified: 'VERIFIED-no-figure', authority: 'General banking practice', verifiedOn: '2 Jul 2026', kw: ['loan without salary', 'personal loan', 'salary slip'], url: null,
      linkText: { en: 'Ask your bank for their exact requirements', hi: 'अपने बैंक से पूरी जानकारी लें' },
      q: { en: 'Personal loan without a salary slip', hi: 'सैलरी स्लिप नहीं है, लोन कैसे मिलेगा' },
      empathy: { en: "Not having a salary slip can feel like a closed door, but it usually isn't.", hi: 'सैलरी स्लिप न होने पर लोन लेना मुश्किल लगता है, लेकिन रास्ते हैं।' },
      answer: { en: 'Banks can instead ask for your ITR, Form 16, or 6-12 months of bank statements. A CIBIL score above 750 generally helps your case.', hi: 'इसके बदले बैंक आईटीआर, फॉर्म 16, या 6-12 महीने की बैंक स्टेटमेंट मांग सकते हैं। सिबिल स्कोर 750 से ऊपर होना मददगार होता है।' },
      followup: { en: 'Want to check your CIBIL score now?', hi: 'बताऊं, अभी अपना सिबिल स्कोर चेक करें?' } },
    { rank: 98, type: 'C', verified: 'VERIFIED-with-figure', authority: 'CIBIL (TransUnion)', verifiedOn: '2 Jul 2026', kw: ['defaulter list', 'cibil dispute', 'wrong entry'], url: 'https://www.cibil.com/consumer-dispute-resolution',
      linkText: { en: 'cibil.com/consumer-dispute-resolution', hi: 'cibil.com/consumer-dispute-resolution' },
      q: { en: 'Remove a wrong entry from my CIBIL report', hi: 'सिबिल में गलत एंट्री कैसे हटाएं' },
      empathy: { en: "Getting a wrong entry fixed is completely your right — let's sort it out.", hi: 'गलत एंट्री हटवाना आपका हक है — चलिए इसे ठीक करते हैं।' },
      answer: { en: "There's no separate 'defaulter list' — it's part of your report. File an online dispute form on MyCIBIL with proper evidence. The bank or bureau must correct it within 30 days, or you're owed ₹100 a day as compensation.", hi: 'कोई अलग ‘डिफॉल्टर लिस्ट’ नहीं होती, यह रिपोर्ट का हिस्सा होती है। MyCIBIL पर सबूत के साथ डिस्प्यूट फॉर्म भरें। बैंक या ब्यूरो को 30 दिन में सुधारना होता है, वरना ₹100 प्रतिदिन का मुआवज़ा मिलता है।' },
      followup: { en: 'Want to know how to fill that dispute form?', hi: 'बताऊं, डिस्प्यूट फॉर्म कैसे भरें?' } },
  ] },

  { id: 'savings', label: { en: 'Savings and investments', hi: 'बचत और निवेश' }, icon: 'savings', items: [
    { rank: 9, type: 'A', verified: 'VERIFIED-with-figure', authority: 'National Savings Institute', verifiedOn: '2 Jul 2026', kw: ['fd rate', 'post office fd', 'fixed deposit'], url: 'https://www.nsiindia.gov.in',
      linkText: { en: 'nsiindia.gov.in', hi: 'nsiindia.gov.in' },
      q: { en: 'Post office FD rates vs bank FD rates', hi: 'पोस्ट ऑफिस एफडी बनाम बैंक एफडी रेट' },
      empathy: { en: 'Choosing where to put your savings matters — good to compare carefully before deciding.', hi: 'सही जगह पैसा लगाना एक अहम फैसला है — फैसला लेने से पहले तुलना करना अच्छा है।' },
      answer: { en: "Post Office Time Deposit's current rates run from 6.9% (1 year) up to 7.5% (5 years). Every bank sets and changes its own FD rate, so we won't call one 'the best' — tell me your bank and I can help you compare its published rate against these numbers.", hi: 'पोस्ट ऑफिस टाइम डिपॉज़िट का मौजूदा रेट: 1 साल 6.9%, 5 साल 7.5% है। हर बैंक अपना अलग रेट तय करता है, इसलिए हम किसी एक को ‘सबसे अच्छा’ नहीं कहेंगे — अपना बैंक बताएं, तुलना में मदद करूं।' },
      followup: { en: "Want help comparing against your own bank's rate?", hi: 'बताऊं, अपने बैंक के रेट से तुलना करें?' } },
    { rank: 32, type: 'A', verified: 'VERIFIED-with-figure', authority: 'Income Tax Department', verifiedOn: '2 Jul 2026', kw: ['ppf', 'tax benefit', 'ppf tax'], url: 'https://incometax.gov.in',
      linkText: { en: 'incometax.gov.in', hi: 'incometax.gov.in' },
      q: { en: 'Tax benefit of a PPF account', hi: 'पीपीएफ का टैक्स फायदा' },
      empathy: { en: 'PPF is a solid way to save on tax as well as build savings.', hi: 'पीपीएफ टैक्स बचाने का भी अच्छा ज़रिया है।' },
      answer: { en: 'Money in PPF gets a tax deduction up to ₹1.5 lakh under Section 80C, and both the interest and maturity amount are tax-free. Current rate is 7.1%.', hi: 'पीपीएफ में जमा पैसा सेक्शन 80C के तहत ₹1.5 लाख तक टैक्स से छूट देता है, ब्याज़ और मैच्योरिटी दोनों टैक्स-फ्री हैं। मौजूदा रेट 7.1% है।' },
      followup: { en: 'Want to know how to open a PPF account?', hi: 'बताऊं, पीपीएफ खाता कैसे खोलें?' } },
    { rank: 40, type: 'A', verified: 'VERIFIED-with-figure', authority: 'National Savings Institute', verifiedOn: '2 Jul 2026', kw: ['scss', 'senior citizen savings', 'senior scheme'], url: 'https://www.nsiindia.gov.in',
      linkText: { en: 'nsiindia.gov.in', hi: 'nsiindia.gov.in' },
      q: { en: 'Senior Citizen Savings Scheme investment limit', hi: 'सीनियर सिटिज़न सेविंग्स स्कीम की लिमिट' },
      empathy: { en: 'Safe, dependable savings matter a lot at this stage of life.', hi: 'इस उम्र में सुरक्षित बचत बहुत ज़रूरी है।' },
      answer: { en: 'You can deposit up to ₹30 lakh alone, or ₹60 lakh jointly. The current rate is 8.2% a year, paid out every quarter.', hi: 'अकेले ₹30 लाख तक (जॉइंट के लिए ₹60 लाख) जमा कर सकते हैं। मौजूदा रेट 8.2% सालाना है, हर तिमाही ब्याज़ मिलता है।' },
      followup: { en: 'Want to know how to open an SCSS account?', hi: 'बताऊं, एससीएसएस खाता कैसे खोलें?' } },
  ] },

  { id: 'fraud', label: { en: 'Fraud and safety', hi: 'धोखाधड़ी और सुरक्षा' }, icon: 'fraud', items: [
    { rank: 95, type: 'E', verified: 'VERIFIED-no-figure', authority: 'MHA / I4C', verifiedOn: '2 Jul 2026', kw: ['digital arrest', 'police video call', 'fake police'], url: 'https://cybercrime.gov.in',
      linkText: { en: 'Call 1930 now or report at cybercrime.gov.in', hi: 'तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें' },
      q: { en: "What is a 'digital arrest' scam", hi: 'डिजिटल अरेस्ट क्या होता है' },
      hardstop: { en: "'Digital arrest' is a scam — no police officer, CBI, or customs officer can ever 'arrest' you over a video call or force you to transfer money. Real police never ask for money or an OTP on a video call. Hang up immediately. Already sent money? Don't feel embarrassed — call 1930 or report at cybercrime.gov.in right away.", hi: "'डिजिटल अरेस्ट' एक धोखा है — कोई भी पुलिस अफसर, सीबीआई या कस्टम्स अफसर वीडियो कॉल पर आपको 'गिरफ्तार' नहीं कर सकता। असली पुलिस कभी वीडियो कॉल पर पैसा या OTP नहीं मांगती। ऐसा कॉल आए तो तुरंत काट दें। पहले से पैसा भेज चुके हैं? शर्मिंदा मत होइए — तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें।" },
      followup: { en: 'Want to know how to verify a real police officer?', hi: 'बताऊं, असली पुलिस की पहचान कैसे करें?' } },
    { rank: 63, type: 'E', verified: 'VERIFIED-with-figure', authority: 'RBI', verifiedOn: '2 Jul 2026', kw: ['card compromised', 'otp shared', 'fraud happened'], url: 'https://cybercrime.gov.in',
      linkText: { en: "cybercrime.gov.in, and your bank's helpline", hi: 'cybercrime.gov.in, और अपने बैंक की हेल्पलाइन' },
      q: { en: 'Card or UPI compromised — what to do right now', hi: 'कार्ड/यूपीआई कॉम्प्रोमाइज़ हो गया, अब क्या करें' },
      hardstop: { en: "Call your bank right now to block your card, net banking, and UPI, and change your UPI PIN — don't wait. Report within 3 working days and, if it wasn't your fault, you won't bear the liability.", hi: 'तुरंत अपने बैंक को कॉल करके कार्ड, नेट-बैंकिंग, और यूपीआई ब्लॉक करवाएं और यूपीआई पिन बदल दें — इंतज़ार न करें। 3 कार्य दिवसों के अंदर रिपोर्ट करने पर, अगर गलती आपकी नहीं थी, तो ज़िम्मेदारी आपकी नहीं होगी।' },
      followup: { en: "Want help finding your bank's helpline number?", hi: 'बताऊं, बैंक का हेल्पलाइन नंबर कैसे ढूंढें?' } },
    { rank: 30, type: 'C', verified: 'VERIFIED-with-figure', authority: 'MHA / I4C', verifiedOn: '3 Jul 2026', kw: ['account frozen', 'account freeze', 'cyber police'], url: 'https://cybercrime.gov.in',
      linkText: { en: 'cybercrime.gov.in', hi: 'cybercrime.gov.in' },
      q: { en: 'My account got frozen by cyber police', hi: 'साइबर पुलिस ने अकाउंट फ्रीज़ कर दिया' },
      empathy: { en: 'An account freeze is genuinely distressing — I understand why you are worried.', hi: 'अकाउंट फ्रीज़ होना सच में परेशान करने वाली बात है, मैं समझ सकती हूं।' },
      // Conditional caveat — never state the 90-day rule as a blanket fact (PRD v6 §7).
      answer: { en: 'This usually happens when your account gets flagged in a cyber-fraud complaint (NCRP) — the bank cannot remove this on its own. If the disputed amount is under ₹50,000, there is no court order on the freeze, and it is an NCRP/administrative freeze (not a case like PMLA), the bank must release it automatically within 90 days. Outside those three conditions, you will need to contact the police station or cyber cell handling the complaint and get a release order for your bank.', hi: 'यह तब होता है जब आपका अकाउंट किसी साइबर फ्रॉड शिकायत (एनसीआरपी) में फ्लैग हो जाता है — बैंक खुद इसे नहीं हटा सकता। अगर विवादित राशि ₹50,000 से कम है, फ्रीज़ पर कोई कोर्ट ऑर्डर नहीं है, और यह एनसीआरपी/प्रशासनिक फ्रीज़ है (पीएमएलए जैसा मामला नहीं), तो बैंक को 90 दिन में अपने आप रिलीज़ करना होगा। इन तीन शर्तों से बाहर होने पर, शिकायत संभालने वाले पुलिस स्टेशन या साइबर सेल से संपर्क करके रिलीज़ ऑर्डर लेना होगा।' },
      followup: { en: 'Want to know which of the three conditions apply to you?', hi: 'बताऊं, आप पर कौन सी शर्तें लागू होती हैं?' } },
  ] },

  { id: 'bills', label: { en: 'Bills and utilities', hi: 'बिल और यूटिलिटीज़' }, icon: 'bills', items: [
    { rank: 35, type: 'B', verified: 'VERIFIED-no-figure', authority: 'NPCI (Bharat Connect / BBPS)', verifiedOn: '2 Jul 2026', kw: ['electricity bill', 'bijli bill', 'power bill'], url: null,
      linkText: { en: "Your discom's website, or any bank/UPI app's Bill Payment section", hi: 'अपनी डिस्कॉम की वेबसाइट या अपने यूपीआई ऐप का बिल पेमेंट सेक्शन' },
      q: { en: 'Pay electricity bill online', hi: 'बिजली बिल ऑनलाइन कैसे भरें' },
      empathy: { en: 'Good to pay this on time so the power stays on without any stress.', hi: 'समय पर बिल भरना अच्छा है, ताकि बिजली बिना किसी परेशानी के चलती रहे।' },
      answer: { en: 'Every state electricity company (discom) has its own website or app. You can also pay through the Bill Payment section of any bank or UPI app that supports Bharat Connect (BBPS) — the shared official payment network behind most bill-pay features, regardless of which app you use.', hi: 'हर राज्य की बिजली कंपनी (डिस्कॉम) की अपनी वेबसाइट/ऐप होती है। किसी भी बैंक या यूपीआई ऐप के ‘बिल पेमेंट’ सेक्शन (भारत कनेक्ट/BBPS) से भी भर सकते हैं — यह सभी ऐप के पीछे चलने वाला एक साझा आधिकारिक नेटवर्क है।' },
      followup: { en: "Want help finding your discom's name?", hi: 'बताऊं, अपनी डिस्कॉम का नाम कैसे पता करें?' } },
    { rank: 54, type: 'A', verified: 'VERIFIED-no-figure', authority: 'NPCI', verifiedOn: '2 Jul 2026', kw: ['fastag recharge', 'fastag', 'toll recharge'], url: 'https://www.npci.org.in',
      linkText: { en: 'npci.org.in', hi: 'npci.org.in' },
      q: { en: 'Recharge FASTag without logging into an app', hi: 'फास्टैग रीचार्ज बिना ऐप लॉगिन के' },
      empathy: { en: 'An easy shortcut once you know it — no need to open a separate app.', hi: 'बिना ऐप खोले रीचार्ज करना आसान तरीका है।' },
      answer: { en: "In any UPI app, go to 'Pay to UPI ID', enter netc.<your vehicle number>@<bank's UPI handle>, and pay with your UPI PIN — no FASTag app login needed.", hi: "अपने किसी भी यूपीआई ऐप में 'पे टू यूपीआई आईडी' में जाकर netc.<गाड़ी का नंबर>@<बैंक का यूपीआई हैंडल> डालें और यूपीआई पिन से पे करें — कोई फास्टैग ऐप लॉगिन नहीं चाहिए।" },
      followup: { en: 'Want to know the correct UPI ID format for your vehicle?', hi: 'बताऊं, अपनी गाड़ी का सही यूपीआई आईडी फॉर्मेट कैसे बनाएं?' } },
    { rank: 96, type: 'A', verified: 'VERIFIED-with-figure', authority: 'BBMP, Karnataka', verifiedOn: '2 Jul 2026', kw: ['property tax', 'bbmp', 'house tax'], url: 'https://bbmptax.karnataka.gov.in',
      linkText: { en: 'bbmptax.karnataka.gov.in', hi: 'bbmptax.karnataka.gov.in' },
      q: { en: 'Pay BBMP property tax online (Bengaluru)', hi: 'बीबीएमपी प्रॉपर्टी टैक्स कैसे भरें (बेंगलुरु)' },
      empathy: { en: 'Good to stay on top of this before the deadline.', hi: 'डेडलाइन से पहले इसे भर देना अच्छा है।' },
      answer: { en: 'Enter your Application, PID, or Renewal number and your name on bbmptax.karnataka.gov.in to see dues, select the year, and pay via UPI, net banking, or card.', hi: 'bbmptax.karnataka.gov.in पर अपना एप्लिकेशन, पीआईडी, या रिन्यूअल नंबर और नाम डालकर बकाया देखें, साल चुनें, और यूपीआई, नेट बैंकिंग, या कार्ड से पे करें।' },
      followup: { en: 'Want help finding your PID number?', hi: 'बताऊं, अपना पीआईडी नंबर कहां मिलेगा?' } },
  ] },
];

export function findBucket(id) {
  return ANSWER_BANK.find((b) => b.id === id);
}
export function findItem(bucketId, rank) {
  return findBucket(bucketId)?.items.find((it) => it.rank === rank);
}
// Simple keyword match for the free-text box (kept deliberately dumb — L1 non-goal
// per PRD v6 §4.7/§12.2; the real matcher is DS-4–DS-7's MM chat orchestrator work).
export function matchByKeyword(text) {
  const v = text.trim().toLowerCase();
  if (!v) return null;
  for (const b of ANSWER_BANK) {
    for (const it of b.items) {
      if (!it.kw) continue;
      if (it.kw.some((k) => v.includes(k) || k.includes(v))) {
        return { bucketId: b.id, rank: it.rank };
      }
    }
  }
  return null;
}
