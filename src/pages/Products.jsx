// Products  (route: /#/products)
// JFS integrated products grid. Tap → in-chat discovery → handoff stub.
// Gold risk disclosure shown before any navigation.
// KYC + payment happen in JFS webview, NOT here.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import { IcChevronLeft, IcDots, IcCoins, IcBuilding, IcShield } from '../components/icons/Icons';

// ── Product catalog ───────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'gold',
    emoji: '🥇',
    labelHi: 'डिजिटल गोल्ड',
    subHi: 'SafeGold के ज़रिये · 99.5% शुद्धता',
    accent: '#C8961E',
    accentLight: '#FDF6E3',
    available: true,
    disclosure: 'डिजिटल गोल्ड अनियंत्रित उत्पाद है — SEBI/RBI regulated नहीं है। कृपया सोच-समझकर invest करें।',
    chatIntro: 'Gold में invest करना चाहते हो — अच्छा। पहले बताओ, कितना लगाना है और कितने समय के लिए?',
  },
  {
    id: 'gold_sip',
    emoji: '✨',
    labelHi: 'Gold SIP',
    subHi: 'हर महीने थोड़ा-थोड़ा · ₹100 से शुरू',
    accent: '#C8961E',
    accentLight: '#FDF6E3',
    available: true,
    disclosure: 'डिजिटल गोल्ड अनियंत्रित उत्पाद है — SEBI/RBI regulated नहीं है। कृपया सोच-समझकर invest करें।',
    chatIntro: 'Gold SIP — हर महीने ₹100 से शुरू हो सकता है। पहले बताओ, कितना महीने में लगाना है?',
  },
  {
    id: 'fd',
    emoji: '🏦',
    labelHi: 'Fixed Deposit',
    subHi: 'गारंटीड रिटर्न · DICGC covered',
    accent: '#534AB7',
    accentLight: '#EEEDFE',
    available: true,
    disclosure: null, // No special risk disclosure for FD
    chatIntro: 'FD — safe, predictable. पहले बताओ: कितना रखना है और कितने समय के लिए?',
  },
];

const COMING_SOON = [
  { label: 'Credit Card', emoji: '💳' },
  { label: 'Insurance', emoji: '🛡️' },
  { label: 'Loan', emoji: '🤝' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function TopBar({ onBack }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '4px 18px 14px',
      borderBottom: '0.5px solid rgba(0,0,0,0.05)',
      flexShrink: 0,
    }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcChevronLeft size={24} color="#2C2C2A" />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#2C2C2A' }}>Products</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#5F5E5A', marginTop: '1px' }}>JFS Integrated</div>
      </div>
      <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcDots size={22} color="#2C2C2A" />
      </button>
    </header>
  );
}

function MukundBubble({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '90%' }}>
      <div style={{ marginTop: '2px' }}>
        <PortraitAvatar size={28} online={false} ringed={false} />
      </div>
      <div style={{
        background: '#EEEDFE', borderRadius: '4px 16px 16px 16px',
        padding: '11px 14px',
        fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
        fontSize: '14px', lineHeight: 1.5, color: '#2C2C2A',
      }}>{text}</div>
    </div>
  );
}

// ── Disclosure + handoff modal ────────────────────────────────────────────────
function DisclosureModal({ product, onProceed, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 200,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px', maxWidth: '420px', width: '100%',
        }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '999px', background: '#E0E0E0', margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: product.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>
            {product.emoji}
          </div>
          <div>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#2C2C2A' }}>
              {product.labelHi}
            </div>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#5F5E5A', marginTop: '2px' }}>
              {product.subHi}
            </div>
          </div>
        </div>

        {product.disclosure && (
          <div style={{
            background: '#FDF6E3', border: '1px solid #F0D88A', borderRadius: '10px',
            padding: '10px 14px', marginBottom: '14px',
            display: 'flex', gap: '8px',
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12.5px', color: '#7A5C0A', lineHeight: 1.5 }}>
              {product.disclosure}
            </div>
          </div>
        )}

        <div style={{
          background: '#EEEDFE', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
          fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12.5px', color: '#3A3380', lineHeight: 1.5,
        }}>
          आगे का काम JFS की सुरक्षित स्क्रीन पर पूरा होगा — KYC और payment वहीं होंगे।
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '13px', borderRadius: '12px',
            border: '1.5px solid #EEEDFE', background: '#FFFFFF',
            fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, color: '#534AB7', cursor: 'pointer',
          }}>रद्द</button>
          <button onClick={onProceed} style={{
            flex: 2, padding: '13px', borderRadius: '12px', border: 'none',
            background: product.accent, color: '#FFFFFF',
            fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer',
          }}>JFS पर जाएं →</button>
        </div>
      </div>
    </div>
  );
}

