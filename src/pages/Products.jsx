// Products  (route: /#/products)
// NOT on home — accessible post-habit only (from inside goal flow).
//
// COMPLIANCE (brief A.4/A.5, G):
//   - Gold disclosure: mandatory, non-skippable, in-voice, BEFORE amount/handoff.
//   - 3 points: unregulated / price can fall / information not advice.
//   - 2 "unclear" responses → return to home, no purchase.
//   - guardrail_disclosure_skipped MUST stay 0 — stop-ship if not.
//   - Figures are ILLUSTRATIVE ONLY: gold ₹7,000/g, FD 7%.
//   - Never show returns/growth/profit. Label rates illustrative.
//   - KYC + payment = JFS SDK stub only. No PII captured here.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import { IcChevronLeft, IcDots } from '../components/icons/Icons';
import { Events } from '../engine/instrumentation';
import { speakMukund } from '../utils/tts';
import { VOICE_CONFIG } from '../config/app-config';

// ── Product catalog ───────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'gold',
    emoji: '🥇',
    labelHi: 'डिजिटल गोल्ड',
    subHi: 'SafeGold के ज़रिये',
    accent: '#C8961E',
    accentLight: '#FDF6E3',
    needsDisclosure: true,
    // Illustrative only — NEVER show as real advice or returns
    illustrative: {
      note: 'उदाहरण (illustrative only — real rate sourced before live use):',
      lines: [
        '₹1,000 invest → लगभग 0.14 gram (₹7,000/g illustrative rate)',
        'कीमत ऊपर-नीचे होती रहती है — guaranteed नहीं',
      ],
    },
  },
  {
    id: 'gold_sip',
    emoji: '✨',
    labelHi: 'Gold SIP',
    subHi: 'हर महीने थोड़ा-थोड़ा · ₹100 से',
    accent: '#C8961E',
    accentLight: '#FDF6E3',
    needsDisclosure: true,
    illustrative: {
      note: 'उदाहरण (illustrative only):',
      lines: ['₹100/month × 12 = ₹1,200 invested → ~0.17 gram (₹7,000/g rate)', 'कीमत उतार-चढ़ाव के साथ चलती है'],
    },
  },
  {
    id: 'fd',
    emoji: '🏦',
    labelHi: 'Fixed Deposit',
    subHi: 'गारंटीड रिटर्न · DICGC covered',
    accent: '#534AB7',
    accentLight: '#EEEDFE',
    needsDisclosure: false,
    illustrative: {
      note: 'उदाहरण (illustrative — real rate must be sourced before live use):',
      lines: ['₹10,000 × 7% × 1 year = ₹10,700 maturity (7% illustrative rate)', 'Actual bank rate varies — check with your bank'],
    },
  },
];

const COMING_SOON = ['Credit Card 💳', 'Insurance 🛡️', 'Loan 🤝'];

// Gold disclosure: 3 mandatory points read aloud
const GOLD_DISCLOSURE_SCRIPT = [
  'पहली बात: Digital gold ek unregulated product hai — isko RBI ya SEBI regulate nahi karta.',
  'Doosri baat: Sone ki keemat upar-neeche hoti rehti hai — aapka paisa kum bhi ho sakta hai.',
  'Teesri baat: Yeh information hai, koi advice nahi. Khareednay se pehle apne aap decide karein.',
];

function TopBar({ onBack }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 18px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcChevronLeft size={24} color="#2C2C2A" />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#2C2C2A' }}>Products</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#5F5E5A' }}>JFS Integrated</div>
      </div>
      <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcDots size={22} color="#2C2C2A" />
      </button>
    </header>
  );
}

function MukundBubble({ text, bg = '#EEEDFE' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '92%' }}>
      <div style={{ marginTop: '2px' }}><PortraitAvatar size={28} online={false} ringed={false} /></div>
      <div style={{ background: bg, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.5, color: '#2C2C2A' }}>{text}</div>
    </div>
  );
}

