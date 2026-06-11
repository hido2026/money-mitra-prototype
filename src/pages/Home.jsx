// Home — Finance hub v2.
// समझो (purple hero) + कागज़ समझें (full-width white tile) only.
// No बही / Passbook. No balance bubble. Human-face avatar (avatar.jpg) throughout.
// Mukund's bill-memory bubble replaces the old balance/goal nudge.

import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomInputBar from '../components/BottomInputBar';
import { IcBulb, IcCamera } from '../components/icons/Icons';

const AVATAR = `${import.meta.env.BASE_URL}assets/avatar.jpg`;

// Round avatar with optional presence dot
function HumanAvatar({ size = 44, presence = false, ring = false }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        background: '#EEEDFE',
        outline: ring ? '2px solid #e4dbff' : 'none',
        outlineOffset: ring ? '2px' : '0',
        boxSizing: 'border-box',
      }}>
        {err ? (
          <div style={{
            width: '100%', height: '100%', background: '#6d17ce',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: size * 0.36,
          }}>H</div>
        ) : (
          <img
            src={AVATAR}
            alt="Himen"
            loading="eager"
            onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
        )}
      </div>
      {presence && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size >= 44 ? 13 : 11,
          height: size >= 44 ? 13 : 11,
          borderRadius: '50%', background: '#25ab21',
          border: '2.5px solid #fff', boxSizing: 'border-box', zIndex: 2,
        }} />
      )}
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      background: '#f6f5fb', maxWidth: '420px', margin: '0 auto',
    }}>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px 4px' }}>

          {/* Greeting — human face */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              aria-label="Back"
              onClick={() => (window.location.href = '/')}
              style={{
                width: 36, height: 36, borderRadius: '50%', background: '#fff',
                border: 'none', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <HumanAvatar size={46} presence ring />
            <h1 style={{
              fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
              fontSize: '22px', fontWeight: 900, color: '#1a1a1a',
              margin: 0, letterSpacing: '-0.3px',
            }}>
              नमस्ते, {user.name || 'Himen'}!
            </h1>
          </div>

          {/* Mukund's bill-memory bubble */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <HumanAvatar size={36} />
            <p style={{
              background: '#f0e8fa', borderRadius: '4px 16px 16px 16px',
              padding: '12px 16px', margin: 0,
              fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
              fontSize: '14px', lineHeight: 1.6, color: '#1a1a1a', maxWidth: '85%',
            }}>
              पिछला बिजली बिल{' '}
              <span style={{ fontWeight: 700, color: '#6d17ce' }}>₹1,240</span>{' '}
              था। नया बिल आया हो तो फ़ोटो दिखाइए — बढ़ा क्यों, समझा दूँगा।
            </p>
          </div>

          {/* समझो — purple hero tile → live Mukund chat */}
          <button
            type="button"
            onClick={() => nav('/chat')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '18px', width: '100%', boxSizing: 'border-box',
              background: 'linear-gradient(135deg, #6d17ce 0%, #5a12ab 100%)',
              border: 'none', borderRadius: '20px', cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 6px 24px rgba(109,23,206,0.25)',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IcBulb size={24} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
                fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1.2,
              }}>समझो</div>
              <div style={{
                fontFamily: "'JioType',sans-serif",
                fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '3px',
              }}>पैसे कटे · सरकारी योजना · बेटी के लिए बचत</div>
              <div style={{
                fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
                fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginTop: '6px',
              }}>कुछ भी पूछो — मुकुंद बताएगा</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={20} height={20} style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* कागज़ समझें — full-width white tile */}
          <button
            type="button"
            onClick={() => nav('/decoder')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '18px', width: '100%', boxSizing: 'border-box',
              background: '#fff', border: 'none', borderRadius: '20px',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
              background: '#f0e8fa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IcCamera size={24} color="#6d17ce" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
                fontSize: '16px', fontWeight: 700, color: '#6d17ce', lineHeight: 1.2,
              }}>कागज़ समझें</div>
              <div style={{
                fontFamily: "'JioType',sans-serif",
                fontSize: '11px', color: '#888780', marginTop: '3px',
              }}>Ghar ka Munshi · Document Decoder</div>
              <div style={{
                fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
                fontSize: '13px', color: '#444', marginTop: '6px',
              }}>बिल की फ़ोटो लें — मैं समझा दूँगा</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={20} height={20} style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <p style={{
            fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
            fontSize: '12px', color: '#b0adb8', textAlign: 'center', margin: '4px 0 0',
          }}>
            और सेवाएँ — जल्द आ रही हैं
          </p>
        </div>
      </div>

      {/* Bottom chat input */}
      <BottomInputBar
        onSubmit={(text) => nav('/chat', { state: { initialMessage: text } })}
        onSpeak={() => nav('/chat', { state: { autoVoice: true } })}
        onPlus={() => nav('/decoder')}
      />
    </div>
  );
}
