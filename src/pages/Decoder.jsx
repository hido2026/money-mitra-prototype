// Decoder — Document Decoder  (route: /#/decoder)
// Voice-first, Hindi. Simulated OCR — no real image processing.
// After a decode resolves → fire insight engine at money_point seam.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import InsightBubble from '../components/InsightBubble';
import { useApp } from '../context/AppContext';
import { computeInsight } from '../engine/insight';
import {
  IcChevronLeft, IcDots, IcCamera, IcZap, IcSmartphone,
  IcFileText, IcCheck, IcXMark, IcRepeat,
} from '../components/icons/Icons';

// ── Canned bill data ───────────────────────────────────────────────────────────
const BILLS = {
  electricity: {
    id: 'electricity',
    labelHi: 'बिजली बिल',
    amount: 1240,
    lines: [
      { labelHi: 'फ़िक्स्ड चार्ज',          amount: 50,      note: 'हर महीने यही रहता है — बदलता नहीं' },
      { labelHi: 'यूनिट चार्ज (180 यूनिट)', amount: 1181.60, note: 'पहले 100 यूनिट ₹3.50, बाकी 80 यूनिट ₹5.80/यूनिट (slab दर)' },
      { labelHi: 'फ्यूल सरचार्ज',           amount: 8.40,    note: 'सरकार हर महीने तय करती है — इस पे आपका control नहीं' },
    ],
    moneyPoint: {
      type: 'save',
      text: '20 यूनिट कम जलाएं तो ₹116 बच सकते हैं अगले महीने।',
      saveable: 116,
      how: 'LED बल्ब + पंखा बंद जब कमरे में न हों।',
    },
    // Decode payload written to AppContext
    decodePayload: {
      bill_type: 'electricity',
      labelHi: 'बिजली बिल',
      amount: 1240,
      recurring: true,
      saveable: 116,
      monthly_saving: 116,
      annual_plan_cost: null,
    },
  },
  recharge: {
    id: 'recharge',
    labelHi: 'मोबाइल रिचार्ज',
    amount: 300,
    lines: [
      { labelHi: 'मासिक प्लान',   amount: 300,  note: '28 दिन · Unlimited calls · 1.5GB/day' },
      { labelHi: 'सालाना खर्चा', amount: 3600, note: '₹300 × 12 = ₹3,600 साल भर में' },
    ],
    moneyPoint: {
      type: 'save',
      text: 'साल का plan ₹2,800 में आता है — ₹800 बचते हैं।',
      saveable: 800,
      how: 'एक बार में ₹2,800 भरो — पूरे साल की टेंशन ख़त्म।',
    },
    decodePayload: {
      bill_type: 'recharge',
      labelHi: 'मोबाइल रिचार्ज',
      amount: 300,
      recurring: true,
      saveable: 800,
      monthly_saving: 800 / 12,   // ≈ ₹66.7/month
      annual_plan_cost: 2800,
    },
  },
};

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// ── Shared sub-components ──────────────────────────────────────────────────────
function TopBar({ onBack }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 18px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcChevronLeft size={24} color="#2C2C2A" />
      </button>
      <PortraitAvatar size={40} online ringed />
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '15px', fontWeight: 600, color: '#2C2C2A' }}>Mukund</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#5F5E5A', marginTop: '1px' }}>Money Mitra · online</div>
      </div>
      <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcDots size={22} color="#2C2C2A" />
      </button>
    </header>
  );
}

function Banner() {
  return (
    <div style={{ padding: '12px 20px 4px' }}>
      <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: '#534AB7' }}>SAMJHO</div>
      <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '1px' }}>दस्तावेज़ पढ़ें</div>
    </div>
  );
}

function MukundBubble({ text, bg = '#EEEDFE', time }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '90%' }}>
      <div style={{ marginTop: '2px' }}><PortraitAvatar size={28} online={false} ringed={false} /></div>
      <div>
        <div style={{ background: bg, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.5, color: '#2C2C2A' }}>{text}</div>
        {time && <div style={{ marginTop: '4px', paddingLeft: '4px', fontSize: '10px', color: '#888780', fontFamily: "'JioType',sans-serif" }}>{time}</div>}
      </div>
    </div>
  );
}

function BigBtn({ label, accent, onClick, outline = false }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '13px 0', borderRadius: '12px', border: outline ? `1.5px solid ${accent}` : 'none', background: outline ? '#FFFFFF' : accent, color: outline ? accent : '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{label}</button>
  );
}

