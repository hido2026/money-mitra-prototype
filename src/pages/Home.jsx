// Home — scoped-cards working chat + हिसाब snapshot (CLAUDE.md §Home + Home spec v7).
// No hard-coded money/name/date — greeting, insight and In/Out/Saved bind to the
// user profile + their हिसाब (state.docs). Bilingual (हिं default / EN toggle).
// No identity block, no mission, no ₹/redeem on home.

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
import { IcReceipt, IcShield } from '../components/icons/Icons';

const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const PURPLE = '#6D17CE';
const PURPLE_LIGHT = '#EDE7FF';
const GREEN = '#1a7d4b';
const AMBER = '#d97706';
const INK = '#2C2C2A';

const _apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groqClient = _apiKey ? new Groq({ apiKey: _apiKey, dangerouslyAllowBrowser: true }) : null;

const COPY = {
  hi: {
    greet: (n) => (n ? `नमस्ते, ${n} जी` : 'नमस्ते जी'),
    savedInsight: (amt) => `इस महीने आपने ${amt} बचाए`,
    askTitle: 'पैसे की बात पूछिए', askSub: 'बिल · सरकारी योजना · ठगी · बचत',
    chip1: 'लोन कैसे मिलेगा?', chip2: 'बेटी की शादी के लिए कैसे बचाएँ?',
    askGhost: 'या अपना सवाल पूछिए →',
    docTitle: 'कोई कागज़ समझ नहीं आ रहा?',
    docExamples: 'बिजली का बिल · बैंक का SMS · LIC की पर्ची · या कुछ और — दिखाइए',
    docReward: 'हर कागज़ पर 100 अंक तक मिल सकते हैं — बिल्कुल मुफ़्त',
    connector: 'जो कागज़ दिखाते हैं, वो यहाँ अपने आप जुड़ जाता है',
    hisaabTitle: 'आपका हिसाब', tileIn: 'आया', tileOut: 'गया', tileSaved: 'बचा',
    hisaabSub: (m) => `आपकी फ़ोटो से अपने आप बना · ${m}`,
    rewardChip: 'इनाम पाइए',
    hisaabEmpty: 'पहली फ़ोटो दिखाइए, हिसाब यहीं बनेगा →',
    trust: 'हम कभी आपसे OTP, PIN या पैसे नहीं माँगते।',
    placeholder: 'कुछ पूछिए या कागज़ दिखाइए…',
    locale: 'hi-IN',
  },
  en: {
    greet: (n) => (n ? `Namaste, ${n} ji` : 'Namaste ji'),
    savedInsight: (amt) => `You've saved ${amt} this month`,
    askTitle: 'Ask about money', askSub: 'Bills · govt schemes · fraud · savings',
    chip1: 'How do I get a loan?', chip2: "How do I save for my daughter's marriage?",
    askGhost: 'Or ask your own question →',
    docTitle: 'Understand a document',
    docExamples: 'Electricity bill · bank SMS · LIC slip · or anything else — show it',
    docReward: 'Each document can earn up to 100 points — free',
    connector: 'Every paper you show adds here automatically',
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#F6F5FB', maxWidth: 420, margin: '0 auto' }}>
      {/* Header: ← · Money Mitra · हिं/EN */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', flexShrink: 0 }}>
        <button aria-label="Back" onClick={() => (window.location.hash = '#/')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ flex: 1, fontFamily: "'JioType',sans-serif", fontSize: 17, fontWeight: 900, color: INK, letterSpacing: '-0.3px' }}>Money Mitra</span>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* A1. Greeting + insight (bound to user + हिसाब) */}
        <div className="animate-fade-in" style={{ margin: '4px 2px 0' }}>
          <h1 style={{ fontFamily: DEVA, fontSize: 22, fontWeight: 900, color: INK, letterSpacing: '-0.4px', margin: 0 }}>{t.greet(userName)}</h1>
          {hasData && bacha >= 0 && (
            <p style={{ fontFamily: DEVA, fontSize: 13, color: '#888780', margin: '4px 0 0' }}>
              {t.savedInsight(inr(bacha))}{reminder ? ` · ${reminder.docType} ${reminder.dueDate}` : ''}
            </p>
          )}
        </div>

        {/* Inline chat thread — home is a working chat */}
        {msgs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => m.role === 'user' ? (
              <div key={i} style={{ alignSelf: 'flex-end', background: PURPLE, color: '#fff', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', maxWidth: '85%', fontFamily: DEVA, fontSize: 14, lineHeight: 1.5 }}>{m.content}</div>
            ) : (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <PortraitAvatar size={28} />
                <div style={{ background: '#fff', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', maxWidth: '85%', fontFamily: DEVA, fontSize: 14, lineHeight: 1.55, color: INK }}>{m.content || '…'}</div>
              </div>
            ))}
            {busy && <div style={{ marginLeft: 36, fontFamily: DEVA, fontSize: 12, color: '#888780' }}>मुकुंद सोच रहा है…</div>}
            <div ref={endRef} />
          </div>
        )}

        {/* Ask hero (पैसे की बात पूछिए) — 2 example pills + A2 ghost pill */}
        <div className="animate-fade-in" style={{ animationDelay: '60ms', background: PURPLE, borderRadius: 20, padding: 18 }}>
          <div style={{ fontFamily: DEVA, fontSize: 18, fontWeight: 800, color: '#fff' }}>{t.askTitle}</div>
          <div style={{ fontFamily: DEVA, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>{t.askSub}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {[t.chip1, t.chip2].map(c => (
              <button key={c} onClick={() => send(c)} style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontFamily: DEVA, fontSize: 13, fontWeight: 600, color: '#fff', textAlign: 'left' }}>{c}</button>
            ))}
          </div>
          {/* A2. ghost "ask anything" pill → open chat with empty input */}
          <button onClick={() => nav('/chat')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', boxSizing: 'border-box', marginTop: 10, background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.5)', borderRadius: 999, padding: '10px', cursor: 'pointer', fontFamily: DEVA, fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {t.askGhost}
          </button>
        </div>

        {/* Document door */}
        <button className="animate-fade-in" onClick={() => nav('/decoder')} style={{ animationDelay: '120ms', display: 'flex', flexDirection: 'column', gap: 0, width: '100%', boxSizing: 'border-box', background: '#fff', border: 'none', borderRadius: 20, padding: 18, cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: DEVA, fontSize: 16, fontWeight: 700, color: INK }}>{t.docTitle}</span>
              <span style={{ display: 'block', fontFamily: DEVA, fontSize: 12, color: '#5F5E5A', marginTop: 4, lineHeight: 1.4 }}>{t.docExamples}</span>
            </span>
          </span>
        </button>

        {/* A3. Connector: vertical line + down arrow + caption */}
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, margin: '-4px 0' }}>
          <span style={{ width: 2, height: 14, background: PURPLE_LIGHT, borderRadius: 1 }} />
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={PURPLE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="6 13 12 19 18 13" /></svg>
          <span style={{ fontFamily: DEVA, fontSize: 12, fontWeight: 600, color: '#5F5E5A', textAlign: 'center', maxWidth: 280 }}>{t.connector}</span>
        </div>

        {/* A4. हिसाब widget — In/Out/Saved + split bar (bound), accent outline, इनाम chip */}
        <button className="animate-fade-in" onClick={() => nav('/passbook')} style={{ animationDelay: '180ms', display: 'block', width: '100%', boxSizing: 'border-box', background: '#fff', border: `1.5px solid ${PURPLE_LIGHT}`, borderRadius: 20, padding: 18, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IcReceipt size={20} color={PURPLE} />
            </span>
            <span style={{ flex: 1, fontFamily: DEVA, fontSize: 16, fontWeight: 800, color: INK }}>{t.hisaabTitle}</span>
          </div>

          {hasData ? (
            <>
              <div style={{ display: 'flex', gap: 10 }}>
                <Tile label={t.tileIn} value={inr(aaya)} color={GREEN} />
                <Tile label={t.tileOut} value={inr(gaya)} color={AMBER} />
                <Tile label={t.tileSaved} value={inr(Math.abs(bacha))} color={PURPLE} emphasised />
              </div>
              <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: '#EFEDF7', marginTop: 12 }}>
                <span style={{ width: `${greenPct}%`, background: GREEN }} />
                <span style={{ width: `${amberPct}%`, background: AMBER }} />
              </div>
              <p style={{ fontFamily: DEVA, fontSize: 12, color: '#888780', margin: '10px 0 0' }}>{t.hisaabSub(month)}</p>
            </>
          ) : (
            <p style={{ fontFamily: DEVA, fontSize: 14, fontWeight: 600, color: PURPLE, margin: 0 }}>{t.hisaabEmpty}</p>
          )}
        </button>

        {/* A5. Trust line (above bottom bar) */}
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '2px 0' }}>
          <IcShield size={16} color={GREEN} />
          <span style={{ fontFamily: DEVA, fontSize: 12, color: '#1a5c38', textAlign: 'center' }}>{t.trust}</span>
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

function Tile({ label, value, color, emphasised }) {
  return (
    <div style={{ flex: 1, background: emphasised ? PURPLE_LIGHT : '#F7F6FB', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontFamily: DEVA, fontSize: 11, fontWeight: 600, color: '#888780', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: DEVA, fontSize: 15, fontWeight: 800, color, letterSpacing: '-0.3px' }}>{value}</div>
    </div>
  );
}
