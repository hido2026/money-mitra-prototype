// Home — scoped-cards working chat + हिसाब snapshot (CLAUDE.md §Home + Home spec v7).
// No hard-coded money/name/date — greeting, insight and In/Out/Saved bind to the
// user profile + their हिसाब (state.docs). Bilingual (हिं default / EN toggle).
// No identity block, no mission, no ₹/redeem on home.
// JDS (a2ui MCP): all colour/radius via tokens (index.css @theme) + jds.jsx recipes.

import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Groq from 'groq-sdk';
import { useApp } from '../context/AppContext';
import { inr } from '../utils/motion';
import { MUKUND_PROMPT } from '../config/system-prompts.js';
import { speakMukund } from '../utils/tts';
import { setPendingFile } from '../utils/pendingFile';
import { useLang, LangToggle } from '../hooks/useLang';
import BottomInputBar from '../components/BottomInputBar';
import AttachSheet from '../components/AttachSheet';
import PortraitAvatar from '../components/PortraitAvatar';
import { IcReceipt, IcFlameColor, IcSchoolColor, IcShieldColor } from '../components/icons/Icons';
import { getStreak } from '../data/nuskha-bank';

const _apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groqClient = _apiKey ? new Groq({ apiKey: _apiKey, dangerouslyAllowBrowser: true }) : null;

const COPY = {
  hi: {
    greet: (n) => (n ? `नमस्ते, ${n} जी` : 'नमस्ते जी'),
    savedInsight: (amt) => `इस महीने आपने ${amt} बचाए`,
    askTitle: 'पैसे की बात पूछिए',
    askPopular: 'सबसे ज़्यादा पूछे गए',
    docTitle: 'कोई कागज़ समझ नहीं आ रहा?',
    docExamples: 'बिजली का बिल · बैंक का SMS · LIC की पर्ची · या कुछ और — दिखाइए',
    connector: 'जो कागज़ दिखाते हैं, वो यहाँ अपने आप जुड़ जाता है',
    gyaanTitle: 'पैसा ज्ञान', gyaanSub: 'रोज़ का एक नुस्खा, 30 सेकंड में',
    gyaanStreak: (n) => `${n}-दिन`,
    hisaabTitle: 'आपका हिसाब', tileIn: 'आया', tileOut: 'गया', tileSaved: 'बचा',
    hisaabSub: (m) => `आपकी फ़ोटो से अपने आप बना · ${m}`,
    hisaabEmpty: 'पहली फ़ोटो दिखाइए, हिसाब यहीं बनेगा →',
    trust: 'हम कभी आपसे OTP, PIN या पैसे नहीं माँगते।',
    placeholder: 'कुछ पूछिए या कागज़ दिखाइए…',
    locale: 'hi-IN',
  },
  en: {
    greet: (n) => (n ? `Namaste, ${n} ji` : 'Namaste ji'),
    savedInsight: (amt) => `You've saved ${amt} this month`,
    askTitle: 'Ask about money',
    askPopular: 'MOST ASKED',
    docTitle: 'Understand a document',
    docExamples: 'Electricity bill · bank SMS · LIC slip · or anything else — show it',
    connector: 'Every paper you show adds here automatically',
    gyaanTitle: 'Paisa Gyaan', gyaanSub: 'One 30-second nuskha, every day',
    gyaanStreak: (n) => `${n}-day`,
    hisaabTitle: 'Your Ledger', tileIn: 'In', tileOut: 'Out', tileSaved: 'Saved',
    hisaabSub: (m) => `Built automatically from your photos · ${m}`,
    hisaabEmpty: 'Show your first paper — your ledger builds here →',
    trust: "We'll never ask for your OTP, PIN, or money.",
    placeholder: 'Ask or show a paper…',
    locale: 'en-IN',
  },
};

