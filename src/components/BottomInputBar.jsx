// BottomInputBar — plus button + text pill (with send) + Speak button.
// Props:
//   compact      bool
//   onSubmit     (text) => void
//   onSpeak      () => void
//   onPlus       () => void
//   voiceStatus  'idle'|'recording'|'processing'|'done'|'error'|'no_mic'|'no_key'
//                — drives speak button appearance

import { useState, forwardRef } from 'react';
import { IcPlus, IcMicrophone } from './icons/Icons';

// Send arrow icon
const IcSend = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
  </svg>
);

const BottomInputBar = forwardRef(function BottomInputBar(
  { compact = false, onSubmit, onSpeak, onPlus, voiceStatus = 'idle' },
  ref
) {
  const [text, setText] = useState('');
  const plusSize  = compact ? 40 : 42;
  const hasText   = text.trim().length > 0;

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setText('');
  };

  // Speak button appearance based on voice status
  const speakBg =
    voiceStatus === 'recording'  ? '#D85A30' :
    voiceStatus === 'processing' ? '#888780' :
    voiceStatus === 'done'       ? '#3B6D11' :
    voiceStatus === 'no_mic'     ? '#D85A30' :
    voiceStatus === 'error'      ? '#888780' :
    '#534AB7';

  // Text-only labels — the IcMicrophone SVG renders alongside (no emoji, per JDS).
  const speakLabel =
    voiceStatus === 'recording'  ? 'बंद करें' :   // tap to stop early
    voiceStatus === 'processing' ? 'समझ रहा...' :
    voiceStatus === 'done'       ? 'हो गया' :
    voiceStatus === 'no_mic'     ? 'इजाज़त दें' :
    voiceStatus === 'error'      ? 'फिर कोशिश' :
    'बोलिए';

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      // extra bottom padding for iOS home indicator (safe-area-inset-bottom ≈ 34px on iPhone X+)
      padding: compact
        ? '8px 16px max(16px, env(safe-area-inset-bottom, 16px))'
        : '12px 16px max(18px, env(safe-area-inset-bottom, 18px))',
      borderTop: '0.5px solid rgba(0,0,0,0.08)',
      background: '#FFFFFF',
      flexShrink: 0,
    }}>
      {/* Plus button */}
      <button
        type="button"
        onClick={onPlus}
        aria-label="Add"
        style={{
          width: plusSize, height: plusSize, minWidth: plusSize,
          borderRadius: '50%', background: '#F5F4FA', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <IcPlus size={20} color="#534AB7" />
      </button>

      {/* Text pill + send button */}
      <div style={{
        flex: 1, minWidth: 0,
        background: '#F5F4FA',
        borderRadius: '999px',
        padding: '11px 12px 11px 18px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <input
          ref={ref}
          type="text"
          placeholder="कुछ भी पूछिए"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          style={{
            flex: 1, minWidth: 0,
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
            fontSize: '14px', color: '#2C2C2A',
          }}
        />
        {/* Send button — visible whenever there's text */}
        {hasText && (
          <button
            type="button"
            onClick={submit}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: 'none', background: '#534AB7', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <IcSend />
          </button>
        )}
      </div>

      {/* Speak button — reflects voice status */}
      <button
        type="button"
        onClick={onSpeak}
        className={voiceStatus === 'recording' ? 'mic-recording' : ''}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: speakBg, color: '#FFFFFF', border: 'none',
          borderRadius: '999px',
          padding: compact ? '10px 14px' : '11px 16px',
          cursor: 'pointer', flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <IcMicrophone size={16} color="#FFFFFF" />
        <span style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '14px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>{speakLabel}</span>
      </button>
    </div>
  );
});

export default BottomInputBar;
