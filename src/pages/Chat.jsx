import { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import { MUKUND_PROMPT } from '../config/system-prompts.js';
import TopBar from '../components/TopBar';
import Message from '../components/Message';
import TypingIndicator from '../components/TypingIndicator';
import InputBar from '../components/InputBar';
import PersonaAvatar from '../components/PersonaAvatar';
import { speakMukund } from '../utils/tts';

// ── Groq client ────────────────────────────────────────────────────────────────
const _apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groqClient = _apiKey
  ? new Groq({ apiKey: _apiKey, dangerouslyAllowBrowser: true })
  : null;
const LIVE_MODE = !!groqClient;

// ── v2-compliant mock (fallback when no API key) ───────────────────────────────
const MOCK = {
  default:
    'Haan, batao. Kya hai — koi specific plan banana hai, kuch samajhna hai, ya koi aur cheez?',
  'SIP kya hai?':
    'SIP yaani har mahine fixed paisa mutual fund mein automatic invest karna. Jaise ₹2,000 har mahine automatically kat ke fund mein chala jaata hai — compounding kaam karta rehta hai. Koi specific goal hai jiske liye SIP plan kar rahe ho?',
  'Beti ki college ke liye plan banao':
    'Theek hai, numbers chahiye. Beti ki abhi umar kya hai, aur roughly college kab hoga — 8 saal baad, 12 saal baad?',
  'Yeh message scam hai kya?':
    'Message dikhao mujhe — abhi check karta hoon. Number kahaan se aaya, aur exact kya likha hai?',
};

async function streamMock(text, onChunk) {
  const reply = MOCK[text] ?? MOCK.default;
  for (const word of reply.split(' ')) {
    onChunk(word + ' ');
    await new Promise((r) => setTimeout(r, 55));
  }
}

// ── Chat ───────────────────────────────────────────────────────────────────────
export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Speak Mukund's response AFTER streaming is fully done.
  // useEffect is the correct place for side effects — NOT inside setMessages().
  useEffect(() => {
    if (isStreaming) return; // still streaming
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.content) {
      speakMukund(last.content);
    }
  }, [isStreaming]); // fires only when isStreaming flips to false

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    try {
      if (LIVE_MODE) {
        const groqMessages = [
          { role: 'system', content: MUKUND_PROMPT },
          ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
        ];
        const stream = await groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          max_tokens: 1024,
          stream: true,
        });
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? '';
          if (token) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, content: last.content + token };
              return updated;
            });
          }
        }
      } else {
        await streamMock(text, (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
            return updated;
          });
        });
      }
    } catch (err) {
      console.error('[chat] error:', err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Kuch technical gadbad ho gayi. Thodi der mein dobara try karein.',
        };
        return updated;
      });
    } finally {
      setIsStreaming(false); // triggers the useEffect above which calls speakMukund
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: '#FAF7F2',
    }}>
      {/* Header — isTyping pulses the portrait avatar */}
      <TopBar onClear={() => setMessages([])} isTyping={isStreaming} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '24px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>

          {/* ── Welcome state ── */}
          {isEmpty && (
            <div className="animate-fade-in" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              paddingTop: '16px',
              paddingBottom: '8px',
            }}>
              {/* Large portrait — 120px, shadow for depth */}
              <PersonaAvatar persona="Mukund" size="xl" shadow={true} />

              {/* Greeting */}
              <p style={{
                margin: '20px 0 20px',
                fontFamily: "'JioType', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: 1.45,
                color: '#1F1F1F',
                maxWidth: '300px',
              }}>
                Namaste! Main Mukund hoon. Aapka paise ka companion. Paise ke baare mein kuch poochhna hai?
              </p>

              {/* Pill label */}
              <p style={{
                margin: '0 0 12px',
                fontFamily: "'JioType', sans-serif",
                fontWeight: 500,
                fontSize: '13px',
                color: 'rgba(25,27,30,0.55)',
                alignSelf: 'flex-start',
              }}>
                Aise puchh sakte ho:
              </p>

              {/* Prompt pills — left-aligned, stacked */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '10px',
                width: '100%',
              }}>
                {[
                  'SIP kya hai?',
                  'Beti ki college ke liye plan banao',
                  'Yeh message scam hai kya?',
                ].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => sendMessage(pill)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(57,0,173,0.15)',
                      background: '#f0eeff',
                      fontFamily: "'JioType', sans-serif",
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#3900ad',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e3dcff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f0eeff'; }}
                  >
                    <span style={{ fontSize: '16px' }}>💬</span>
                    {pill}
                  </button>
                ))}
              </div>

              {/* Footer hint */}
              <p style={{
                margin: '16px 0 0',
                fontFamily: "'JioType', sans-serif",
                fontWeight: 400,
                fontSize: '13px',
                color: 'rgba(25,27,30,0.45)',
                fontStyle: 'italic',
              }}>
                …ya aap kuch aur poochh sakte ho
              </p>
            </div>
          )}

          {/* ── Messages ── */}
          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} content={msg.content} persona="Mukund" />
          ))}

          {/* ── Typing indicator ── */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <TypingIndicator persona="Mukund" />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <InputBar onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
