// Decoder — कागज़ समझें (route: /#/decoder)
// VOICE-FIRST chat (v4): reads ANY real financial paper via a vision model and
// replies as Mukund in short bubbles that AUTO-SPEAK (Sarvam hi-IN). Renders
// STRICTLY from extracted JSON + computed insights — no invented numbers.
// No manual entry. हिसाब accumulates real decodes (in-memory).
// JDS (a2ui MCP): IconCircle §11.44, TagChip §11.69, InfoBox §11.50, jdsBtn §6 —
// all colour/radius via tokens (index.css @theme).

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
import { IconCircle, TagChip, InfoBox, jdsBtn } from '../components/jds';
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

const CARD = 'bg-surface border-primary-20 ml-[42px] rounded-xl border p-4';

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
    <div className="animate-fade-in flex items-start gap-2.5" style={{ animationDelay: `${delay}ms` }}>
      <PortraitAvatar size={32} online={false} ringed={false} />
      <div className="font-deva bg-primary-20 text-ink max-w-[85%] rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl px-3.5 py-2.5 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function Decoder() {
  const nav = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();

  const [stage, setStage] = useState('input'); // demo | input | reading | result | blurry | error
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
      <div className="animate-fade-in flex flex-col gap-3 p-4">
        <TagChip tone="warning">{D.sample}</TagChip>
        <Bubble>{D.recog}</Bubble>
        <div className={CARD}>
          <div className="mb-2 flex items-center gap-2">
            <span className="bg-reward-soft flex size-8.5 items-center justify-center rounded-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h7l-1 8 9-12h-7z" stroke="var(--color-reward-ink)" strokeWidth="2" strokeLinejoin="round"/></svg>
            </span>
            <TagChip tone="brand">{D.title}</TagChip>
          </div>
          <div className="font-deva text-ink text-[30px] font-black tracking-tight">{D.amt}</div>
          <div className="bg-surface-minimal mt-3 rounded-lg px-3.5 py-3">
            <div className="font-deva text-primary-50 text-[13px] font-extrabold">{D.worryQ}</div>
            <div className="font-deva text-ink mt-1.5 text-sm leading-relaxed">{D.worry}</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <PortraitAvatar size={32} online={false} ringed={false} />
          <p className="font-deva bg-primary-20 text-ink m-0 max-w-[85%] rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl px-3.5 py-2.5 text-sm leading-relaxed">{D.insight}</p>
        </div>
        <button onClick={() => setStage('input')} className={`${jdsBtn('primary')} mt-1 w-full`}>
          <IcCamera size={20} color="#fff" />
          <span>{D.cta} →</span>
        </button>
        <p className="font-deva text-ink-soft mt-0.5 text-center text-[12.5px]">{D.note}</p>
      </div>
    );
  };

  // ── Screen 1: input (chat front door) ──
  const renderInput = () => (
    <div className="animate-fade-in flex flex-col gap-3.5 p-4">
      <Bubble>{INTRO[lang] || INTRO.hi}</Bubble>

      {/* Helper line */}
      <p className="font-deva text-ink-soft mx-0.5 text-[13px]">
        {lang === 'en' ? 'Bill · Receipt · Bank notice · PDF · WhatsApp photo too' : 'बिल · रसीद · बैंक नोटिस · PDF · WhatsApp वाली फ़ोटो भी'}
      </p>

      {/* Gallery — PRIMARY (images + PDFs) */}
      <button onClick={() => galleryRef.current?.click()} className={jdsBtn('primary')}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>{lang === 'en' ? 'Upload from gallery' : 'गैलरी से चुनें'}</span>
      </button>

      {/* Camera — secondary */}
      <button onClick={() => cameraRef.current?.click()} className={jdsBtn('tertiary')}>
        <IcCamera size={20} color="var(--color-primary-50)" />
        <span>{lang === 'en' ? 'Take a photo' : 'फ़ोटो खींचें'}</span>
      </button>

      {/* Capability card */}
      <div className="bg-surface border-primary-20 rounded-xl border p-3.5">
        <div className="mb-2 flex flex-wrap gap-2">
          {(lang === 'en'
            ? ['Electricity bill', 'Bank notice', 'Receipt', 'Pay slip', 'PDF', '…and more']
            : ['बिजली बिल', 'बैंक नोटिस', 'रसीद', 'तनख्वाह पर्ची', 'PDF', '…और बहुत कुछ']
          ).map(c => <TagChip key={c} tone="brand">{c}</TagChip>)}
        </div>
        <p className="font-deva text-ink-soft m-0 text-xs">
          {lang === 'en' ? 'Works in Hindi or your language too.' : 'हिंदी या आपकी भाषा में भी पढ़ लूँगा।'}
        </p>
      </div>

      {/* Privacy disclaimer */}
      <InfoBox tone="success" icon={<IcShield size={20} color="var(--color-success)" />}>
        {lang === 'en'
          ? "Don't worry — we don't keep the photo, just the key details."
          : 'बेफ़िक्र रहिए — फ़ोटो हम रखते नहीं, बस ज़रूरी बात याद रखते हैं।'}
      </InfoBox>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*,application/pdf" onChange={onPick} className="hidden" />
    </div>
  );

  const renderReading = () => (
    <div className="animate-fade-in flex flex-col gap-3.5 p-4" aria-busy="true" aria-label={lang === 'en' ? 'Mukund is reading' : 'मुकुंद पढ़ रहा है'}>
      <Shimmer h={28} w="55%" />
      <Shimmer h={120} />
      <div className="flex gap-2.5">
        <Shimmer h={32} w={32} round />
        <Shimmer h={56} grow />
      </div>
      <p className="font-deva text-ink-soft mt-1 text-center text-sm font-semibold">
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
      <div className="flex flex-col gap-3 p-4">
        {/* 1. Recognition bubble */}
        <Bubble delay={0}>{recogText(data, lang)}</Bubble>

        {/* 2. Breakdown widget */}
        <div className={`${CARD} animate-fade-in`} style={{ animationDelay: '80ms' }}>
          <div className="mb-2 flex items-center gap-2">
            <IconCircle size="sm" tinted icon={docIcon(iconForCategory(data.category), 18, 'var(--color-primary-50)')} />
            {!ambiguous && <TagChip tone={isIn ? 'success' : 'brand'}>{directionLabel(data.direction, lang)}</TagChip>}
            {data.category && (
              <TagChip tone="muted">{lang === 'en' ? (CAT_EN[data.category] || data.category) : data.category}</TagChip>
            )}
          </div>

          {data.amount ? (
            <div className={`font-deva text-[30px] font-black tracking-tight ${isIn ? 'text-success' : 'text-ink'}`}>{isIn ? '+' : ''}{inr(shownAmt)}</div>
          ) : (
            <div className="font-deva text-ink-soft text-sm">
              {lang === 'en' ? "Couldn't read the amount clearly." : 'रकम साफ़ नहीं पढ़ पाया।'}
            </div>
          )}

          {/* line items */}
          {data.lineItems?.length > 0 && (
            <div className="border-primary-20 mt-2.5 border-t pt-2">
              {data.lineItems.map((li, i) => (
                <div key={i} className="font-deva flex justify-between py-0.5 text-[13px]">
                  <span className="text-ink-soft">{li.label}</span>
                  <span className="text-ink font-semibold">{inr(li.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {data.dueDate && (
            <div className="font-deva text-ink-soft mt-2 text-[12.5px]">
              {lang === 'en' ? 'Due date: ' : 'आख़िरी तारीख़: '}
              <span className="text-ink font-bold">{data.dueDate}</span>
            </div>
          )}

          {lowConf && (
            <div className="mt-3 flex items-center gap-2">
              <span className="font-deva text-ink-soft text-[13px]">{lang === 'en' ? 'Looks right?' : 'सही है?'}</span>
              <button onClick={() => setConfirmed(true)} className="font-deva bg-success rounded-full px-4 py-1.5 text-[13px] font-bold text-white">
                {lang === 'en' ? 'Yes' : 'हाँ'}
              </button>
              <button onClick={reset} className="font-deva bg-surface border-primary-20 text-primary-50 rounded-full border-[1.5px] px-4 py-1.5 text-[13px] font-bold">
                {lang === 'en' ? 'Show again' : 'दुबारा दिखाएँ'}
              </button>
            </div>
          )}
        </div>

        {/* ambiguous → one question */}
        {ambiguous && (
          <div className="ml-[42px]">
            <InfoBox tone="warning">
              <span className="font-deva text-ink mb-3 block font-semibold">
                {lang === 'en' ? 'Did you pay this, or did you receive it?' : 'यह पैसा आपने दिया, या आपको मिला?'}
              </span>
              <span className="flex gap-2.5">
                <button onClick={() => resolveDirection('out')} className={`${jdsBtn('primary')} flex-1`}>
                  {lang === 'en' ? 'I paid · Expense' : 'मैंने दिया · खर्च'}
                </button>
                <button onClick={() => resolveDirection('in')} className={`${jdsBtn('tertiary')} flex-1`}>
                  {lang === 'en' ? 'I received · Income' : 'मुझे मिला · कमाई'}
                </button>
              </span>
            </InfoBox>
          </div>
        )}

        {/* 3. Insight bubble — leads with the specific extracted fact */}
        {!ambiguous && insightLine && (
          <div className="animate-fade-in flex items-start gap-2.5" style={{ animationDelay: '160ms' }}>
            <PortraitAvatar size={32} online={false} ringed={false} />
            <div>
              <p className="font-deva bg-primary-20 text-ink m-0 max-w-[85%] rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl px-3.5 py-2.5 text-sm leading-relaxed">{insightLine}</p>
              <button onClick={() => { setSpeaking(true); speakMukund(insightLine, () => setSpeaking(false), lang); }} className="font-deva text-ink-soft mt-1 ml-1 inline-flex items-center gap-1 bg-transparent px-1 py-0.5 text-xs font-bold">
                <IcSparks size={13} color="var(--color-ink-soft)" /> {lang === 'en' ? 'Listen' : 'सुनें'}
              </button>
            </div>
          </div>
        )}

        {/* B. UNCERTAIN → explain, then ASK before adding */}
        {askPending && (
          <div className="animate-fade-in ml-[42px]">
            <InfoBox tone="warning">
              <span className="font-deva text-ink mb-3 block font-bold">
                {lang === 'en' ? 'Did you take this? Should I add it to your ledger?' : 'क्या यह आपने लिया है? हिसाब में जोड़ूँ?'}
              </span>
              <span className="flex gap-2.5">
                <button onClick={askYes} className={`${jdsBtn('primary')} flex-1`}>
                  {lang === 'en' ? 'Yes, add it' : 'हाँ, जोड़ें'}
                </button>
                <button onClick={askNo} className={`${jdsBtn('tertiary')} flex-1`}>
                  {lang === 'en' ? 'Just wanted to understand' : 'सिर्फ़ समझना था'}
                </button>
              </span>
              <span className="font-deva text-reward-ink mt-2.5 block text-xs">
                {lang === 'en' ? "If you're not sure, I won't add it." : 'पक्का पता न हो, तो अपने आप नहीं जोड़ता।'}
              </span>
            </InfoBox>
          </div>
        )}

        {/* 4. Reward — variable points + bonus reason chips (only when entry entered हिसाब) */}
        {added && reward && (
          <div className="animate-pop bg-primary-50 ml-[42px] rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <IcSparks size={20} color="var(--color-reward)" />
              <span className="font-deva text-[16px] font-extrabold text-white">
                {lang === 'en' ? `${reward.total} points earned!` : `${reward.total} अंक मिले!`}
              </span>
              {reward.reasons.filter(r => r.why !== 'फ़ोटो जोड़ी').map(r => (
                <span key={r.why} className="font-deva rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-bold" style={{ color: 'var(--color-reward)' }}>+{r.pts} {r.why}</span>
              ))}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full origin-left rounded-full transition-transform duration-500 ease-out" style={{ background: 'var(--color-reward)', transform: `scaleX(${Math.min(totalPoints, JACKPOT_POINTS) / JACKPOT_POINTS})` }} />
            </div>
            <div className="font-deva mt-2 text-xs text-white/90">
              {Math.min(totalPoints, JACKPOT_POINTS)} / {JACKPOT_POINTS.toLocaleString('en-IN')} {lang === 'en' ? 'points' : 'अंक'} · {lang === 'en' ? `Reward at ${JACKPOT_POINTS.toLocaleString('en-IN')} points — keep going.` : `${JACKPOT_POINTS.toLocaleString('en-IN')} अंक पूरे होने पर इनाम — पढ़ते रहिए।`}
            </div>
          </div>
        )}

        {/* 5a. Added → confirmation (+ recurring note if remembered) */}
        {added && (
          <div className="font-deva text-success ml-[42px] flex items-center gap-1.5 text-xs">
            <IcCheck size={14} color="var(--color-success)" />
            {lang === 'en'
              ? (recurringNote ? 'Same as last time — added to your ledger' : 'Added to your ledger')
              : (recurringNote ? 'पिछली बार की तरह — हिसाब में जोड़ दिया' : 'हिसाब में जुड़ गया')}
          </div>
        )}

        {/* 5b. Explain-only → never touched हिसाब */}
        {explainedOnly && (
          <div className="font-deva text-ink-soft ml-[42px] text-xs">
            {lang === 'en'
              ? `Not added to ledger — ${route === 'none' ? 'information only' : 'just explained'}.`
              : `हिसाब में नहीं जोड़ा — सिर्फ़ ${route === 'none' ? 'जानकारी' : 'समझाया'}।`}
          </div>
        )}

        {/* 6. See full हिसाब — explicit secondary button (FIX 7: was passive strip) */}
        <button onClick={() => nav('/passbook')} className={`${jdsBtn('tertiary')} w-full border-2`}>
          {lang === 'en' ? 'See your full Hisaab →' : 'अपना पूरा हिसाब देखें →'}
        </button>

        <button onClick={reset} className={jdsBtn('primary')}>
          <IcCamera size={20} color="#fff" />
          <span>{lang === 'en' ? 'Check another document' : 'एक और कागज़ दिखाओ'}</span>
        </button>
      </div>
    );
  };

  const renderError = () => (
    <div className="animate-fade-in flex flex-col items-center gap-4 px-6 py-10 text-center">
      <span className="bg-error-soft flex size-16 items-center justify-center rounded-full"><IcAlertOctagon size={28} color="var(--color-error)" /></span>
      <p className="font-deva text-ink m-0 text-base font-bold">
        {lang === 'en' ? 'Something went wrong' : 'तकनीकी गड़बड़'}
      </p>
      <p className="font-deva text-ink-soft m-0 text-[13px] leading-relaxed">{errorMsg}</p>
      <button onClick={reset} className={jdsBtn('primary')}>
        {lang === 'en' ? 'Try again' : 'दोबारा कोशिश'}
      </button>
    </div>
  );

  const renderBlurry = () => (
    <div className="animate-fade-in flex flex-col items-center gap-4 px-6 py-10 text-center">
      <span className="bg-error-soft flex size-16 items-center justify-center rounded-full">
        <IcCamera size={28} color="var(--color-error)" />
      </span>
      <p className="font-deva text-ink m-0 text-base font-bold">
        {lang === 'en' ? "Couldn't read the document clearly — try again?" : 'कागज़ साफ़ नहीं दिखा — दुबारा दिखाइए?'}
      </p>
      <p className="font-deva text-ink-soft m-0 text-[13px] leading-relaxed">
        {lang === 'en' ? 'Good lighting, full document in frame.' : 'साफ़ रोशनी में, पूरा कागज़ फ्रेम के अंदर रखें।'}
      </p>
      <button onClick={reset} className={jdsBtn('primary')}>
        {lang === 'en' ? 'Try again' : 'दुबारा दिखाइए'}
      </button>
    </div>
  );

  const showDock = stage === 'demo' || stage === 'input' || stage === 'result';

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col bg-surface">
      <header className="border-stroke-subtle flex shrink-0 items-center gap-2.5 border-b px-4 py-2 pb-3">
        <button onClick={() => ((stage === 'input' || stage === 'demo') ? nav('/') : reset())} className="flex border-0 bg-transparent p-0" aria-label="Back">
          <IcChevronLeft size={24} color="var(--color-ink)" />
        </button>
        <PortraitAvatar size={36} online ringed />
        <div className="min-w-0 flex-1">
          <div className="font-jio text-ink text-[15px] font-bold">
            {lang === 'hi' ? 'कागज़ समझें' : 'Check document'}
          </div>
          <div className={`font-deva text-[11px] ${speaking ? 'text-primary-50 font-bold' : 'text-ink-soft'}`}>
            {speaking
              ? (lang === 'en' ? 'Mukund · speaking…' : 'मुकुंद · बोल रहा है…')
              : (lang === 'en' ? 'Mukund · reads & explains' : 'मुकुंद · पढ़कर समझाता है')}
          </div>
        </div>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <div className="flex-1 overflow-y-auto">
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
    <div
      className={`mm-shimmer bg-surface-ghost ${round ? 'rounded-full' : 'rounded-lg'} ${grow ? 'flex-1' : ''}`}
      style={{ height: h, width: round ? h : w }}
    />
  );
}
