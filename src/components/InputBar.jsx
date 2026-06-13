// InputBar — text input + WORKING mic (Web Speech primary, Sarvam STT fallback).
// Text input auto-focused on load. Tap mic → speak → transcript is sent.

import { useState, useRef, useEffect } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';

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
  const micBg =
    isRecording  ? '#8B2C2C' :
    isProcessing ? 'rgba(139,44,44,0.12)' :
    'transparent';
  const micColor =
    isRecording  ? '#fff' :
    isProcessing ? '#8B2C2C' :
    '#8B2C2C';

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      background: '#FAF7F2',
      borderTop: '1px solid rgba(139,44,44,0.18)',
      padding: '12px 16px 24px',
    }}>

      {/* ── Primary row: text input + mic + send ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#fff',
        border: '1.5px solid rgba(139,44,44,0.22)',
        borderRadius: '14px',
        padding: '10px 12px',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'सुन रहा हूँ… बोलिए' : isProcessing ? 'समझ रहा हूँ…' : 'मुकुंद से कुछ भी पूछिए…'}
          disabled={disabled}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: "'JioType', sans-serif",
            fontWeight: 400,
            fontSize: '15px',
            color: '#1F1F1F',
          }}
        />

        {/* Mic — WORKING. Tap to record, tap again to stop. */}
        <button
          onClick={toggleVoice}
          aria-label={isRecording ? 'Stop recording' : 'Speak'}
          title={isRecording ? 'बंद करें' : 'बोलिए'}
          className={isRecording ? 'mic-recording' : ''}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: isRecording ? 'none' : '1.5px solid rgba(139,44,44,0.28)',
            background: micBg,
            color: micColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          {isRecording ? <IcStop /> : <IcMic />}
        </button>

        {/* Send — only visible when there's text */}
        {text.trim() && (
          <button
            onClick={handleSubmit}
            disabled={disabled}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: '#8B2C2C',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <IcSend />
          </button>
        )}
      </div>
    </div>
  );
}
