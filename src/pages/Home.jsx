// Home — two tools only: Ghar ka Munshi (Decoder) + बही (Passbook).
// Products NOT on home — per brief B: reveal only after habit forms.
// Tap Mukund portrait 5× to open dev panel.

import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import DevPanel from '../components/DevPanel';
import { useApp } from '../context/AppContext';
import { Events, logEvent } from '../engine/instrumentation';
import { computeMorningSummary } from '../engine/summary';
import { computeInsight } from '../engine/insights';
import { IcBookOpen, IcCamera, IcBulb } from '../components/icons/Icons';
import { VOICE_CONFIG } from '../config/app-config';
import { speakMukund } from '../utils/tts';

const f = n => (n < 0 ? '-' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');

export default function Home() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const { entries, goals, balance } = state;

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const summary = useMemo(() => computeMorningSummary(entries, goals, balance), [entries, goals, balance]);

  // Pattern insight — derived value, computed synchronously on every render.
  // useMemo (not useState+useEffect) so it is NEVER null after a navigation remount:
  //   - useState resets to null on remount; effect fires async → bubble disappears briefly
  //   - useMemo runs synchronously before paint, always reflects current state
  // Deps include sessionDecodes so a fresh decode on return also updates the bubble.
  const pattern = useMemo(
    () => computeInsight(state, null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, goals, balance, state.sessionDecodes],
  );

  // Analytics — fire once per distinct insight type shown, not on every render.
  const lastLoggedType = useRef(null);
  useEffect(() => {
    if (!pattern || pattern.type === lastLoggedType.current) return;
    lastLoggedType.current = pattern.type;
    if (pattern.type === 'goal_pacing') {
      logEvent('goal_pacing_insight_shown', { flow: 'home', had_goal: true });
    } else if (pattern.type === 'biggest_mover') {
      logEvent('spending_pattern_insight_shown', { flow: 'home', had_goal: pattern.had_goal });
    } else {
      logEvent('insight_shown', { flow: 'home', insight_type: pattern.type, had_goal: pattern.had_goal });
    }
  }, [pattern]);

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
      {showDev && <DevPanel onClose={() => setShowDev(false)} dispatch={dispatch} />}

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
          <div style={{ flex: 1 }}>
            <div style={{ background: '#EEEDFE', borderRadius: '4px 16px 16px 16px', padding: '12px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.55, color: '#2C2C2A' }}>
              {summary ?? `${VOICE_CONFIG.persona_name} यहाँ है — पैसों में मदद के लिए।`}
            </div>
            {summary && <button onClick={() => speakMukund(summary)} style={{ marginTop: '4px', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#888780', padding: '2px 6px', borderRadius: '6px' }}>🔊 सुनिए</button>}
          </div>
        </div>
      </div>

      {/* Pattern insight bubble */}
      {pattern && (
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <PortraitAvatar size={32} online={false} ringed={false} />
            <div style={{ flex: 1 }}>
              <div style={{ background: '#FFFBEA', borderRadius: '4px 16px 16px 16px', padding: '12px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.55, color: '#2C2C2A' }}>
                💡 {pattern.text}
              </div>
              <button onClick={() => speakMukund(pattern.text)} style={{ marginTop: '4px', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#888780', padding: '2px 6px', borderRadius: '6px' }}>🔊 सुनिए</button>
            </div>
          </div>
        </div>
      )}

      {/* ── समझो hero card (full-width) ── */}
      <div style={{ padding: '0 20px 12px' }}>
        <button onClick={() => nav('/samjho-entry')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 18px', background: '#EEEDFE',
          border: '1.5px solid #D5D1FA', borderRadius: '18px',
          cursor: 'pointer', textAlign: 'left',
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcBulb size={22} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#534AB7', lineHeight: 1.2 }}>समझो</div>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#7B72D4', marginTop: '1px' }}>SIP · Scheme · Fraud · PMSBY</div>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#534AB7', marginTop: '4px', opacity: 0.8 }}>कुछ भी पूछो — मुकुंद समझाएगा</div>
          </div>
          <div style={{ flexShrink: 0, fontFamily: "'JioType',sans-serif", fontSize: '18px', color: '#7B72D4' }}>›</div>
        </button>
      </div>

      {/* ── कागज़ समझें + बही (secondary row) ── */}
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
