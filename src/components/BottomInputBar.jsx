// BottomInputBar — plus button + text pill + Speak button.
// Used on home and corridor screens.
// Props:
//   compact     bool — smaller plus + Speak (corridor variant)
//   onSubmit    (text) => void  — Enter pressed in input
//   onSpeak     () => void
//   onPlus      () => void
//   inputRef    React ref to focus the input from parent (escape chip)

import { useState, forwardRef } from 'react';
import { IcPlus, IcMicrophone } from './icons/Icons';

const BottomInputBar = forwardRef(function BottomInputBar(
  { compact = false, onSubmit, onSpeak, onPlus },
  ref
) {
  const [text, setText] = useState('');
  const plusSize = compact ? 40 : 42;
  const speakPadY = compact ? 10 : 11;
  const speakPadX = compact ? 18 : 20;

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setText('');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: compact ? '8px 16px 16px' : '12px 16px 18px',
      borderTop: compact ? '0.5px solid rgba(0,0,0,0.05)' : 'none',
      background: '#FFFFFF',
      flexShrink: 0,
    }}>
      {/* Plus button */}
      <button
        type="button"
        onClick={onPlus}
        aria-label="Add attachment"
        style={{
          width: plusSize,
          height: plusSize,
          minWidth: plusSize,
          borderRadius: '50%',
          background: '#F5F4FA',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <IcPlus size={20} color="#534AB7" />
      </button>

      {/* Text pill */}
      <div style={{
        flex: 1,
        minWidth: 0,
        background: '#F5F4FA',
        borderRadius: '999px',
        padding: '11px 18px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <input
          ref={ref}
          type="text"
          placeholder="कुछ भी पूछिए"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
            fontSize: '14px',
            color: '#2C2C2A',
          }}
        />
      </div>

      {/* Speak button */}
      <button
        type="button"
        onClick={onSpeak}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#534AB7',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '999px',
          padding: `${speakPadY}px ${speakPadX}px`,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <IcMicrophone size={18} color="#FFFFFF" />
        <span style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '15px',
          fontWeight: 600,
          color: '#FFFFFF',
          lineHeight: 1,
        }}>बोलिए</span>
      </button>
    </div>
  );
});

export default BottomInputBar;
