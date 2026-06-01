// Decoder — Ghar ka Munshi  (route: /#/decoder)
// Camera / gallery → Groq vision → Mukund's explanation → "बही में डालें"
// Photo is NEVER stored. Process and discard immediately.

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Groq from 'groq-sdk';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import { useApp } from '../context/AppContext';
import { computeInsight } from '../engine/insight';
import { logEvent } from '../utils/analytics';
import InsightBubble from '../components/InsightBubble';
import { IcChevronLeft, IcDots, IcCamera, IcFileText } from '../components/icons/Icons';

// ── Groq client ───────────────────────────────────────────────────────────────
const _key = import.meta.env.VITE_GROQ_API_KEY;
const groq = _key ? new Groq({ apiKey: _key, dangerouslyAllowBrowser: true }) : null;

const VISION_MODEL  = 'meta-llama/llama-4-scout-17b-16e-instruct';
const FALLBACK_TEXT = 'यह ठीक से दिख नहीं रहा — दोबारा फ़ोटो लें, रोशनी में।';

const MUKUND_PROMPT = `You are Mukund, a 35-year-old Hindi-speaking financial helper. You speak like a smart older cousin — warm, direct, no jargon. Look at this bill, receipt, or financial document. Reply in Devanagari Hindi, 2-3 sentences max, under 80 words. Cover: 1) What is this document (bill type, from whom) 2) The key amount (total due / paid / balance) 3) One money point: is this normal, is there a saving possible, or is something wrong. End your reply with the amount on a separate line in this exact format: AMOUNT:₹[number]`;

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

function MukundBubble({ text, bg = '#EEEDFE' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '90%' }}>
      <div style={{ marginTop: '2px' }}><PortraitAvatar size={28} online={false} ringed={false} /></div>
      <div style={{ background: bg, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.55, color: '#2C2C2A', whiteSpace: 'pre-wrap' }}>{text}</div>
    </div>
  );
}

// ── Main Decoder ───────────────────────────────────────────────────────────────

export default function Decoder() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();

  const [step, setStep]         = useState('home');   // home | reading | result | error
  const [result, setResult]     = useState('');       // cleaned Mukund text
  const [parsedAmt, setParsedAmt] = useState(null);
  const [insight, setInsight]   = useState(null);

  // Hidden file inputs — one for camera, one for gallery
  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setStep('reading');
    logEvent('decoder_used');

    try {
      if (!groq) throw new Error('no groq key');
      const b64 = await compressToBase64(file);
      const resp = await groq.chat.completions.create({
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
      const raw = resp.choices[0]?.message?.content ?? '';
      if (!raw.trim()) throw new Error('empty response');

      const amt = parseAmount(raw);
      setResult(cleanText(raw));
      setParsedAmt(amt);

      // Push decode to AppContext for insight engine
      if (amt) {
        dispatch({ type: 'ADD_DECODE', payload: {
          bill_type:         'unknown',
          labelHi:           'रसीद',
          amount:             amt,
          recurring:          false,
          saveable:           0,
          monthly_saving:     0,
          annual_plan_cost:   null,
        }});
      }

      // Insight seam — check after decode
      const payload = computeInsight(state);
      if (payload) {
        setInsight(payload);
        dispatch({ type: 'MARK_INSIGHT_FIRED' });
        logEvent('insight_shown');
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
    nav('/passbook', { state: { decoderAmount: parsedAmt } });
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

      <MukundBubble text="जो समझ न आये — बिल, रसीद, मैसेज — उसकी फ़ोटो दिखाइए। पढ़ कर समझाता हूँ।" time="अभी" />

      {/* Camera button — primary */}
      <button onClick={() => cameraRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#534AB7', border: 'none', borderRadius: '14px', padding: '16px', cursor: 'pointer' }}>
        <IcCamera size={22} color="#FFFFFF" />
        <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>फ़ोटो लीजिए</span>
      </button>

      {/* Gallery link — secondary */}
      <button onClick={() => galleryRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '12px', padding: '13px', cursor: 'pointer' }}>
        <IcFileText size={16} color="#534AB7" />
        <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 500, color: '#534AB7' }}>गैलरी से चुनें</span>
      </button>

      <div style={{ background: '#F5F4FA', borderRadius: '8px', padding: '8px 12px', fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', lineHeight: 1.4 }}>
        📱 फ़ोटो आपके फ़ोन पर ही रहती है — हम store नहीं करते।
      </div>

      {/* Hidden inputs */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*"                       onChange={onFileChange} style={{ display: 'none' }} />
    </div>
  );

  // renderReading is now <ReadingStep /> — extracted above to obey rules of hooks

  // ── Step: result ──────────────────────────────────────────────────────────────
  const renderResult = (isError = false) => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text={result || FALLBACK_TEXT} bg={isError ? '#FAECE7' : '#EEEDFE'} />

      {/* Privacy badge */}
      <div style={{ background: '#F5F4FA', borderRadius: '8px', padding: '8px 12px', fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780' }}>
        📱 फ़ोटो आपके फ़ोन पर ही रहती है
      </div>

      {/* Insight bubble */}
      {insight && (
        <InsightBubble payload={insight} onAction={handleInsightAction} onDismiss={() => setInsight(null)} />
      )}

      {/* Bridge button */}
      {!isError && parsedAmt && (
        <button onClick={goToPassbook} style={{ width: '100%', padding: '14px', borderRadius: '13px', border: 'none', background: '#3B6D11', color: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
          बही में डालें — {fmt(parsedAmt)}
        </button>
      )}

      {/* Take another photo */}
      <button onClick={() => { setStep('home'); setResult(''); setParsedAmt(null); setInsight(null); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #EEEDFE', background: '#fff', color: '#534AB7', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', cursor: 'pointer' }}>
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
