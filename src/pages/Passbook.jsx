// मेरा हिसाब (route: /#/passbook) — REPLACES the old manual passbook.
// Auto-built from decoded documents only. NO manual entry: no amount buttons,
// no amount field, no category chips, no मिला/खर्च/आगे flow. Nothing typed.
// In-memory feed (state.docs). "भूल जाओ" removes a row — memory is the user's to clear.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang, LangToggle } from '../hooks/useLang';
import { useCountUp, inr } from '../utils/motion';
import { JACKPOT_POINTS, JACKPOT_RUPEES, REDEEM_PARTNER, directionLabel } from '../data/decoder-samples';
import { hisaabInsights } from '../utils/insights';
import EditEntrySheet from '../components/EditEntrySheet';
import {
  IcChevronLeft, IcReceipt, IcZap, IcSmartphone, IcFileDollar, IcSparks, IcXMark, IcCamera,
  IcShield, IcChartLine, IcBuilding,
  IcWallet, IcLock, IcFork, IcCart, IcGas, IcUpi, IcCoin, IcGoldCoin,
} from '../components/icons/Icons';

const timeLabel = (ts) => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const PURPLE = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const GREEN = '#1a7d4b';
const INK = '#2C2C2A';
const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";

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

export default function Passbook() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const [lang, setLang] = useLang();
  const [toast, setToast] = useState(false);
  const [editId, setEditId] = useState(null);

  const docs = state.docs;
  const editDoc = docs.find(d => d.id === editId) || null;
  // Bill reminders — any decoded doc that carries a due date.
  const reminders = docs.filter(d => d.dueDate);
  // D1: borrowed money (loan disbursal, CC credit) NEVER counts as income.
  const aaya = docs.filter(d => d.dir === 'in' && !d.borrowed).reduce((s, d) => s + d.amount, 0);
  const udhar = docs.filter(d => d.borrowed).reduce((s, d) => s + d.amount, 0);
  const gaya = docs.filter(d => d.dir === 'out').reduce((s, d) => s + d.amount, 0);
  const bache = aaya - gaya;
  const totalPoints = docs.reduce((s, d) => s + (d.points || 0), 0);
  // D3: suppress balance metric when no real income doc present
  const hasRealIncome = docs.some(d => d.dir === 'in' && !d.borrowed);

  const aC = useCountUp(aaya);
  const gC = useCountUp(gaya);
  const bC = useCountUp(Math.abs(bache));
  const uC = useCountUp(udhar);

  // Cumulative insight cards — recompute on every render (decode / भूल जाओ).
  const insights = hisaabInsights(docs);

  const redeem = () => { setToast(true); setTimeout(() => setToast(false), 2200); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#F6F5FB', maxWidth: '420px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px 12px', background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <button onClick={() => nav('/decoder')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }} aria-label="Back">
          <IcChevronLeft size={24} color={INK} />
        </button>
        <h1 style={{ flex: 1, fontFamily: DEVA, fontSize: '18px', fontWeight: 900, color: INK, margin: 0, letterSpacing: '-0.3px' }}>
          {lang === 'en' ? 'My Ledger' : 'मेरा हिसाब'}
        </h1>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Metrics — D1: आया excludes borrowed; D3: बचे suppressed without real income */}
        <div className="animate-fade-in" style={{ display: 'flex', gap: '10px' }}>
          <Metric label={lang === 'en' ? 'In' : 'आया'} value={inr(aC)} color={GREEN} />
          <Metric label={lang === 'en' ? 'Out' : 'गया'} value={inr(gC)} color={PURPLE} />
          {hasRealIncome
            ? <Metric label={lang === 'en' ? (bache >= 0 ? 'Saved' : 'Short') : (bache >= 0 ? 'बचे' : 'कम पड़े')} value={inr(bC)} color={bache >= 0 ? INK : '#c0392b'} emphasised />
            : <Metric label={lang === 'en' ? 'Saved' : 'बचे'} value="—" color="#888780" emphasised />
          }
        </div>
        {/* D2: borrowed section shown only when present */}
        {udhar > 0 && (
          <div className="animate-fade-in" style={{ background: '#FFF8E1', border: '1px solid #F3DBA0', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: DEVA, fontSize: '13px', fontWeight: 700, color: '#7B5C00', flex: 1 }}>
              {lang === 'en' ? 'Loan / Borrowed' : 'उधार / ऋण मिला'}
            </span>
            <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 800, color: '#7B5C00' }}>{inr(uC)}</span>
          </div>
        )}

        {/* कुल इनाम */}
        <div className="animate-fade-in" style={{ background: PURPLE, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', animationDelay: '60ms' }}>
          <IcSparks size={24} color="#FFD479" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 800, color: '#fff' }}>कुल इनाम — {totalPoints.toLocaleString('en-IN')} अंक</div>
            <div style={{ fontFamily: DEVA, fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>{JACKPOT_POINTS.toLocaleString('en-IN')} अंक = ₹{JACKPOT_RUPEES} · {REDEEM_PARTNER}</div>
          </div>
        </div>

        <p style={{ fontFamily: DEVA, fontSize: '12px', color: '#888780', margin: '0 2px', textAlign: 'center' }}>
          {lang === 'en' ? 'Auto-built from photos — no manual entry.' : 'सब फ़ोटो से अपने आप — कोई एंट्री नहीं।'}
        </p>

        {/* Bill reminders — any decoded doc with a due date */}
        {reminders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontFamily: DEVA, fontSize: '11px', fontWeight: 800, color: '#888780', letterSpacing: '0.4px', margin: '4px 2px 0' }}>बिल याद दिलाएँ</p>
            {reminders.map(d => (
              <div key={'r' + d.id} style={{ background: '#fff', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: 36, height: 36, borderRadius: '999px', background: '#FFF3CD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: DEVA, fontSize: '14px', fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.merchant || d.docType}</div>
                  <div style={{ fontFamily: DEVA, fontSize: '11px', color: '#888780' }}>आख़िरी तारीख़ · {d.dueDate}</div>
                </div>
                <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 800, color: '#c0392b' }}>{inr(d.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Auto-logged feed — tap a row to सही करें (edit amount/आया-गया/उधार) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {docs.map((d, i) => (
            <button key={d.id} onClick={() => setEditId(d.id)} className="animate-fade-in" style={{ width: '100%', textAlign: 'left', background: '#fff', border: 'none', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <span style={{ width: 40, height: 40, borderRadius: '12px', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {docIcon(d.icon, 20, PURPLE)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DEVA, fontSize: '14px', fontWeight: 700, color: INK }}>{d.docType}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontFamily: DEVA, fontSize: '11px', color: '#888780' }}>{d.category}</span>
                  {d.borrowed
                    ? <span style={{ fontFamily: DEVA, fontSize: '10px', fontWeight: 700, color: '#7B5C00', background: '#FFF3CD', borderRadius: '999px', padding: '1px 7px' }}>उधार</span>
                    : <span style={{ fontFamily: DEVA, fontSize: '10px', fontWeight: 700, color: d.dir === 'in' ? GREEN : PURPLE, background: d.dir === 'in' ? '#e6f5ec' : PURPLE_LIGHT, borderRadius: '999px', padding: '1px 7px' }}>{directionLabel(d.dir)}</span>
                  }
                  {d.ts && <span style={{ fontFamily: DEVA, fontSize: '10px', color: '#b0adb8' }}>{timeLabel(d.ts)}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontFamily: DEVA, fontSize: '15px', fontWeight: 800, color: d.borrowed ? '#7B5C00' : (d.dir === 'in' ? GREEN : INK) }}>
                  {d.borrowed ? '' : (d.dir === 'in' ? '+' : '−')}{inr(d.amount)}
                </span>
                <span style={{ fontFamily: DEVA, fontSize: '11px', fontWeight: 700, color: '#b0adb8' }}>बदलें ›</span>
              </div>
            </button>
          ))}
        </div>

        {/* Cumulative insight cards — each unlocks when its data condition is met */}
        {docs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {insights.map((c, i) => (
              <div key={c.id} className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', borderRadius: '14px', padding: '12px 14px', animationDelay: `${i * 50}ms` }}>
                <IcSparks size={16} color={PURPLE} />
                <span style={{ fontFamily: DEVA, fontSize: '13px', color: INK }}>{c.text}</span>
              </div>
            ))}
            <p style={{ fontFamily: DEVA, fontSize: '12px', color: '#888780', textAlign: 'center', margin: '2px 0 0' }}>
              जितनी ज़्यादा फ़ोटो, उतना साफ़ हिसाब।
            </p>
          </div>
        )}

        {docs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontFamily: DEVA, fontSize: '14px', color: '#888780', margin: 0 }}>
              {lang === 'en' ? 'No documents yet — show a photo and your ledger builds itself.' : 'अभी कोई कागज़ नहीं — एक फ़ोटो दिखाइए, हिसाब अपने आप बन जाएगा।'}
            </p>
            <button onClick={() => nav('/decoder', { state: { openCamera: true, attribution: 'points_view' } })} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: PURPLE, border: 'none', borderRadius: '999px', padding: '12px 22px', cursor: 'pointer', fontFamily: DEVA, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              <IcCamera size={18} color="#fff" /> {lang === 'en' ? 'Show a photo' : 'फ़ोटो दिखाओ'}
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast-animate" style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: INK, color: '#fff', fontFamily: DEVA, fontSize: '13px', padding: '10px 18px', borderRadius: '999px', zIndex: 500, whiteSpace: 'nowrap' }}>
          इनाम — डेमो (Reliance Retail)
        </div>
      )}

      <EditEntrySheet
        open={!!editDoc}
        title={editDoc ? (editDoc.merchant ? `${editDoc.docType} · ${editDoc.merchant}` : editDoc.docType) : ''}
        initial={editDoc ? { amount: editDoc.amount, dir: editDoc.dir, borrowed: editDoc.borrowed } : null}
        onSave={(next) => { dispatch({ type: 'UPDATE_DOC', payload: { id: editId, patch: { amount: next.amount, dir: next.dir, borrowed: next.borrowed } } }); setEditId(null); }}
        onDelete={() => { dispatch({ type: 'FORGET_DOC', payload: editId }); setEditId(null); }}
        onClose={() => setEditId(null)}
      />
    </div>
  );
}

function Metric({ label, value, color, emphasised }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: '14px', padding: emphasised ? '14px 10px' : '12px 10px', textAlign: 'center', border: emphasised ? `1.5px solid ${PURPLE_LIGHT}` : 'none' }}>
      <div style={{ fontFamily: DEVA, fontSize: '11px', fontWeight: 600, color: '#888780', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: DEVA, fontSize: emphasised ? '18px' : '15px', fontWeight: emphasised ? 900 : 800, color, letterSpacing: '-0.3px' }}>{value}</div>
    </div>
  );
}
