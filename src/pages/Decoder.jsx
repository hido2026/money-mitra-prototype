// Decoder — कागज़ समझें (route: /#/decoder)
// 3-beat, camera-only, NO manual entry: input → (mock capture) → reading → result.
// Visual validation prototype — sample data only, no live AI / OCR / upload.
// We keep the READING (amount, who, category, in/out), never the photo.

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCountUp, inr } from '../utils/motion';
import {
  DECODE_CYCLE, JACKPOT_POINTS, JACKPOT_RUPEES, REDEEM_PARTNER, directionLabel,
} from '../data/decoder-samples';
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

  const [stage, setStage] = useState('input'); // input | capture | reading | result | blurry
  const [doc, setDoc] = useState(null);
  const idxRef = useRef(0);

  // reading → result: pick the next canned decode, log it to the हिसाब, reveal.
  useEffect(() => {
    if (stage !== 'reading') return;
    const t = setTimeout(() => {
      const base = DECODE_CYCLE[idxRef.current % DECODE_CYCLE.length];
      idxRef.current += 1;
      const d = { ...base, id: 'u' + Date.now() + '-' + idxRef.current, ts: Date.now() };
      setDoc(d);
      dispatch({ type: 'ADD_DOC', payload: d });
      setStage('result');
    }, 1400);
    return () => clearTimeout(t);
  }, [stage, dispatch]);

  // ── live हिसाब totals (from the in-memory feed) ──
  const docs = state.docs;
  const aaya = docs.filter(d => d.dir === 'in').reduce((s, d) => s + d.amount, 0);
  const gaya = docs.filter(d => d.dir === 'out').reduce((s, d) => s + d.amount, 0);
  const bache = aaya - gaya;
  const totalPoints = docs.reduce((s, d) => s + (d.points || 0), 0);

  const shownAmt = useCountUp(doc?.amount ?? 0);
  const isIn = doc?.dir === 'in';

  // ── Stage: input (single front door) ──
  const renderInput = () => (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <PortraitAvatar size={36} online={false} ringed={false} />
        <p style={{ background: PURPLE_LIGHT, borderRadius: '4px 16px 16px 16px', padding: '12px 16px', margin: 0, fontFamily: DEVA, fontSize: '14px', lineHeight: 1.6, color: INK, maxWidth: '88%' }}>
          जो भी कागज़ हो — बिल, रसीद, तनख्वाह, कमाई — फ़ोटो दिखाइए। मैं पढ़कर अपने आप हिसाब बना दूँगा।
        </p>
      </div>

      <button onClick={() => setStage('capture')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '16px', cursor: 'pointer' }}>
        <IcCamera size={22} color="#fff" />
        <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>फ़ोटो लें</span>
      </button>

      <button onClick={() => setStage('reading')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: '999px', padding: '14px', cursor: 'pointer' }}>
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
        हम आपकी फ़ोटो नहीं रखते — सिर्फ़ ज़रूरी बात याद रखते हैं।
      </div>

      <button onClick={() => setStage('blurry')} style={{ alignSelf: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: DEVA, fontSize: '11px', color: '#b0adb8', textDecoration: 'underline', padding: '4px' }}>
        डेमो: खराब फ़ोटो का हाल देखें
      </button>
    </div>
  );

  // ── Stage: capture (mock camera viewfinder — not a JDS content surface) ──
  const renderCapture = () => (
    <div className="animate-fade-in" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', background: '#161616' }}>
      <div style={{ flex: 1, position: 'relative', margin: '16px', borderRadius: '16px', overflow: 'hidden', background: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: '24px', border: '2px dashed rgba(255,255,255,0.4)', borderRadius: '12px' }} />
        <div style={{ width: '62%', transform: 'rotate(-2deg)', background: '#f3f3f3', borderRadius: '8px', padding: '14px' }}>
          <div style={{ height: '8px', background: '#d4d4d4', borderRadius: '3px', marginBottom: '8px' }} />
          <div style={{ height: '8px', width: '58%', background: '#d4d4d4', borderRadius: '3px', marginBottom: '8px' }} />
          <div style={{ height: '8px', background: '#d4d4d4', borderRadius: '3px', marginBottom: '12px' }} />
          <div style={{ height: '14px', width: '42%', background: '#bdeccd', borderRadius: '3px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
        <button onClick={() => setStage('reading')} aria-label="capture" style={{ width: '68px', height: '68px', borderRadius: '50%', border: '5px solid #777', background: '#fff', cursor: 'pointer' }} />
      </div>
    </div>
  );

  // ── Stage: reading (skeleton shimmer, never a spinner) ──
  const renderReading = () => (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} aria-busy="true" aria-label="मुकुंद पढ़ रहा है">
      <Shimmer h={28} w="55%" />
      <Shimmer h={96} />
      <div style={{ display: 'flex', gap: '10px' }}>
        <Shimmer h={32} w={32} round />
        <Shimmer h={60} grow />
      </div>
      <Shimmer h={52} />
      <p style={{ textAlign: 'center', fontFamily: DEVA, fontSize: '14px', fontWeight: 600, color: '#888780', margin: '4px 0 0' }}>मुकुंद पढ़ रहा है…</p>
    </div>
  );

  // ── Stage: result (the money moment) ──
  const renderResult = () => (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Recognition */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: 22, height: 22, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IcCheck size={13} color="#fff" />
        </span>
        <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: INK }}>पहचान लिया — {doc.docType}</span>
      </div>

      {/* 2. Amount + direction */}
      <div style={{ background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '16px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ width: 40, height: 40, borderRadius: '12px', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {docIcon(doc.icon, 22, PURPLE)}
          </span>
          <span className="animate-pop" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isIn ? '#e6f5ec' : PURPLE_LIGHT, color: isIn ? GREEN : PURPLE, borderRadius: '999px', padding: '5px 12px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700 }}>
            {directionLabel(doc.dir)}
          </span>
        </div>
        <div style={{ fontFamily: DEVA, fontSize: '34px', fontWeight: 900, color: isIn ? GREEN : INK, letterSpacing: '-0.5px' }}>
          {isIn ? '+' : ''}{inr(shownAmt)}
        </div>
        <div style={{ marginTop: '8px', display: 'inline-block', background: '#F5F4FA', borderRadius: '999px', padding: '5px 12px', fontFamily: DEVA, fontSize: '12px', fontWeight: 600, color: '#5F5E5A' }}>
          अपने आप: {doc.category}
        </div>
      </div>

      {/* 3. Reward (earned, NOT a lottery) */}
      <div className="animate-pop" style={{ background: PURPLE, borderRadius: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IcSparks size={20} color="#FFD479" />
          <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 800, color: '#fff' }}>इनाम — {doc.points} अंक मिले!</span>
        </div>
        <div style={{ marginTop: '12px', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '999px', background: '#FFD479', transformOrigin: 'left', transform: `scaleX(${Math.min(totalPoints, JACKPOT_POINTS) / JACKPOT_POINTS})`, transition: 'transform 500ms ease-out' }} />
        </div>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontFamily: DEVA, fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
          <span>{Math.min(totalPoints, JACKPOT_POINTS)} / {JACKPOT_POINTS.toLocaleString('en-IN')} अंक</span>
          <span>{JACKPOT_POINTS.toLocaleString('en-IN')} अंक = ₹{JACKPOT_RUPEES} · {REDEEM_PARTNER} पर</span>
        </div>
      </div>

      {/* 4. Insight (supportive, no advice) + सुनें */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <PortraitAvatar size={32} online={false} ringed={false} />
        <div>
          <p style={{ background: PURPLE_LIGHT, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', margin: 0, fontFamily: DEVA, fontSize: '14px', lineHeight: 1.55, color: INK }}>
            {doc.insight}
          </p>
          <button onClick={() => speakMukund(doc.insight)} style={{ marginTop: '4px', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700, color: '#888780', padding: '2px 4px' }}>
            <IcSparks size={13} color="#888780" /> सुनें
          </button>
        </div>
      </div>

      {/* 5. Auto-log confirmation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: DEVA, fontSize: '12px', color: GREEN }}>
        <IcCheck size={14} color={GREEN} /> अपने आप हिसाब में जुड़ गया
      </div>

      {/* 6. Tappable हिसाब strip */}
      <button onClick={() => nav('/passbook')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box', background: '#F5F4FA', border: 'none', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ flex: 1, fontFamily: DEVA, fontSize: '13px', fontWeight: 600, color: INK }}>
          मेरा हिसाब · आया <span style={{ color: GREEN }}>{inr(aaya)}</span> · गया <span style={{ color: PURPLE }}>{inr(gaya)}</span> · बचे <span style={{ fontWeight: 800 }}>{inr(bache)}</span>
        </span>
        <ChevronRight color={PURPLE} />
      </button>

      {/* 7. Loop */}
      <button onClick={() => { setStage('input'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '16px', cursor: 'pointer' }}>
        <IcCamera size={20} color="#fff" />
        <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>एक और फ़ोटो दिखाओ</span>
      </button>
    </div>
  );

  // ── Stage: blurry / bad photo fallback ──
  const renderBlurry = () => (
    <div className="animate-fade-in" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#FDECEC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcCamera size={28} color="#fa2f40" />
      </span>
      <p style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: INK, margin: 0 }}>कागज़ साफ़ नहीं दिखा — दुबारा दिखाइए?</p>
      <p style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A', margin: 0, lineHeight: 1.5 }}>साफ़ रोशनी में, पूरा कागज़ फ्रेम के अंदर रखें।</p>
      <button onClick={() => setStage('capture')} style={{ background: PURPLE, border: 'none', borderRadius: '999px', padding: '13px 28px', cursor: 'pointer', fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
        दुबारा दिखाइए
      </button>
    </div>
  );

  const showHeader = stage !== 'capture';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fff', maxWidth: '420px', margin: '0 auto' }}>
      {showHeader && (
        <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <button onClick={() => (stage === 'input' ? nav('/') : setStage('input'))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label="Back">
            <IcChevronLeft size={24} color={INK} />
          </button>
          <PortraitAvatar size={36} online ringed />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '15px', fontWeight: 700, color: INK }}>कागज़ समझें</div>
            <div style={{ fontFamily: DEVA, fontSize: '11px', color: '#5F5E5A' }}>मुकुंद · पढ़कर हिसाब बनाता है</div>
          </div>
        </header>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {stage === 'input' && renderInput()}
        {stage === 'capture' && renderCapture()}
        {stage === 'reading' && renderReading()}
        {stage === 'result' && doc && renderResult()}
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
