// Home — Money Mitra v12 (route: "/")
// Three entry points: Document Decoder · Money Passbook · Products chip
// Keep: Mukund portrait + online dot, JBIQ cloverleaf, greeting, bottom बोलिए bar

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import JbiqLogo from '../components/JbiqLogo';
import BottomInputBar from '../components/BottomInputBar';
import {
  IcChevronLeft, IcChevronUp, IcEdit,
  IcCamera, IcBookOpen, IcCoins,
} from '../components/icons/Icons';

function Toast({ text }) {
  return (
    <div style={{
      position: 'fixed', bottom: '88px', left: '50%', transform: 'translateX(-50%)',
      background: '#2C2C2A', color: '#fff',
      fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
      fontSize: '13px', padding: '10px 18px',
      borderRadius: '999px', boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
      zIndex: 100, maxWidth: '90vw', textAlign: 'center',
      animation: 'fade-in 220ms ease-out',
    }}>
      {text}
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const inputRef = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(null), 2200); };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      background: '#FFFFFF', maxWidth: '420px', margin: '0 auto',
    }}>
      {toast && <Toast text={toast} />}

      {/* ── Top bar ── */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 18px 14px' }}>
        <button
          type="button"
          aria-label="Back"
          style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}
        >
          <IcChevronLeft size={24} color="#2C2C2A" />
        </button>

        <PortraitAvatar size={44} online ringed />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
          <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '17px', fontWeight: 600, color: '#2C2C2A' }}>
            Money Mitra
          </span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B6D11', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '11px', color: '#3B6D11' }}>
              online · अभी पूछो
            </span>
          </div>
        </div>

        <button type="button" style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}>
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
          fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
          fontSize: '17px', fontWeight: 500, lineHeight: 1.4, color: '#2C2C2A', maxWidth: '340px',
        }}>
          नमस्ते! मैं मुकुंद — आपके पैसे का companion।
        </p>
        <p style={{
          margin: '6px 0 0',
          fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
          fontSize: '13px', lineHeight: 1.5, color: '#5F5E5A', maxWidth: '340px',
        }}>
          पैसे की समझ, बचत, और बढ़ोतरी — सब हिंदी में।{' '}
          <span style={{ color: '#534AB7', fontWeight: 600 }}>सही दिशा दूँगा।</span>
        </p>
      </section>

      {/* ── Three feature cards ── */}
      <section style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Card 1 — Document Decoder */}
        <button
          type="button"
          onClick={() => nav('/decoder')}
          style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: '#FFFFFF', border: '1.5px solid #EEEDFE',
            borderRadius: '16px', padding: '16px', cursor: 'pointer',
            textAlign: 'left', width: '100%',
          }}
        >
          <div style={{
            width: '52px', height: '52px', minWidth: '52px',
            borderRadius: '14px', background: '#EEEDFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IcCamera size={24} color="#534AB7" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#534AB7', lineHeight: 1.2 }}>
              समझो
            </div>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', marginTop: '2px' }}>
              Document Decoder
            </div>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '5px', lineHeight: 1.35 }}>
              जो समझ न आये दिखाइए — बिल, रसीद, मैसेज
            </div>
          </div>
          <span style={{ fontSize: '18px', color: '#534AB7', fontWeight: 700, flexShrink: 0 }}>›</span>
        </button>

        {/* Card 2 — Money Passbook */}
        <button
          type="button"
          onClick={() => nav('/passbook')}
          style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: '#FFFFFF', border: '1.5px solid #EAF3DE',
            borderRadius: '16px', padding: '16px', cursor: 'pointer',
            textAlign: 'left', width: '100%',
          }}
        >
          <div style={{
            width: '52px', height: '52px', minWidth: '52px',
            borderRadius: '14px', background: '#EAF3DE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IcBookOpen size={24} color="#3B6D11" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#3B6D11', lineHeight: 1.2 }}>
              बही
            </div>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', marginTop: '2px' }}>
              Money Passbook
            </div>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '5px', lineHeight: 1.35 }}>
              रोज़ का हिसाब — मिला, खर्च, बचा
            </div>
          </div>
          <span style={{ fontSize: '18px', color: '#3B6D11', fontWeight: 700, flexShrink: 0 }}>›</span>
        </button>

        {/* Chip — Products */}
        <button
          type="button"
          onClick={() => nav('/products')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#FDF6E3', border: '1.5px solid #F0D88A',
            borderRadius: '12px', padding: '11px 14px', cursor: 'pointer',
            textAlign: 'left', width: '100%',
          }}
        >
          <IcCoins size={18} color="#C8961E" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 600, color: '#7A5C0A' }}>
              Products{' '}
            </span>
            <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#9A7B2A' }}>
              Gold · FD · और →
            </span>
          </div>
          <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#9A7B2A' }}>JFS</span>
        </button>
      </section>

      {/* ── Empty middle (JBIQ companion pattern) ── */}
      <div style={{ flex: 1, minHeight: '20px' }} />

      {/* ── Previous conversation indicator ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0 4px' }}>
        <button
          type="button"
          onClick={() => nav('/chat')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}
        >
          <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', fontWeight: 500, color: '#888780' }}>
            पुरानी बातचीत
          </span>
          <IcChevronUp size={14} color="#888780" />
        </button>
      </div>

      {/* ── Bottom input bar ── */}
      <BottomInputBar
        ref={inputRef}
        onSubmit={(text) => nav('/chat', { state: { seedText: text } })}
        onSpeak={() => nav('/chat')}
        onPlus={() => {}}
      />
    </div>
  );
}
