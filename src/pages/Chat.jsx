import { useState, useRef, useEffect } from 'react';
import TopBar from '../components/TopBar';
import PersonaAvatar from '../components/PersonaAvatar';
import Message from '../components/Message';
import TypingIndicator from '../components/TypingIndicator';
import InputBar from '../components/InputBar';

const PILLS = [
  'SIP kya hai?',
  'Beti ki college ke liye plan banao',
  'Yeh message scam hai kya?',
];

// ─── Mock responses (UI testing only, no API key needed) ─────────────────────
// When a real ANTHROPIC_API_KEY is added to Vercel, this block gets replaced
// by a call to /api/chat and MOCK_MODE flipped to false.
const MOCK_MODE = false;

const MOCK = {
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

function getMockReply(persona, text) {
  const bank = MOCK[persona] || MOCK.Mukund;
  return bank[text] || bank.default;
}

async function streamMock(text, persona, onChunk) {
  const reply = getMockReply(persona, text);
  const words = reply.split(' ');
  for (const word of words) {
    onChunk(word + ' ');
    await new Promise((r) => setTimeout(r, 60));
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Chat({ persona, onPersonaChange }) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);

  const greeting =
    persona === 'Mukund'
      ? 'Namaste! Main Mukund hoon. Paise ke baare mein kuch poochhna hai?'
      : 'Namaste! Main Meera hoon. Paise ke baare mein kuch poochhna hai?';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    try {
      if (MOCK_MODE) {
        await streamMock(text, persona, (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
            return updated;
          });
        });
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages, persona }),
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const { text: chunk } = JSON.parse(data);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, content: last.content + chunk };
                return updated;
              });
            } catch { /* ignore malformed chunk */ }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, kuch technical gadbad ho gayi. Thodi der mein dobara try karein.',
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleTogglePersona = () => {
    const next = persona === 'Mukund' ? 'Meera' : 'Mukund';
    onPersonaChange(next);
    setMessages([]);
  };

  const handleClear = () => setMessages([]);
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#FAF7F2' }}>
      <TopBar
        persona={persona}
        onTogglePersona={handleTogglePersona}
        onClearConversation={handleClear}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

          {isEmpty && (
            <div className="flex flex-col items-center gap-4 pt-6 pb-2 animate-fade-in">
              <PersonaAvatar persona={persona} size="lg" />
              <p
                className="text-base sm:text-lg text-center font-medium"
                style={{ color: '#1F1F1F', fontFamily: 'Georgia, serif', maxWidth: 320 }}
              >
                {greeting}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {PILLS.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => sendMessage(pill)}
                    className="px-4 py-2 rounded-full border text-sm transition-colors hover:bg-white"
                    style={{ borderColor: '#E8E0D5', color: '#1F1F1F', background: 'transparent' }}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} content={msg.content} persona={persona} />
          ))}

          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <TypingIndicator persona={persona} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <InputBar persona={persona} onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
