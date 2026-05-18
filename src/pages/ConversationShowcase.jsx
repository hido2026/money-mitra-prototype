// ConversationShowcase — pre-scripted bet conversation in a phone frame.
// Voice-first input (mic + Hinglish transcript), Devanagari output.
// Each conversation carries its own accent color (purple / coral / green).

import PersonaAvatar from '../components/PersonaAvatar';

// ── Tiny icon set (inline SVG) ─────────────────────────────────────────────────
const IcSignal = () => (
  <svg viewBox="0 0 18 12" width="17" height="11" fill="currentColor" aria-hidden>
    <rect x="0"  y="8" width="3" height="4"  rx="0.5" />
    <rect x="5"  y="5" width="3" height="7"  rx="0.5" />
    <rect x="10" y="2" width="3" height="10" rx="0.5" />
    <rect x="15" y="0" width="3" height="12" rx="0.5" opacity="0.4" />
  </svg>
);
const IcWifi = () => (
  <svg viewBox="0 0 16 12" width="16" height="11" fill="currentColor" aria-hidden>
    <path d="M8 11.5a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm-3.5-3a4.95 4.95 0 017 0l-1.25 1.25a3.18 3.18 0 00-4.5 0L4.5 8.5zM2 6a8.49 8.49 0 0112 0l-1.25 1.25a6.71 6.71 0 00-9.5 0L2 6zM0 3.5a12 12 0 0116 0l-1.25 1.25a10.23 10.23 0 00-13.5 0L0 3.5z"/>
  </svg>
);
const IcBattery = () => (
  <svg viewBox="0 0 26 12" width="25" height="12" aria-hidden>
    <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" fill="none" stroke="currentColor" strokeOpacity="0.5"/>
    <rect x="23.5" y="3.5" width="2"  height="5"  rx="1"   fill="currentColor" fillOpacity="0.5"/>
    <rect x="2"    y="2"   width="17" height="8"  rx="1.5" fill="currentColor"/>
  </svg>
);
const IcMic = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
    <path d="M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3zm6-5a1 1 0 00-1 1v1a5 5 0 11-10 0v-1a1 1 0 10-2 0v1a7 7 0 1014 0v-1a1 1 0 00-1-1zm-3 10H9a1 1 0 000 2h6a1 1 0 000-2z"/>
  </svg>
);
const IcBack = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
  </svg>
);

// ── Status bar (iPhone X style) ────────────────────────────────────────────────
function StatusBar() {
  return (
    <div style={{
      height: '40px',
      padding: '0 22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: "'JioType', sans-serif",
      fontWeight: 600,
      fontSize: '14px',
      color: '#1F1F1F',
      flexShrink: 0,
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <IcSignal />
        <IcWifi />
        <IcBattery />
      </div>
    </div>
  );
}

// ── Avatar (40×40, circular crop, image with fallback) ────────────────────────
function ChatAvatar() {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      minWidth: '40px',
      borderRadius: '50%',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <PersonaAvatar persona="Mukund" size="md" />
    </div>
  );
}
// PersonaAvatar 'md' is 56px — too big. Replace with inline 40px img:
function MukundAvatar40() {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      minWidth: '40px',
      borderRadius: '50%',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <img
        src={`${import.meta.env.BASE_URL}mukund.jpg`}
        alt="Mukund"
        loading="eager"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
      />
    </div>
  );
}

// ── Chat header (back + Mukund + name) ────────────────────────────────────────
function ChatHeader({ accent }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '6px 14px 8px',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      background: '#FAFAFA',
      flexShrink: 0,
    }}>
      <div style={{ color: accent, display: 'flex', cursor: 'default' }}>
        <IcBack />
      </div>
      <MukundAvatar40 />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: "'JioType', sans-serif",
          fontWeight: 700,
          fontSize: '15px',
          color: '#1F1F1F',
          lineHeight: 1.15,
        }}>Mukund</span>
        <span style={{
          fontFamily: "'JioType', sans-serif",
          fontWeight: 400,
          fontSize: '11px',
          color: '#888780',
        }}>Money Mitra · online</span>
      </div>
    </div>
  );
}

