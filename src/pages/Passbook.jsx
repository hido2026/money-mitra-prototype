// मेरा हिसाब (route: /#/passbook) — REPLACES the old manual passbook.
// Auto-built from decoded documents only. NO manual entry: no amount buttons,
// no amount field, no category chips, no मिला/खर्च/आगे flow. Nothing typed.
// In-memory feed (state.docs). "भूल जाओ" removes a row — memory is the user's to clear.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCountUp, inr } from '../utils/motion';
import { JACKPOT_POINTS, JACKPOT_RUPEES, REDEEM_PARTNER, directionLabel } from '../data/decoder-samples';
import { hisaabInsights } from '../utils/insights';
import {
  IcChevronLeft, IcReceipt, IcZap, IcSmartphone, IcFileDollar, IcSparks, IcXMark, IcCamera,
} from '../components/icons/Icons';

const PURPLE = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const GREEN = '#1a7d4b';
const INK = '#2C2C2A';
const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";

function docIcon(key, size, color) {
  if (key === 'zap') return <IcZap size={size} color={color} />;
  if (key === 'phone') return <IcSmartphone size={size} color={color} />;
  if (key === 'salary') return <IcFileDollar size={size} color={color} />;
  return <IcReceipt size={size} color={color} />;
}

export default function Passbook() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const [toast, setToast] = useState(false);

  const docs = state.docs;
  const aaya = docs.filter(d => d.dir === 'in').reduce((s, d) => s + d.amount, 0);
  const gaya = docs.filter(d => d.dir === 'out').reduce((s, d) => s + d.amount, 0);
  const bache = aaya - gaya;
  const totalPoints = docs.reduce((s, d) => s + (d.points || 0), 0);

  const aC = useCountUp(aaya);
  const gC = useCountUp(gaya);
  const bC = useCountUp(bache);

  // Cumulative insight cards — recompute on every render (decode / भूल जाओ).
  const insights = hisaabInsights(docs);

  const redeem = () => { setToast(true); setTimeout(() => setToast(false), 2200); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#F6F5FB', maxWidth: '420px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px 12px', background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <button onClick={() => nav('/decoder')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label="Back">
          <IcChevronLeft size={24} color={INK} />
        </button>
        <h1 style={{ flex: 1, fontFamily: DEVA, fontSize: '18px', fontWeight: 900, color: INK, margin: 0, letterSpacing: '-0.3px' }}>मेरा हिसाब</h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Three metrics */}
        <div className="animate-fade-in" style={{ display: 'flex', gap: '10px' }}>
          <Metric label="आया" value={inr(aC)} color={GREEN} />
          <Metric label="गया" value={inr(gC)} color={PURPLE} />
          <Metric label="बचे" value={inr(bC)} color={INK} emphasised />
        </div>

        {/* कुल इनाम */}
        <div className="animate-fade-in" style={{ background: PURPLE, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', animationDelay: '60ms' }}>
          <IcSparks size={24} color="#FFD479" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 800, color: '#fff' }}>कुल इनाम — {totalPoints.toLocaleString('en-IN')} अंक</div>
            <div style={{ fontFamily: DEVA, fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>{JACKPOT_POINTS.toLocaleString('en-IN')} अंक = ₹{JACKPOT_RUPEES} · {REDEEM_PARTNER}</div>
          </div>
          <button onClick={redeem} style={{ background: '#fff', border: 'none', borderRadius: '999px', padding: '9px 18px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700, color: PURPLE, flexShrink: 0 }}>
            बदलें
          </button>
        </div>

        <p style={{ fontFamily: DEVA, fontSize: '12px', color: '#888780', margin: '0 2px', textAlign: 'center' }}>
          सब फ़ोटो से अपने आप — कोई एंट्री नहीं।
        </p>

        {/* Auto-logged feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {docs.map((d, i) => (
            <div key={d.id} className="animate-fade-in" style={{ background: '#fff', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <span style={{ width: 40, height: 40, borderRadius: '12px', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {docIcon(d.icon, 20, PURPLE)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DEVA, fontSize: '14px', fontWeight: 700, color: INK }}>{d.docType}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontFamily: DEVA, fontSize: '11px', color: '#888780' }}>{d.category}</span>
                  <span style={{ fontFamily: DEVA, fontSize: '10px', fontWeight: 700, color: d.dir === 'in' ? GREEN : PURPLE, background: d.dir === 'in' ? '#e6f5ec' : PURPLE_LIGHT, borderRadius: '999px', padding: '1px 7px' }}>{directionLabel(d.dir)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 800, color: d.dir === 'in' ? GREEN : INK }}>
                  {d.dir === 'in' ? '+' : '−'}{inr(d.amount)}
                </span>
                <button onClick={() => dispatch({ type: 'FORGET_DOC', payload: d.id })} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: DEVA, fontSize: '11px', color: '#b0adb8', padding: '2px' }}>
                  <IcXMark size={11} color="#b0adb8" /> भूल जाओ
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cumulative insight cards — each unlocks when its data condition is met */}
        {docs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {insights.map((c, i) => (
              <div key={c.id} className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', borderRadius: '14px', padding: '12px 14px', animationDelay: `${i * 50}ms` }}>
                <IcSparks size={16} color={PURPLE} />
                <span style={{ fontFamily: DEVA, fontSize: '13px', color: INK }}>{c.text}</span>
              </div>
            ))}
            <p style={{ fontFamily: DEVA, fontSize: '12px', color: '#888780', textAlign: 'center', margin: '2px 0 0' }}>
              जितनी ज़्यादा फ़ोटो, उतना साफ़ हिसाब।
            </p>
          </div>
        )}

        {docs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontFamily: DEVA, fontSize: '14px', color: '#888780', margin: 0 }}>अभी कोई कागज़ नहीं — एक फ़ोटो दिखाइए, हिसाब अपने आप बन जाएगा।</p>
            <button onClick={() => nav('/decoder', { state: { openCamera: true } })} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '12px 22px', cursor: 'pointer', fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              <IcCamera size={18} color="#fff" /> फ़ोटो दिखाओ
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast-animate" style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: INK, color: '#fff', fontFamily: DEVA, fontSize: '13px', padding: '10px 18px', borderRadius: '999px', zIndex: 500, whiteSpace: 'nowrap' }}>
          इनाम — डेमो (Reliance Retail)
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color, emphasised }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: '14px', padding: emphasised ? '14px 10px' : '12px 10px', textAlign: 'center', border: emphasised ? `1.5px solid ${PURPLE_LIGHT}` : 'none' }}>
      <div style={{ fontFamily: DEVA, fontSize: '11px', fontWeight: 600, color: '#888780', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: DEVA, fontSize: emphasised ? '18px' : '15px', fontWeight: emphasised ? 900 : 800, color, letterSpacing: '-0.3px' }}>{value}</div>
    </div>
  );
}
