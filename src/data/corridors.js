// Cold-entry corridor configs.
// samjhoCorridor chips updated Jun 2026 — 4 non-overlapping topics,
// each routes to its own scripted three-beat conversation.

export const samjhoCorridor = {
  route: 'samjho-entry',
  bannerCaps: 'SAMJHO',
  bannerHi: 'समझो',
  accent: '#534AB7',
  accentLight: '#EEEDFE',
  bubbleText: 'कोई भी सवाल पूछो — योजना हो, पैसे कटे हों, बेटी की बचत हो। बताओ, क्या समझना है?',
  chips: [
    {
      iconKey: 'stamp',
      devanagari: 'सरकारी योजना का पैसा आया या नहीं — कैसे देखूँ?',
      hinglish: 'Sarkari yojana ka paisa aaya ya nahi — kaise dekhu?',
      route: '/samjhao-scheme-status',
    },
    {
      iconKey: 'shield',
      devanagari: 'पैसे कट गए — अब क्या करूँ?',
      hinglish: 'Paise kat gaye — ab kya karu?',
      route: '/samjhao-paisa-kata',
    },
    {
      iconKey: 'coin-off',
      devanagari: 'बिना बताए खाते से पैसा क्यों कटा?',
      hinglish: 'Bina bataye khate se paisa kyun kata?',
      route: '/samjhao-bina-bataye',
    },
    {
      iconKey: 'school',
      devanagari: 'बेटी के लिए सबसे अच्छी बचत कौन सी?',
      hinglish: 'Beti ke liye sabse acchi bachat kaun si?',
      route: '/samjhao-beti',
    },
  ],
  escape: {
    text: 'कुछ और पूछो',
    dashed: 'rgba(83, 74, 183, 0.4)',
  },
};

export const bachaoCorridor = {
  route: 'bachao-entry',
  bannerCaps: 'BACHAO',
  bannerHi: 'पैसा बचाओ',
  accent: '#D85A30',
  accentLight: '#FAECE7',
  bubbleText: 'अच्छा, पैसा बचाने की बात — सही जगह आए हो। पहले बताओ, क्या हुआ है?',
  chips: [
    {
      iconKey: 'alert-octagon',
      devanagari: 'मेरे साथ UPI fraud हुआ है',
      hinglish: 'Mere saath UPI fraud hua hai',
      route: '/bachao-ravi',
    },
    {
      iconKey: 'coin-off',
      devanagari: 'बैंक से ₹436 क्यों कटा?',
      hinglish: 'Bank se ₹436 kyun kata?',
      route: '/bachao-ravi', // TODO: branch — ₹436 PMJJBY pattern
    },
    {
      iconKey: 'file-dollar',
      devanagari: 'Insurance policy सही है या ULIP trap?',
      hinglish: 'Insurance policy sahi hai ya ULIP trap?',
      route: '/bachao-ravi', // TODO: branch — ULIP audit
    },
  ],
  escape: {
    text: 'कुछ और हुआ है',
    dashed: 'rgba(216, 90, 48, 0.4)',
  },
};

export const aageBadhoCorridor = {
  route: 'aage-badho-entry',
  bannerCaps: 'AAGE BADHO',
  bannerHi: 'पैसा बढ़ाओ',
  accent: '#3B6D11',
  accentLight: '#EAF3DE',
  bubbleText: 'अच्छा, पैसा बढ़ाने की सोच रहे हो — बढ़िया। पहले बताओ, मंज़िल क्या है?',
  chips: [
    {
      iconKey: 'school',
      devanagari: 'बेटी/बेटे की पढ़ाई के लिए',
      hinglish: 'Beti/bete ki padhai ke liye',
      route: '/aage-badho-ravi',
    },
    {
      iconKey: 'confetti',
      devanagari: 'शादी के लिए',
      hinglish: 'Shaadi ke liye',
      route: '/aage-badho-ravi', // TODO: wedding branch
    },
    {
      iconKey: 'home',
      devanagari: 'घर / गाड़ी के लिए',
      hinglish: 'Ghar / gaadi ke liye',
      route: '/aage-badho-ravi', // TODO: house/vehicle branch
    },
  ],
  escape: {
    text: 'मेरा goal अलग है',
    dashed: 'rgba(59, 109, 17, 0.4)',
  },
};
