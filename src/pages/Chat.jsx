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
    setMessages(nextMessages);
    setIsStreaming(true);

    // Placeholder for streaming assistant reply
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          persona,
        }),
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
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const { text: chunk } = JSON.parse(data);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
              return updated;
            });
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch (err) {
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

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

          {/* Greeting + pills (only when empty) */}
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
                    style={{
                      borderColor: '#E8E0D5',
                      color: '#1F1F1F',
                      background: 'transparent',
                    }}
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

          {/* Typing indicator — shows while streaming AND last message has no content yet */}
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
