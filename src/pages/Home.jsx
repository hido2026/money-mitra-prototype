// Home — Money Mitra Hindi-first landing (route: "/")
// JBIQ companion pattern: empty middle, scope cards top, input bottom.

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import JbiqLogo from '../components/JbiqLogo';
import BottomInputBar from '../components/BottomInputBar';
import {
  IcChevronLeft, IcChevronUp, IcEdit,
  IcBulb, IcPiggyBank, IcRocket, IcReceipt,
} from '../components/icons/Icons';

function ScopeCard({ icon, accent, accentLight, title, titleColor, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${accentLight}`,
        borderRadius: '14px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '9px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div style={{
        width: '28px',
        height: '28px',
        minWidth: '28px',
        borderRadius: '8px',
        background: accentLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontWeight: 700,
          fontSize: '14px',
          lineHeight: 1.1,
          color: titleColor || accent,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '10.5px',
          color: '#5F5E5A',
          marginTop: '3px',
          lineHeight: 1.35,
        }}>
          {subtitle}
        </div>
      </div>
    </button>
  );
}

function ComingSoonCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#F9F8FB',
        border: '1.5px dashed rgba(83, 74, 183, 0.25)',
        borderRadius: '14px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '9px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div style={{
        width: '28px',
        height: '28px',
        minWidth: '28px',
        borderRadius: '8px',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IcReceipt size={15} color="#888780" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontWeight: 700,
          fontSize: '13px',
          lineHeight: 1.1,
          color: '#888780',
        }}>
          रोज़ का खर्चा
        </div>
        <div style={{
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '9px',
          color: '#534AB7',
          fontWeight: 600,
          letterSpacing: '0.2px',
          marginTop: '3px',
          lineHeight: 1.35,
          textTransform: 'uppercase',
        }}>
          जल्द आ रहा है
        </div>
      </div>
    </button>
  );
}

function Toast({ text }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '88px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#2C2C2A',
      color: '#fff',
      fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
      fontSize: '13px',
      padding: '10px 18px',
      borderRadius: '999px',
      boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
      zIndex: 100,
      animation: 'fade-in 220ms ease-out',
      maxWidth: '90vw',
      textAlign: 'center',
    }}>
      {text}
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  };

  const handleSubmit = (text) => {
    // Free-text fallback → Samjho corridor for now
    nav('/samjho-entry', { state: { seedText: text } });
  };
  const handleSpeak = () => {
    // Stub: voice not wired in v11. Route to Samjho corridor.
    nav('/samjho-entry');
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
      {toast && <Toast text={toast} />}

      {/* ── Top bar ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '4px 18px 14px',
      }}>
        <button
          type="button"
          aria-label="Back"
          onClick={() => { /* home — visual consistency */ }}
          style={{
            background: 'none', border: 'none', padding: 0,
            display: 'flex', cursor: 'pointer',
          }}
        >
          <IcChevronLeft size={24} color="#2C2C2A" />
        </button>

        <PortraitAvatar size={44} online ringed />

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1.2,
          minWidth: 0,
        }}>
          <span style={{
            fontFamily: "'JioType', sans-serif",
            fontSize: '17px',
            fontWeight: 600,
            color: '#2C2C2A',
          }}>Money Mitra</span>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#3B6D11',
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
              fontSize: '11px',
              color: '#3B6D11',
            }}>online · अभी पूछो</span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Edit"
          style={{
            background: 'none', border: 'none', padding: 0,
            display: 'flex', cursor: 'pointer',
          }}
        >
          <IcEdit size={22} color="#2C2C2A" />
        </button>
      </header>

      {/* ── JBIQ cloverleaf + greeting ── */}
      <section style={{ padding: '6px 24px 0' }}>
        <div style={{ marginBottom: '10px' }}>
          <JbiqLogo size={34} />
        </div>
        <p style={{
          margin: 0,
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '17px',
          fontWeight: 500,
          lineHeight: 1.4,
          color: '#2C2C2A',
          maxWidth: '340px',
        }}>
          नमस्ते! मैं मुकुंद — आपके पैसे का companion।
        </p>
        <p style={{
          margin: '6px 0 0',
          fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
          fontSize: '13px',
          lineHeight: 1.5,
          color: '#5F5E5A',
          maxWidth: '340px',
        }}>
          पैसे की समझ, बचत, और बढ़ोतरी — सब हिंदी में।{' '}
          <span style={{ color: '#534AB7', fontWeight: 600 }}>
            सही दिशा दूँगा।
          </span>
        </p>
      </section>

      {/* ── 2×2 scope cards ── */}
      <section style={{
        padding: '16px 20px 0',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        <ScopeCard
          icon={<IcBulb size={15} color="#534AB7" />}
          accent="#534AB7"
          accentLight="#EEEDFE"
          title="समझो"
          titleColor="#534AB7"
          subtitle="SIP, stock, scheme, FD — पूछो"
          onClick={() => nav('/samjho-entry')}
        />
        <ScopeCard
          icon={<IcPiggyBank size={15} color="#D85A30" />}
          accent="#D85A30"
          accentLight="#FAECE7"
          title="पैसा बचाओ"
          titleColor="#D85A30"
          subtitle="Fraud रोको · hidden charges पकड़ो"
          onClick={() => nav('/bachao-entry')}
        />
        <ScopeCard
          icon={<IcRocket size={15} color="#3B6D11" />}
          accent="#3B6D11"
          accentLight="#EAF3DE"
          title="पैसा बढ़ाओ"
          titleColor="#3B6D11"
          subtitle="Goal · plan · सही जगह लगाओ"
          onClick={() => nav('/aage-badho-entry')}
        />
        <ComingSoonCard
          onClick={() => showToast('जल्द आ रहा है — AA license के बाद')}
        />
      </section>

      {/* ── Empty middle (deliberate) ── */}
      <div style={{ flex: 1, minHeight: '24px' }} />

      {/* ── Previous conversation indicator ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0 4px',
      }}>
        <button
          type="button"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: 0,
          }}
        >
          <span style={{
            fontFamily: "'Noto Sans Devanagari', 'JioType', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: '#888780',
          }}>पुरानी बातचीत</span>
          <IcChevronUp size={14} color="#888780" />
        </button>
      </div>

      {/* ── Bottom input bar ── */}
      <BottomInputBar
        ref={inputRef}
        onSubmit={handleSubmit}
        onSpeak={handleSpeak}
        onPlus={() => { /* attachment picker stub */ }}
      />
    </div>
  );
}