// ── Gold Disclosure Gate (non-skippable) ──────────────────────────────────────
function GoldDisclosureGate({ product, onPassed, onAbort }) {
  const [step, setStep]            = useState(0);   // 0,1,2 = the 3 points
  const [unclearCount, setUnclear] = useState(0);
  const [heard, setHeard]          = useState([false, false, false]);

  const currentLine = GOLD_DISCLOSURE_SCRIPT[step];

  const playStep = (s) => {
    speakMukund(GOLD_DISCLOSURE_SCRIPT[s]);
    Events.productsDisclosureStarted({ product_id: product.id, step: s });
  };

  const markHeard = () => {
    const newHeard = [...heard];
    newHeard[step] = true;
    setHeard(newHeard);
    Events.productsDisclosureHeard({ product_id: product.id, step });
    if (step < 2) {
      setStep(s => s + 1);
      playStep(step + 1);
    } else {
      onPassed();
    }
  };

  const markUnclear = () => {
    const count = unclearCount + 1;
    setUnclear(count);
    Events.guardrailConfused({ product_id: product.id, step });
    if (count >= 2) {
      // 2 unclear → abort, return to home
      Events.guardrailAbandoned({ product_id: product.id, reason: '2_unclear_disclosures' });
      onAbort();
    } else {
      // Replay current step
      playStep(step);
    }
  };

  // Auto-play on mount
  useState(() => { setTimeout(() => playStep(0), 300); });

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Disclosure header */}
      <div style={{ background: '#FDF6E3', border: '1.5px solid #F0D88A', borderRadius: '14px', padding: '14px' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 700, color: '#7A5C0A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          ⚠️ ज़रूरी जानकारी — {step + 1}/3
        </div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#2C2C2A', lineHeight: 1.6 }}>
          {currentLine}
        </div>
      </div>

      {/* Replay */}
      <button onClick={() => playStep(step)} style={{ background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#534AB7' }}>
        🔊 फिर से सुनें
      </button>

      {/* Understood / Not clear */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={markHeard} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#534AB7', color: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
          समझ गया {step < 2 ? '→' : '✓'}
        </button>
        <button onClick={markUnclear} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #EEEDFE', background: '#fff', color: '#888780', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', cursor: 'pointer' }}>
          समझ नहीं आया
        </button>
      </div>

      {unclearCount > 0 && (
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#D85A30', textAlign: 'center' }}>
          एक बार और समझ नहीं आया तो हम रुक जाएंगे — कोई जल्दी नहीं।
        </div>
      )}
    </div>
  );
}

// ── Discovery view ────────────────────────────────────────────────────────────
function DiscoveryView({ product, onHandoff, onBack }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text={`${product.labelHi} — जानना चाहती हैं? पहले बताएं: कितना लगाना है और कितने समय के लिए?`} bg={product.accentLight} />

      {/* Illustrative figures — clearly labelled */}
      <div style={{ background: '#F5F4FA', borderRadius: '12px', padding: '12px 14px' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', marginBottom: '6px', fontStyle: 'italic' }}>{product.illustrative.note}</div>
        {product.illustrative.lines.map((l, i) => (
          <div key={i} style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#5F5E5A', lineHeight: 1.4, marginBottom: '3px' }}>· {l}</div>
        ))}
      </div>

      {/* Amount chips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {['₹500', '₹1,000', '₹5,000'].map(amt => (
          <button key={amt} onClick={onHandoff} style={{ padding: '12px 4px', borderRadius: '10px', border: `1.5px solid ${product.accentLight}`, background: '#FFFFFF', cursor: 'pointer', fontFamily: "'JioType',sans-serif", fontSize: '14px', fontWeight: 600, color: product.accent, textAlign: 'center' }}>
            {amt}
          </button>
        ))}
      </div>

      <div style={{ background: product.accentLight, borderRadius: '10px', padding: '10px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12.5px', color: '#3A3380', lineHeight: 1.5 }}>
        आगे का काम JFS की सुरक्षित स्क्रीन पर पूरा होगा — KYC और payment वहीं।
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1.5px solid #EEEDFE', background: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#534AB7', cursor: 'pointer' }}>← वापस</button>
        <button onClick={onHandoff} style={{ flex: 2, padding: '13px', borderRadius: '12px', border: 'none', background: product.accent, color: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>JFS पर जाएं →</button>
      </div>
    </div>
  );
}

// ── Handoff stub ──────────────────────────────────────────────────────────────
function HandoffStub({ product, onReturn }) {
  return (
    <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px' }}>{product.emoji}</div>
      <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 600, color: '#2C2C2A' }}>
        आप अब JFS की सुरक्षित स्क्रीन पर जा रहे हैं…
      </div>
      <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', lineHeight: 1.5, maxWidth: '300px' }}>
        KYC, amount, और payment — सब JFS की screen पर होगा।<br />हम कोई जानकारी नहीं रखते।
      </div>
      <div style={{ background: '#F5F4FA', borderRadius: '10px', padding: '12px 16px', fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', lineHeight: 1.4 }}>
        [SDK STUB — real JFS integration goes here]
      </div>
      <button onClick={onReturn} style={{ padding: '14px 32px', borderRadius: '12px', border: '1.5px solid #EEEDFE', background: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#534AB7', cursor: 'pointer' }}>
        ← Money Mitra पर वापस
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Products() {
  const nav = useNavigate();
  const [view, setView] = useState('grid');           // grid | disclosure | discovery | handoff
  const [selected, setSelected] = useState(null);

  const openProduct = (product) => {
    setSelected(product);
    Events.productsDiscoveryShown({ product_id: product.id });
    if (product.needsDisclosure) {
      setView('disclosure');
    } else {
      setView('discovery');
    }
  };

  const onDisclosurePassed = () => {
    Events.productsIntentExpressed({ product_id: selected.id });
    setView('discovery');
  };

  const onDisclosureAbort = () => {
    // 2 unclear → guardrail: return to home
    nav('/');
  };

  const onHandoff = () => {
    Events.productsHandoffInitiated({ product_id: selected.id });
    setView('handoff');
  };

  const onReturn = () => {
    Events.productsHandoffReturned({ product_id: selected.id });
    setView('grid');
    setSelected(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFFFFF', maxWidth: '420px', margin: '0 auto' }}>
      <TopBar onBack={() => view !== 'grid' ? setView('grid') : nav('/')} />

      {view === 'grid' && (
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '0 4px' }}>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: '#534AB7' }}>INTEGRATED PRODUCTS</div>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '1px' }}>JFS से सीधे जोड़ा हुआ</div>
          </div>

          {PRODUCTS.map(p => (
            <button key={p.id} onClick={() => openProduct(p)} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#FFFFFF', border: `1.5px solid ${p.accentLight}`, borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: p.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{p.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 700, color: '#2C2C2A' }}>{p.labelHi}</div>
                <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11.5px', color: '#5F5E5A', marginTop: '3px' }}>{p.subHi}</div>
                {p.needsDisclosure && (
                  <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#C8961E', marginTop: '3px' }}>⚠️ Disclosure required</div>
                )}
              </div>
              <span style={{ fontSize: '18px', color: p.accent, fontWeight: 700 }}>›</span>
            </button>
          ))}

          {/* Coming soon */}
          <div>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>जल्द आ रहा है</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COMING_SOON.map(c => (
                <div key={c} style={{ background: '#F9F8FB', border: '1.5px dashed rgba(83,74,183,0.2)', borderRadius: '10px', padding: '8px 12px', fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#888780' }}>{c}</div>
              ))}
            </div>
          </div>

          <div style={{ background: '#F5F4FA', borderRadius: '10px', padding: '10px 14px', fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', lineHeight: 1.5 }}>
            🔒 PII हमारी screen पर capture नहीं होती · KYC + payment JFS की सुरक्षित screen पर
          </div>
        </div>
      )}

      {view === 'disclosure' && selected && (
        <GoldDisclosureGate product={selected} onPassed={onDisclosurePassed} onAbort={onDisclosureAbort} />
      )}
      {view === 'discovery' && selected && (
        <DiscoveryView product={selected} onHandoff={onHandoff} onBack={() => setView('grid')} />
      )}
      {view === 'handoff' && selected && (
        <HandoffStub product={selected} onReturn={onReturn} />
      )}
    </div>
  );
}