export default function Home() {
  const nav = useNavigate();
  const { state } = useApp();
  const [lang, setLang] = useLang();
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const endRef = useRef(null);
  const t = COPY[lang];

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const userName = user.name || ''; // no registration → nameless greeting
  const gyaanStreak = useMemo(() => getStreak().current_streak, []);

  // ── हिसाब binding (no hard-coded values) ───────────────────────────────────
  const docs = state.docs;
  const hasData = docs.length > 0;
  const aaya = docs.filter(d => d.dir === 'in' && !d.borrowed).reduce((s, d) => s + d.amount, 0);
  const gaya = docs.filter(d => d.dir === 'out').reduce((s, d) => s + d.amount, 0);
  const bacha = aaya - gaya;
  const amberPct = aaya > 0 ? Math.min(100, Math.round((gaya / aaya) * 100)) : (gaya > 0 ? 100 : 0);
  const greenPct = Math.max(0, 100 - amberPct);
  const reminder = docs.find(d => d.dueDate) || null;
  const month = new Date().toLocaleString(t.locale, { month: 'long' });

  const send = async (text) => {
    const q = (text || '').trim();
    if (!q || busy) return;
    const next = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setBusy(true);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      let reply;
      if (groqClient) {
        const r = await groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: MUKUND_PROMPT }, ...next],
          max_tokens: 700,
        });
        reply = r.choices[0]?.message?.content?.trim() || 'समझ नहीं पाया — दोबारा पूछिए।';
      } else {
        reply = 'अभी जवाब नहीं दे पा रहा — थोड़ी देर में दोबारा पूछिए।';
      }
      setMsgs([...next, { role: 'assistant', content: reply }]);
      speakMukund(reply);
    } catch {
      setMsgs([...next, { role: 'assistant', content: 'कुछ गड़बड़ हुई — दोबारा पूछिए।' }]);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const onFile = (f) => { setPendingFile(f); nav('/decoder', { state: { attribution: 'home_camera' } }); };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col bg-surface-minimal">
      {/* Header: ← · Money Mitra · हिं/EN */}
      <header className="flex shrink-0 items-center gap-2.5 px-4 py-2.5">
        <button
          aria-label="Back"
          onClick={() => (window.location.hash = '#/')}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={18} height={18} className="text-ink"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="font-jio text-ink flex-1 text-[17px] font-black tracking-tight">Money Mitra</span>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 pt-1 pb-3">
        {/* A1. Greeting + insight (bound to user + हिसाब) */}
        <div className="animate-fade-in mx-0.5 mt-1">
          <h1 className="font-deva text-ink m-0 text-[22px] font-black tracking-tight">{t.greet(userName)}</h1>
          {hasData && bacha >= 0 && (
            <p className="font-deva text-ink-soft mt-1 mb-0 text-[13px]">
              {t.savedInsight(inr(bacha))}{reminder ? ` · ${reminder.docType} ${reminder.dueDate}` : ''}
            </p>
          )}
        </div>

        {/* Inline chat thread — home is a working chat */}
        {msgs.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {msgs.map((m, i) => m.role === 'user' ? (
              <div key={i} className="font-deva bg-primary-50 max-w-[85%] self-end rounded-tl-2xl rounded-tr-2xl rounded-br-sm rounded-bl-2xl px-3.5 py-2.5 text-sm leading-relaxed text-white">{m.content}</div>
            ) : (
              <div key={i} className="flex items-start gap-2">
                <PortraitAvatar size={28} />
                <div className="font-deva text-ink bg-surface max-w-[85%] rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl px-3.5 py-2.5 text-sm leading-relaxed">{m.content || '…'}</div>
              </div>
            ))}
            {busy && <div className="font-deva text-ink-soft ml-9 text-xs">मुकुंद सोच रहा है…</div>}
            <div ref={endRef} />
          </div>
        )}

        {/* Ask entry — uniform light-violet chip (matches Document/Ledger/
            Paisa Gyaan below), per the design-prototype reference. Icon is a
            solid-violet chat-bubble + white ₹ (design "Option A") sitting on
            the light chip, not a solid-violet chip itself. "Most asked" is a
            gold flame badge — matches the reference's 🔥, swapped for a
            compliant SVG. Example prompts + free-text ghost pill live one tap
            in, on the actual Ask screen (MoneyQuestions), not duplicated here. */}
        <button className="animate-fade-in bg-surface flex w-full items-center gap-3.5 rounded-xl p-[18px] text-left" onClick={() => nav('/chat')} style={{ animationDelay: '60ms' }}>
          <span className="bg-primary-20 flex size-13 shrink-0 items-center justify-center rounded-2xl">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path fill="var(--color-primary-50)" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              <text x="12" y="13.5" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#fff">₹</text>
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-deva text-ink block text-base font-bold">{t.askTitle}</span>
            <span className="font-deva bg-reward-soft text-reward-ink mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold">
              <IcFlameColor size={15} />
              {t.askPopular}
            </span>
          </span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-disabled shrink-0"><polyline points="9 6 15 12 9 18" /></svg>
        </button>

        {/* Document door — same uniform light-violet chip as Ask above. */}
        <button className="animate-fade-in bg-surface flex w-full items-center gap-3.5 rounded-xl p-[18px] text-left" onClick={() => nav('/decoder')} style={{ animationDelay: '120ms' }}>
          <span className="bg-primary-20 flex size-13 shrink-0 items-center justify-center rounded-2xl">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-deva text-ink block text-base font-bold">{t.docTitle}</span>
            <span className="font-deva text-ink-soft mt-1 block text-xs leading-relaxed">{t.docExamples}</span>
          </span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-disabled shrink-0"><polyline points="9 6 15 12 9 18" /></svg>
        </button>

        {/* A3. Connector: vertical line + down arrow + caption */}
        <div className="animate-fade-in -my-1 flex flex-col items-center gap-1">
          <span className="bg-primary-20 h-3.5 w-0.5 rounded" />
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-50"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="6 13 12 19 18 13" /></svg>
          <span className="font-deva text-ink-soft max-w-[280px] text-center text-xs font-semibold">{t.connector}</span>
        </div>

        {/* A4. हिसाब — same uniform light-violet chip family as Ask/Document,
            kept in its own bordered card (per the design-prototype reference)
            since it's the data-bound widget, not just a nav door. Tiles +
            split bar appear once there's data. */}
        <button className="animate-fade-in bg-surface border-primary-20 block w-full rounded-xl border-[1.5px] p-[18px] text-left" onClick={() => nav('/passbook')} style={{ animationDelay: '180ms' }}>
          <div className="flex items-center gap-3.5">
            <span className="bg-primary-20 flex size-13 shrink-0 items-center justify-center rounded-2xl">
              <IcReceipt size={24} color="var(--color-primary-50)" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-deva text-ink block text-base font-bold">{t.hisaabTitle}</span>
              {!hasData && (
                <span className="font-deva text-primary-50 mt-1 block text-xs font-semibold">{t.hisaabEmpty}</span>
              )}
            </span>
          </div>

          {hasData && (
            <>
              <div className="mt-3.5 flex gap-2.5">
                <Tile label={t.tileIn} value={inr(aaya)} colorClass="text-success" />
                <Tile label={t.tileOut} value={inr(gaya)} colorClass="text-warning" />
                <Tile label={t.tileSaved} value={inr(Math.abs(bacha))} colorClass="text-primary-50" emphasised />
              </div>
              <div className="bg-surface-ghost mt-3 flex h-2 overflow-hidden rounded-full">
                <span className="bg-success block h-full" style={{ width: `${greenPct}%` }} />
                <span className="bg-warning block h-full" style={{ width: `${amberPct}%` }} />
              </div>
              <p className="font-deva text-ink-soft mt-2.5 mb-0 text-xs">{t.hisaabSub(month)}</p>
            </>
          )}
        </button>

        {/* Paisa Gyaan entry — secondary to the 3 scoped cards above, per
            CLAUDE.md's Home contract; daily nuskha + streak habit loop. */}
        <button
          className="animate-fade-in bg-surface flex w-full items-center gap-3.5 rounded-xl p-[18px] text-left"
          onClick={() => nav('/paisa-gyaan')}
          style={{ animationDelay: '210ms' }}
        >
          <span className="bg-primary-20 flex size-13 shrink-0 items-center justify-center rounded-2xl">
            <IcSchoolColor size={26} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-deva text-ink block text-base font-bold">{t.gyaanTitle}</span>
            <span className="font-deva text-ink-soft mt-0.5 block text-xs">{t.gyaanSub}</span>
          </span>
          {gyaanStreak > 0 && (
            <span className="bg-reward-soft text-reward-ink flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold">
              <IcFlameColor size={16} />
              {t.gyaanStreak(gyaanStreak)}
            </span>
          )}
        </button>

        {/* A5. Trust line (above bottom bar) */}
        <div className="animate-fade-in flex items-center justify-center gap-2 py-0.5">
          <IcShieldColor size={17} />
          <span className="font-deva text-success text-center text-xs">{t.trust}</span>
        </div>
      </div>

      <BottomInputBar
        placeholder={t.placeholder}
        onSubmit={(text) => send(text)}
        onSpeak={() => nav('/chat', { state: { autoVoice: true } })}
        onPlus={() => setAttachOpen(true)}
      />

      <AttachSheet open={attachOpen} onClose={() => setAttachOpen(false)} onFile={onFile} />
    </div>
  );
}

function Tile({ label, value, colorClass, emphasised }) {
  return (
    <div className={`flex-1 rounded-lg px-2 py-2.5 text-center ${emphasised ? 'bg-primary-20' : 'bg-surface-minimal'}`}>
      <div className="font-deva text-ink-soft mb-0.5 text-[11px] font-semibold">{label}</div>
      <div className={`font-deva text-[15px] font-extrabold tracking-tight ${colorClass}`}>{value}</div>
    </div>
  );
}
