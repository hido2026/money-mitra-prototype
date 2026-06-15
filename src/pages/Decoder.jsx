// Decoder — कागज़ समझें (route: /#/decoder)
// VOICE-FIRST chat (v4): reads ANY real financial paper via a vision model and
// replies as Mukund in short bubbles that AUTO-SPEAK (Sarvam hi-IN). Renders
// STRICTLY from extracted JSON + computed insights — no invented numbers.
// No manual entry. हिसाब accumulates real decodes (in-memory).

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCountUp, inr } from '../utils/motion';
import { JACKPOT_POINTS, directionLabel } from '../data/decoder-samples';
import { extractFromFile, docLabel, docIconKey } from '../utils/extract';
import { awardPoints, REWARDS_CFG } from '../utils/rewards';
import { insightEngine } from '../utils/insights';
import { speakMukund } from '../utils/tts';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import {
  IcChevronLeft, IcCamera, IcFileText, IcCheck, IcShield,
  IcReceipt, IcZap, IcSmartphone, IcFileDollar, IcSparks,
} from '../components/icons/Icons';

// seenTypes persists across decodes in the session (for variety/first-of-type bonuses)
const _seenTypes = new Set();

const PURPLE = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const GREEN = '#1a7d4b';
const INK = '#2C2C2A';
const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const LOW_CONF = 0.6;

const INTRO = 'कोई भी कागज़ जो समझ न आए या परेशान करे — बिल, बैंक नोटिस, मैसेज, पर्ची — दिखाइए। मैं आसान भाषा में समझा दूँगा।';

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

// The spoken/printed recognition line (real doc + total; never "कागज़" when avoidable).
function recogText(d) {
  const who = d.merchant || docLabel(d.docType);
  if (!d.amount) return `यह ${who} है।`;
  return d.direction === 'in' ? `यह ${who} है — ${inr(d.amount)} मिले।` : `यह ${who} है — कुल ${inr(d.amount)}।`;
}

