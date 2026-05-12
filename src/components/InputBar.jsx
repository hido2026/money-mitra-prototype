import { useState } from 'react';

// JDS ic_mic svg_path (from JDS icon library)
const IcMic = ({ color = 'currentColor', size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <path
      d="M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3zm6-5a1 1 0 00-1 1v1a5 5 0 11-10 0v-1a1 1 0 10-2 0v1a7 7 0 1014 0v-1a1 1 0 00-1-1zm-3 10H9a1 1 0 000 2h6a1 1 0 000-2z"
      fill={color}
    />
  </svg>
);

// Send icon — JDS arrow (paper-plane style)
const IcSend = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <path
      d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
      fill="currentColor"
    />
  </svg>
);

export default function InputBar({ persona, onSend, disabled }) {
  const [text, setText] = useState('');
  const placeholder = persona === 'Mukund'
    ? 'Mukund se baat karein…'
    : 'Meera se baat karein…';

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
      padding: '10px 16px 14px',
    }}>
      {/* JDS InputField — surface-ghost pill, border-radius 23px per spec */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--jds-surface-ghost)',
        borderRadius: '23px',
        padding: '6px 6px 6px 16px',
        maxWidth: '672px',
        margin: '0 auto',
      }}>
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

        {/* Mic — disabled, voice coming soon */}
        <div title="Voice coming soon" style={{ position: 'relative' }}>
          <button
            disabled
            style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.38,   // JDS disabled opacity
            }}
          >
            <IcMic color="var(--jds-icon-medium)" />
          </button>
        </div>

        {/* Send — JDS primary button, circle */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          style={{
            width: '36px', height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: canSend ? 'var(--jds-primary-50)' : 'var(--jds-surface-ghost)',
            color: canSend ? '#fff' : 'var(--jds-text-disabled)',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          <IcSend />
        </button>
      </div>
    </div>
  );
}
