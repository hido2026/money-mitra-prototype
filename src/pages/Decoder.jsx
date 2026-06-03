// Decoder — "Ghar ka Munshi"  (route: /#/decoder)
//
// Simulated OCR flow (brief A.2 / I):
//   snap(sim) → transparent "reading" narration → confirm amount →
//   plain-Hindi line-items → concrete "save ₹X" (with HOW) → optional goal bridge
//
// Photo is NEVER stored. Simulated OCR returns ONLY {bill_type, amount}.
// Badge visible at every step: "Simulated OCR — photo stays on your phone."
//
// Electricity: ₹1,562  (₹50 fixed + 180 × ₹8.40 = ₹1,512 + ₹50)
// Recharge:    ₹800 saving  (₹300 × 12 = ₹3,600; yearly plan ₹2,800)

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import { useApp } from '../context/AppContext';
import { computeInsight } from '../engine/insights';
import { Events } from '../engine/instrumentation';
import { speakMukund } from '../utils/tts';
import { SIMULATED_BILLS, BILL_OPTIONS } from '../engine/decoder-data';
import { IcChevronLeft, IcDots, IcCamera, IcFileText, IcCheck, IcRepeat } from '../components/icons/Icons';
import { VOICE_CONFIG } from '../config/app-config';

// ── Sub-components ─────────────────────────────────────────────────────────────
function TopBar({ onBack }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 18px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcChevronLeft size={24} color="#2C2C2A" />
      </button>
      <PortraitAvatar size={40} online ringed />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '15px', fontWeight: 600, color: '#2C2C2A' }}>{VOICE_CONFIG.persona_name}</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#5F5E5A', marginTop: '1px' }}>Ghar ka Munshi · online</div>
      </div>
      <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcDots size={22} color="#2C2C2A" />
      </button>
    </header>
  );
}

function Badge() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      background: '#F0F7FF', border: '1px solid #BEE0FF',
      borderRadius: '8px', padding: '7px 12px',
      fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#2563EB', lineHeight: 1.4,
    }}>
      🔒 Simulated OCR — photo stays on your phone, only the amount is kept.
    </div>
  );
}

function MukundBubble({ text, bg = '#EEEDFE' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '90%' }}>
      <div style={{ marginTop: '2px' }}><PortraitAvatar size={28} online={false} ringed={false} /></div>
      <div style={{ background: bg, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.5, color: '#2C2C2A' }}>{text}</div>
    </div>
  );
}

function BigBtn({ label, accent, onClick, outline = false }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '14px 8px', borderRadius: '12px', border: outline ? `1.5px solid ${accent}` : 'none', background: outline ? '#FFFFFF' : accent, color: outline ? accent : '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
      {label}
    </button>
  );
}

// ── Reading animation component ────────────────────────────────────────────────
function ReadingStep({ steps }) {
  const [shown, setShown] = useState(0);
  const [dots, setDots]   = useState('.');

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 450);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (shown >= steps.length) return;
    const t = setTimeout(() => setShown(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [shown, steps.length]);

  return (
    <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcFileText size={32} color="#534AB7" />
      </div>
      <div style={{ textAlign: 'center', minHeight: '80px' }}>
        {steps.slice(0, shown).map((s, i) => (
          <div key={i} style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: i === shown - 1 ? '17px' : '14px', fontWeight: i === shown - 1 ? 600 : 400, color: i === shown - 1 ? '#2C2C2A' : '#888780', marginBottom: '6px', transition: 'all 0.3s' }}>{s}</div>
        ))}
        {shown < steps.length && <span style={{ color: '#888780' }}>{dots}</span>}
      </div>
    </div>
  );
}

