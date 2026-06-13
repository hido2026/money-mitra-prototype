// Decoder — कागज़ समझें (route: /#/decoder)
// REAL & grounded (v2): reads the actual uploaded image/PDF via a vision model,
// renders STRICTLY from the extracted JSON. No invented numbers; null → nothing.
// Camera-only, no manual entry. हिसाब accumulates real decodes (in-memory).

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCountUp, inr } from '../utils/motion';
import { JACKPOT_POINTS, JACKPOT_RUPEES, REDEEM_PARTNER, directionLabel } from '../data/decoder-samples';
import { extractFromFile, insightFor, docLabel, iconFor } from '../utils/extract';
import { speakMukund } from '../utils/tts';
import PortraitAvatar from '../components/PortraitAvatar';
import {
  IcChevronLeft, IcCamera, IcFileText, IcCheck,
  IcReceipt, IcZap, IcSmartphone, IcFileDollar, IcSparks,
} from '../components/icons/Icons';

const PURPLE = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const GREEN = '#1a7d4b';
const INK = '#2C2C2A';
const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const REWARD_POINTS = 100;       // fixed, earned per real readable decode
const LOW_CONF = 0.6;

function docIcon(key, size, color) {
  if (key === 'zap') return <IcZap size={size} color={color} />;
  if (key === 'phone') return <IcSmartphone size={size} color={color} />;
  if (key === 'salary') return <IcFileDollar size={size} color={color} />;
  return <IcReceipt size={size} color={color} />;
}