// ── User voice message (right) — mic + Hinglish transcript ────────────────────
function UserVoiceMessage({ voice, time, accent }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '2px',
    }}>
      <div style={{
        maxWidth: '80%',
        background: '#E8E8E8',
        borderRadius: '16px 16px 4px 16px',
        padding: '8px 12px 9px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
      }}>
        {/* Voice indicator row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: accent }}>
          <span style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: accent,
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IcMic size={11} />
          </span>
          {/* Waveform */}
          <svg width="58" height="14" viewBox="0 0 58 14" aria-hidden>
            {[3,7,11,5,9,4,12,6,8,5,10,4,7,3].map((h, i) => (
              <rect key={i} x={i * 4} y={(14 - h) / 2} width="2" height={h} rx="1" fill={accent} opacity="0.85" />
            ))}
          </svg>
          <span style={{
            fontFamily: "'JioType', sans-serif",
            fontSize: '11px',
            color: accent,
            opacity: 0.7,
            fontWeight: 500,
          }}>0:04</span>
        </div>

        {/* Hinglish transcript */}
        <span style={{
          fontFamily: "'JioType', sans-serif",
          fontStyle: 'italic',
          fontSize: '12px',
          lineHeight: 1.35,
          color: '#888780',
          fontWeight: 400,
        }}>
          “{voice}”
        </span>
      </div>
      <span style={{
        fontFamily: "'JioType', sans-serif",
        fontSize: '10px',
        color: '#A8A8A0',
        paddingRight: '2px',
        marginTop: '1px',
      }}>{time}</span>
    </div>
  );
}

// ── Mukund Devanagari message (left) ──────────────────────────────────────────
function MukundMessage({ text, time, action, accent, accentSoft }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      justifyContent: 'flex-start',
    }}>
      <MukundAvatar40 />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '2px',
        maxWidth: '80%',
      }}>
        <div style={{
          background: accentSoft,
          border: `1px solid ${accent}1F`,
          borderRadius: '16px 16px 16px 4px',
          padding: '9px 13px 10px',
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontWeight: 400,
          fontSize: '14.5px',
          lineHeight: 1.5,
          color: '#1F1F1F',
        }}>
          {text}

          {action && (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              background: '#fff',
              border: `1px solid ${accent}33`,
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}>
              <span style={{
                fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                color: accent,
              }}>
                {action.label}
              </span>
              <span style={{
                fontFamily: "'JioType', sans-serif",
                fontWeight: 400,
                fontSize: '11px',
                color: '#888780',
              }}>
                {action.sub}
              </span>
            </div>
          )}
        </div>
        <span style={{
          fontFamily: "'JioType', sans-serif",
          fontSize: '10px',
          color: '#A8A8A0',
          paddingLeft: '2px',
          marginTop: '1px',
        }}>{time}</span>
      </div>
    </div>
  );
}

// ── Day / timestamp separator ─────────────────────────────────────────────────
function Separator({ label }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '4px 0',
    }}>
      <span style={{
        fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
        fontSize: '11px',
        fontWeight: 500,
        color: '#888780',
        background: 'rgba(0,0,0,0.05)',
        padding: '3px 10px',
        borderRadius: '999px',
      }}>{label}</span>
    </div>
  );
}

// ── Fake input bar (visual only) ──────────────────────────────────────────────
function FakeInputBar({ accent }) {
  return (
    <div style={{
      padding: '8px 12px 14px',
      background: '#FAFAFA',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexShrink: 0,
    }}>
      <div style={{
        flex: 1,
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.10)',
        borderRadius: '14px',
        padding: '9px 13px',
        fontFamily: "'JioType', sans-serif",
        fontSize: '13px',
        color: '#A8A8A0',
      }}>
        Mic dabake bolo…
      </div>
      <button style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'none',
        background: accent,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 2px 8px ${accent}44`,
      }}>
        <IcMic size={18} />
      </button>
    </div>
  );
}

// ── Main showcase ─────────────────────────────────────────────────────────────
export default function ConversationShowcase({ conversation }) {
  const { title, subtitle, messages, accent, accentSoft } = conversation;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: '#FAFAFA',
    }}>
      <StatusBar />
      <ChatHeader accent={accent} />

      {/* Title strip */}
      <div style={{
        padding: '8px 14px 6px',
        background: '#FAFAFA',
        flexShrink: 0,
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{
          fontFamily: "'JioType', sans-serif",
          fontWeight: 700,
          fontSize: '13px',
          color: accent,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}>{title}</div>
        <div style={{
          fontFamily: "'JioType', sans-serif",
          fontWeight: 400,
          fontSize: '11px',
          color: '#888780',
          marginTop: '1px',
        }}>{subtitle}</div>
      </div>

      {/* Conversation thread — flows naturally; page scrolls on small viewports */}
      <div style={{
        padding: '10px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
      }}>
        {messages.map((m, i) => {
          if (m.from === 'user')      return <UserVoiceMessage key={i} voice={m.voice} time={m.time} accent={accent} />;
          if (m.from === 'mukund')    return <MukundMessage key={i} text={m.text} time={m.time} action={m.action} accent={accent} accentSoft={accentSoft} />;
          if (m.from === 'separator') return <Separator key={i} label={m.label} />;
          return null;
        })}
      </div>

      <FakeInputBar accent={accent} />
    </div>
  );
}
