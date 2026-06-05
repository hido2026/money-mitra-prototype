// Decoder — Ghar ka Munshi  (route: /#/decoder)
// Accepts images (camera/gallery) AND PDFs.
// Images → Groq vision model. PDFs → PDF.js text extraction → Groq text model.
// Files are NEVER stored. Process and discard immediately.

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Groq from 'groq-sdk';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import { useApp } from '../context/AppContext';
import { computeInsight, computeConnectDotsInsight } from '../engine/insight';
import { logEvent } from '../utils/analytics';
import InsightBubble from '../components/InsightBubble';
import { IcChevronLeft, IcDots, IcCamera, IcFileText } from '../components/icons/Icons';
import { speakMukund } from '../utils/tts';
// Worker URL registered at build time by Vite (emitted as a separate asset)
// PDF.js library itself is still loaded on-demand via dynamic import below
import _pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// ── Groq client ───────────────────────────────────────────────────────────────
const _key = import.meta.env.VITE_GROQ_API_KEY;
const groq = _key ? new Groq({ apiKey: _key, dangerouslyAllowBrowser: true }) : null;

const VISION_MODEL  = 'meta-llama/llama-4-scout-17b-16e-instruct';
const TEXT_MODEL    = 'llama-3.3-70b-versatile';
const FALLBACK_TEXT = 'यह ठीक से दिख नहीं रहा — दोबारा फ़ोटो लें या PDF भेजें।';

const MUKUND_PROMPT = `You are Mukund, a 35-year-old Hindi-speaking financial helper. You speak like a smart older cousin — warm, direct, no jargon. Look at this bill, receipt, or financial document. Reply in Devanagari Hindi, 2-3 sentences max, under 80 words. Cover: 1) What is this document (bill type, from whom) 2) The key amount (total due / paid / balance) 3) One money point: is this normal, is there a saving possible, or is something wrong. End your reply with the amount on a separate line in this exact format: AMOUNT:₹[number]`;

// ── PDF helpers (PDF.js loaded on-demand) ─────────────────────────────────────

async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  // Use the worker URL that Vite emitted as a static asset
  pdfjsLib.GlobalWorkerOptions.workerSrc = _pdfWorkerUrl;
  return pdfjsLib;
}

/** Extract selectable text from first 3 pages. Returns '' for scanned PDFs. */
async function extractPdfText(pdf) {
  const maxPages = Math.min(pdf.numPages, 3);
  const parts = [];
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map(item => item.str).join(' '));
  }
  return parts.join('\n').trim();
}

/** Render first page of PDF to a 1024px-max JPEG base64 (for scanned PDFs). */
async function renderPdfPageToBase64(pdf) {
  const page     = await pdf.getPage(1);
  const scale    = Math.min(1024 / page.getViewport({ scale: 1 }).width, 2);
  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement('canvas');
  canvas.width   = Math.round(viewport.width);
  canvas.height  = Math.round(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
}

/**
 * Handle a PDF file: try text extraction first.
 * If text is too short (scanned PDF), fall back to image rendering.
 * Returns { mode: 'text'|'image', content: string }
 */
async function processPdf(file) {
  const pdfjsLib   = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf        = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const text = await extractPdfText(pdf);
  // If we got meaningful text (>100 chars of non-whitespace), use text path
  if (text.replace(/\s/g, '').length > 100) {
    return { mode: 'text', content: text.slice(0, 3000) };
  }
  // Otherwise it's a scanned/image PDF — render first page as image
  const b64 = await renderPdfPageToBase64(pdf);
  return { mode: 'image', content: b64 };
}

// ── Image helpers ─────────────────────────────────────────────────────────────

async function compressToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round((height / width) * MAX); width = MAX; }
        else                 { width  = Math.round((width  / height) * MAX); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.82);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function parseAmount(text) {
  const match = text.match(/AMOUNT:₹([\d,]+)/);
  if (!match) return null;
  return parseInt(match[1].replace(/,/g, ''), 10);
}

function cleanText(text) {
  // Strip the AMOUNT line before displaying
  return text.replace(/\nAMOUNT:₹[\d,]+\s*$/, '').trim();
}

/**
 * Infer bill_type from Mukund's Devanagari/English response text.
 * Used to tag the entry for cross-decode comparison.
 */
function parseBillType(text) {
  if (!text) return 'other';
  const t = text.toLowerCase();
  if (t.includes('बिजली') || t.includes('electricity') || t.includes('electric') || t.includes('power') || t.includes('bijli')) {
    return 'बिजली बिल';
  }
  if (t.includes('रिचार्ज') || t.includes('recharge') || t.includes('mobile') || t.includes('jio') || t.includes('airtel') || t.includes('vi ') || t.includes('bsnl')) {
    return 'मोबाइल रिचार्ज';
  }
  return 'other';
}

