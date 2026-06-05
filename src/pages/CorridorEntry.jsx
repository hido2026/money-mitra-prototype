// CorridorEntry — cold-entry screen that warms the user up before deep flow.
// Shared template; each route passes its corridor config.

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import {
  IcChevronLeft, IcDots,
  IcChartLine, IcScale, IcStamp, IcPencil,
  IcAlertOctagon, IcCoinOff, IcFileDollar,
  IcSchool, IcConfetti, IcHome, IcShield,
} from '../components/icons/Icons';

// Map iconKey → component (keeps corridor data plain JSON).
const ICON_MAP = {
  'chart-line':    IcChartLine,
  'scale':         IcScale,
  'stamp':         IcStamp,
  'alert-octagon': IcAlertOctagon,
  'coin-off':      IcCoinOff,
  'file-dollar':   IcFileDollar,
  'school':        IcSchool,
  'confetti':      IcConfetti,
  'home':          IcHome,
  'shield':        IcShield,
};

function currentTime() {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function PresetChip({ chip, accent, accentLight, onTap }) {
  const Icon = ICON_MAP[chip.iconKey];
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${accentLight}`,
        borderRadius: '11px',
        padding: '10px 13px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex' }}>
        {Icon ? <Icon size={16} color={accent} /> : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '13px',
          lineHeight: 1.3,
          color: '#2C2C2A',
        }}>
          {chip.devanagari}
        </div>
        <div style={{
          fontFamily: "'JioType', sans-serif",
          fontSize: '10px',
          color: '#888780',
          fontStyle: 'italic',
          marginTop: '1px',
          lineHeight: 1.3,
        }}>
          {chip.hinglish}
        </div>
      </div>
    </button>
  );
}

function EscapeChip({ text, dashedColor, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        background: '#FFFFFF',
        border: `1.5px dashed ${dashedColor}`,
        borderRadius: '11px',
        padding: '10px 13px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex' }}>
        <IcPencil size={16} color="#888780" />
      </div>
      <div style={{
        flex: 1,
        minWidth: 0,
        fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
        fontSize: '13px',
        fontStyle: 'italic',
        color: '#5F5E5A',
        lineHeight: 1.3,
      }}>
        {text}
      </div>
    </button>
  );
}

export default function CorridorEntry({ corridor }) {
  const nav = useNavigate();
  const inputRef = useRef(null);
  const [time] = useState(currentTime());

  const focusInput = () => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: '#FFFFFF',
      maxWidth: '420px',
      margin: '0 auto',
    }}>
      {/* ── Top bar ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '4px 18px 14px',
        borderBottom: '0.5px solid rgba(0,0,0,0.05)',
      }}>
        <button
          type="button"
          aria-label="Back"
          onClick={() => nav('/')}
          style={{
            background: 'none', border: 'none', padding: 0,
            display: 'flex', cursor: 'pointer',
          }}
        >
          <IcChevronLeft size={24} color="#2C2C2A" />
        </button>

        <PortraitAvatar size={40} online ringed />

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1.2,
          minWidth: 0,
        }}>
          <span style={{
            fontFamily: "'JioType', sans-serif",
            fontSize: '15px',
            fontWeight: 600,
            color: '#2C2C2A',
          }}>Mukund</span>
          <span style={{
            fontFamily: "'JioType', sans-serif",
            fontSize: '11px',
            color: '#5F5E5A',
            marginTop: '1px',
          }}>Money Mitra · online</span>
        </div>

        <button
          type="button"
          aria-label="More"
          style={{
            background: 'none', border: 'none', padding: 0,
            display: 'flex', cursor: 'pointer',
          }}
        >
          <IcDots size={22} color="#2C2C2A" />
        </button>
      </header>

      {/* ── Section banner ── */}
      <section style={{ padding: '16px 20px 4px' }}>
        <div style={{
          fontFamily: "'JioType', sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.8px',
          color: corridor.accent,
        }}>
          {corridor.bannerCaps}
        </div>
        <div style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '13px',
          color: '#5F5E5A',
          marginTop: '1px',
        }}>
          {corridor.bannerHi}
        </div>
      </section>

      {/* ── Conversation area ── */}
      <section style={{
        flex: 1,
        padding: '16px 16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Mukund's first message */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: '8px',
          maxWidth: '88%',
        }}>
          <div style={{ marginTop: '2px' }}>
            <PortraitAvatar size={28} online={false} ringed={false} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: corridor.accentLight,
              borderRadius: '4px 16px 16px 16px',
              padding: '11px 14px',
              fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#2C2C2A',
            }}>
              {corridor.bubbleText}
            </div>
            <div style={{
              marginTop: '4px',
              paddingLeft: '4px',
              fontFamily: "'JioType', sans-serif",
              fontSize: '10px',
              color: '#888780',
            }}>
              {time}
            </div>
          </div>
        </div>

        {/* "या इनमें से चुनो" label */}
        <div style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '10.5px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          color: '#888780',
          textTransform: 'uppercase',
          marginBottom: '1px',
        }}>
          या इनमें से चुनो
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {corridor.chips.map((chip, i) => (
            <PresetChip
              key={i}
              chip={chip}
              accent={corridor.accent}
              accentLight={corridor.accentLight}
              onTap={() => nav(chip.route)}
            />
          ))}
          <EscapeChip
            text={corridor.escape.text}
            dashedColor={corridor.escape.dashed}
            onTap={focusInput}
          />
        </div>
      </section>

      {/* ── Bottom input bar (compact) ── */}
      <BottomInputBar
        ref={inputRef}
        compact
        onSubmit={(t) => { /* TODO: free-text handler — for now, stay on corridor */ }}
        onSpeak={() => { /* TODO: voice handler */ }}
        onPlus={() => { /* attachment stub */ }}
      />
    </div>
  );
}
