// MOCK MODE — swap in real Anthropic call once API key is ready.
// To switch: set ANTHROPIC_API_KEY in Vercel env vars, then replace this
// file with the real implementation in api/chat.real.js

const MOCK_RESPONSES = {
  Mukund: {
    default: 'Bilkul! Main aapki madad karne ke liye yahaan hoon. Paise ke baare mein aap koi bhi sawaal poochh sakte hain — SIP ho, insurance ho, ya phir koi bhi financial planning. Batayein, kya jaanna chahte hain? 😊',
    'SIP kya hai?': 'SIP matlab Systematic Investment Plan! Yeh ek tarika hai jisme aap har mahine ek fixed amount — jaise ₹500 ya ₹1000 — mutual fund mein invest karte hain. Jaise aap har mahine kirana khareedne ke liye paise nikalte ho, waise hi SIP se aap apne future ke liye thoda-thoda invest karte rehte ho. Compounding ki wajah se yeh chota amount aaage jaake kaafi bada ban jaata hai!',
    'Beti ki college ke liye plan banao': 'Bahut achha socha aapne! Beti ki education ke liye abhi se plan karna bilkul sahi hai. Pehle batayein — beti ki abhi kya umar hai, aur aap kitne saal mein college fund chahte hain? Uske hisaab se main aapko ek simple SIP plan suggest kar sakta hoon jo aaram se goal achieve kar sake. 📚',
    'Yeh message scam hai kya?': 'Agar koi message yeh keh raha hai ki "aapne lottery jeeti," ya "ek baar payment karo aur double paise milenge," ya "aapka account band hoga — abhi click karo" — toh 99% chance hai yeh SCAM hai! Koi bhi sarkari bank ya company aapko aise messages nahi bhejti. Message ka screenshot share karein, main confirm kar sakta hoon. 🚨',
  },
  Meera: {
    default: 'Namaste! Main yahaan hoon aapki madad ke liye. Paise ke baare mein koi bhi sawaal poochhne mein jhijhak mat karein — chhote savings ho ya badi planning, sab discuss kar sakte hain. Aaj kya jaanna chahti hain aap? 😊',
    'SIP kya hai?': 'SIP ek bahut simple aur samajhdari wala tarika hai invest karne ka! Har mahine ek choti si raqam — jaise ₹500 — mutual fund mein jaati hai automatically. Sochiye jaise piggy bank, lekin yeh piggy bank time ke saath grow bhi karta hai! Aur sabse achhi baat — aapko share market ke utar-chadaav ki chinta nahi karni, kyunki aap regularly thoda-thoda invest karti rehti hain. 💰',
    'Beti ki college ke liye plan banao': 'Wah, kitni achhi soch hai! Beti ki education ke liye planning abhi se shuru karna samajhdaari hai. Kya aap mujhe bata sakti hain — beti ki age kya hai aur aap approximately kitne saal mein college fund ready chahti hain? Ussi ke hisaab se main aapko suggest karungi kitna monthly invest karna chahiye. 🎓',
    'Yeh message scam hai kya?': 'Aajkal bohot saare fraud messages aa rahe hain — bilkul sahi kiya jo check kiya! Kuch red flags jo dekhne chahiye: agar message mein "urgent" ya "last chance" likha ho, koi link click karne ko keh raha ho, ya personal details maang raha ho — toh yeh scam ho sakta hai. Message mujhe dikhayein, main help karungi check karne mein! 🛡️',
  },
};

function getMockResponse(persona, lastMessage) {
  const responses = MOCK_RESPONSES[persona] || MOCK_RESPONSES.Mukund;
  return responses[lastMessage] || responses.default;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, persona } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const reply = getMockResponse(persona, lastUserMessage);

  // Stream word-by-word to simulate real streaming
  const words = reply.split(' ');
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
    await sleep(60);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
