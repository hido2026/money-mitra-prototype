// Passbook — Money Passbook  (route: /#/passbook)
// Voice-first, Hindi. In-memory only — reload resets everything.
// State (entries / goal / balance) lives in AppContext so the insight engine
// can read it cross-component.
//
// INSIGHT SEAM fires at the end of every add_in / add_out confirmation
// (when mode transitions from confirm_in / confirm_out → saved).

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PortraitAvatar from '../components/PortraitAvatar';
import BottomInputBar from '../components/BottomInputBar';
import InsightBubble from '../components/InsightBubble';
import { useApp } from '../context/AppContext';
import { computeInsight } from '../engine/insight';
import {
  IcChevronLeft, IcDots, IcCheck,
  IcArrowUp, IcArrowDown, IcTarget,
} from '../components/icons/Icons';

function fmt(n)     { return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtFull(n) { return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function now() {
  const d = new Date();
  let h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

const CANNED_SMS = { display: 'Rs.199 debited for recharge', amount: 199, category: 'फ़ोन' };
const CATEGORIES = ['खाना','यात्रा','बिल','दवाई','फ़ोन','बच्चे','घर','अन्य'];
const SOURCES    = [{ label:'तनख़्वाह', sub:'Salary' },{ label:'उपहार', sub:'Gift' },{ label:'बेचा', sub:'Sold' },{ label:'मिला', sub:'Found' }];
const GOAL_CHIPS = ['त्योहार','फीस','फ़ोन','बफ़र'];

// ── Sub-components ─────────────────────────────────────────────────────────────
function TopBar({ onBack }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 18px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
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

function BigBtn({ label, accent, onClick, outline = false, icon }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '13px 8px', borderRadius: '12px', border: outline ? `1.5px solid ${accent}` : 'none', background: outline ? '#FFFFFF' : accent, color: outline ? accent : '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
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

function GoalBar({ goal }) {
  if (!goal) return null;
  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#5F5E5A' }}>🎯 {goal.label}</span>
        <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '12px', color: '#3B6D11', fontWeight: 600 }}>{fmt(goal.saved)} / {fmt(goal.target)}</span>
      </div>
      <div style={{ background: '#EAF3DE', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
        <div style={{ background: '#3B6D11', height: '100%', width: `${pct}%`, borderRadius: '999px', transition: 'width 0.5s ease' }} />
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
        <input type="number" placeholder="और रकम" value={value && !([200,500,1000,2000].includes(value)) ? value : ''} onChange={e => onChange(Number(e.target.value) || null)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'JioType',sans-serif", fontSize: '16px', color: '#2C2C2A' }} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Passbook() {
  const nav     = useNavigate();
  const loc     = useLocation();
  const inputRef = useRef(null);
  const { state, dispatch } = useApp();

  // Destructure from shared context
  const { entries, goal, balance, insightFired, sessionDecodes } = state;

  // ── Local UI-only state ────────────────────────────────────────────────────
  const [mode, setMode]             = useState('home');
  const [pendingAmt, setPendingAmt] = useState(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingType, setPendingType]   = useState(null);
  const [goalName, setGoalName]     = useState('');
  const [goalTarget, setGoalTarget] = useState(null);
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsShown, setSmsShown]     = useState(false);
  const [insight, setInsight]       = useState(null);  // fires at saved seam

  // Handle incoming state from Decoder bridge or goal pre-fill
  useEffect(() => {
    if (loc.state?.openGoal) {
      setMode('goal');
    } else if (loc.state?.fromDecoder && loc.state?.saveable) {
      setGoalName('बचत');
      setGoalTarget(loc.state.saveable);
      setMode('goal_prefill');
    }
  }, []);

  // ── INSIGHT SEAM: called right after an entry is committed ─────────────────
  const fireInsightIfReady = () => {
    const payload = computeInsight({ sessionDecodes, entries, goal, insightFired });
    if (payload) {
      setInsight(payload);
      dispatch({ type: 'MARK_INSIGHT_FIRED' });
    }
  };

  const commitEntry = () => {
    const entry = { type: pendingType, amt: Number(pendingAmt), label: pendingLabel, src: 'manual', time: now(), id: Date.now() };
    dispatch({ type: 'ADD_ENTRY', payload: entry });
    setMode('saved');
    // Seam fires AFTER dispatch so state reflects the new entry
    // We compute manually here with the projected new state
    const projectedEntries = [entry, ...entries];
    const projectedState = { sessionDecodes, entries: projectedEntries, goal, insightFired };
    const payload = computeInsight(projectedState);
    if (payload) {
      setInsight(payload);
      dispatch({ type: 'MARK_INSIGHT_FIRED' });
    }
    // Auto-return to home after delay (extended if insight shows)
    if (!payload) setTimeout(() => setMode('home'), 1800);
  };

  const handleInsightAction = (action) => {
    if (action === 'set_goal') { setInsight(null); setMode('goal'); }
    if (action === 'add_to_bahi') { setInsight(null); setMode('home'); }
  };

  const todayIn  = entries.filter(e => e.type === 'in' ).reduce((s, e) => s + e.amt, 0);
  const todayOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.amt, 0);

  // ── Renderers ──────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ padding: '20px 16px 12px', textAlign: 'center', borderBottom: '1px solid #F5F4FA' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px' }}>बैलेंस</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: balance < 0 ? '36px' : '42px', fontWeight: 700, color: balance >= 0 ? '#2C2C2A' : '#D85A30', lineHeight: 1.1, marginTop: '4px' }}>{fmtFull(Math.abs(balance))}</div>
        {balance < 0 && <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#D85A30', marginTop: '2px' }}>खर्च ज़्यादा हो गया</div>}
      </div>
      {goal && <div style={{ padding: '12px 16px 4px' }}><GoalBar goal={goal} /></div>}
      <div style={{ padding: '12px 16px' }}>
        <MukundBubble text={entries.length === 0 ? "आज कितना मिला? कितना खर्च हुआ?" : `आज: ${fmt(todayIn)} मिला, ${fmt(todayOut)} गया।`} bg="#EEEDFE" />
      </div>
      <div style={{ display: 'flex', gap: '10px', padding: '0 16px' }}>
        <BigBtn label="मिला" accent="#3B6D11" icon={<IcArrowUp size={16} color="#fff"/>} onClick={() => { setPendingType('in'); setPendingAmt(null); setPendingLabel(''); setMode('add_in'); }} />
        <BigBtn label="खर्च" accent="#D85A30" icon={<IcArrowDown size={16} color="#fff"/>} onClick={() => { setPendingType('out'); setPendingAmt(null); setPendingLabel(''); setMode('add_out'); }} />
        {!goal && (
          <button onClick={() => setMode('goal')} style={{ padding: '13px 10px', borderRadius: '12px', border: '1.5px solid #EAF3DE', background: '#EAF3DE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcTarget size={18} color="#3B6D11" />
          </button>
        )}
      </div>
      {entries.length > 0 && (
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>हाल की entries</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {entries.slice(0, 5).map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FAFAFA', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: e.type === 'in' ? '#EAF3DE' : '#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {e.type === 'in' ? <IcArrowUp size={13} color="#3B6D11" /> : <IcArrowDown size={13} color="#D85A30" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#2C2C2A', fontWeight: 500 }}>{e.label}</div>
                  <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '10px', color: '#888780', marginTop: '1px' }}>{e.time}{e.src === 'sms' ? ' · SMS' : ''}</div>
                </div>
                <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '14px', fontWeight: 700, color: e.type === 'in' ? '#3B6D11' : '#D85A30', flexShrink: 0 }}>{e.type === 'in' ? '+' : '-'}{fmt(e.amt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
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
      <AmountPicker value={pendingAmt} onChange={v => setPendingAmt(v)} />
      <div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#5F5E5A', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>कहाँ से मिला?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {SOURCES.map(s => <Chip key={s.label} label={s.label} sub={s.sub} selected={pendingLabel === s.label} onClick={() => setPendingLabel(s.label)} />)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="वापस" accent="#888780" outline onClick={() => setMode('home')} />
        <BigBtn label="आगे →" accent="#3B6D11" onClick={() => { if (pendingAmt && pendingLabel) setMode('confirm_in'); }} />
      </div>
    </div>
  );

  const renderAddOut = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text="कितना खर्च हुआ, किस पे?" bg="#FAECE7" />
      <AmountPicker value={pendingAmt} onChange={v => setPendingAmt(v)} />
      <div>
        <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '12px', color: '#5F5E5A', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>किस पे?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
          {CATEGORIES.map(c => <button key={c} onClick={() => setPendingLabel(c)} style={{ padding: '10px 4px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', border: pendingLabel === c ? '2px solid #D85A30' : '1.5px solid #FAECE7', background: pendingLabel === c ? '#FAECE7' : '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', fontWeight: 600, color: pendingLabel === c ? '#D85A30' : '#2C2C2A' }}>{c}</button>)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="वापस" accent="#888780" outline onClick={() => setMode('home')} />
        <BigBtn label="आगे →" accent="#D85A30" onClick={() => { if (pendingAmt && pendingLabel) setMode('confirm_out'); }} />
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

  // ── SAVED step — INSIGHT SEAM ──────────────────────────────────────────────
  const renderSaved = () => (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IcCheck size={22} color="#3B6D11" />
        </div>
        <div>
          <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '16px', fontWeight: 700, color: '#2C2C2A' }}>हो गया ✓</div>
          <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '13px', color: '#5F5E5A', marginTop: '2px' }}>
            आज: {fmt(todayIn)} मिला, {fmt(todayOut)} गया।
            {todayIn - todayOut > 0 ? ` बचा: ${fmt(todayIn - todayOut)}।` : ''}
          </div>
        </div>
      </div>

      {/* ── Insight bubble fires HERE — at the saved seam ── */}
      {insight && (
        <InsightBubble
          payload={insight}
          onAction={handleInsightAction}
          onDismiss={() => { setInsight(null); setMode('home'); }}
        />
      )}

      {!insight && (
        <button onClick={() => setMode('home')} style={{ alignSelf: 'stretch', padding: '12px', borderRadius: '12px', border: '1.5px solid #EEEDFE', background: '#FFFFFF', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#534AB7', cursor: 'pointer' }}>
          ← बही पर वापस
        </button>
      )}
    </div>
  );

  const renderGoal = (prefilled = false) => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text={prefilled ? `Decoder से ₹${goalTarget} की बचत — इसे goal बनाएं?` : "किसके लिए जोड़ना है?"} bg="#EAF3DE" />
      {!prefilled && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {GOAL_CHIPS.map(g => <Chip key={g} label={g} selected={goalName === g} onClick={() => setGoalName(g)} />)}
        </div>
      )}
      {prefilled && <div style={{ fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#3B6D11', fontWeight: 600 }}>लक्ष्य: {fmt(goalTarget)}</div>}
      {!prefilled && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F5F4FA', borderRadius: '10px', padding: '10px 14px' }}>
            <input placeholder="अपना goal लिखें" value={goalName && !GOAL_CHIPS.includes(goalName) ? goalName : ''} onChange={e => setGoalName(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Noto Sans Devanagari','JioType',sans-serif", fontSize: '14px', color: '#2C2C2A' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F5F4FA', borderRadius: '10px', padding: '10px 14px' }}>
            <span style={{ fontFamily: "'JioType',sans-serif", fontSize: '16px', color: '#888780', marginRight: '4px' }}>₹</span>
            <input type="number" placeholder="कितना चाहिए?" value={goalTarget ?? ''} onChange={e => setGoalTarget(Number(e.target.value) || null)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'JioType',sans-serif", fontSize: '16px', color: '#2C2C2A' }} />
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="रद्द" accent="#888780" outline onClick={() => setMode('home')} />
        <BigBtn label="Goal सेट करें" accent="#3B6D11" onClick={() => {
          if (goalName && goalTarget) {
            dispatch({ type: 'SET_GOAL', payload: { label: goalName, target: goalTarget, saved: 0 } });
            setMode('home');
          }
        }} />
      </div>
    </div>
  );

  const renderSms = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <MukundBubble text="यह SMS मिला — confirm करें?" bg="#EEEDFE" />
      <div style={{ background: '#FAFAFA', border: '1.5px solid #EEEDFE', borderRadius: '14px', padding: '14px' }}>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Simulated SMS</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '14px', color: '#2C2C2A', fontWeight: 500 }}>{CANNED_SMS.display}</div>
        <div style={{ fontFamily: "'JioType',sans-serif", fontSize: '11px', color: '#888780', marginTop: '4px' }}>🔒 कोई account नहीं, कोई name नहीं — सिर्फ़ amount + category</div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <BigBtn label="हाँ, जोड़ें" accent="#D85A30" onClick={() => {
          setSmsShown(true);
          dispatch({ type: 'ADD_ENTRY', payload: { type: 'out', amt: CANNED_SMS.amount, label: CANNED_SMS.category, src: 'sms', time: now(), id: Date.now() } });
          setMode('home');
        }} />
        <BigBtn label="नहीं" accent="#888780" outline onClick={() => { setSmsShown(true); setMode('home'); }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FFFFFF', maxWidth: '420px', margin: '0 auto' }}>
      <TopBar onBack={() => mode === 'home' ? nav('/') : setMode('home')} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {mode === 'home'         && renderHome()}
        {mode === 'add_in'       && renderAddIn()}
        {mode === 'confirm_in'   && renderConfirm()}
        {mode === 'add_out'      && renderAddOut()}
        {mode === 'confirm_out'  && renderConfirm()}
        {mode === 'saved'        && renderSaved()}
        {mode === 'goal'         && renderGoal(false)}
        {mode === 'goal_prefill' && renderGoal(true)}
        {mode === 'sms'          && renderSms()}
      </div>
      <BottomInputBar ref={inputRef} compact onSubmit={() => {}} onSpeak={() => {}} onPlus={() => {}} />
    </div>
  );
}