// ── Discovery chat for a product ──────────────────────────────────────────────
function DiscoveryView({ product, onHandoff, onBack }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text={product.chatIntro} />

      {/* Eligibility chips — NON-PII only */}
      <div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '10.5px', fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          आगे जानने के लिए
        </div>
        {['₹1,000 से कम', '₹1,000 – ₹10,000', '₹10,000 से ज़्यादा'].map(opt => (
          <button key={opt} onClick={onHandoff} style={{
            display: 'block', width: '100%', marginBottom: '8px',
            padding: '12px 14px', borderRadius: '11px', cursor: 'pointer', textAlign: 'left',
            border: `1.5px solid ${product.accentLight}`,
            background: '#FFFFFF',
            fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
            fontSize: '14px', color: '#2C2C2A',
          }}>{opt}</button>
        ))}
      </div>

      <button onClick={onBack} style={{
        background: 'none', border: '1.5px solid #EEEDFE', borderRadius: '12px',
        padding: '12px', cursor: 'pointer',
        fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
        fontSize: '14px', color: '#534AB7',
      }}>← वापस</button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Products() {
  const nav = useNavigate();
  const [selected, setSelected] = useState(null);    // product in discovery
  const [modal, setModal] = useState(null);           // product in handoff modal

  const openProduct = (product) => {
    setSelected(product);
  };

  const triggerHandoff = (product) => {
    setModal(product);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFFFFF', maxWidth: '420px', margin: '0 auto' }}>
      {modal && (
        <DisclosureModal
          product={modal}
          onProceed={() => {
            // Handoff stub — real SDK integration happens here
            alert('JFS handoff stub — SafeGold / FD SDK would open here.');
            setModal(null); setSelected(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      <TopBar onBack={() => selected ? setSelected(null) : nav('/')} />

      {selected ? (
        <DiscoveryView
          product={selected}
          onHandoff={() => triggerHandoff(selected)}
          onBack={() => setSelected(null)}
        />
      ) : (
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '0 4px 4px' }}>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: '#534AB7' }}>
              INTEGRATED PRODUCTS
            </div>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '1px' }}>
              JFS से सीधे जोड़ा हुआ
            </div>
          </div>

          {PRODUCTS.map(p => (
            <button key={p.id} onClick={() => openProduct(p)} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              background: '#FFFFFF', border: `1.5px solid ${p.accentLight}`,
              borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: p.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', flexShrink: 0,
              }}>{p.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 700, color: '#2C2C2A' }}>
                  {p.labelHi}
                </div>
                <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11.5px', color: '#5F5E5A', marginTop: '3px' }}>
                  {p.subHi}
                </div>
              </div>
              <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '16px', color: p.accent, fontWeight: 700, flexShrink: 0 }}>›</div>
            </button>
          ))}

          {/* Coming soon */}
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              जल्द आ रहा है
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COMING_SOON.map(c => (
                <div key={c.label} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#F9F8FB', border: '1.5px dashed rgba(83,74,183,0.2)',
                  borderRadius: '10px', padding: '8px 12px',
                }}>
                  <span style={{ fontSize: '14px' }}>{c.emoji}</span>
                  <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#888780' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance footer */}
          <div style={{
            background: '#F5F4FA', borderRadius: '10px', padding: '10px 14px', marginTop: '4px',
            fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', lineHeight: 1.5,
          }}>
            🔒 PII हमारी screen पर capture नहीं होती · KYC + payment JFS की सुरक्षित screen पर
          </div>
        </div>
      )}
    </div>
  );
}
