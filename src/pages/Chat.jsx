import { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { MUKUND_PROMPT, MEERA_PROMPT } from '../config/system-prompts.js';
import TopBar from '../components/TopBar';
import Message from '../components/Message';
import TypingIndicator from '../components/TypingIndicator';
import InputBar from '../components/InputBar';

// ── JBIQ 4-petal brand icon ────────────────────────────────────────────────
// Matches the purple flower/asterisk mark shown in all companion chat screens
const JBIQDot = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="var(--jds-primary-50)">
    <ellipse cx="24" cy="14" rx="9" ry="13" />
    <ellipse cx="34" cy="24" rx="13" ry="9" />
    <ellipse cx="24" cy="34" rx="9" ry="13" />
    <ellipse cx="14" cy="24" rx="13" ry="9" />
  </svg>
);

// ── Prompt pills ──────────────────────────────────────────────────────────────
const PILLS = {
  Mukund: [
    'SIP kya hai?',
    'Beti ki college ke liye plan banao',
    'Yeh message scam hai kya?',
  ],
  Meera: [
    'SIP kya hai?',
    'Beti ki college ke liye plan banao',
    'Yeh message scam hai kya?',
  ],
};

// ── API client ─────────────────────────────────────────────────────────────────
const _apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
const claudeClient = _apiKey
  ? new Anthropic({ apiKey: _apiKey, dangerouslyAllowBrowser: true })
  : null;
const LIVE_MODE = !!claudeClient;

// ── v2-compliant mock responses ────────────────────────────────────────────────
// Short · Hinglish · no sycophantic openers · ends with specific question
const MOCK = {
  Mukund: {
    default:
      'Haan, batao. Kya hai — koi specific plan banana hai, kuch samajhna hai, ya koi aur cheez?',
    'SIP kya hai?':
      'SIP yaani har mahine fixed paisa mutual fund mein automatic invest karna. Jaise ₹2,000 har mahine automatically kat ke fund mein chala jaata hai — aap alag se kuch nahi karte, compounding kaam karta rehta hai. Koi specific goal hai jiske liye SIP plan kar rahe ho?',
    'Beti ki college ke liye plan banao':
      'Theek hai, numbers chahiye. Beti ki abhi umar kya hai, aur roughly college kab hoga — 8 saal baad, 12 saal baad?',
    'Yeh message scam hai kya?':
      'Message dikhao mujhe — abhi check karta hoon. Number kahaan se aaya, aur exact kya likha hai?',
  },
  Meera: {
    default:
      'Batao, kya hai? Koi plan banana hai, kuch samajhna hai, ya koi problem hai?',
    'SIP kya hai?':
      'SIP yaani har mahine fixed paisa mutual fund mein automatic invest karna. Jaise ₹2,000 har mahine kat ke fund mein jaata hai — ek baar set karo, phir automatic. Aapke mind mein koi goal hai jiske liye SIP karna chahti ho?',
    'Beti ki college ke liye plan banao':
      'Theek hai. Teen cheezein bata sakti hoon — beti ki abhi kya umar hai, kitne saal mein fund chahiye, aur aaj roughly kitna month bachat ho sakti hai?',
    'Yeh message scam hai kya?':
      'Message dikhao mujhe — abhi check karti hoon. Kahaan se aaya, exact kya likha hai?',
  },
};

async function streamMock(text, persona, onChunk) {
  const bank = MOCK[persona] ?? MOCK.Mukund;
  const reply = bank[text] ?? bank.default;
  for (const word of reply.split(' ')) {
    onChunk(word + ' ');
    await new Promise((r) => setTimeout(r, 55));
  }
}

// ── Chat page ──────────────────────────────────────────────────────────────────
export default function Chat({ persona, onPersonaChange, onBack }) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);

  const greeting =
    persona === 'Mukund'
      ? `Hey! Main Mukund hoon — aapka finance companion. Paise ke baare mein kya soch rahe ho?`
      : `Hey! Main Meera hoon — aapki finance companion. Paise ke baare mein kya soch rahi ho?`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    try {
      if (LIVE_MODE) {
        const systemPrompt = persona === 'Meera' ? MEERA_PROMPT : MUKUND_PROMPT;
        const stream = claudeClient.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 1024,
          system: systemPrompt,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        });
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, content: last.content + event.delta.text };
              return updated;
            });
          }
        }
      } else {
        await streamMock(text, persona, (chunk) => {
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
      setIsStreaming(false);
    }
  };

  const isEmpty = messages.length === 0;
  const pills = PILLS[persona] ?? PILLS.Mukund;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: 'var(--jds-surface-default)',
    }}>
      <TopBar
        persona={persona}
        onBack={onBack}
        onClearConversation={() => setMessages([])}
      />

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{
          maxWidth: '672px',
          margin: '0 auto',
          padding: '20px 20px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>

          {/* ── Empty state: matches JBIQ companion chat start ── */}
          {isEmpty && (
            <div className="animate-fade-in">
              {/* JBIQ 4-petal brand icon */}
              <div style={{ marginBottom: '16px' }}>
                <JBIQDot size={52} />
              </div>

              {/* Bold greeting — left-aligned, 2 lines */}
              <p style={{
                margin: '0 0 20px',
                fontFamily: "'JioType', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: 1.4,
                color: 'var(--jds-text-high)',
                maxWidth: '340px',
              }}>
                {greeting}
              </p>

              {/* Prompt pills — left-aligned, stacked vertically */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '10px',
              }}>
                {pills.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => sendMessage(pill)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '999px',
                      border: 'none',
                      background: 'var(--jds-primary-20)',
                      fontFamily: "'JioType', sans-serif",
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--jds-surface-bold)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#d4d4fc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--jds-primary-20)'; }}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} content={msg.content} persona={persona} />
          ))}

          {/* Typing indicator */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <TypingIndicator persona={persona} />
          )}

          {/* "Scroll to view history" hint — shown when there are messages */}
          {!isEmpty && (
            <div style={{
              textAlign: 'center',
              padding: '8px 0 4px',
              fontFamily: "'JioType', sans-serif",
              fontSize: '13px',
              color: 'var(--jds-text-disabled)',
            }}>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <InputBar persona={persona} onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