const ChevronRight = ({ size = 18, color = '#aaa' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function Decoder() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();

  const [stage, setStage] = useState('input'); // input | reading | result | blurry
  const [data, setData] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const addedRef = useRef(false);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  // ── live हिसाब totals (from the real in-memory feed) ──
  const docs = state.docs;
  const aaya = docs.filter(d => d.dir === 'in').reduce((s, d) => s + d.amount, 0);
  const gaya = docs.filter(d => d.dir === 'out').reduce((s, d) => s + d.amount, 0);
  const bache = aaya - gaya;
  const totalPoints = docs.reduce((s, d) => s + (d.points || 0), 0);

  const shownAmt = useCountUp(data?.amount ?? 0);

  // Log a resolved, real decode to the हिसाब exactly once.
  const logDecode = (d) => {
    if (addedRef.current || !d.amount || d.direction === 'ambiguous') return;
    addedRef.current = true;
    dispatch({ type: 'ADD_DOC', payload: {
      id: 'u' + Date.now(), docType: docLabel(d.docType), category: d.category || 'अन्य',
      dir: d.direction, amount: d.amount, points: REWARD_POINTS, icon: iconFor(d.docType),
    }});
  };

  const handleFile = async (file) => {
    if (!file) return;
    setData(null); setConfirmed(false); addedRef.current = false;
    setStage('reading');
    try {
      const d = await extractFromFile(file);
      if (!d.readable) { setStage('blurry'); return; }
      setData(d);
      setStage('result');
      logDecode(d); // logs only if amount present AND direction resolved
    } catch (err) {
      console.warn('[decode] failed:', err?.message || err);
      setStage('blurry');
    }
  };

  const onPick = (e) => { handleFile(e.target.files?.[0] ?? null); e.target.value = ''; };

  const resolveDirection = (dir) => {
    const d = { ...data, direction: dir };
    setData(d);
    logDecode(d);
  };

  const reset = () => { setStage('input'); setData(null); setConfirmed(false); addedRef.current = false; };

  // ── Stage: input ──
  const renderInput = () => (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <PortraitAvatar size={36} online={false} ringed={false} />
        <p style={{ background: PURPLE_LIGHT, borderRadius: '4px 16px 16px 16px', padding: '12px 16px', margin: 0, fontFamily: DEVA, fontSize: '14px', lineHeight: 1.6, color: INK, maxWidth: '88%' }}>
          जो भी कागज़ हो — बिल, रसीद, तनख्वाह, कमाई — फ़ोटो दिखाइए। मैं पढ़कर अपने आप हिसाब बना दूँगा।
        </p>
      </div>

      <button onClick={() => cameraRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '16px', cursor: 'pointer' }}>
        <IcCamera size={22} color="#fff" />
        <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>फ़ोटो लें</span>
      </button>

      <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: '999px', padding: '14px', cursor: 'pointer' }}>
        <IcFileText size={18} color={PURPLE} />
        <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 600, color: PURPLE }}>फ़ाइल या PDF चुनें</span>
      </button>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: DEVA, fontSize: '12px', color: '#888780' }}>मैं पढ़ सकता हूँ —</span>
        {['बिजली बिल', 'रसीद', 'तनख्वाह पर्ची', 'कमाई स्क्रीन'].map(c => (
          <span key={c} style={{ background: '#F5F4FA', borderRadius: '999px', padding: '5px 12px', fontFamily: DEVA, fontSize: '12px', fontWeight: 600, color: PURPLE }}>{c}</span>
        ))}
      </div>

      <div style={{ background: '#F5F4FA', borderRadius: '10px', padding: '10px 14px', fontFamily: DEVA, fontSize: '12px', color: '#5F5E5A', lineHeight: 1.5 }}>
        हम आपकी फ़ोटो नहीं रखते — पढ़ने के बाद सिर्फ़ ज़रूरी बात याद रखते हैं।
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*,.pdf,application/pdf" onChange={onPick} style={{ display: 'none' }} />
    </div>
  );

  // ── Stage: reading (skeleton shimmer) ──
  const renderReading = () => (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} aria-busy="true" aria-label="मुकुंद पढ़ रहा है">
      <Shimmer h={28} w="55%" />
      <Shimmer h={120} />
      <div style={{ display: 'flex', gap: '10px' }}>
        <Shimmer h={32} w={32} round />
        <Shimmer h={56} grow />
      </div>
      <p style={{ textAlign: 'center', fontFamily: DEVA, fontSize: '14px', fontWeight: 600, color: '#888780', margin: '4px 0 0' }}>मुकुंद पढ़ रहा है…</p>
    </div>
  );

  // ── Stage: result (render strictly from extracted data) ──
  const renderResult = () => {
    const isIn = data.direction === 'in';
    const ambiguous = data.direction === 'ambiguous';
    const lowConf = !ambiguous && data.amount && data.confidence < LOW_CONF && !confirmed;
    const logged = !ambiguous && !!data.amount;

    return (
      <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* 1. Recognition — merchant or doc type (only what was read) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcCheck size={13} color="#fff" />
          </span>
          <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: INK }}>
            पहचान लिया — {data.merchant || docLabel(data.docType)}
          </span>
        </div>

        {/* 2. Amount + direction (rendered only from extracted fields) */}
        <div style={{ background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '16px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: data.amount ? '8px' : 0 }}>
            <span style={{ width: 40, height: 40, borderRadius: '12px', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {docIcon(iconFor(data.docType), 22, PURPLE)}
            </span>
            {!ambiguous && (
              <span className="animate-pop" style={{ display: 'inline-flex', alignItems: 'center', background: isIn ? '#e6f5ec' : PURPLE_LIGHT, color: isIn ? GREEN : PURPLE, borderRadius: '999px', padding: '5px 12px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700 }}>
                {directionLabel(data.direction)}
              </span>
            )}
          </div>

          {data.amount ? (
            <div style={{ fontFamily: DEVA, fontSize: '34px', fontWeight: 900, color: isIn ? GREEN : INK, letterSpacing: '-0.5px' }}>
              {isIn ? '+' : ''}{inr(shownAmt)}
            </div>
          ) : (
            <div style={{ fontFamily: DEVA, fontSize: '14px', color: '#888780' }}>रकम साफ़ नहीं पढ़ पाया।</div>
          )}

          {data.category && (
            <div style={{ marginTop: '8px', display: 'inline-block', background: '#F5F4FA', borderRadius: '999px', padding: '5px 12px', fontFamily: DEVA, fontSize: '12px', fontWeight: 600, color: '#5F5E5A' }}>
              अपने आप: {data.category}
            </div>
          )}

          {/* low-confidence confirm */}
          {lowConf && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A' }}>सही है?</span>
              <button onClick={() => setConfirmed(true)} style={{ background: GREEN, border: 'none', borderRadius: '999px', padding: '6px 16px', cursor: 'pointer', fontFamily: DEVA, fontSize: '13px', fontWeight: 700, color: '#fff' }}>हाँ</button>
              <button onClick={reset} style={{ background: '#fff', border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: '999px', padding: '6px 16px', cursor: 'pointer', fontFamily: DEVA, fontSize: '13px', fontWeight: 700, color: PURPLE }}>दुबारा दिखाएँ</button>
            </div>
          )}
        </div>

        {/* ambiguous → one plain question (two taps, no typing) */}
        {ambiguous && (
          <div style={{ background: '#FFFBEA', border: '1px solid #F2E2A8', borderRadius: '16px', padding: '16px' }}>
            <p style={{ margin: '0 0 12px', fontFamily: DEVA, fontSize: '14px', fontWeight: 600, color: INK }}>यह आपको मिला पैसा है, या आपने दिया?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => resolveDirection('in')} style={{ flex: 1, background: '#e6f5ec', color: GREEN, border: 'none', borderRadius: '999px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700 }}>मिला (आया)</button>
              <button onClick={() => resolveDirection('out')} style={{ flex: 1, background: PURPLE_LIGHT, color: PURPLE, border: 'none', borderRadius: '999px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700 }}>दिया (गया)</button>
            </div>
          </div>
        )}

        {/* 3. Reward — only on a real, readable, resolved decode */}
        {logged && (
          <div className="animate-pop" style={{ background: PURPLE, borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IcSparks size={20} color="#FFD479" />
              <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 800, color: '#fff' }}>इनाम — {REWARD_POINTS} अंक मिले!</span>
            </div>
            <div style={{ marginTop: '12px', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '999px', background: '#FFD479', transformOrigin: 'left', transform: `scaleX(${Math.min(totalPoints, JACKPOT_POINTS) / JACKPOT_POINTS})`, transition: 'transform 500ms ease-out' }} />
            </div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontFamily: DEVA, fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
              <span>{Math.min(totalPoints, JACKPOT_POINTS)} / {JACKPOT_POINTS.toLocaleString('en-IN')} अंक</span>
              <span>{JACKPOT_POINTS.toLocaleString('en-IN')} अंक = ₹{JACKPOT_RUPEES} · {REDEEM_PARTNER}</span>
            </div>
          </div>
        )}

        {/* 4. Insight (grounded, no advice) + सुनें */}
        {!ambiguous && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <PortraitAvatar size={32} online={false} ringed={false} />
            <div>
              <p style={{ background: PURPLE_LIGHT, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', margin: 0, fontFamily: DEVA, fontSize: '14px', lineHeight: 1.55, color: INK }}>
                {insightFor(data)}
              </p>
              <button onClick={() => speakMukund(insightFor(data))} style={{ marginTop: '4px', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700, color: '#888780', padding: '2px 4px' }}>
                <IcSparks size={13} color="#888780" /> सुनें
              </button>
            </div>
          </div>
        )}

        {/* 5. Auto-log confirmation */}
        {logged && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: DEVA, fontSize: '12px', color: GREEN }}>
            <IcCheck size={14} color={GREEN} /> अपने आप हिसाब में जुड़ गया
          </div>
        )}

        {/* 6. Tappable हिसाब strip */}
        {docs.length > 0 && (
          <button onClick={() => nav('/passbook')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box', background: '#F5F4FA', border: 'none', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ flex: 1, fontFamily: DEVA, fontSize: '13px', fontWeight: 600, color: INK }}>
              मेरा हिसाब · आया <span style={{ color: GREEN }}>{inr(aaya)}</span> · गया <span style={{ color: PURPLE }}>{inr(gaya)}</span> · बचे <span style={{ fontWeight: 800 }}>{inr(bache)}</span>
            </span>
            <ChevronRight color={PURPLE} />
          </button>
        )}

        {/* 7. Loop */}
        <button onClick={reset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '16px', cursor: 'pointer' }}>
          <IcCamera size={20} color="#fff" />
          <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>एक और फ़ोटो दिखाओ</span>
        </button>
      </div>
    );
  };

  // ── Stage: blurry / unreadable fallback ──
  const renderBlurry = () => (
    <div className="animate-fade-in" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#FDECEC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcCamera size={28} color="#fa2f40" />
      </span>
      <p style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: INK, margin: 0 }}>कागज़ साफ़ नहीं दिखा — दुबारा दिखाइए?</p>
      <p style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A', margin: 0, lineHeight: 1.5 }}>साफ़ रोशनी में, पूरा कागज़ फ्रेम के अंदर रखें।</p>
      <button onClick={reset} style={{ background: PURPLE, border: 'none', borderRadius: '999px', padding: '13px 28px', cursor: 'pointer', fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
        दुबारा दिखाइए
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fff', maxWidth: '420px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <button onClick={() => (stage === 'input' ? nav('/') : reset())} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label="Back">
          <IcChevronLeft size={24} color={INK} />
        </button>
        <PortraitAvatar size={36} online ringed />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '15px', fontWeight: 700, color: INK }}>कागज़ समझें</div>
          <div style={{ fontFamily: DEVA, fontSize: '11px', color: '#5F5E5A' }}>मुकुंद · पढ़कर हिसाब बनाता है</div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {stage === 'input' && renderInput()}
        {stage === 'reading' && renderReading()}
        {stage === 'result' && data && renderResult()}
        {stage === 'blurry' && renderBlurry()}
      </div>
    </div>
  );
}

function Shimmer({ h, w = '100%', round = false, grow = false }) {
  return (
    <div className="mm-shimmer" style={{ height: h, width: round ? h : w, flex: grow ? 1 : undefined, borderRadius: round ? '50%' : '12px', background: '#ECEAF5' }} />
  );
}
