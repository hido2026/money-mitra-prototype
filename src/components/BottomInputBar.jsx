// BottomInputBar — plus button + text pill (with send) + Speak button.
// Props:
//   compact      bool
//   onSubmit     (text) => void
//   onSpeak      () => void
//   onPlus       () => void
//   voiceStatus  'idle'|'recording'|'processing'|'done'|'error'|'no_mic'|'no_key'
//                — drives speak button appearance
// JDS (a2ui MCP): tokens only — status colours map to success/warning/error/neutral.

import { useState, forwardRef } from 'react';
import { IcPlus, IcMicrophone } from './icons/Icons';
import { useLang } from '../hooks/useLang';

// Send arrow icon
const IcSend = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
  </svg>
);

const BottomInputBar = forwardRef(function BottomInputBar(
  { compact = false, onSubmit, onSpeak, onPlus, voiceStatus = 'idle', placeholder = 'कुछ भी पूछिए' },
  ref
) {
  const [text, setText] = useState('');
  const [lang] = useLang();
  const plusSize  = compact ? 'size-10' : 'size-10.5';
  const hasText   = text.trim().length > 0;

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setText('');
  };

  // Speak button appearance based on voice status
  const speakBgClass =
    voiceStatus === 'recording'  ? 'bg-error' :
    voiceStatus === 'processing' ? 'bg-neutral' :
    voiceStatus === 'done'       ? 'bg-success' :
    voiceStatus === 'no_mic'     ? 'bg-error' :
    voiceStatus === 'error'      ? 'bg-neutral' :
    'bg-primary-50';

  // Text-only labels — the IcMicrophone SVG renders alongside (no emoji, per JDS).
  const speakLabel =
    voiceStatus === 'recording'  ? (lang === 'en' ? 'Stop'    : 'बंद करें') :
    voiceStatus === 'processing' ? (lang === 'en' ? 'Thinking…' : 'समझ रहा...') :
    voiceStatus === 'done'       ? (lang === 'en' ? 'Done'    : 'हो गया') :
    voiceStatus === 'no_mic'     ? (lang === 'en' ? 'Allow mic' : 'इजाज़त दें') :
    voiceStatus === 'error'      ? (lang === 'en' ? 'Retry'   : 'फिर कोशिश') :
    (lang === 'en' ? 'Speak' : 'बोलिए');

  return (
    <div
      className="border-stroke-subtle sticky bottom-0 z-50 flex shrink-0 items-center gap-2 border-t bg-surface"
      style={{ padding: compact ? '8px 16px max(16px, env(safe-area-inset-bottom, 16px))' : '12px 16px max(18px, env(safe-area-inset-bottom, 18px))' }}
    >
      {/* Plus button */}
      <button
        type="button"
        onClick={onPlus}
        aria-label="Add"
        className={`${plusSize} bg-surface-minimal flex shrink-0 items-center justify-center rounded-full`}
      >
        <IcPlus size={20} color="var(--color-primary-50)" />
      </button>

      {/* Text pill + send button */}
      <div className="bg-surface-minimal flex min-w-0 flex-1 items-center gap-1.5 rounded-full py-2.5 pr-3 pl-4.5">
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          className="font-deva text-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
        />
        {/* Send button — visible whenever there's text */}
        {hasText && (
          <button
            type="button"
            onClick={submit}
            className="bg-primary-50 flex size-8 shrink-0 items-center justify-center rounded-full text-white"
          >
            <IcSend />
          </button>
        )}
      </div>

      {/* Speak button — reflects voice status */}
      <button
        type="button"
        onClick={onSpeak}
        className={`font-deva flex shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-white transition-colors duration-200 ${speakBgClass} ${voiceStatus === 'recording' ? 'mic-recording' : ''}`}
        style={{ padding: compact ? '10px 14px' : '11px 16px' }}
      >
        <IcMicrophone size={16} color="#FFFFFF" />
        <span className="whitespace-nowrap">{speakLabel}</span>
      </button>
    </div>
  );
});

export default BottomInputBar;
