// InputBar — text input primary, mic icon secondary (voice Phase 2)
// Text input auto-focused on load.

import { useState, useRef, useEffect } from 'react';

const IcMic = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
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
          placeholder="Kuch poochhiye Mukund se…"
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

        {/* Mic — secondary, greyed out with "Coming soon" tooltip */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => { setVoiceTip(true); setTimeout(() => setVoiceTip(false), 2500); }}
            title="Voice jald aa raha hai"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1.5px solid rgba(139,44,44,0.18)',
              background: 'transparent',
              color: 'rgba(139,44,44,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,44,44,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <IcMic />
          </button>

          {/* Tooltip on tap */}
          {voiceTip && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              right: 0,
              background: '#1F1F1F',
              color: '#fff',
              fontFamily: "'JioType', sans-serif",
              fontSize: '12px',
              padding: '7px 12px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 20,
            }}>
              Voice jald aa raha hai
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '14px',
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid #1F1F1F',
              }} />
            </div>
          )}
        </div>

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
