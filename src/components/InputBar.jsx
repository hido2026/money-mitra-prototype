// InputBar — voice button dominant, text input secondary
// Voice is disabled (Phase 2). Text input auto-focused on load.

import { useState, useRef, useEffect } from 'react';

const IcMic = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path
      d="M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3zm6-5a1 1 0 00-1 1v1a5 5 0 11-10 0v-1a1 1 0 10-2 0v1a7 7 0 1014 0v-1a1 1 0 00-1-1zm-3 10H9a1 1 0 000 2h6a1 1 0 000-2z"
      fill="currentColor"
    />
  </svg>
);

const IcSend = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
  </svg>
);

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [voiceTip, setVoiceTip] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus on load so cursor is immediately visible
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

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

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      background: '#FAF7F2',
      borderTop: '1px solid rgba(139,44,44,0.18)',
      padding: '14px 16px 22px',
    }}>

      {/* ── Voice button — large, dominant, deep red ── */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <button
          onClick={() => { setVoiceTip(true); setTimeout(() => setVoiceTip(false), 2500); }}
          style={{
            width: '100%',
            padding: '15px 20px',
            borderRadius: '14px',
            border: 'none',
            background: '#8B2C2C',
            color: '#fff',
            fontFamily: "'JioType', sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            animation: 'voice-pulse 2.8s ease-in-out infinite',
          }}
        >
          <IcMic />
          Bolo aur poochho
        </button>

        {/* Tooltip on tap */}
        {voiceTip && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1F1F1F',
            color: '#fff',
            fontFamily: "'JioType', sans-serif",
            fontSize: '13px',
            padding: '8px 14px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 20,
          }}>
            Voice jald aa raha hai — abhi text mein puchhiye
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1F1F1F',
            }} />
          </div>
        )}
      </div>

      {/* ── Text input — secondary ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ya yahan likhein…"
          disabled={disabled}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(139,44,44,0.25)',
            outline: 'none',
            padding: '8px 2px',
            fontFamily: "'JioType', sans-serif",
            fontWeight: 400,
            fontSize: '15px',
            color: '#1F1F1F',
            fontStyle: 'italic',
          }}
        />

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
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <IcSend />
          </button>
        )}
      </div>
    </div>
  );
}