// ── Step renderers ─────────────────────────────────────────────────────────────

function StepHome({ onSelect }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <MukundBubble text="जो समझ न आये — बिल, रसीद, मैसेज — उसकी फोटो दिखाइए। पढ़ कर समझाता हूँ।" bg="#EEEDFE" time="अभी" />
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.5px', color: '#888780', textTransform: 'uppercase', marginBottom: '10px' }}>या इनमें से चुनो</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'electricity', icon: <IcZap size={16} color="#D85A30"/>, label: 'बिजली बिल', sub: 'UPPCL / BSES / MSEDCL जैसा' },
            { id: 'recharge',    icon: <IcSmartphone size={16} color="#534AB7"/>, label: 'मोबाइल रिचार्ज', sub: 'Jio / Airtel / Vi' },
            { id: 'other',       icon: <IcFileText size={16} color="#888780"/>, label: 'कुछ और', sub: 'बैंक स्टेटमेंट, रसीद, मैसेज' },
          ].map(({ id, icon, label, sub }) => (
            <button key={id} onClick={() => onSelect(id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', border: '1.5px solid #EEEDFE', borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 600, color: '#2C2C2A' }}>{label}</div>
                <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', marginTop: '2px' }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => onSelect('camera')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#534AB7', border: 'none', borderRadius: '14px', padding: '14px', cursor: 'pointer', marginTop: '4px' }}>
        <IcCamera size={20} color="#FFFFFF" />
        <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>फ़ोटो लीजिए</span>
      </button>
      <div style={{ background: '#F5F4FA', borderRadius: '8px', padding: '8px 12px', fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', lineHeight: 1.4 }}>
        🔒 Simulated OCR — amount only · कोई PII save नहीं होता · सिर्फ़ जानकारी के लिए
      </div>
    </div>
  );
}

function StepReading({ bill }) {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IcFileText size={32} color="#534AB7" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 600, color: '#2C2C2A' }}>पढ़ रहा हूँ{dots}</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#888780', marginTop: '6px' }}>{bill?.labelHi ?? 'दस्तावेज़'}</div>
      </div>
      <div style={{ background: '#F5F4FA', borderRadius: '8px', padding: '8px 14px', fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780' }}>Simulated OCR — amount only</div>
    </div>
  );
}

function StepConfirm({ bill, onYes, onNo }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MukundBubble text={`यह ${bill.labelHi} है — ${fmt(bill.amount)} का। सही है?`} bg="#EEEDFE" time="अभी" />
      <div style={{ background: '#FAFAFA', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid #EEEDFE' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{bill.labelHi}</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '42px', fontWeight: 700, color: '#2C2C2A', marginTop: '8px', lineHeight: 1 }}>{fmt(bill.amount)}</div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="हाँ, सही है" accent="#3B6D11" onClick={onYes} />
        <BigBtn label="नहीं" accent="#D85A30" onClick={onNo} outline />
      </div>
    </div>
  );
}

function StepExplain({ bill, onNext, onReplay }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <MukundBubble text="देखो — यह बिल इस तरह बना है:" bg="#EEEDFE" time="अभी" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bill.lines.map((line, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #F0EFF8', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 600, color: '#2C2C2A', flex: 1, marginRight: '8px' }}>{line.labelHi}</div>
              <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '14px', fontWeight: 700, color: '#534AB7', flexShrink: 0 }}>{fmt(line.amount)}</div>
            </div>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '11.5px', color: '#5F5E5A', marginTop: '4px', lineHeight: 1.4 }}>{line.note}</div>
          </div>
        ))}
        <div style={{ background: '#EEEDFE', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 700, color: '#534AB7' }}>कुल</div>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#534AB7' }}>{fmt(bill.amount)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button onClick={onReplay} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#534AB7' }}>
          <IcRepeat size={14} color="#534AB7" /> फिर सुनें
        </button>
        <button onClick={onNext} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#534AB7', color: '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>आगे →</button>
      </div>
    </div>
  );
}

