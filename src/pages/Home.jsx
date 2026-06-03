// Home — two tools only: Ghar ka Munshi (Decoder) + बही (Passbook).
// Products NOT on home — per brief B: reveal only after habit forms.
// Tap Mukund portrait 5× to open dev panel.

import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import DevPanel from '../components/DevPanel';
import { useApp } from '../context/AppContext';
import { Events } from '../engine/instrumentation';
import { computeMorningSummary } from '../engine/summary';
import { computeInsight } from '../engine/insights';
import { IcBookOpen, IcCamera } from '../components/icons/Icons';
import { VOICE_CONFIG } from '../config/app-config';

const f = n => (n < 0 ? '-' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');

export default function Home() {
  const nav = useNavigate();
  const { state } = useApp();
  const { entries, goals, balance } = state;

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const summary = useMemo(() => computeMorningSummary(entries, goals, balance), [entries, goals, balance]);

  // Pattern insight on home
  const [pattern, setPattern] = useState(null);
  useEffect(() => {
    if (sessionStorage.getItem('pattern_shown')) return;
    const result = computeInsight(state, null);
    if (result) {
      setPattern(result);
      sessionStorage.setItem('pattern_shown', result.type);
    }
  }, [entries, goals]);

  // Dev panel: tap portrait 5×
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const [showDev, setShowDev] = useState(false);
  const onPortraitTap = () => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1200);
    if (tapCount.current >= 5) { tapCount.current = 0; setShowDev(true); }
  };

  useEffect(() => {
    Events.appOpened({ flow: 'home' });
    if (summary) Events.summarySeen({ flow: 'home' });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFFFFF', maxWidth: '420px', margin: '0 auto', padding: '0 0 28px' }}>
      {showDev && <DevPanel onClose={() => setShowDev(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '28px 22px 16px' }}>
        <div onClick={onPortraitTap} style={{ cursor: 'default' }}>
          <PortraitAvatar size={48} online ringed />
        </div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '20px', fontWeight: 700, color: '#2C2C2A', lineHeight: 1.25 }}>
          नमस्ते{user.name ? `, ${user.name}` : ''}!
        </div>
      </div>

      {/* Morning summary bubble */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <PortraitAvatar size={32} online={false} ringed={false} />
          <div style={{ background: '#EEEDFE', borderRadius: '4px 16px 16px 16px', padding: '12px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.55, color: '#2C2C2A', flex: 1 }}>
            {summary ?? `${VOICE_CONFIG.persona_name} यहाँ है — पैसों में मदद के लिए।`}
          </div>
        </div>
      </div>

      {/* Pattern insight bubble */}
      {pattern && (
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <PortraitAvatar size={32} online={false} ringed={false} />
            <div style={{ background: '#FFFBEA', borderRadius: '4px 16px 16px 16px', padding: '12px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.55, color: '#2C2C2A', flex: 1 }}>
              💡 {pattern.text}
            </div>
          </div>
        </div>
      )}

      {/* Two cards */}
      <div style={{ display: 'flex', gap: '12px', padding: '0 20px' }}>
        <button onClick={() => nav('/decoder')} style={cardStyle('#EEEDFE')}>
          <div style={iconBox('#EEEDFE')}><IcCamera size={22} color="#534AB7" /></div>
          <div style={cardTitle('#534AB7')}>कागज़ समझें</div>
          <div style={cardSub}>Ghar ka Munshi</div>
          <div style={cardHint}>बिल की फ़ोटो लें</div>
        </button>

        <button onClick={() => nav('/passbook')} style={cardStyle('#EAF3DE')}>
          <div style={iconBox('#EAF3DE')}><IcBookOpen size={22} color="#3B6D11" /></div>
          <div style={cardTitle('#3B6D11')}>बही</div>
          <div style={cardSub}>Money Passbook</div>
          {entries.length > 0 && (
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '13px', color: balance < 0 ? '#D85A30' : '#3B6D11', fontWeight: 700, marginTop: '6px' }}>
              {f(balance)}
            </div>
          )}
        </button>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'center', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#C0BFBC' }}>
        और सेवाएँ — जल्द आ रही हैं
      </div>
    </div>
  );
}

const cardStyle = (border) => ({
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
  padding: '16px 14px', background: '#FFFFFF', border: `1.5px solid ${border}`,
  borderRadius: '18px', cursor: 'pointer', textAlign: 'left', minHeight: '120px',
});
const iconBox = (bg) => ({ width: '40px', height: '40px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' });
const cardTitle = (c) => ({ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 700, color: c, lineHeight: 1.2 });
const cardSub  = { fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', marginTop: '2px' };
const cardHint = { fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '11px', color: '#888780', marginTop: '4px' };
