// Decoder — कागज़ समझें (route: /#/decoder)
// VOICE-FIRST chat (v4): reads ANY real financial paper via a vision model and
// replies as Mukund in short bubbles that AUTO-SPEAK (Sarvam hi-IN). Renders
// STRICTLY from extracted JSON + computed insights — no invented numbers.
// No manual entry. हिसाब accumulates real decodes (in-memory).

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCountUp, inr } from '../utils/motion';
import { JACKPOT_POINTS, directionLabel, CAT_EN } from '../data/decoder-samples';
import { extractFromFile, docLabel, docIconKey, iconForCategory, classifyRoute } from '../utils/extract';
import { awardPoints, REWARDS_CFG } from '../utils/rewards';
import { insightEngine } from '../utils/insights';
import { Events } from '../engine/instrumentation';
import { speakMukund } from '../utils/tts';
import { takePendingFile } from '../utils/pendingFile';
import { useLang, LangToggle } from '../hooks/useLang';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import {
  IcChevronLeft, IcCamera, IcCheck, IcShield, IcAlertOctagon,
  IcReceipt, IcZap, IcSmartphone, IcFileDollar, IcSparks,
  IcWallet, IcLock, IcFork, IcCart, IcGas, IcUpi, IcCoin, IcGoldCoin,
  IcChartLine, IcBuilding,
} from '../components/icons/Icons';

// seenTypes persists across decodes in the session (for variety/first-of-type bonuses)
const _seenTypes = new Set();
// Recurring-doc memory (in-memory session): recurringKey → 'add' | 'skip'.
const _recurringChoices = new Map();

const PURPLE = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const GREEN = '#1a7d4b';
const INK = '#2C2C2A';
const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const LOW_CONF = 0.6;

const INTRO = {
  hi: 'कोई भी कागज़ जो समझ न आए या परेशान करे — बिल, बैंक नोटिस, मैसेज, पर्ची — दिखाइए। मैं आसान भाषा में समझा दूँगा।',
  en: 'Any document that confuses or worries you — bill, bank notice, message, receipt — show it to me. I\'ll explain it in simple language.',
};

// Pre-filled SAMPLE shown first (validation flow). Illustrative only — not the user's data.
const DEMO_COPY = {
  en: { sample: 'Sample', title: 'Electricity bill', amt: '₹740',
    recog: "Here's a sample — an electricity bill, read in plain language.",
    insight: "₹740 this time — ₹60 more than last month. Pay by 25 June and there's no late fee.",
    worryQ: 'Should you worry?', worry: "Not much — it's only ₹60 more, likely the heat.",
    cta: 'Check your document', note: 'Upload your bill, bank SMS, or any financial paper.' },
  hi: { sample: 'नमूना', title: 'बिजली बिल', amt: '₹740',
    recog: 'यह एक नमूना है — बिजली बिल, आसान भाषा में।',
    insight: 'इस बार ₹740 — पिछली बार से ₹60 ज़्यादा। 25 जून तक भर दें तो लेट फ़ीस नहीं लगेगी।',
    worryQ: 'क्या चिंता की बात है?', worry: 'ज़्यादा नहीं — बस ₹60 बढ़ा है, शायद गर्मी से।',
    cta: 'अपना कागज़ दिखाइए', note: 'अपना बिल, बैंक SMS, या कोई भी कागज़ दिखाकर आज़माइए।' },
};

function docIcon(key, size, color) {
  switch (key) {
    case 'zap':       return <IcZap size={size} color={color} />;
    case 'phone':     return <IcSmartphone size={size} color={color} />;
    case 'wallet':    return <IcWallet size={size} color={color} />;
    case 'salary':    return <IcFileDollar size={size} color={color} />;
    case 'shield':    return <IcShield size={size} color={color} />;
    case 'lock':      return <IcLock size={size} color={color} />;
    case 'fork':      return <IcFork size={size} color={color} />;
    case 'cart':      return <IcCart size={size} color={color} />;
    case 'gas':       return <IcGas size={size} color={color} />;
    case 'upi':       return <IcUpi size={size} color={color} />;
    case 'coin':      return <IcCoin size={size} color={color} />;
    case 'gold-coin': return <IcGoldCoin size={size} color={color} />;
    case 'chart':     return <IcChartLine size={size} color={color} />;
    case 'bank':      return <IcBuilding size={size} color={color} />;
    default:          return <IcReceipt size={size} color={color} />;
  }
}

