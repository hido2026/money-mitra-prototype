// Home — default landing screen.
// Layout (top → bottom):
//   1. Avatar + "नमस्ते {name}"
//   2. Morning summary bubble (if data exists, else default subtitle)
//   3. Pattern insight bubble (if pattern found this session)
//   4. Two cards side by side: बही | कागज़ समझें
//   5. Muted footer

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import { useApp } from '../context/AppContext';
import { logEvent } from '../utils/analytics';
import { computeMorningSummary } from '../engine/summary';
import { computePattern, recordPatternShown } from '../engine/patterns';
import { IcBookOpen, IcCamera } from '../components/icons/Icons';

// ── Sub-components ─────────────────────────────────────────────────────────────

function MukundBubble({ text, bg = '#EEEDFE', prefix = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <PortraitAvatar size={32} online={false} ringed={false} />
      <div style={{
        background: bg,
        borderRadius: '4px 16px 16px 16px',
        padding: '12px 14px',
        fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
        fontSize: '14px', lineHeight: 1.55, color: '#2C2C2A', flex: 1,
      }}>
        {prefix && <span style={{ marginRight: '5px' }}>{prefix}</span>}
        {text}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const nav = useNavigate();
  const { state } = useApp();
  const { entries, goals, balance } = state;

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  // ── Morning summary ─────────────────────────────────────────────────────────
  const summary = useMemo(
    () => computeMorningSummary(entries, goals, balance),
    [entries, goals, balance],
  );

  useEffect(() => {
    logEvent('app_opened');
  }, []);

  useEffect(() => {
    if (summary) logEvent('summary_seen');
  }, [summary]);

  // ── Pattern detection (max one per session) ─────────────────────────────────
  const [pattern, setPattern] = useState(null);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('pattern_shown_this_session');
    if (alreadyShown) return;

    const result = computePattern(entries, goals, balance);
    if (result) {
      setPattern(result);
      sessionStorage.setItem('pattern_shown_this_session', result.type);
      recordPatternShown(result.type);
      logEvent('pattern_shown');
    }
  }, [entries, goal]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100dvh', background: '#FFFFFF',
      maxWidth: '420px', margin: '0 auto',
      padding: '0 0 28px',
    }}>

      {/* 1 — Greeting row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '28px 22px 16px',
      }}>
        <PortraitAvatar size={48} online ringed />
        <div style={{
          fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
          fontSize: '20px', fontWeight: 700, color: '#2C2C2A', lineHeight: 1.25,
        }}>
          नमस्ते{user.name ? `, ${user.name}` : ''}!
        </div>
      </div>

      {/* 2 — Morning summary bubble */}
      <div style={{ padding: '0 20px 12px' }}>
        <MukundBubble
          text={summary ?? 'मुकुंद यहाँ है — पैसों में मदद के लिए।'}
          bg="#EEEDFE"
        />
      </div>

      {/* 3 — Pattern insight bubble (only if found this session) */}
      {pattern && (
        <div style={{ padding: '0 20px 14px' }}>
          <MukundBubble
            text={pattern.text}
            bg="#FFFBEA"
            prefix="💡"
          />
        </div>
      )}

      {/* 4 — Two cards side by side */}
      <div style={{ display: 'flex', gap: '12px', padding: '0 20px' }}>

        {/* बही */}
        <button
          onClick={() => nav('/passbook')}
          style={cardStyle('#EAF3DE', '#3B6D11')}
        >
          <div style={iconBox('#EAF3DE')}>
            <IcBookOpen size={22} color="#3B6D11" />
          </div>
          <div style={cardTitle('#3B6D11')}>बही</div>
          <div style={cardSub}>रोज़ का हिसाब</div>
          {entries.length > 0 && (
            <div style={{
              fontFamily: "'JioType',sans-serif",
              fontSize: '13px',
              color: balance < 0 ? '#D85A30' : '#3B6D11',
              fontWeight: 700, marginTop: '8px',
            }}>
              {balance < 0 ? '-' : ''}₹{Math.abs(Math.round(balance)).toLocaleString('en-IN')}
            </div>
          )}
        </button>

        {/* कागज़ समझें */}
        <button
          onClick={() => nav('/decoder')}
          style={cardStyle('#EEEDFE', '#534AB7')}
        >
          <div style={iconBox('#EEEDFE')}>
            <IcCamera size={22} color="#534AB7" />
          </div>
          <div style={cardTitle('#534AB7')}>कागज़ समझें</div>
          <div style={cardSub}>बिल की फ़ोटो लें</div>
        </button>

      </div>

      {/* Flexible spacer */}
      <div style={{ flex: 1 }} />

      {/* 5 — Coming soon footer */}
      <div style={{
        textAlign: 'center', padding: '0 20px',
        fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
        fontSize: '12px', color: '#C0BFBC',
      }}>
        और सेवाएँ (जल्द आ रही हैं)
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const cardStyle = (borderColor, _accent) => ({
  flex: 1,
  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
  padding: '16px 14px', background: '#FFFFFF',
  border: `1.5px solid ${borderColor}`,
  borderRadius: '18px', cursor: 'pointer', textAlign: 'left',
  minHeight: '120px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
});

const iconBox = (bg) => ({
  width: '40px', height: '40px', borderRadius: '12px',
  background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: '10px',
});

const cardTitle = (color) => ({
  fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
  fontSize: '15px', fontWeight: 700, color, lineHeight: 1.2,
});

const cardSub = {
  fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
  fontSize: '11px', color: '#888780', marginTop: '3px',
};