// ── money_point — INSIGHT SEAM ─────────────────────────────────────────────────
function StepMoneyPoint({ bill, insight, onAction, onDismissInsight, onBridge, onDone }) {
  const mp = bill.moneyPoint;
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <MukundBubble text={`${mp.text} — ${mp.how}`} bg="#EEEDFE" time="अभी" />

      <div style={{ background: '#EAF3DE', border: '1.5px solid #C5E0A8', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#3B6D11', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>बच सकते हैं</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '32px', fontWeight: 700, color: '#3B6D11', lineHeight: 1 }}>₹{mp.saveable.toLocaleString('en-IN')}</div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#5F5E5A', marginTop: '2px' }}>{mp.how}</div>
      </div>

      {/* ── Insight bubble fires HERE — at the money_point seam ── */}
      {insight && (
        <InsightBubble
          payload={insight}
          onAction={onAction}
          onDismiss={onDismissInsight}
        />
      )}

      {/* Bridge / done buttons — only if no insight action covers it */}
      {!insight && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <BigBtn label="बही में जोड़ें →" accent="#3B6D11" onClick={onBridge} />
          <BigBtn label="ठीक है" accent="#534AB7" onClick={onDone} outline />
        </div>
      )}
      {insight && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <BigBtn label="मुख्य पेज" accent="#534AB7" onClick={onDone} outline />
        </div>
      )}
    </div>
  );
}

function StepVoiceFallback({ onBack }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <MukundBubble text="पूरा पढ़ नहीं पाया। रकम बोल दीजिए — मैं समझाता हूँ।" bg="#FAECE7" time="अभी" />
      <button onClick={onBack} style={{ background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '12px', padding: '12px', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#534AB7' }}>← वापस जाएं</button>
    </div>
  );
}

// ── Main Decoder ───────────────────────────────────────────────────────────────
export default function Decoder() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();

  const [step, setStep]           = useState('home');
  const [bill, setBill]           = useState(null);
  const [insight, setInsight]     = useState(null);   // fires at money_point seam

  const pickBill = (id) => {
    if (id === 'other' || id === 'camera') { setBill(null); setStep('reading_other'); return; }
    setBill(BILLS[id]);
    setStep('reading');
  };

  // Auto-advance reading → confirm/fallback
  useEffect(() => {
    if (step === 'reading') {
      const t = setTimeout(() => {
        // Push decode to AppContext so insight engine can see it
        dispatch({ type: 'ADD_DECODE', payload: bill.decodePayload });
        setStep('confirm');
      }, 2200);
      return () => clearTimeout(t);
    }
    if (step === 'reading_other') {
      const t = setTimeout(() => setStep('voice_fallback'), 2200);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ── INSIGHT SEAM: compute when entering money_point ────────────────────────
  const enterMoneyPoint = () => {
    const payload = computeInsight(state);
    if (payload) {
      setInsight(payload);
      dispatch({ type: 'MARK_INSIGHT_FIRED' });
    }
    setStep('money_point');
  };

  // Insight action handler from Decoder context
  const handleInsightAction = (action) => {
    if (action === 'add_to_bahi') {
      nav('/passbook', { state: { fromDecoder: true, saveable: bill?.moneyPoint?.saveable, label: bill?.moneyPoint?.text } });
    } else if (action === 'set_goal') {
      nav('/passbook', { state: { openGoal: true } });
    }
  };

  const goToPassbook = () => {
    nav('/passbook', { state: { fromDecoder: true, saveable: bill?.moneyPoint?.saveable, label: bill?.moneyPoint?.text } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFFFFF', maxWidth: '420px', margin: '0 auto' }}>
      <TopBar onBack={() => step === 'home' ? nav('/') : setStep('home')} />
      <Banner />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {step === 'home'           && <StepHome onSelect={pickBill} />}
        {(step === 'reading' || step === 'reading_other') && <StepReading bill={bill} />}
        {step === 'confirm'        && bill && <StepConfirm bill={bill} onYes={enterMoneyPoint} onNo={() => setStep('voice_fallback')} />}
        {step === 'explain'        && bill && <StepExplain bill={bill} onNext={enterMoneyPoint} onReplay={() => setStep('explain')} />}
        {step === 'money_point'    && bill && (
          <StepMoneyPoint
            bill={bill}
            insight={insight}
            onAction={handleInsightAction}
            onDismissInsight={() => setInsight(null)}
            onBridge={goToPassbook}
            onDone={() => nav('/')}
          />
        )}
        {step === 'voice_fallback' && <StepVoiceFallback onBack={() => setStep('home')} />}
      </div>
      <BottomInputBar compact onSubmit={() => {}} onSpeak={() => {}} onPlus={() => {}} />
    </div>
  );
}