const ChevronRight = ({ size = 18, color = '#aaa' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// The spoken/printed recognition line (real doc + total; never "कागज़" when avoidable).
function recogText(d, lang = 'hi') {
  const who = d.merchant || docLabel(d.docType);
  if (lang === 'en') {
    if (!d.amount) return `This is a ${who}.`;
    return d.direction === 'in' ? `This is a ${who} — ${inr(d.amount)} received.` : `This is a ${who} — total ${inr(d.amount)}.`;
  }
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

  const [stage, setStage] = useState('demo'); // demo | input | reading | result | blurry | error
  const [lang, setLang] = useLang();
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [insightLine, setInsightLine] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [reward, setReward] = useState(null); // { total, reasons }
  const [route, setRoute] = useState(null);       // 'confirmed' | 'uncertain' | 'none'
  const [askResolved, setAskResolved] = useState(null); // null | 'added' | 'skipped'
  const [recurringNote, setRecurringNote] = useState(false);
  const addedRef = useRef(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const fileRef = useRef(null); // PDF / file picker (also images saved as files)
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
      speakMukund(INTRO[lang] || INTRO.hi, () => setSpeaking(false), lang);
    }
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opened from मेरा हिसाब's "फ़ोटो दिखाओ" → open the camera straight away.
  useEffect(() => {
    if (location.state?.openCamera && !camOpenedRef.current) {
      camOpenedRef.current = true;
      setStage('input'); // skip the demo when explicitly sent to capture
      const t = setTimeout(() => cameraRef.current?.click(), 200);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  // Opened from the home AttachSheet (+/Document card) → decode the picked file once.
  useEffect(() => {
    const f = takePendingFile();
    if (f) handleFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speak recognition → grounded insight (always; educate-not-advise). No हिसाब write.
  const explain = (d) => {
    const line = insightEngine(d, state.docs, lang);
    setInsightLine(line);
    setSpeaking(true);
    speakMukund(recogText(d, lang), () => speakMukund(line, () => setSpeaking(false), lang), lang);
    setTimeout(() => setSpeaking(false), 16000);
  };

  // Write ONE entry to the हिसाब + award points. Points only ever fire here.
  const addToHisaab = (d) => {
    if (!d.amount || addedRef.current) return;
    addedRef.current = true;
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
      dueDate: d.dueDate || null, ts: Date.now(),
    }});
    Events.uploadCompleted({ attribution: location.state?.attribution || 'organic' });
  };

  // Route a resolved decode (CLAUDE.md §Document routing): confirmed / uncertain / none.
  const routeDoc = (d) => {
    if (d.direction === 'ambiguous') return; // direction resolver handles this first
    explain(d);
    let r = classifyRoute(d);
    // Recurring memory — skip the ASK if we already know the user's choice for this key.
    if (r === 'uncertain' && d.isRecurring && d.recurringKey && _recurringChoices.has(d.recurringKey)) {
      const choice = _recurringChoices.get(d.recurringKey);
      if (choice === 'add') { setRecurringNote(true); setRoute('confirmed'); addToHisaab(d); return; }
      setRoute('none'); return; // remembered "skip" → explain only
    }
    setRoute(r);
    if (r === 'confirmed') addToHisaab(d);
    // uncertain → wait for ASK; none → explain only
  };

  // ASK card answers (UNCERTAIN docs).
  const askYes = () => {
    if (!data) return;
    addToHisaab(data);
    setAskResolved('added');
    if (data.isRecurring && data.recurringKey) _recurringChoices.set(data.recurringKey, 'add');
  };
  const askNo = () => {
    setAskResolved('skipped');
    if (data?.isRecurring && data?.recurringKey) _recurringChoices.set(data.recurringKey, 'skip');
  };

  const handleFile = async (file) => {
    if (!file) return;
    setData(null); setConfirmed(false); addedRef.current = false;
    setRoute(null); setAskResolved(null); setRecurringNote(false); setReward(null); setInsightLine('');
    setStage('reading');
    try {
      const d = await extractFromFile(file);
      if (!d.readable) { setStage('blurry'); return; }
      setData(d);
      setStage('result');
      routeDoc(d);
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
  const resolveDirection = (dir) => { const d = { ...data, direction: dir }; setData(d); routeDoc(d); };
  const reset = () => { setStage('input'); setData(null); setConfirmed(false); setInsightLine(''); setErrorMsg(''); setReward(null); setRoute(null); setAskResolved(null); setRecurringNote(false); addedRef.current = false; };

  // ── Screen 0: demo — a pre-filled SAMPLE decode so the user instantly gets it,
  //    then "show your own document" opens the real capture. Sample is clearly
  //    labelled; it never touches the हिसाब and never poses as the user's data. ──
  const renderDemo = () => {
    const D = DEMO_COPY[lang];
    return (
      <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ alignSelf: 'flex-start', background: '#fff5dc', color: '#8a6a00', fontFamily: DEVA, fontSize: '11px', fontWeight: 800, padding: '4px 11px', borderRadius: '999px' }}>{D.sample}</span>
        <Bubble>{D.recog}</Bubble>
        <div style={{ background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '16px', padding: '16px', marginLeft: '42px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: 34, height: 34, borderRadius: '10px', background: '#fcf1e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h7l-1 8 9-12h-7z" stroke="#a8620f" strokeWidth="2" strokeLinejoin="round"/></svg>
            </span>
            <span style={{ background: PURPLE_LIGHT, color: PURPLE, borderRadius: '999px', padding: '4px 11px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700 }}>{D.title}</span>
          </div>
          <div style={{ fontFamily: DEVA, fontSize: '30px', fontWeight: 900, color: INK, letterSpacing: '-0.5px' }}>{D.amt}</div>
          <div style={{ marginTop: '12px', background: '#f7f5fd', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ fontFamily: DEVA, fontSize: '13px', fontWeight: 800, color: PURPLE }}>{D.worryQ}</div>
            <div style={{ fontFamily: DEVA, fontSize: '14px', color: INK, lineHeight: 1.5, marginTop: '6px' }}>{D.worry}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <PortraitAvatar size={32} online={false} ringed={false} />
          <p style={{ background: PURPLE_LIGHT, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', margin: 0, fontFamily: DEVA, fontSize: '14px', lineHeight: 1.55, color: INK, maxWidth: '85%' }}>{D.insight}</p>
        </div>
        <button onClick={() => setStage('input')} style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '15px', cursor: 'pointer' }}>
          <IcCamera size={20} color="#fff" />
          <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{D.cta} →</span>
        </button>
        <p style={{ fontFamily: DEVA, fontSize: '12.5px', color: '#5F5E5A', textAlign: 'center', margin: '2px 0 0' }}>{D.note}</p>
      </div>
    );
  };

  // ── Screen 1: input (chat front door) ──
  const renderInput = () => (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Bubble>{INTRO[lang] || INTRO.hi}</Bubble>

      {/* Helper line */}
      <p style={{ margin: '0 2px', fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A' }}>
        {lang === 'en' ? 'Bill · Receipt · Bank notice · WhatsApp photo too' : 'बिल · रसीद · बैंक नोटिस · WhatsApp वाली फ़ोटो भी'}
      </p>

      {/* Gallery — PRIMARY */}
      <button onClick={() => galleryRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '16px', cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
          {lang === 'en' ? 'Upload from gallery' : 'गैलरी से चुनें'}
        </span>
      </button>

      {/* Secondary row: camera + PDF */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={() => cameraRef.current?.click()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: '999px', padding: '14px', cursor: 'pointer' }}>
          <IcCamera size={20} color={PURPLE} />
          <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 600, color: PURPLE }}>
            {lang === 'en' ? 'Take a photo' : 'फ़ोटो खींचें'}
          </span>
        </button>
        <button onClick={() => fileRef.current?.click()} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', background: 'transparent', border: '2.2px solid #6b4ef0', borderRadius: '999px', padding: '8px 18px', cursor: 'pointer' }}>
          <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 800, color: '#7a5cf0' }}>PDF</span>
          <span style={{ fontFamily: DEVA, fontSize: '10px', fontWeight: 500, color: '#8b80c4' }}>
            {lang === 'en' ? 'works too' : 'भी चलेगा'}
          </span>
        </button>
      </div>

      {/* Capability card */}
      <div style={{ background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '16px', padding: '14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          {(lang === 'en'
            ? ['Electricity bill', 'Bank notice', 'Receipt', 'Pay slip', '…and much more']
            : ['बिजली बिल', 'बैंक नोटिस', 'रसीद', 'तनख्वाह पर्ची', '…और बहुत कुछ']
          ).map(c => (
            <span key={c} style={{ background: '#F5F4FA', borderRadius: '999px', padding: '5px 12px', fontFamily: DEVA, fontSize: '12px', fontWeight: 600, color: PURPLE }}>{c}</span>
          ))}
        </div>
        <p style={{ margin: 0, fontFamily: DEVA, fontSize: '12px', color: '#5F5E5A' }}>
          {lang === 'en' ? 'Works in Hindi or your language too.' : 'हिंदी या आपकी भाषा में भी पढ़ लूँगा।'}
        </p>
      </div>

      {/* Privacy disclaimer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#e9f6ee', borderRadius: '12px', padding: '12px 14px' }}>
        <IcShield size={20} color={GREEN} />
        <span style={{ fontFamily: DEVA, fontSize: '12.5px', color: '#1a5c38', lineHeight: 1.5 }}>
          {lang === 'en'
            ? "Don't worry — we don't keep the photo, just the key details."
            : 'बेफ़िक्र रहिए — फ़ोटो हम रखते नहीं, बस ज़रूरी बात याद रखते हैं।'}
        </span>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="application/pdf,image/*" onChange={onPick} style={{ display: 'none' }} />
    </div>
  );

  const renderReading = () => (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} aria-busy="true" aria-label={lang === 'en' ? 'Mukund is reading' : 'मुकुंद पढ़ रहा है'}>
      <Shimmer h={28} w="55%" />
      <Shimmer h={120} />
      <div style={{ display: 'flex', gap: '10px' }}>
        <Shimmer h={32} w={32} round />
        <Shimmer h={56} grow />
      </div>
      <p style={{ textAlign: 'center', fontFamily: DEVA, fontSize: '14px', fontWeight: 600, color: '#888780', margin: '4px 0 0' }}>
        {lang === 'en' ? 'Mukund is reading…' : 'मुकुंद पढ़ रहा है…'}
      </p>
    </div>
  );

  // ── Screen 2: result (voice-first chat) ──
  const renderResult = () => {
    const isIn = data.direction === 'in';
    const ambiguous = data.direction === 'ambiguous';
    const lowConf = !ambiguous && data.amount && data.confidence < LOW_CONF && !confirmed;
    // Routing-aware outcomes (CLAUDE.md §Document routing)
    const added = route === 'confirmed' || (route === 'uncertain' && askResolved === 'added');
    const askPending = route === 'uncertain' && askResolved === null;
    const explainedOnly = route === 'none' || (route === 'uncertain' && askResolved === 'skipped');

    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 1. Recognition bubble */}
        <Bubble delay={0}>{recogText(data, lang)}</Bubble>

        {/* 2. Breakdown widget */}
        <div className="animate-fade-in" style={{ background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '16px', padding: '16px', marginLeft: '42px', animationDelay: '80ms' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: 34, height: 34, borderRadius: '10px', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {docIcon(iconForCategory(data.category), 18, PURPLE)}
            </span>
            {!ambiguous && (
              <span className="animate-pop" style={{ background: isIn ? '#e6f5ec' : PURPLE_LIGHT, color: isIn ? GREEN : PURPLE, borderRadius: '999px', padding: '4px 11px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700 }}>{directionLabel(data.direction, lang)}</span>
            )}
            {data.category && (
              <span style={{ background: '#F5F4FA', borderRadius: '999px', padding: '4px 11px', fontFamily: DEVA, fontSize: '12px', fontWeight: 600, color: '#5F5E5A' }}>
                {lang === 'en' ? (CAT_EN[data.category] || data.category) : data.category}
              </span>
            )}
          </div>

          {data.amount ? (
            <div style={{ fontFamily: DEVA, fontSize: '30px', fontWeight: 900, color: isIn ? GREEN : INK, letterSpacing: '-0.5px' }}>{isIn ? '+' : ''}{inr(shownAmt)}</div>
          ) : (
            <div style={{ fontFamily: DEVA, fontSize: '14px', color: '#888780' }}>
              {lang === 'en' ? "Couldn't read the amount clearly." : 'रकम साफ़ नहीं पढ़ पाया।'}
            </div>
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
            <div style={{ marginTop: '8px', fontFamily: DEVA, fontSize: '12.5px', color: '#5F5E5A' }}>
              {lang === 'en' ? 'Due date: ' : 'आख़िरी तारीख़: '}
              <span style={{ color: INK, fontWeight: 700 }}>{data.dueDate}</span>
            </div>
          )}

          {lowConf && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A' }}>{lang === 'en' ? 'Looks right?' : 'सही है?'}</span>
              <button onClick={() => setConfirmed(true)} style={{ background: GREEN, border: 'none', borderRadius: '999px', padding: '6px 16px', cursor: 'pointer', fontFamily: DEVA, fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {lang === 'en' ? 'Yes' : 'हाँ'}
              </button>
              <button onClick={reset} style={{ background: '#fff', border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: '999px', padding: '6px 16px', cursor: 'pointer', fontFamily: DEVA, fontSize: '13px', fontWeight: 700, color: PURPLE }}>
                {lang === 'en' ? 'Show again' : 'दुबारा दिखाएँ'}
              </button>
            </div>
          )}
        </div>

        {/* ambiguous → one question */}
        {ambiguous && (
          <div style={{ background: '#FFFBEA', border: '1px solid #F2E2A8', borderRadius: '16px', padding: '16px', marginLeft: '42px' }}>
            <p style={{ margin: '0 0 12px', fontFamily: DEVA, fontSize: '14px', fontWeight: 600, color: INK }}>
              {lang === 'en' ? 'Did you pay this, or did you receive it?' : 'यह पैसा आपने दिया, या आपको मिला?'}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => resolveDirection('out')} style={{ flex: 1, background: PURPLE, color: '#fff', border: 'none', borderRadius: '999px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700 }}>
                {lang === 'en' ? 'I paid · Expense' : 'मैंने दिया · खर्च'}
              </button>
              <button onClick={() => resolveDirection('in')} style={{ flex: 1, background: '#fff', color: GREEN, border: `1.5px solid #cde7d8`, borderRadius: '999px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700 }}>
                {lang === 'en' ? 'I received · Income' : 'मुझे मिला · कमाई'}
              </button>
            </div>
          </div>
        )}

        {/* 3. Insight bubble — leads with the specific extracted fact */}
        {!ambiguous && insightLine && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', animationDelay: '160ms' }}>
            <PortraitAvatar size={32} online={false} ringed={false} />
            <div>
              <p style={{ background: PURPLE_LIGHT, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', margin: 0, fontFamily: DEVA, fontSize: '14px', lineHeight: 1.55, color: INK, maxWidth: '85%' }}>{insightLine}</p>
              <button onClick={() => { setSpeaking(true); speakMukund(insightLine, () => setSpeaking(false), lang); }} style={{ marginTop: '4px', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: DEVA, fontSize: '12px', fontWeight: 700, color: '#888780', padding: '2px 4px' }}>
                <IcSparks size={13} color="#888780" /> {lang === 'en' ? 'Listen' : 'सुनें'}
              </button>
            </div>
          </div>
        )}

        {/* B. UNCERTAIN → explain, then ASK before adding */}
        {askPending && (
          <div className="animate-fade-in" style={{ background: '#FFFBEA', border: '1px solid #F2E2A8', borderRadius: '16px', padding: '16px', marginLeft: '42px' }}>
            <p style={{ margin: '0 0 12px', fontFamily: DEVA, fontSize: '14px', fontWeight: 700, color: INK }}>
              {lang === 'en' ? 'Did you take this? Should I add it to your ledger?' : 'क्या यह आपने लिया है? हिसाब में जोड़ूँ?'}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={askYes} style={{ flex: 1, background: PURPLE, color: '#fff', border: 'none', borderRadius: '999px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700 }}>
                {lang === 'en' ? 'Yes, add it' : 'हाँ, जोड़ें'}
              </button>
              <button onClick={askNo} style={{ flex: 1, background: '#fff', color: PURPLE, border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: '999px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700 }}>
                {lang === 'en' ? 'Just wanted to understand' : 'सिर्फ़ समझना था'}
              </button>
            </div>
            <p style={{ margin: '10px 0 0', fontFamily: DEVA, fontSize: '12px', color: '#8a7a3a' }}>
              {lang === 'en' ? "If you're not sure, I won't add it." : 'पक्का पता न हो, तो अपने आप नहीं जोड़ता।'}
            </p>
          </div>
        )}

        {/* 4. Reward — variable points + bonus reason chips (only when entry entered हिसाब) */}
        {added && reward && (
          <div className="animate-pop" style={{ background: PURPLE, borderRadius: '16px', padding: '16px', marginLeft: '42px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <IcSparks size={20} color="#FFD479" />
              <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                {lang === 'en' ? `${reward.total} points earned!` : `${reward.total} अंक मिले!`}
              </span>
              {reward.reasons.filter(r => r.why !== 'फ़ोटो जोड़ी').map(r => (
                <span key={r.why} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '999px', padding: '3px 10px', fontFamily: DEVA, fontSize: '11px', fontWeight: 700, color: '#FFD479' }}>+{r.pts} {r.why}</span>
              ))}
            </div>
            <div style={{ marginTop: '12px', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '999px', background: '#FFD479', transformOrigin: 'left', transform: `scaleX(${Math.min(totalPoints, JACKPOT_POINTS) / JACKPOT_POINTS})`, transition: 'transform 500ms ease-out' }} />
            </div>
            <div style={{ marginTop: '8px', fontFamily: DEVA, fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
              {Math.min(totalPoints, JACKPOT_POINTS)} / {JACKPOT_POINTS.toLocaleString('en-IN')} {lang === 'en' ? 'points' : 'अंक'} · {lang === 'en' ? `Reward at ${JACKPOT_POINTS.toLocaleString('en-IN')} points — keep going.` : `${JACKPOT_POINTS.toLocaleString('en-IN')} अंक पूरे होने पर इनाम — पढ़ते रहिए।`}
            </div>
          </div>
        )}

        {/* 5a. Added → confirmation (+ recurring note if remembered) */}
        {added && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '42px', fontFamily: DEVA, fontSize: '12px', color: GREEN }}>
            <IcCheck size={14} color={GREEN} />
            {lang === 'en'
              ? (recurringNote ? 'Same as last time — added to your ledger' : 'Added to your ledger')
              : (recurringNote ? 'पिछली बार की तरह — हिसाब में जोड़ दिया' : 'हिसाब में जुड़ गया')}
          </div>
        )}

        {/* 5b. Explain-only → never touched हिसाब */}
        {explainedOnly && (
          <div style={{ marginLeft: '42px', fontFamily: DEVA, fontSize: '12px', color: '#888780' }}>
            {lang === 'en'
              ? `Not added to ledger — ${route === 'none' ? 'information only' : 'just explained'}.`
              : `हिसाब में नहीं जोड़ा — सिर्फ़ ${route === 'none' ? 'जानकारी' : 'समझाया'}।`}
          </div>
        )}

        {/* 6. See full हिसाब — explicit secondary button (FIX 7: was passive strip) */}
        <button onClick={() => nav('/passbook')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', boxSizing: 'border-box', background: '#fff', border: `2px solid ${PURPLE}`, borderRadius: '999px', padding: '14px', cursor: 'pointer' }}>
          <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: PURPLE }}>
            {lang === 'en' ? 'See your full Hisaab →' : 'अपना पूरा हिसाब देखें →'}
          </span>
        </button>

        <button onClick={reset} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '15px', cursor: 'pointer' }}>
          <IcCamera size={20} color="#fff" />
          <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            {lang === 'en' ? 'Check another document' : 'एक और कागज़ दिखाओ'}
          </span>
        </button>
      </div>
    );
  };

  const renderError = () => (
    <div className="animate-fade-in" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcAlertOctagon size={28} color="#D85A30" /></span>
      <p style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: INK, margin: 0 }}>
        {lang === 'en' ? 'Something went wrong' : 'तकनीकी गड़बड़'}
      </p>
      <p style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A', margin: 0, lineHeight: 1.5 }}>{errorMsg}</p>
      <button onClick={reset} style={{ background: PURPLE, border: 'none', borderRadius: '999px', padding: '13px 28px', cursor: 'pointer', fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
        {lang === 'en' ? 'Try again' : 'दोबारा कोशिश'}
      </button>
    </div>
  );

  const renderBlurry = () => (
    <div className="animate-fade-in" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#FDECEC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcCamera size={28} color="#fa2f40" />
      </span>
      <p style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 700, color: INK, margin: 0 }}>
        {lang === 'en' ? "Couldn't read the document clearly — try again?" : 'कागज़ साफ़ नहीं दिखा — दुबारा दिखाइए?'}
      </p>
      <p style={{ fontFamily: DEVA, fontSize: '13px', color: '#5F5E5A', margin: 0, lineHeight: 1.5 }}>
        {lang === 'en' ? 'Good lighting, full document in frame.' : 'साफ़ रोशनी में, पूरा कागज़ फ्रेम के अंदर रखें।'}
      </p>
      <button onClick={reset} style={{ background: PURPLE, border: 'none', borderRadius: '999px', padding: '13px 28px', cursor: 'pointer', fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
        {lang === 'en' ? 'Try again' : 'दुबारा दिखाइए'}
      </button>
    </div>
  );

  const showDock = stage === 'demo' || stage === 'input' || stage === 'result';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fff', maxWidth: '420px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <button onClick={() => ((stage === 'input' || stage === 'demo') ? nav('/') : reset())} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label="Back">
          <IcChevronLeft size={24} color={INK} />
        </button>
        <PortraitAvatar size={36} online ringed />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '15px', fontWeight: 700, color: INK }}>
            {lang === 'hi' ? 'कागज़ समझें' : 'Check document'}
          </div>
          <div style={{ fontFamily: DEVA, fontSize: '11px', color: speaking ? PURPLE : '#5F5E5A', fontWeight: speaking ? 700 : 400 }}>
            {speaking
              ? (lang === 'en' ? 'Mukund · speaking…' : 'मुकुंद · बोल रहा है…')
              : (lang === 'en' ? 'Mukund · reads & explains' : 'मुकुंद · पढ़कर समझाता है')}
          </div>
        </div>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {stage === 'demo' && renderDemo()}
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
          onPlus={() => galleryRef.current?.click()}
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