// ── Loading dots (needs its own component to use hooks safely) ────────────────
function ReadingStep() {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ padding: '48px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcFileText size={32} color="#534AB7" />
      </div>
      <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '17px', fontWeight: 600, color: '#2C2C2A' }}>
        मुकुंद पढ़ रहा है{dots}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TopBar({ onBack }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 18px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcChevronLeft size={24} color="#2C2C2A" />
      </button>
      <PortraitAvatar size={40} online ringed />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '15px', fontWeight: 600, color: '#2C2C2A' }}>Mukund</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#5F5E5A', marginTop: '1px' }}>Money Mitra · online</div>
      </div>
      <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcDots size={22} color="#2C2C2A" />
      </button>
    </header>
  );
}

function MukundBubble({ text, bg = '#EEEDFE', speakable = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '92%' }}>
      <div style={{ marginTop: '2px' }}><PortraitAvatar size={28} online={false} ringed={false} /></div>
      <div>
        <div style={{ background: bg, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.55, color: '#2C2C2A', whiteSpace: 'pre-wrap' }}>{text}</div>
        {speakable && (
          <button onClick={() => speakMukund(text)} style={{ marginTop: '4px', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#888780', padding: '2px 6px', borderRadius: '6px' }}>
            🔊 सुनिए
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Decoder ───────────────────────────────────────────────────────────────

export default function Decoder() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();

  const [step, setStep]           = useState('home');   // home | reading | result | error
  const [result, setResult]       = useState('');       // cleaned Mukund text
  const [parsedAmt, setParsedAmt] = useState(null);
  const [insight, setInsight]     = useState(null);
  // Connect-dots insight: ties decoded bill → last same-category entry → active goal.
  // Shown as a plain Mukund bubble above "बही में डालें"; suppresses general InsightBubble.
  const [connectDots, setConnectDots] = useState(null);

  // Hidden file inputs — one for camera, one for gallery
  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setStep('reading');
    logEvent('decoder_used');

    try {
      if (!groq) throw new Error('no groq key');

      const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
      let resp;

      if (isPDF) {
        // Auto-detect: text-based PDF → text model / scanned PDF → vision model
        const { mode, content } = await processPdf(file);
        if (mode === 'text') {
          resp = await groq.chat.completions.create({
            model: TEXT_MODEL,
            messages: [{ role: 'user', content: `${MUKUND_PROMPT}\n\nDocument text:\n${content}` }],
            max_tokens: 220,
          });
        } else {
          // Scanned PDF rendered as image → same path as a regular photo
          resp = await groq.chat.completions.create({
            model: VISION_MODEL,
            messages: [{
              role: 'user',
              content: [
                { type: 'text',      text: MUKUND_PROMPT },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${content}` } },
              ],
            }],
            max_tokens: 220,
          });
        }
      } else {
        // Regular image → vision model
        const b64 = await compressToBase64(file);
        resp = await groq.chat.completions.create({
          model: VISION_MODEL,
          messages: [{
            role: 'user',
            content: [
              { type: 'text',      text: MUKUND_PROMPT },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
            ],
          }],
          max_tokens: 220,
        });
      }
      const raw = resp.choices[0]?.message?.content ?? '';
      if (!raw.trim()) throw new Error('empty response');

      const amt = parseAmount(raw);
      const cleanedText = cleanText(raw);
      setResult(cleanedText);
      setParsedAmt(amt);
      speakMukund(cleanedText); // read Mukund's bill explanation aloud

      // Determine bill type from Mukund's response text (Hindi category label)
      const detectedBillType = parseBillType(cleanedText);

      // Push decode to AppContext for insight engine (tagged with detected category)
      if (amt) {
        dispatch({ type: 'ADD_DECODE', payload: {
          bill_type:         detectedBillType,
          labelHi:           detectedBillType !== 'other' ? detectedBillType : 'रसीद',
          amount:             amt,
          recurring:          detectedBillType !== 'other',
          saveable:           0,
          monthly_saving:     0,
          annual_plan_cost:   null,
        }});
      }

      // ── Priority 1: Connect-dots insight (bill vs last entry → goal) ──────────
      // Uses entries already in state (not the dispatch above — that's sessionDecodes).
      if (amt && detectedBillType !== 'other') {
        const cd = computeConnectDotsInsight(
          detectedBillType,
          amt,
          state.entries,
          state.goals,
          state.balance,
        );
        if (cd) {
          setConnectDots(cd);
          logEvent('connect_dots_insight_shown', { bill_type: detectedBillType });
        }
      }

      // ── General insight seam (T0–T3 engine) — suppressed if connect-dots fired ─
      if (!connectDots) {
        const payload = computeInsight(state);
        if (payload) {
          setInsight(payload);
          dispatch({ type: 'MARK_INSIGHT_FIRED' });
          logEvent('insight_shown', { tier: payload.tier });
        }
      }

      setStep('result');
    } catch {
      setResult(FALLBACK_TEXT);
      setParsedAmt(null);
      setStep('error');
    }
  };

  const onFileChange = (e) => { handleFile(e.target.files?.[0] ?? null); e.target.value = ''; };

  const goToPassbook = () => {
    const billType = parseBillType(result);
    nav('/passbook', { state: {
      decoderAmount:   parsedAmt,
      decoderBillType: billType,
    }});
  };

  const handleInsightAction = (action) => {
    if (action === 'add_to_bahi') goToPassbook();
    if (action === 'set_goal')    nav('/passbook', { state: { openGoal: true } });
  };

  // ── Step: home ───────────────────────────────────────────────────────────────
  const renderHome = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ padding: '4px 4px 0' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: '#534AB7' }}>SAMJHO</div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '1px' }}>कागज़ समझें</div>
      </div>

      <MukundBubble text="जो समझ न आये — बिल, रसीद, मैसेज — फ़ोटो या PDF दिखाइए। पढ़ कर समझाता हूँ।" time="अभी" />

      {/* Gallery / PDF — PRIMARY (works on all devices) */}
      <button onClick={() => galleryRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#534AB7', border: 'none', borderRadius: '14px', padding: '16px', cursor: 'pointer' }}>
        <IcFileText size={22} color="#FFFFFF" />
        <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>फ़ाइल या PDF चुनें</span>
      </button>

      {/* Camera — secondary (mobile only, use capture) */}
      <button onClick={() => cameraRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '12px', padding: '13px', cursor: 'pointer' }}>
        <IcCamera size={16} color="#534AB7" />
        <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 500, color: '#534AB7' }}>📱 फ़ोटो लीजिए (मोबाइल)</span>
      </button>

      <div style={{ background: '#F5F4FA', borderRadius: '8px', padding: '8px 12px', fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', lineHeight: 1.4 }}>
        📱 फ़ोटो/PDF आपके फ़ोन पर ही रहती है — हम store नहीं करते।
      </div>

      {/* Hidden inputs */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*,.pdf,application/pdf"   onChange={onFileChange} style={{ display: 'none' }} />
    </div>
  );

  // renderReading is now <ReadingStep /> — extracted above to obey rules of hooks

  // ── Step: result ──────────────────────────────────────────────────────────────
  const renderResult = (isError = false) => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text={result || FALLBACK_TEXT} speakable={!isError} bg={isError ? '#FAECE7' : '#EEEDFE'} />

      {/* Privacy badge */}
      <div style={{ background: '#F5F4FA', borderRadius: '8px', padding: '8px 12px', fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780' }}>
        📱 फ़ोटो आपके फ़ोन पर ही रहती है
      </div>

      {/* General insight bubble (T0–T3) — shown only when connect-dots didn't fire */}
      {insight && !connectDots && (
        <InsightBubble payload={insight} onAction={handleInsightAction} onDismiss={() => setInsight(null)} />
      )}

      {/* Connect-dots insight — shown above "बही में डालें"; observation only, no CTA */}
      {connectDots && (
        <MukundBubble text={`💡 ${connectDots.text}`} speakable bg="#FFFBEA" />
      )}

      {/* Bridge button */}
      {!isError && parsedAmt && (
        <button onClick={goToPassbook} style={{ width: '100%', padding: '14px', borderRadius: '13px', border: 'none', background: '#3B6D11', color: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
          बही में डालें — {fmt(parsedAmt)}
        </button>
      )}

      {/* Take another photo */}
      <button onClick={() => { setStep('home'); setResult(''); setParsedAmt(null); setInsight(null); setConnectDots(null); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #EEEDFE', background: '#fff', color: '#534AB7', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', cursor: 'pointer' }}>
        दोबारा फ़ोटो लें
      </button>
    </div>
  );

  function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFFFFF', maxWidth: '420px', margin: '0 auto' }}>
      <TopBar onBack={() => step !== 'reading' ? nav('/') : undefined} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {step === 'home'    && renderHome()}
        {step === 'reading' && <ReadingStep />}
        {step === 'result'  && renderResult(false)}
        {step === 'error'   && renderResult(true)}
      </div>

      <BottomInputBar compact onSubmit={() => {}} onSpeak={() => {}} onPlus={() => {}} />
    </div>
  );
}
