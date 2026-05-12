import { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { MUKUND_PROMPT, MEERA_PROMPT } from '../config/system-prompts.js';
import TopBar from '../components/TopBar';
import PersonaAvatar from '../components/PersonaAvatar';
import Message from '../components/Message';
import TypingIndicator from '../components/TypingIndicator';
import InputBar from '../components/InputBar';

// ── Prompt pills ──────────────────────────────────────────────────────────────
const PILLS = [
  'SIP kya hai?',
  'Beti ki college ke liye plan banao',
  'Yeh message scam hai kya?',
];

// ── API client (browser-safe prototype mode) ──────────────────────────────────
// Set VITE_ANTHROPIC_API_KEY in .env.local for local dev with real Claude.
// GitHub Pages builds without the key → falls back to v2-faithful mock mode.
const _apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
const claudeClient = _apiKey
  ? new Anthropic({ apiKey: _apiKey, dangerouslyAllowBrowser: true })
  : null;
const LIVE_MODE = !!claudeClient;

// ── v2-compliant mock responses ───────────────────────────────────────────────
// Short · Hinglish · no sycophantic openers · ends with specific follow-up question
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
      'Theek hai. Teen cheezein bata sakti hain — beti ki abhi kya umar hai, kitne saal mein fund chahiye, aur aaj roughly kitna month bachat ho sakti hai?',
    'Yeh message scam hai kya?':
      'Message dikhao mujhe — abhi check karti hoon. Kahaan se aaya, exact kya likha hai?',
  },
};

async function streamMock(text, persona, onChunk) {
  const bank = MOCK[persona] ?? MOCK.Mukund;
  const reply = bank[text] ?? bank.default;
  const words = reply.split(' ');
  for (const word of words) {
    onChunk(word + ' ');
    await new Promise((r) => setTimeout(r, 55));
  }
}

// ── Chat page ─────────────────────────────────────────────────────────────────
export default function Chat({ persona, onPersonaChange }) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);

  const greeting =
    persona === 'Mukund'
      ? 'Namaste! Main Mukund hoon. Paise ke baare mein kya soch rahe ho aaj?'
      : 'Namaste! Main Meera hoon. Paise ke baare mein kya soch rahe ho aaj?';

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
        // ── Real Claude API (browser, dangerouslyAllowBrowser) ──
        const systemPrompt = persona === 'Meera' ? MEERA_PROMPT : MUKUND_PROMPT;
        const stream = claudeClient.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 1024,
          system: systemPrompt,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                content: last.content + event.delta.text,
              };
              return updated;
            });
          }
        }
      } else {
        // ── v2-faithful mock (GitHub Pages / no API key) ──
        await streamMock(text, persona, (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
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

  const handleTogglePersona = () => {
    onPersonaChange(persona === 'Mukund' ? 'Meera' : 'Mukund');
    setMessages([]);
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: 'var(--jds-surface-minimal)',
    }}>
      <TopBar
        persona={persona}
        onTogglePersona={handleTogglePersona}
        onClearConversation={() => setMessages([])}
      />

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{
          maxWidth: '672px',
          margin: '0 auto',
          padding: '20px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>

          {/* Empty state */}
          {isEmpty && (
            <div
              className="animate-fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '32px',
                paddingBottom: '8px',
              }}
            >
              <PersonaAvatar persona={persona} size="lg" />
              <p style={{
                margin: 0,
                fontFamily: "'JioType', sans-serif",
                fontWeight: 700,
                fontSize: '17px',
                color: 'var(--jds-text-high)',
                textAlign: 'center',
                maxWidth: '300px',
                lineHeight: 1.35,
              }}>
                {greeting}
              </p>

              {/* Prompt pills */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
              }}>
                {PILLS.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => sendMessage(pill)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '999px',
                      border: '1px solid var(--jds-stroke-subtle)',
                      background: 'var(--jds-surface-default)',
                      fontFamily: "'JioType', sans-serif",
                      fontWeight: 500,
                      fontSize: '14px',
                      color: 'var(--jds-text-high)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--jds-primary-20)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--jds-surface-default)'; }}
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

          {/* Typing indicator — shown only while streaming and reply is still empty */}
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
