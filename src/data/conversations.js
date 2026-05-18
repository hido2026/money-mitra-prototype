// Scripted conversations for deck showcases.
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
  accent: '#534AB7',      // purple
  accentSoft: '#EEEBFB',  // soft fill for Mukund bubbles
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