// ── Main Decoder ───────────────────────────────────────────────────────────────
export default function Decoder() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const fileRef = useRef(null);

  const [step, setStep]       = useState('home');   // home | reading | confirm | explain | money_point | bridge
  const [bill, setBill]       = useState(null);
  const [insight, setInsight] = useState(null);
  const [t0, setT0]           = useState(null);

  const pickBill = (id) => {
    const b = SIMULATED_BILLS[id];
    if (!b) return;
    setBill(b);
    setT0(Date.now());
    Events.decoderStarted({ bill_type: id, input_modality: 'tap' });
    setStep('reading');
  };

  // Auto-advance reading → confirm after narration completes
  useEffect(() => {
    if (step !== 'reading' || !bill) return;
    const delay = bill.reading_steps.length * 900 + 800;
    const t = setTimeout(() => setStep('confirm'), delay);
    return () => clearTimeout(t);
  }, [step, bill]);

  const onConfirmYes = () => {
    Events.decoderExplainPlayed({ bill_type: bill.id });
    setStep('explain');
    speakMukund(bill.line_items.map(l => `${l.label}: ₹${l.amount.toLocaleString('en-IN')}. ${l.note}`).join(' '));
  };

  const onConfirmNo = () => {
    // Manual amount entry — go back to home
    setStep('home');
  };

  const onExplainNext = () => {
    Events.decoderMoneyPoint({ bill_type: bill.id, savings: bill.money_point.savings });
    speakMukund(bill.money_point.text);
    setStep('money_point');
  };

  const onReplay = () => {
    Events.decoderReplay({ bill_type: bill.id, segment: 'explain' });
    speakMukund(bill.line_items.map(l => `${l.label}: ₹${l.amount.toLocaleString('en-IN')}. ${l.note}`).join(' '));
  };

  const onBahiAdd = () => {
    // Push decode to AppContext and check for insight
    dispatch({ type: 'ADD_DECODE', payload: { bill_type: bill.id, amount: bill.amount } });
    const payload = computeInsight({ ...state, sessionDecodes: [...state.sessionDecodes, { bill_type: bill.id, amount: bill.amount }] }, null);
    if (payload && !state.insightFired) {
      setInsight(payload);
      dispatch({ type: 'MARK_INSIGHT_FIRED' });
      Events.insightShown({ type: payload.type, savings_amount: payload.savings_amount, had_goal: !!state.goals.length });
      speakMukund(payload.text);
    }
    setStep('bridge');
  };

  const goToPassbook = () => {
    nav('/passbook', { state: { decoderAmount: bill.amount, decoderBillType: bill.id } });
  };

  // ── Step: home ──────────────────────────────────────────────────────────────
  const renderHome = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ padding: '4px 0' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: '#534AB7' }}>GHAR KA MUNSHI</div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '1px' }}>कागज़ समझें</div>
      </div>

      <MukundBubble text="जो समझ न आये — बिल, रसीद — दिखाइए। पढ़ कर समझाता हूँ।" />

      <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '10.5px', fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        कौन सा बिल है?
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {BILL_OPTIONS.map(opt => (
          <button key={opt.id} onClick={() => pickBill(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', border: '1.5px solid #EEEDFE', borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>{opt.icon}</span>
            <div>
              <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 600, color: '#2C2C2A' }}>{opt.label}</div>
              <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', marginTop: '2px' }}>{opt.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Camera stub */}
      <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '12px', padding: '13px', cursor: 'pointer' }}>
        <IcCamera size={16} color="#534AB7" />
        <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 500, color: '#534AB7' }}>📱 फ़ोटो लीजिए (मोबाइल)</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={() => pickBill('electricity')} /* sim: camera → default to electricity */ />

      <Badge />
    </div>
  );

  // ── Step: reading ───────────────────────────────────────────────────────────
  const renderReading = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ReadingStep steps={bill.reading_steps} />
      <div style={{ padding: '0 16px 16px' }}><Badge /></div>
    </div>
  );

  // ── Step: confirm ───────────────────────────────────────────────────────────
  const renderConfirm = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MukundBubble text={`यह ${bill.labelHi} है — ₹${bill.amount.toLocaleString('en-IN')} का। सही है?`} />

      <div style={{ background: '#FAFAFA', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid #EEEDFE' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{bill.labelHi}</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '44px', fontWeight: 700, color: '#2C2C2A', marginTop: '8px', lineHeight: 1 }}>₹{bill.amount.toLocaleString('en-IN')}</div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="हाँ, सही है" accent="#3B6D11" onClick={onConfirmYes} />
        <BigBtn label="नहीं — बदलें" accent="#D85A30" onClick={onConfirmNo} outline />
      </div>
      <Badge />
    </div>
  );

  // ── Step: explain ───────────────────────────────────────────────────────────
  const renderExplain = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <MukundBubble text="देखो — यह बिल इस तरह बना है:" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bill.line_items.map((line, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #F0EFF8', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 600, color: '#2C2C2A', flex: 1, marginRight: '8px' }}>{line.label}</div>
              <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '14px', fontWeight: 700, color: '#534AB7', flexShrink: 0 }}>₹{line.amount.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '11.5px', color: '#5F5E5A', marginTop: '4px', lineHeight: 1.4 }}>{line.note}</div>
          </div>
        ))}
        <div style={{ background: '#EEEDFE', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 700, color: '#534AB7' }}>कुल</div>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#534AB7' }}>₹{bill.amount.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onReplay} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#534AB7' }}>
          <IcRepeat size={14} color="#534AB7" /> फिर सुनें
        </button>
        <button onClick={onExplainNext} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#534AB7', color: '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          आगे → पैसे बचाएं
        </button>
      </div>
    </div>
  );

  // ── Step: money_point ────────────────────────────────────────────────────────
  const renderMoneyPoint = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <MukundBubble text={bill.money_point.text} bg="#EAF3DE" />

      {bill.money_point.savings > 0 && (
        <div style={{ background: '#EAF3DE', border: '1.5px solid #C5E0A8', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#3B6D11', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>बच सकते हैं</div>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '32px', fontWeight: 700, color: '#3B6D11', lineHeight: 1 }}>₹{bill.money_point.savings.toLocaleString('en-IN')}</div>
          <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#5F5E5A', marginTop: '6px' }}>{bill.money_point.how}</div>
        </div>
      )}

      {/* decoderSelfReport fires here via the onBahiAdd handler */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {bill.money_point.savings > 0 && (
          <BigBtn label="बही में जोड़ें →" accent="#3B6D11" onClick={onBahiAdd} />
        )}
        <BigBtn label="ठीक है, शुक्रिया" accent="#534AB7" onClick={() => nav('/')} outline={bill.money_point.savings > 0} />
      </div>
    </div>
  );

  // ── Step: bridge ─────────────────────────────────────────────────────────────
  const renderBridge = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {insight ? (
        <MukundBubble text={insight.text} bg="#FFFBEA" />
      ) : (
        <MukundBubble text={`बही में ₹${bill.amount.toLocaleString('en-IN')} जोड़ दें?`} bg="#EEEDFE" />
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="बही में जाएं →" accent="#3B6D11" onClick={goToPassbook} />
        <BigBtn label="घर" accent="#534AB7" onClick={() => nav('/')} outline />
      </div>

      <button onClick={() => { setBill(null); setInsight(null); setStep('home'); }} style={{ background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '12px', padding: '12px', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#534AB7' }}>
        दोबारा पढ़ें
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FFFFFF', maxWidth: '420px', margin: '0 auto', overflow: 'hidden' }}>
      <TopBar onBack={() => step === 'home' ? nav('/') : setStep('home')} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {step === 'home'        && renderHome()}
        {step === 'reading'     && bill && renderReading()}
        {step === 'confirm'     && bill && renderConfirm()}
        {step === 'explain'     && bill && renderExplain()}
        {step === 'money_point' && bill && renderMoneyPoint()}
        {step === 'bridge'      && bill && renderBridge()}
      </div>
      <BottomInputBar compact voiceStatus="idle" onSubmit={() => {}} onSpeak={() => {}} onPlus={() => {}} />
    </div>
  );
}