function Bubble({ children, delay = 0 }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', animationDelay: `${delay}ms` }}>
      <PortraitAvatar size={32} online={false} ringed={false} />
      <div style={{ background: PURPLE_LIGHT, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', fontFamily: DEVA, fontSize: '14px', lineHeight: 1.55, color: INK, maxWidth: '85%' }}>
        {children}
      </div>
    </div>
  );
}

export default function Decoder() {
  const nav = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();

  const [stage, setStage] = useState('input'); // input | reading | result | blurry | error
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [insightLine, setInsightLine] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [reward, setReward] = useState(null); // { total, reasons }
  const addedRef = useRef(false);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);
  const introSpokenRef = useRef(false);
  const camOpenedRef = useRef(false);

  const docs = state.docs;
  const aaya = docs.filter(d => d.dir === 'in').reduce((s, d) => s + d.amount, 0);
  const gaya = docs.filter(d => d.dir === 'out').reduce((s, d) => s + d.amount, 0);
  const bache = aaya - gaya;
  const totalPoints = docs.reduce((s, d) => s + (d.points || 0), 0);

  const shownAmt = useCountUp(data?.amount ?? 0);

  // Auto-speak the intro once when the screen first opens.
  useEffect(() => {
    if (stage === 'input' && !introSpokenRef.current) {
      introSpokenRef.current = true;
      setSpeaking(true);
      speakMukund(INTRO, () => setSpeaking(false));
    }
  }, [stage]);

  // Opened from मेरा हिसाब's "फ़ोटो दिखाओ" → open the camera straight away.
  useEffect(() => {
    if (location.state?.openCamera && !camOpenedRef.current) {
      camOpenedRef.current = true;
      const t = setTimeout(() => cameraRef.current?.click(), 200);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  // Finalize a resolved decode: compute the grounded insight (from PRIOR entries),
  // auto-speak recognition → insight, then log it to the हिसाब once (real amount only).
  const finalize = (d) => {
    if (d.direction === 'ambiguous') return;
    const line = insightEngine(d, state.docs);
    setInsightLine(line);
    setSpeaking(true);
    speakMukund(recogText(d), () => speakMukund(line, () => setSpeaking(false)));
    const safety = setTimeout(() => setSpeaking(false), 16000);
    void safety;
    if (d.amount && !addedRef.current) {
      addedRef.current = true;
      // A1: use the specific docType title; fall back to category only for truly unknown docs
      const title = docLabel(d.docType) !== 'कागज़'
        ? docLabel(d.docType)
        : (d.category && d.category !== 'अन्य' ? d.category : 'कागज़');
      const hasIncome = state.docs.some(e => e.dir === 'in' && !e.borrowed);
      const hasExpense = state.docs.some(e => e.dir === 'out');
      const earned = awardPoints('doc_captured', {
        seenTypes: _seenTypes, docType: d.docType,
        hasIncome: hasIncome || (d.direction === 'in' && !d.borrowed),
        hasExpense: hasExpense || d.direction === 'out',
      });
      setReward(earned);
      dispatch({ type: 'ADD_DOC', payload: {
        id: 'u' + Date.now(), docType: title, merchant: d.merchant,
        category: d.category || 'अन्य', dir: d.direction, amount: d.amount,
        points: earned.total, icon: docIconKey(d.docType),
        borrowed: d.borrowed === true,
      }});
    }
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
      finalize(d);
    } catch (err) {
      console.warn('[decode] failed:', err?.message || err);
      if (err?.message === 'no_key') {
        setErrorMsg('API key नहीं मिली — GitHub Secrets में VITE_GROQ_API_KEY सेट करें।');
      } else if (err?.status === 429 || err?.message?.includes('rate')) {
        setErrorMsg('थोड़ा इंतज़ार करें — बहुत जल्दी अनुरोध आए। एक मिनट में दोबारा कोशिश करें।');
      } else if (err?.status >= 500 || err?.message?.includes('network') || err?.message?.includes('fetch')) {
        setErrorMsg('सर्वर से कनेक्ट नहीं हो पाया — इंटरनेट जाँचें और दोबारा कोशिश करें।');
      } else {
        setErrorMsg('कुछ गड़बड़ हुई — दोबारा कोशिश करें।');
      }
      setStage('error');
    }
  };

  const onPick = (e) => { handleFile(e.target.files?.[0] ?? null); e.target.value = ''; };
  const resolveDirection = (dir) => { const d = { ...data, direction: dir }; setData(d); finalize(d); };
  const reset = () => { setStage('input'); setData(null); setConfirmed(false); setInsightLine(''); setErrorMsg(''); setReward(null); addedRef.current = false; };

  // ── Screen 1: input (chat front door) ──
  const renderInput = () => (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Bubble>{INTRO}</Bubble>

      <button onClick={() => cameraRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '16px', cursor: 'pointer' }}>
        <IcCamera size={22} color="#fff" />
        <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>फ़ोटो लें</span>
      </button>
      <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: '999px', padding: '14px', cursor: 'pointer' }}>
        <IcFileText size={18} color={PURPLE} />
        <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 600, color: PURPLE }}>फ़ाइल या PDF चुनें</span>
      </button>

      {/* Capability card — breadth + vernacular (examples are not a limit) */}
      <div style={{ background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '16px', padding: '14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          {['बिजली बिल', 'बैंक नोटिस', 'रसीद', 'तनख्वाह पर्ची', '…और बहुत कुछ'].map(c => (
            <span key={c} style={{ background: '#F5F4FA', borderRadius: '999px', padding: '5px 12px', fontFamily: DEVA, fontSize: '12px', fontWeight: 600, color: PURPLE }}>{c}</span>
          ))}
        </div>
        <p style={{ margin: 0, fontFamily: DEVA, fontSize: '12px', color: '#5F5E5A' }}>हिंदी या आपकी भाषा में भी पढ़ लूँगा।</p>
      </div>

      {/* Warm, reassuring disclaimer (green, shield) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#e9f6ee', borderRadius: '12px', padding: '12px 14px' }}>
        <IcShield size={20} color={GREEN} />
        <span style={{ fontFamily: DEVA, fontSize: '12.5px', color: '#1a5c38', lineHeight: 1.5 }}>
          बेफ़िक्र रहिए — फ़ोटो हम रखते नहीं, बस ज़रूरी बात याद रखते हैं।
        </span>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*,.pdf,application/pdf" onChange={onPick} style={{ display: 'none' }} />
    </div>
  );

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

  // ── Screen 2: result (voice-first chat) ──
  const renderResult = () => {
    const isIn = data.direction === 'in';
    const ambiguous = data.direction === 'ambiguous';
    const lowConf = !ambiguous && data.amount && data.confidence < LOW_CONF && !confirmed;
    const logged = !ambiguous && !!data.amount;

    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 1. Recognition bubble */}
        <Bubble delay={0}>{recogText(data)}</Bubble>

        {/* 2. Breakdown widget */}
        <div className="animate-fade-in" style={{ background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '16px', padding: '16px', marginLeft: '42px', animationDelay: '80ms' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: 34, height: 34, borderRadius: '10px', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {docIcon(iconForCategory(data.category), 18, PURPLE)}
            </span>
            {!ambiguous && (
              <span className="animate-pop" style={{ background: isIn ? '#e6f5ec' : PURPLE_LIGHT, color: isIn ? GREEN : PURPLE, borderRadius: '999px', padding: '4px 11px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700 }}>{directionLabel(data.direction)}</span>
            )}
            {data.category && (
              <span style={{ background: '#F5F4FA', borderRadius: '999px', padding: '4px 11px', fontFamily: DEVA, fontSize: '12px', fontWeight: 600, color: '#5F5E5A' }}>{data.category}</span>
            )}
          </div>

          {data.amount ? (
            <div style={{ fontFamily: DEVA, fontSize: '30px', fontWeight: 900, color: isIn ? GREEN : INK, letterSpacing: '-0.5px' }}>{isIn ? '+' : ''}{inr(shownAmt)}</div>
          ) : (
            <div style={{ fontFamily: DEVA, fontSize: '14px', color: '#888780' }}>रकम साफ़ नहीं पढ़ पाया।</div>
          )}

          {/* line items */}
          {data.lineItems?.length > 0 && (
            <div style={{ marginTop: '10px', borderTop: `1px solid ${PURPLE_LIGHT}`, paddingTop: '8px' }}>
              {data.lineItems.map((li, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontFamily: DEVA, fontSize: '13px' }}>
                  <span style={{ color: '#5F5E5A' }}>{li.label}</span>
                  <span style={{ color: INK, fontWeight: 600 }}>{inr(li.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {data.dueDate && (
            <div style={{ marginTop: '8px', fontFamily: DEVA, fontSize: '12.5px', color: '#5F5E5A' }}>आख़िरी तारीख़: <span style={{ color: INK, fontWeight: 700 }}>{data.dueDate}</span></div>
          )}

          {lowConf && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A' }}>सही है?</span>
              <button onClick={() => setConfirmed(true)} style={{ background: GREEN, border: 'none', borderRadius: '999px', padding: '6px 16px', cursor: 'pointer', fontFamily: DEVA, fontSize: '13px', fontWeight: 700, color: '#fff' }}>हाँ</button>
              <button onClick={reset} style={{ background: '#fff', border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: '999px', padding: '6px 16px', cursor: 'pointer', fontFamily: DEVA, fontSize: '13px', fontWeight: 700, color: PURPLE }}>दुबारा दिखाएँ</button>
            </div>
          )}
        </div>

        {/* ambiguous → one question; "मैंने दिया · खर्च" is the PRIMARY first button */}
        {ambiguous && (
          <div style={{ background: '#FFFBEA', border: '1px solid #F2E2A8', borderRadius: '16px', padding: '16px', marginLeft: '42px' }}>
            <p style={{ margin: '0 0 12px', fontFamily: DEVA, fontSize: '14px', fontWeight: 600, color: INK }}>यह पैसा आपने दिया, या आपको मिला?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => resolveDirection('out')} style={{ flex: 1, background: PURPLE, color: '#fff', border: 'none', borderRadius: '999px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700 }}>मैंने दिया · खर्च</button>
              <button onClick={() => resolveDirection('in')} style={{ flex: 1, background: '#fff', color: GREEN, border: `1.5px solid #cde7d8`, borderRadius: '999px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700 }}>मुझे मिला · कमाई</button>
            </div>
          </div>
        )}

        {/* 3. Insight bubble — leads with the specific extracted fact */}
        {!ambiguous && insightLine && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', animationDelay: '160ms' }}>
            <PortraitAvatar size={32} online={false} ringed={false} />
            <div>
              <p style={{ background: PURPLE_LIGHT, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', margin: 0, fontFamily: DEVA, fontSize: '14px', lineHeight: 1.55, color: INK, maxWidth: '85%' }}>{insightLine}</p>
              <button onClick={() => { setSpeaking(true); speakMukund(insightLine, () => setSpeaking(false)); }} style={{ marginTop: '4px', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700, color: '#888780', padding: '2px 4px' }}>
                <IcSparks size={13} color="#888780" /> सुनें
              </button>
            </div>
          </div>
        )}

        {/* 4. Reward — variable points + bonus reason chips */}
        {logged && reward && (
          <div className="animate-pop" style={{ background: PURPLE, borderRadius: '16px', padding: '16px', marginLeft: '42px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <IcSparks size={20} color="#FFD479" />
              <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 800, color: '#fff' }}>{reward.total} अंक मिले!</span>
              {reward.reasons.filter(r => r.why !== 'फ़ोटो जोड़ी').map(r => (
                <span key={r.why} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '999px', padding: '3px 10px', fontFamily: DEVA, fontSize: '11px', fontWeight: 700, color: '#FFD479' }}>+{r.pts} {r.why}</span>
              ))}
            </div>
            <div style={{ marginTop: '12px', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '999px', background: '#FFD479', transformOrigin: 'left', transform: `scaleX(${Math.min(totalPoints, JACKPOT_POINTS) / JACKPOT_POINTS})`, transition: 'transform 500ms ease-out' }} />
            </div>
            <div style={{ marginTop: '8px', fontFamily: DEVA, fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
              {Math.min(totalPoints, JACKPOT_POINTS)} / {JACKPOT_POINTS.toLocaleString('en-IN')} अंक · {JACKPOT_POINTS.toLocaleString('en-IN')} अंक पूरे होने पर इनाम — पढ़ते रहिए।
            </div>
          </div>
        )}

        {/* 5. Auto-log */}
        {logged && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '42px', fontFamily: DEVA, fontSize: '12px', color: GREEN }}>
            <IcCheck size={14} color={GREEN} /> अपने आप हिसाब में जुड़ गया
          </div>
        )}

        {/* 6. हिसाब strip */}
        {docs.length > 0 && (
          <button onClick={() => nav('/passbook')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box', background: '#F5F4FA', border: 'none', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ flex: 1, fontFamily: DEVA, fontSize: '13px', fontWeight: 600, color: INK }}>
              मेरा हिसाब · आया <span style={{ color: GREEN }}>{inr(aaya)}</span> · गया <span style={{ color: PURPLE }}>{inr(gaya)}</span> · बचे <span style={{ fontWeight: 800 }}>{inr(bache)}</span>
            </span>
            <ChevronRight color={PURPLE} />
          </button>
        )}

        <button onClick={reset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '15px', cursor: 'pointer' }}>
          <IcCamera size={20} color="#fff" />
          <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>एक और कागज़ दिखाओ</span>
        </button>
      </div>
    );
  };

  const renderError = () => (
    <div className="animate-fade-in" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>⚠️</span>
      <p style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: INK, margin: 0 }}>तकनीकी गड़बड़</p>
      <p style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A', margin: 0, lineHeight: 1.5 }}>{errorMsg}</p>
      <button onClick={reset} style={{ background: PURPLE, border: 'none', borderRadius: '999px', padding: '13px 28px', cursor: 'pointer', fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: '#fff' }}>दोबारा कोशिश</button>
    </div>
  );

  const renderBlurry = () => (
    <div className="animate-fade-in" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#FDECEC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcCamera size={28} color="#fa2f40" />
      </span>
      <p style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: INK, margin: 0 }}>कागज़ साफ़ नहीं दिखा — दुबारा दिखाइए?</p>
      <p style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A', margin: 0, lineHeight: 1.5 }}>साफ़ रोशनी में, पूरा कागज़ फ्रेम के अंदर रखें।</p>
      <button onClick={reset} style={{ background: PURPLE, border: 'none', borderRadius: '999px', padding: '13px 28px', cursor: 'pointer', fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: '#fff' }}>दुबारा दिखाइए</button>
    </div>
  );

  const showDock = stage === 'input' || stage === 'result';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fff', maxWidth: '420px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <button onClick={() => (stage === 'input' ? nav('/') : reset())} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label="Back">
          <IcChevronLeft size={24} color={INK} />
        </button>
        <PortraitAvatar size={36} online ringed />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '15px', fontWeight: 700, color: INK }}>कागज़ समझें</div>
          <div style={{ fontFamily: DEVA, fontSize: '11px', color: speaking ? PURPLE : '#5F5E5A', fontWeight: speaking ? 700 : 400 }}>
            {speaking ? 'मुकुंद · बोल रहा है…' : 'मुकुंद · पढ़कर समझाता है'}
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {stage === 'input' && renderInput()}
        {stage === 'reading' && renderReading()}
        {stage === 'result' && data && renderResult()}
        {stage === 'blurry' && renderBlurry()}
        {stage === 'error'  && renderError()}
      </div>

      {showDock && (
        <BottomInputBar
          compact
          onSubmit={(t) => nav('/chat', { state: { initialMessage: t } })}
          onSpeak={() => nav('/chat', { state: { autoVoice: true } })}
          onPlus={() => fileRef.current?.click()}
        />
      )}
    </div>
  );
}

function Shimmer({ h, w = '100%', round = false, grow = false }) {
  return (
    <div className="mm-shimmer" style={{ height: h, width: round ? h : w, flex: grow ? 1 : undefined, borderRadius: round ? '50%' : '12px', background: '#ECEAF5' }} />
  );
}
