// मेरा हिसाब (route: /#/passbook) — REPLACES the old manual passbook.
// Auto-built from decoded documents only. NO manual entry: no amount buttons,
// no amount field, no category chips, no मिला/खर्च/आगे flow. Nothing typed.
// In-memory feed (state.docs). "भूल जाओ" removes a row — memory is the user's to clear.
// JDS (a2ui MCP): StatDisplay §11.59 tiles, InfoBox §11.50 borrowed strip,
// TagChip §11.69 direction/loan tags, IconCircle §11.44 — all token-driven.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang, LangToggle } from '../hooks/useLang';
import { useCountUp, inr } from '../utils/motion';
import { JACKPOT_POINTS, JACKPOT_RUPEES, CAT_EN, directionLabel } from '../data/decoder-samples';
import { hisaabInsights } from '../utils/insights';
import EditEntrySheet from '../components/EditEntrySheet';
import { StatDisplay, InfoBox, TagChip, IconCircle } from '../components/jds';
import {
  IcChevronLeft, IcReceipt, IcZap, IcSmartphone, IcFileDollar, IcSparks, IcCamera,
  IcShield, IcChartLine, IcBuilding,
  IcWallet, IcLock, IcFork, IcCart, IcGas, IcUpi, IcCoin, IcGoldCoin, IcDroplet, IcWifi,
} from '../components/icons/Icons';

