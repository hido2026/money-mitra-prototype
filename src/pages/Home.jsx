// Home — default landing screen after registration.
// Shows personalised greeting + two main cards (बही + decoder).
// Fires logEvent("app_opened") on every mount.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import { useApp } from '../context/AppContext';
import { logEvent } from '../utils/analytics';
import { IcBookOpen, IcCamera } from '../components/icons/Icons';

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function Home() {
  const nav = useNavigate();
  const { state } = useApp();

  // Read user name from localStorage (set during registration)
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  // Fire app_opened on every visit (for day-2/3 return tracking)
  useEffect(() => {
    logEvent('app_opened');
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100dvh', background: '#FFFFFF',
      maxWidth: '420px', margin: '0 auto',
      padding: '0 0 24px',
    }}>
      {/* ── Header: avatar + greeting ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '28px 22px 20px',
      }}>
        <PortraitAvatar size={52} online ringed />
        <div>
          <div style={{
            fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
            fontSize: '20px', fontWeight: 700, color: '#2C2C2A', lineHeight: 1.2,
          }}>
            नमस्ते{user.name ? `, ${user.name}` : ''}!
          </div>
          <div style={{
            fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
            fontSize: '13px', color: '#5F5E5A', marginTop: '3px',
          }}>
            मुकुंद यहाँ है — पैसों में मदद के लिए
          </div>
        </div>
      </div>

      {/* ── Two main cards ── */}
      <div style={{
        padding: '4px 20px 0',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>

        {/* Card 1 — बही */}
        <button
          onClick={() => nav('/passbook')}
          style={cardStyle('#EAF3DE', '#C5E0A8')}
        >
          <div style={iconBoxStyle('#EAF3DE', '#3B6D11')}>
            <IcBookOpen size={26} color="#3B6D11" />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={cardTitleStyle('#3B6D11')}>बही</div>
            <div style={cardSubStyle}>रोज़ का हिसाब</div>
            {state.entries.length > 0 && (
              <div style={{
                fontFamily: "'JioType',sans-serif",
                fontSize: '13px', color: '#3B6D11',
                fontWeight: 600, marginTop: '4px',
              }}>
                बैलेंस: {fmt(state.balance)}
              </div>
            )}
          </div>
          <span style={{ fontSize: '20px', color: '#3B6D11', fontWeight: 700 }}>›</span>
        </button>

        {/* Card 2 — Decoder */}
        <button
          onClick={() => nav('/decoder')}
          style={cardStyle('#EEEDFE', '#C5C0F0')}
        >
          <div style={iconBoxStyle('#EEEDFE', '#534AB7')}>
            <IcCamera size={26} color="#534AB7" />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={cardTitleStyle('#534AB7')}>कागज़ समझें</div>
            <div style={cardSubStyle}>बिल या रसीद की फ़ोटो लें</div>
          </div>
          <span style={{ fontSize: '20px', color: '#534AB7', fontWeight: 700 }}>›</span>
        </button>
      </div>

      {/* ── Flexible spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Coming soon footer ── */}
      <div style={{
        textAlign: 'center', padding: '16px 20px 0',
        fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
        fontSize: '12px', color: '#C0BFBC',
      }}>
        और सेवाएँ (जल्द आ रही हैं)
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const cardStyle = (bg, borderColor) => ({
  display: 'flex', alignItems: 'center', gap: '16px',
  background: '#FFFFFF',
  border: `1.5px solid ${borderColor}`,
  borderRadius: '18px',
  padding: '18px 16px',
  cursor: 'pointer', width: '100%',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
});

const iconBoxStyle = (bg, color) => ({
  width: '54px', height: '54px', minWidth: '54px',
  borderRadius: '14px', background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
});

const cardTitleStyle = (color) => ({
  fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
  fontSize: '17px', fontWeight: 700, color, lineHeight: 1.2,
});

const cardSubStyle = {
  fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
  fontSize: '12px', color: '#888780', marginTop: '3px',
};
