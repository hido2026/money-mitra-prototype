// InputBar — matches JBIQ app input bar pattern
// [+] [placeholder text.......] [purple Speak/Send pill]

import { useState } from 'react';

// JDS ic_mic svg_path
const IcMic = () => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <path
      d="M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3zm6-5a1 1 0 00-1 1v1a5 5 0 11-10 0v-1a1 1 0 10-2 0v1a7 7 0 1014 0v-1a1 1 0 00-1-1zm-3 10H9a1 1 0 000 2h6a1 1 0 000-2z"
      fill="currentColor"
    />
  </svg>
);

// Waveform / voice bars icon (matches "Speak" button in app)
const IcWave = () => (
  <svg viewBox="0 0 20 14" fill="none" width="20" height="14">
    <rect x="0" y="4" width="2.5" height="6" rx="1.25" fill="white" />
    <rect x="4" y="1" width="2.5" height="12" rx="1.25" fill="white" />
    <rect x="8" y="0" width="2.5" height="14" rx="1.25" fill="white" />
    <rect x="12" y="2" width="2.5" height="10" rx="1.25" fill="white" />
    <rect x="16" y="4" width="2.5" height="6" rx="1.25" fill="white" />
  </svg>
);

export default function InputBar({ persona, onSend, disabled }) {
  const [text, setText] = useState('');
  const placeholder = `Hey, ${persona === 'Mukund' ? 'Mukund' : 'Meera'} se poochhna hai…`;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = !!text.trim() && !disabled;

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      background: 'var(--jds-surface-default)',
      borderTop: '1px solid var(--jds-stroke-subtle)',
      padding: '10px 16px 16px',
    }}>
      {/* JDS input pill — surface-ghost, rounded 28px */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--jds-surface-ghost)',
        borderRadius: '28px',
        padding: '6px 6px 6px 14px',
        maxWidth: '672px',
        margin: '0 auto',
        gap: '8px',
      }}>
        {/* "+" attachment button */}
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 4px',
            cursor: 'pointer',
            fontFamily: "'JioType', sans-serif",
            fontWeight: 700,
            fontSize: '22px',
            color: 'var(--jds-primary-50)',
            lineHeight: 1,
            flexShrink: 0,
          }}
          title="Attach"
        >
          +
        </button>

        {/* Text input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: "'JioType', sans-serif",
            fontWeight: 400,
            fontSize: '15px',
            color: 'var(--jds-text-high)',
            minWidth: 0,
          }}
        />

        {/* Speak / Send pill button */}
        <button
          onClick={handleSubmit}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '999px',
            border: 'none',
            background: canSend
              ? 'var(--jds-primary-50)'
              : 'var(--jds-surface-bold)',    // always purple like app
            color: '#fff',
            fontFamily: "'JioType', sans-serif",
            fontWeight: 700,
            fontSize: '14px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            opacity: disabled ? 0.65 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          <IcWave />
          <span>{canSend ? 'Bhejo' : 'Bolo'}</span>
        </button>
      </div>
    </div>
  );
}
