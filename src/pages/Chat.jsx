import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Groq from 'groq-sdk';
import { useApp } from '../context/AppContext';
import { ONBOARDING } from '../data/onboarding.config.js';
import { MUKUND_PROMPT } from '../config/system-prompts.js';
import TopBar from '../components/TopBar';
import Message from '../components/Message';
import TypingIndicator from '../components/TypingIndicator';
import InputBar from '../components/InputBar';
import AnswerBank from '../components/AnswerBank';
import { speakMukund } from '../utils/tts';
import { useLang } from '../hooks/useLang';

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
  const [lang, setLang] = useLang();
  const bottomRef = useRef(null);
  const location = useLocation();
  const autoSentRef = useRef(false);
  const { state, dispatch } = useApp();
  const onbAskMarkedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Speak Mukund's response AFTER streaming is fully done.
  // useEffect is the correct place for side effects — NOT inside setMessages().
  useEffect(() => {
    if (isStreaming) return; // still streaming
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.content) {
      speakMukund(last.content, undefined, lang);
    }
  }, [isStreaming]); // fires only when isStreaming flips to false

  const sendMessage = async (text) => {
    // Day-0 mission: "मुकुंद से कुछ पूछो" completes on the first question asked.
    if (location.state?.onboardingAsk && !onbAskMarkedRef.current && !state.onboarding.steps.askedMukund) {
      onbAskMarkedRef.current = true;
      dispatch({ type: 'ONBOARDING_STEP', payload: 'askedMukund' });
      dispatch({ type: 'ONBOARDING_AWARD', payload: ONBOARDING.STEP_ASK });
    }
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

  // Auto-send a message passed from the home screen's text box (initialMessage).
  // Guard prevents StrictMode's double-effect from sending twice.
  useEffect(() => {
    const init = location.state?.initialMessage;
    if (init && !autoSentRef.current) {
      autoSentRef.current = true;
      sendMessage(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-dvh flex-col bg-surface-minimal">
      {/* Header — isTyping pulses the portrait avatar */}
      <TopBar onClear={() => setMessages([])} isTyping={isStreaming} lang={lang} setLang={setLang} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[520px] flex-col gap-3 px-4 pt-6 pb-2">

          {/* ── Guided Ask (PRD v6 §12.1 DS-2) — replaces the free-text-only welcome.
               Every tap resolves deterministically to one Answer Bank row; no LLM
               call happens here. Free text below still goes to sendMessage/Groq
               unchanged (DS-3, L1 non-goal). ── */}
          {isEmpty && <AnswerBank />}

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

      <InputBar onSend={sendMessage} disabled={isStreaming} autoStartVoice={location.state?.autoVoice} />
    </div>
  );
}