const timeLabel = (ts) => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

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
    case 'droplet':   return <IcDroplet size={size} color={color} />;
    case 'wifi':      return <IcWifi size={size} color={color} />;
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
  const insights = hisaabInsights(docs, lang);

  const redeem = () => { setToast(true); setTimeout(() => setToast(false), 2200); };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col bg-surface-minimal">
      {/* Header */}
      <header className="border-stroke-subtle flex shrink-0 items-center gap-2.5 border-b bg-surface px-4 py-2 pb-3">
        <button onClick={() => nav('/decoder')} className="flex border-0 bg-transparent p-0" aria-label="Back">
          <IcChevronLeft size={24} color="var(--color-ink)" />
        </button>
        <h1 className="font-deva text-ink flex-1 text-lg font-black tracking-tight">
          {lang === 'en' ? 'My Passbook' : 'मेरा हिसाब'}
        </h1>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">

        {/* Metrics — D1: आया excludes borrowed; D3: बचे suppressed without real income */}
        <div className="animate-fade-in flex gap-2.5">
          <Metric label={lang === 'en' ? 'In' : 'आया'} value={inr(aC)} colorClass="text-success" />
          <Metric label={lang === 'en' ? 'Out' : 'गया'} value={inr(gC)} colorClass="text-primary-50" />
          {hasRealIncome
            ? <Metric label={lang === 'en' ? (bache >= 0 ? 'Saved' : 'Short') : (bache >= 0 ? 'बचे' : 'कम पड़े')} value={inr(bC)} colorClass={bache >= 0 ? 'text-ink' : 'text-error'} emphasised />
            : <Metric label={lang === 'en' ? 'Saved' : 'बचे'} value="—" colorClass="text-ink-soft" emphasised />
          }
        </div>

        {/* D2: borrowed section shown only when present */}
        {udhar > 0 && (
          <div className="animate-fade-in">
            <InfoBox tone="warning">
              <span className="flex items-center justify-between gap-2">
                <span className="font-deva text-reward-ink font-bold">
                  {lang === 'en' ? 'Loan / Borrowed' : 'उधार / ऋण मिला'}
                </span>
                <span className="font-deva text-reward-ink text-[15px] font-extrabold">{inr(uC)}</span>
              </span>
            </InfoBox>
          </div>
        )}

        {/* Rewards banner — brand-neutral gift (FIX 10) */}
        <div className="animate-fade-in bg-primary-50 flex items-center gap-3 rounded-xl p-4" style={{ animationDelay: '60ms' }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--color-reward)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
          <div className="min-w-0 flex-1">
            <div className="font-deva text-[15px] font-extrabold text-white">
              {lang === 'en'
                ? `Total rewards — ${totalPoints.toLocaleString('en-IN')} points`
                : `कुल इनाम — ${totalPoints.toLocaleString('en-IN')} अंक`}
            </div>
            <div className="font-deva mt-0.5 text-xs text-white/85">
              {lang === 'en'
                ? `1,000 points = ₹${JACKPOT_RUPEES} in shopping vouchers`
                : `1,000 अंक = शॉपिंग वाउचर और गिफ्ट`}
            </div>
            <div className="font-deva mt-px text-[11px] text-white/70">
              {lang === 'en' ? 'Redeem at partner stores' : 'पार्टनर दुकानों पर इस्तेमाल करें'}
            </div>
          </div>
          {totalPoints >= JACKPOT_POINTS && (
            <button onClick={redeem} className="font-deva bg-reward text-ink shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold">
              {lang === 'en' ? 'Redeem' : 'इनाम लें'}
            </button>
          )}
        </div>

        <p className="font-deva text-ink-soft mx-0.5 text-center text-xs">
          {lang === 'en' ? 'Auto-built from photos — no manual entry.' : 'सब फ़ोटो से अपने आप — कोई एंट्री नहीं।'}
        </p>

        {/* Bill reminders — any decoded doc with a due date */}
        {reminders.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-deva text-ink-soft mx-0.5 mt-1 text-[11px] font-extrabold tracking-wide uppercase">
              {lang === 'en' ? 'BILL REMINDERS' : 'बिल याद दिलाएँ'}
            </p>
            {reminders.map(d => (
              <div key={'r' + d.id} className="bg-surface flex items-center gap-3 rounded-lg px-3.5 py-3">
                <span className="bg-reward-soft flex size-9 shrink-0 items-center justify-center rounded-full">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-reward-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-deva text-ink overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">{d.merchant || d.docType}</div>
                  <div className="font-deva text-ink-soft text-[11px]">
                    {lang === 'en' ? 'Due date' : 'आख़िरी तारीख़'} · {d.dueDate}
                  </div>
                </div>
                <span className="font-deva text-error text-[15px] font-extrabold">{inr(d.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Auto-logged feed — tap a row to सही करें (edit amount/आया-गया/उधार) */}
        <div className="flex flex-col gap-2.5">
          {docs.map((d, i) => (
            <button key={d.id} onClick={() => setEditId(d.id)} className="animate-fade-in bg-surface flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <IconCircle tinted icon={docIcon(d.icon, 20, 'var(--color-primary-50)')} />
              <div className="min-w-0 flex-1">
                <div className="font-deva text-ink text-sm font-bold">{d.docType}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-deva text-ink-soft text-[11px]">
                    {lang === 'en' ? (CAT_EN[d.category] || d.category) : d.category}
                  </span>
                  {d.borrowed
                    ? <TagChip tone="warning">{lang === 'en' ? 'Loan' : 'उधार'}</TagChip>
                    : <TagChip tone={d.dir === 'in' ? 'success' : 'brand'}>{directionLabel(d.dir, lang)}</TagChip>
                  }
                  {d.ts && <span className="font-deva text-ink-disabled text-[10px]">{timeLabel(d.ts)}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`font-deva text-[15px] font-extrabold ${d.borrowed ? 'text-reward-ink' : (d.dir === 'in' ? 'text-success' : 'text-ink')}`}>
                  {d.borrowed ? '' : (d.dir === 'in' ? '+' : '−')}{inr(d.amount)}
                </span>
                <span className="font-deva text-ink-disabled text-[11px] font-bold">
                  {lang === 'en' ? 'Edit ›' : 'बदलें ›'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Cumulative insight cards — each unlocks when its data condition is met */}
        {docs.length > 0 && (
          <div className="flex flex-col gap-2">
            {insights.map((c, i) => (
              <div key={c.id} className="animate-fade-in bg-surface flex items-center gap-2 rounded-lg px-3.5 py-3" style={{ animationDelay: `${i * 50}ms` }}>
                <IcSparks size={16} color="var(--color-primary-50)" />
                <span className="font-deva text-ink text-[13px]">{c.text}</span>
              </div>
            ))}
            <p className="font-deva text-ink-soft mt-0.5 text-center text-xs">
              {lang === 'en' ? 'More photos = clearer hisaab.' : 'जितनी ज़्यादा फ़ोटो, उतना साफ़ हिसाब।'}
            </p>
          </div>
        )}

        {docs.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <p className="font-deva text-ink-soft m-0 text-sm">
              {lang === 'en' ? 'No documents yet — show a photo and your hisaab builds itself.' : 'अभी कोई कागज़ नहीं — एक फ़ोटो दिखाइए, हिसाब अपने आप बन जाएगा।'}
            </p>
            <button onClick={() => nav('/decoder', { state: { openCamera: true, attribution: 'points_view' } })} className="font-deva bg-primary-50 flex items-center gap-2 rounded-full px-5.5 py-3 text-[15px] font-bold text-white">
              <IcCamera size={18} color="#fff" /> {lang === 'en' ? 'Show a photo' : 'फ़ोटो दिखाओ'}
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast-animate font-deva bg-ink fixed bottom-8 left-1/2 z-500 -translate-x-1/2 rounded-full px-4.5 py-2.5 text-[13px] whitespace-nowrap text-white">
          {lang === 'en' ? 'Reward — demo only' : 'इनाम — सिर्फ़ डेमो'}
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

function Metric({ label, value, colorClass, emphasised }) {
  return (
    <div className={`flex-1 rounded-lg text-center ${emphasised ? 'border-primary-20 border-[1.5px] px-2.5 py-3.5' : 'py-3 px-2.5'} bg-surface`}>
      <StatDisplay value={value} label={label} colorClass={colorClass} align="center" />
    </div>
  );
}
