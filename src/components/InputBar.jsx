// InputBar — text input + WORKING mic (Web Speech primary, Sarvam STT fallback).
// Text input auto-focused on load. Tap mic → speak → transcript is sent.
// JDS: violet brand tokens throughout (was a legacy maroon/cream skin).

import { useState, useRef, useEffect } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useLang } from '../hooks/useLang';

const IcMic = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
    <path
      d="M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3zm6-5a1 1 0 00-1 1v1a5 5 0 11-10 0v-1a1 1 0 10-2 0v1a7 7 0 1014 0v-1a1 1 0 00-1-1zm-3 10H9a1 1 0 000 2h6a1 1 0 000-2z"
      fill="currentColor"
    />
  </svg>
);

const IcStop = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </svg>
);

const IcSend = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
  </svg>
);

export default function InputBar({ onSend, disabled, autoStartVoice = false }) {
  const [text, setText] = useState('');
  const [lang] = useLang();
  const inputRef = useRef(null);

  // ── Voice input — Web Speech (Chrome/Safari) → Sarvam STT fallback ──────────
  const { status: voiceStatus, toggle: toggleVoice } = useVoiceInput({
    onResult: (transcript) => {
      const t = (transcript || '').trim();
      if (t) onSend(t);
    },
  });
  const isRecording  = voiceStatus === 'recording';
  const isProcessing = voiceStatus === 'processing';

  // Auto-focus on load so cursor is immediately visible
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // If we arrived here from the home "बोलिए" button, start recording once.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartVoice && !autoStartedRef.current) {
      autoStartedRef.current = true;
      const t = setTimeout(() => toggleVoice(), 350);
      return () => clearTimeout(t);
    }
  }, [autoStartVoice, toggleVoice]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Mic button appearance reflects live voice status
  const micClass = isRecording
    ? 'bg-primary-50 text-white border-0'
    : isProcessing
      ? 'bg-primary-20 text-primary-50 border-0'
      : 'bg-transparent text-primary-50 border-primary-20 border-[1.5px]';

  return (
    <div className="border-primary-20 sticky bottom-0 border-t bg-surface-minimal px-4 pt-3 pb-6">

      {/* ── Primary row: text input + mic + send ── */}
      <div className="border-primary-20 flex items-center gap-2 rounded-xl border-[1.5px] bg-surface px-3 py-2.5">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording  ? (lang === 'en' ? 'Listening… speak now' : 'सुन रहा हूँ… बोलिए') :
            isProcessing ? (lang === 'en' ? 'Understanding…' : 'समझ रहा हूँ…') :
            (lang === 'en' ? 'Ask Mukund anything…' : 'मुकुंद से कुछ भी पूछिए…')
          }
          disabled={disabled}
          className="font-jio text-ink flex-1 border-0 bg-transparent text-[15px] outline-none"
        />

        {/* Mic — WORKING. Tap to record, tap again to stop. */}
        <button
          onClick={toggleVoice}
          aria-label={isRecording ? 'Stop recording' : 'Speak'}
          title={isRecording ? 'बंद करें' : 'बोलिए'}
          className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${isRecording ? 'mic-recording' : ''} ${micClass}`}
        >
          {isRecording ? <IcStop /> : <IcMic />}
        </button>

        {/* Send — only visible when there's text */}
        {text.trim() && (
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className={`bg-primary-50 flex size-9 shrink-0 items-center justify-center rounded-full text-white ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <IcSend />
          </button>
        )}
      </div>
    </div>
  );
}
