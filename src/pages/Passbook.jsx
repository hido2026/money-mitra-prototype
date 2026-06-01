// Passbook — Money Passbook  (route: /#/passbook)
// Entry schema: { id, type, amount, category, timestamp, time, src }
// State lives in AppContext (persisted to localStorage on every change).
// Features: add in/out · edit · delete · goal card · persistence toast

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import BottomSheet from '../components/BottomSheet';
import InsightBubble from '../components/InsightBubble';
import { useApp } from '../context/AppContext';
import { computeInsight } from '../engine/insight';
import { logEvent } from '../utils/analytics';
import {
  IcChevronLeft, IcDots, IcCheck,
  IcArrowUp, IcArrowDown, IcTarget,
} from '../components/icons/Icons';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n)     { return '₹' + Math.abs(Number(n)).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtFull(n) { return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function nowISO()   { return new Date().toISOString(); }
function displayTime(isoOrLegacy) {
  try {
    const d = new Date(isoOrLegacy);
    if (isNaN(d)) return isoOrLegacy; // legacy "9:41 AM" string — return as-is
    let h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
  } catch { return isoOrLegacy; }
}

const CATEGORIES = ['खाना','यात्रा','बिल','दवाई','फ़ोन','बच्चे','घर','अन्य'];
const SOURCES    = [
  { label:'तनख़्वाह', sub:'Salary' },
  { label:'उपहार',   sub:'Gift'   },
  { label:'बेचा',    sub:'Sold'   },
  { label:'मिला',    sub:'Found'  },
];
const GOAL_CHIPS  = ['त्योहार','फीस','फ़ोन','बफ़र'];
const CANNED_SMS  = { display: 'Rs.199 debited for recharge', amount: 199, category: 'फ़ोन' };

// ── Sub-components ─────────────────────────────────────────────────────────────

function TopBar({ onBack }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '4px 18px 14px',
      borderBottom: '0.5px solid rgba(0,0,0,0.05)', flexShrink: 0,
    }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        <IcChevronLeft size={24} color="#2C2C2A" />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#2C2C2A' }}>बही</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#5F5E5A', marginTop: '1px' }}>Money Passbook · रोज़ का हिसाब</div>
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
      <div style={{ background: bg, borderRadius: '4px 16px 16px 16px', padding: '11px 14px', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', lineHeight: 1.5, color: '#2C2C2A' }}>{text}</div>
    </div>
  );
}

function BigBtn({ label, accent, onClick, outline = false, icon, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ flex: 1, padding: '13px 8px', borderRadius: '12px', border: outline ? `1.5px solid ${accent}` : 'none', background: outline ? '#FFFFFF' : (disabled ? '#D8D7D4' : accent), color: outline ? accent : '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      {icon}{label}
    </button>
  );
}

function Chip({ label, sub, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', border: selected ? '2px solid #534AB7' : '1.5px solid #EEEDFE', background: selected ? '#EEEDFE' : '#FFFFFF' }}>
      <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 600, color: selected ? '#534AB7' : '#2C2C2A' }}>{label}</div>
      {sub && <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', marginTop: '2px' }}>{sub}</div>}
    </button>
  );
}

function GoalProgressBar({ goal }) {
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', fontWeight: 600, color: '#3B6D11' }}>🎯 {goal.label}</span>
        <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#3B6D11' }}>{pct}%</span>
      </div>
      <div style={{ background: '#D0EAC0', borderRadius: '999px', height: '8px', overflow: 'hidden', marginBottom: '4px' }}>
        <div style={{ background: '#3B6D11', height: '100%', width: `${pct}%`, borderRadius: '999px', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#5F5E5A' }}>
        {fmt(goal.saved)} / {fmt(goal.target)}
      </div>
    </div>
  );
}

function AmountPicker({ value, onChange }) {
  const QUICK = [200, 500, 1000, 2000];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => onChange(q)} style={{ padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', border: value === q ? '2px solid #534AB7' : '1.5px solid #EEEDFE', background: value === q ? '#EEEDFE' : '#FFFFFF', fontFamily: "'JioType',sans-serif", fontSize: '14px', fontWeight: 600, color: value === q ? '#534AB7' : '#2C2C2A' }}>
            {fmt(q)}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: '#F5F4FA', borderRadius: '10px', padding: '10px 14px' }}>
        <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '16px', color: '#888780', marginRight: '4px' }}>₹</span>
        <input type="number" placeholder="और रकम" value={value && ![200,500,1000,2000].includes(value) ? value : ''} onChange={e => onChange(Number(e.target.value) || null)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'JioType',sans-serif", fontSize: '16px', color: '#2C2C2A' }} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Passbook() {
  const nav  = useNavigate();
  const loc  = useLocation();
  const inputRef = useRef(null);
  const { state, dispatch } = useApp();
  const { entries, goal, balance, insightFired, sessionDecodes, restoredFromStorage } = state;

  // ── UI flow state ───────────────────────────────────────────────────────────
  const [mode, setMode]               = useState('home');
  const [pendingAmt, setPendingAmt]   = useState(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingType, setPendingType] = useState(null);
  const [insight, setInsight]         = useState(null);

  // Goal form
  const [goalName, setGoalName]     = useState('');
  const [goalTarget, setGoalTarget] = useState(null);

  // Edit/delete sheet
  const [editEntry, setEditEntry]   = useState(null);   // entry being edited
  const [editAmt, setEditAmt]       = useState('');
  const [editCat, setEditCat]       = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Goal sheet
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [editGoalMode, setEditGoalMode]   = useState(false);

  // Decoder entry tagging — bill_type passed from Decoder navigation state
  const [decoderBillType, setDecoderBillType] = useState(null);

  // SMS opt-in
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsShown, setSmsShown]     = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  // Show "data restored" toast once on mount
  useEffect(() => {
    if (restoredFromStorage) {
      showToast('पिछला हिसाब लोड हो गया');
      dispatch({ type: 'CLEAR_RESTORED_FLAG' });
    }
  }, []);

  // Handle incoming state from Decoder bridge or goal pre-fill
  useEffect(() => {
    if (loc.state?.openGoal) {
      setGoalSheetOpen(true);
    } else if (loc.state?.decoderAmount) {
      setPendingAmt(loc.state.decoderAmount);
      setPendingLabel('बिल');
      setPendingType('out');
      setDecoderBillType(loc.state.decoderBillType ?? null); // tag for decode_comparison pattern
      setMode('add_out');
    } else if (loc.state?.fromDecoder && loc.state?.saveable) {
      setGoalName('बचत');
      setGoalTarget(loc.state.saveable);
      setGoalSheetOpen(true);
    }
  }, []);

  // ── Commit entry + insight seam ─────────────────────────────────────────────
  const commitEntry = () => {
    const entry = {
      id:        Date.now().toString(),
      type:      pendingType,
      amount:    Number(pendingAmt),
      category:  pendingLabel,
      timestamp: nowISO(),
      time:      displayTime(nowISO()),
      src:       decoderBillType ? 'decoder' : 'manual',
      source:    decoderBillType ? 'decoder' : 'manual',
      bill_type: decoderBillType ?? null,   // enables decode_comparison pattern
    };
    setDecoderBillType(null); // clear after use — not sticky across entries
    dispatch({ type: 'ADD_ENTRY', payload: entry });
    logEvent('entry_logged');

    // Compute insight with projected new state
    const projectedEntries = [entry, ...entries];
    const payload = computeInsight({ sessionDecodes, entries: projectedEntries, goal, insightFired });
    if (payload) {
      setInsight(payload);
      dispatch({ type: 'MARK_INSIGHT_FIRED' });
      logEvent('insight_shown');
    }
    setMode('saved');
    if (!payload) setTimeout(() => setMode('home'), 1600);
  };

  const todayIn  = entries.filter(e => e.type === 'in').reduce((s, e)  => s + e.amount, 0);
  const todayOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);

  // ── Edit / delete handlers ───────────────────────────────────────────────────
  const openEdit = (entry) => {
    setEditEntry(entry);
    setEditAmt(String(entry.amount));
    setEditCat(entry.category);
    setConfirmDelete(false);
  };

  const saveEdit = () => {
    if (!editEntry) return;
    dispatch({ type: 'UPDATE_ENTRY', payload: { id: editEntry.id, amount: Number(editAmt), category: editCat } });
    logEvent('entry_edited');
    setEditEntry(null);
    showToast('एंट्री बदल दी गई');
  };

  const doDelete = () => {
    if (!editEntry) return;
    dispatch({ type: 'DELETE_ENTRY', payload: editEntry.id });
    logEvent('entry_deleted');
    setEditEntry(null);
    setConfirmDelete(false);
    showToast('एंट्री हटा दी गई');
  };

  // ── Goal handlers ────────────────────────────────────────────────────────────
  const saveGoal = () => {
    if (!goalName.trim() || !goalTarget) return;
    dispatch({ type: 'SET_GOAL', payload: { label: goalName.trim(), target: Number(goalTarget), saved: goal?.saved ?? 0 } });
    logEvent('goal_set');
    setGoalSheetOpen(false);
    setGoalName(''); setGoalTarget(null); setEditGoalMode(false);
    showToast('लक्ष्य सेट हो गया');
  };

  const clearGoal = () => {
    dispatch({ type: 'CLEAR_GOAL' });
    setGoalSheetOpen(false);
    setEditGoalMode(false);
  };

  const handleInsightAction = (action) => {
    if (action === 'set_goal')    { setInsight(null); setGoalSheetOpen(true); }
    if (action === 'add_to_bahi') { setInsight(null); setMode('home'); }
  };

  // ── Renderers ────────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Balance */}
      <div style={{ padding: '20px 16px 12px', textAlign: 'center', borderBottom: '1px solid #F5F4FA' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px' }}>बैलेंस</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: balance < 0 ? '36px' : '42px', fontWeight: 700, color: balance >= 0 ? '#2C2C2A' : '#D85A30', lineHeight: 1.1, marginTop: '4px' }}>
          {fmtFull(Math.abs(balance))}
        </div>
        {balance < 0 && <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#D85A30', marginTop: '2px' }}>खर्च ज़्यादा हो गया</div>}
      </div>

      {/* Goal card */}
      <div style={{ padding: '12px 16px' }}>
        {goal ? (
          <button onClick={() => { setEditGoalMode(true); setGoalName(goal.label); setGoalTarget(goal.target); setGoalSheetOpen(true); }} style={{ width: '100%', background: '#EAF3DE', borderRadius: '14px', padding: '14px 16px', border: '1.5px solid #C5E0A8', cursor: 'pointer', textAlign: 'left' }}>
            <GoalProgressBar goal={goal} />
          </button>
        ) : (
          <button onClick={() => { setEditGoalMode(false); setGoalSheetOpen(true); }} style={{ width: '100%', background: '#F9F8FB', borderRadius: '14px', padding: '12px 16px', border: '1.5px dashed rgba(83,74,183,0.2)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IcTarget size={18} color="#534AB7" />
            <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#534AB7' }}>
              कोई लक्ष्य रखें? त्योहार, बच्चों की फ़ीस, सोना — कुछ भी।
            </span>
          </button>
        )}
      </div>

      {/* Mukund prompt */}
      <div style={{ padding: '0 16px 12px' }}>
        <MukundBubble text={entries.length === 0 ? "आज कितना मिला? कितना खर्च हुआ?" : `आज: ${fmt(todayIn)} मिला, ${fmt(todayOut)} गया।`} bg="#EEEDFE" />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', padding: '0 16px' }}>
        <BigBtn label="मिला" accent="#3B6D11" icon={<IcArrowUp size={16} color="#fff"/>} onClick={() => { setPendingType('in'); setPendingAmt(null); setPendingLabel(''); setMode('add_in'); }} />
        <BigBtn label="खर्च" accent="#D85A30" icon={<IcArrowDown size={16} color="#fff"/>} onClick={() => { setPendingType('out'); setPendingAmt(null); setPendingLabel(''); setMode('add_out'); }} />
      </div>

      {/* Entries list */}
      {entries.length > 0 && (
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>हाल की ENTRIES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {entries.slice(0, 8).map(e => (
              <button key={e.id} onClick={() => openEdit(e)} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FAFAFA', borderRadius: '10px', padding: '10px 12px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: e.type === 'in' ? '#EAF3DE' : '#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {e.type === 'in' ? <IcArrowUp size={13} color="#3B6D11" /> : <IcArrowDown size={13} color="#D85A30" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#2C2C2A', fontWeight: 500 }}>{e.category}</div>
                  <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', marginTop: '1px' }}>{e.time ?? displayTime(e.timestamp)}{e.src === 'sms' ? ' · SMS' : ''}</div>
                </div>
                <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '14px', fontWeight: 700, color: e.type === 'in' ? '#3B6D11' : '#D85A30', flexShrink: 0 }}>
                  {e.type === 'in' ? '+' : '-'}{fmt(e.amount)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SMS opt-in */}
      <div style={{ padding: '12px 16px 8px', marginTop: '4px' }}>
        <div style={{ background: '#F5F4FA', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', fontWeight: 600, color: '#2C2C2A' }}>SMS से जोड़ें</div>
            <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '10.5px', color: '#888780', marginTop: '2px', lineHeight: 1.3 }}>Simulated only · कोई account नहीं दिखेगा</div>
          </div>
          <button onClick={() => { setSmsConsent(c => !c); if (!smsConsent && !smsShown) setMode('sms'); }} style={{ width: '44px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: smsConsent ? '#3B6D11' : '#D8D7D4', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '3px', left: smsConsent ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAddIn = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text="कितना मिला? और किससे?" bg="#EAF3DE" />
      <AmountPicker value={pendingAmt} onChange={setPendingAmt} />
      <div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#5F5E5A', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>कहाँ से मिला?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {SOURCES.map(s => <Chip key={s.label} label={s.label} sub={s.sub} selected={pendingLabel === s.label} onClick={() => setPendingLabel(s.label)} />)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="वापस" accent="#888780" outline onClick={() => setMode('home')} />
        <BigBtn label="आगे →" accent="#3B6D11" disabled={!pendingAmt || !pendingLabel} onClick={() => setMode('confirm_in')} />
      </div>
    </div>
  );

  const renderAddOut = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text="कितना खर्च हुआ, किस पे?" bg="#FAECE7" />
      <AmountPicker value={pendingAmt} onChange={setPendingAmt} />
      <div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#5F5E5A', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>किस पे?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
          {CATEGORIES.map(c => <button key={c} onClick={() => setPendingLabel(c)} style={{ padding: '10px 4px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', border: pendingLabel === c ? '2px solid #D85A30' : '1.5px solid #FAECE7', background: pendingLabel === c ? '#FAECE7' : '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', fontWeight: 600, color: pendingLabel === c ? '#D85A30' : '#2C2C2A' }}>{c}</button>)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="वापस" accent="#888780" outline onClick={() => setMode('home')} />
        <BigBtn label="आगे →" accent="#D85A30" disabled={!pendingAmt || !pendingLabel} onClick={() => setMode('confirm_out')} />
      </div>
    </div>
  );

  const renderConfirm = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text={pendingType === 'in' ? `₹${pendingAmt} ${pendingLabel} से मिला — सही है?` : `₹${pendingAmt} ${pendingLabel} पे — ठीक है?`} bg={pendingType === 'in' ? '#EAF3DE' : '#FAECE7'} />
      <div style={{ background: '#FAFAFA', borderRadius: '16px', padding: '20px', textAlign: 'center', border: `1.5px solid ${pendingType === 'in' ? '#C5E0A8' : '#F0C8B8'}` }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{pendingLabel}</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '38px', fontWeight: 700, color: pendingType === 'in' ? '#3B6D11' : '#D85A30', marginTop: '6px', lineHeight: 1 }}>
          {pendingType === 'in' ? '+' : '-'}{fmt(pendingAmt)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="हाँ" accent={pendingType === 'in' ? '#3B6D11' : '#D85A30'} onClick={commitEntry} />
        <BigBtn label="नहीं" accent="#888780" outline onClick={() => setMode(pendingType === 'in' ? 'add_in' : 'add_out')} />
      </div>
    </div>
  );

  const renderSaved = () => (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IcCheck size={22} color="#3B6D11" />
        </div>
        <div>
          <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#2C2C2A' }}>हो गया ✓</div>
          <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '2px' }}>
            आज: {fmt(todayIn)} मिला, {fmt(todayOut)} गया।{todayIn - todayOut > 0 ? ` बचा: ${fmt(todayIn - todayOut)}।` : ''}
          </div>
        </div>
      </div>
      {insight && <InsightBubble payload={insight} onAction={handleInsightAction} onDismiss={() => { setInsight(null); setMode('home'); }} />}
      {!insight && <button onClick={() => setMode('home')} style={{ alignSelf: 'stretch', padding: '12px', borderRadius: '12px', border: '1.5px solid #EEEDFE', background: '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#534AB7', cursor: 'pointer' }}>← बही पर वापस</button>}
    </div>
  );

  const renderSms = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text="यह SMS मिला — confirm करें?" bg="#EEEDFE" />
      <div style={{ background: '#FAFAFA', border: '1.5px solid #EEEDFE', borderRadius: '14px', padding: '14px' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Simulated SMS</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '14px', color: '#2C2C2A', fontWeight: 500 }}>{CANNED_SMS.display}</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', marginTop: '4px' }}>🔒 सिर्फ़ amount + category</div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="हाँ, जोड़ें" accent="#D85A30" onClick={() => {
          setSmsShown(true);
          dispatch({ type: 'ADD_ENTRY', payload: { id: Date.now().toString(), type: 'out', amount: CANNED_SMS.amount, category: CANNED_SMS.category, timestamp: nowISO(), time: displayTime(nowISO()), src: 'sms' } });
          logEvent('entry_logged');
          setMode('home');
        }} />
        <BigBtn label="नहीं" accent="#888780" outline onClick={() => { setSmsShown(true); setMode('home'); }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFFFFF', maxWidth: '420px', margin: '0 auto' }}>
      <TopBar onBack={() => mode === 'home' ? nav('/') : setMode('home')} />

      {/* Toast */}
      {toast && (
        <div className="toast-animate" style={{ position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)', background: '#2C2C2A', color: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', padding: '10px 18px', borderRadius: '999px', zIndex: 400, whiteSpace: 'nowrap', boxShadow: '0 4px 18px rgba(0,0,0,0.18)' }}>
          {toast}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {mode === 'home'        && renderHome()}
        {mode === 'add_in'      && renderAddIn()}
        {mode === 'confirm_in'  && renderConfirm()}
        {mode === 'add_out'     && renderAddOut()}
        {mode === 'confirm_out' && renderConfirm()}
        {mode === 'saved'       && renderSaved()}
        {mode === 'sms'         && renderSms()}
      </div>

      <BottomInputBar ref={inputRef} compact onSubmit={() => {}} onSpeak={() => {}} onPlus={() => {}} />

      {/* ── Edit / Delete bottom sheet ── */}
      <BottomSheet open={!!editEntry} onClose={() => { setEditEntry(null); setConfirmDelete(false); }} title={confirmDelete ? 'एंट्री हटाएँ?' : 'एंट्री बदलें'}>
        {editEntry && !confirmDelete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={sheetLabelStyle}>रकम (₹)</label>
              <input type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)} style={sheetInputStyle} />
            </div>
            <div>
              <label style={sheetLabelStyle}>कैटेगरी</label>
              <input type="text" value={editCat} onChange={e => setEditCat(e.target.value)} style={sheetInputStyle} />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setEditCat(c)} style={{ padding: '5px 10px', borderRadius: '8px', border: editCat === c ? '1.5px solid #534AB7' : '1.5px solid #EEEDFE', background: editCat === c ? '#EEEDFE' : '#FAFAFA', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: editCat === c ? '#534AB7' : '#5F5E5A', cursor: 'pointer' }}>{c}</button>
                ))}
              </div>
            </div>
            <button onClick={saveEdit} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#534AB7', color: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>बदलें</button>
            <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '11px', borderRadius: '12px', border: '1.5px solid #FAECE7', background: '#FFF', color: '#D85A30', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>हटाएँ</button>
          </div>
        )}
        {editEntry && confirmDelete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', color: '#2C2C2A', margin: 0 }}>क्या यह एंट्री हटाएँ?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={doDelete} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: '#D85A30', color: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>हाँ</button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1.5px solid #EEEDFE', background: '#fff', color: '#534AB7', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>नहीं</button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── Goal bottom sheet ── */}
      <BottomSheet open={goalSheetOpen} onClose={() => { setGoalSheetOpen(false); setEditGoalMode(false); }} title={editGoalMode ? 'लक्ष्य बदलें' : 'नया लक्ष्य'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {GOAL_CHIPS.map(g => <Chip key={g} label={g} selected={goalName === g} onClick={() => setGoalName(g)} />)}
          </div>
          <input placeholder="किसके लिए बचत?" value={goalName} onChange={e => setGoalName(e.target.value)} style={sheetInputStyle} />
          <div style={{ display: 'flex', alignItems: 'center', background: '#F5F4FA', borderRadius: '10px', padding: '10px 14px' }}>
            <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '16px', color: '#888780', marginRight: '4px' }}>₹</span>
            <input type="number" placeholder="कितने चाहिए?" value={goalTarget ?? ''} onChange={e => setGoalTarget(Number(e.target.value) || null)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'JioType',sans-serif", fontSize: '16px', color: '#2C2C2A' }} />
          </div>
          <button onClick={saveGoal} disabled={!goalName.trim() || !goalTarget} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: goalName.trim() && goalTarget ? '#3B6D11' : '#D8D7D4', color: '#fff', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>लक्ष्य रखें</button>
          {editGoalMode && <button onClick={clearGoal} style={{ width: '100%', padding: '11px', borderRadius: '12px', border: '1.5px solid #FAECE7', background: '#fff', color: '#D85A30', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', cursor: 'pointer' }}>लक्ष्य हटाएँ</button>}
        </div>
      </BottomSheet>
    </div>
  );
}

const sheetLabelStyle = {
  display: 'block', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
  fontSize: '12px', color: '#5F5E5A', marginBottom: '6px', fontWeight: 600,
};
const sheetInputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '1.5px solid #EEEDFE', background: '#FAFAFA',
  fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
  fontSize: '15px', color: '#2C2C2A', outline: 'none', boxSizing: 'border-box',
};
