// Home — rebuilt to the locked spec (CLAUDE.md §Home + §Universal shell).
// No identity block, no mission board, no ₹/redeem. Hindi default + EN toggle.
// Lead + three scoped cards (shortcuts, not gates). The home is a working chat:
// a question from the dock is answered INLINE (no forced entry into a card).

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Groq from 'groq-sdk';
import { MUKUND_PROMPT } from '../config/system-prompts.js';
import { speakMukund } from '../utils/tts';
import { setPendingFile } from '../utils/pendingFile';
import BottomInputBar from '../components/BottomInputBar';
import AttachSheet from '../components/AttachSheet';
import PortraitAvatar from '../components/PortraitAvatar';
import { IcReceipt } from '../components/icons/Icons';

const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const PURPLE = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const INK = '#2C2C2A';

const _apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groqClient = _apiKey ? new Groq({ apiKey: _apiKey, dangerouslyAllowBrowser: true }) : null;

const COPY = {
  hi: {
    lead: 'नमस्ते, आज मैं किसमें मदद करूँ?',
    askTitle: 'पैसे की बात पूछिए', askSub: 'बिल · सरकारी योजना · ठगी · बचत',
    chip1: 'सरकारी योजना का पैसा कैसे मिलता है?', chip2: 'ठगी से कैसे बचूँ?',
    docTitle: 'Document समझिए', docSub: 'फ़ोटो दिखाइए — आसान भाषा में समझा दूँगा',
    ledgerTitle: 'आपका हिसाब', ledgerSub: 'फ़ोटो से अपने आप बने', pill: 'अंक मिलते रहेंगे',
    placeholder: 'पूछिए या Document दिखाइए…',
  },
  en: {
    lead: 'Namaste — how can I help today?',
    askTitle: 'Ask about money', askSub: 'Bills · govt schemes · fraud · savings',
    chip1: 'How do I get government scheme money?', chip2: 'How do I stay safe from fraud?',
    docTitle: 'Understand a Document', docSub: 'Show a photo — I’ll explain it simply',
    ledgerTitle: 'Your हिसाब', ledgerSub: 'Built automatically from photos', pill: 'Earn points',
    placeholder: 'Ask or show a Document…',
  },
};

export default function Home() {
  const nav = useNavigate();
  const [lang, setLang] = useState('hi');
  const [msgs, setMsgs] = useState([]); // inline chat thread
  const [busy, setBusy] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const endRef = useRef(null);
  const t = COPY[lang];

  const send = async (text) => {
    const q = (text || '').trim();
    if (!q || busy) return;
    const next = [...msgs, { role: 'user', content: q }];
    setMsgs(next);
    setBusy(true);
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
      {/* Top bar: ← · Money Mitra · हिं/EN toggle */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: '#F6F5FB', flexShrink: 0 }}>
        <button aria-label="Back" onClick={() => (window.location.hash = '#/')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ flex: 1, fontFamily: "'JioType',sans-serif", fontSize: 17, fontWeight: 900, color: INK, letterSpacing: '-0.3px' }}>Money Mitra</span>
        <button onClick={() => setLang(l => (l === 'hi' ? 'en' : 'hi'))} style={{ display: 'flex', background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: 999, padding: '3px', cursor: 'pointer' }}>
          {['hi', 'en'].map(L => (
            <span key={L} style={{ fontFamily: DEVA, fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: lang === L ? PURPLE : 'transparent', color: lang === L ? '#fff' : '#888780' }}>{L === 'hi' ? 'हिं' : 'EN'}</span>
          ))}
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Lead line */}
        <h1 className="animate-fade-in" style={{ fontFamily: DEVA, fontSize: 24, fontWeight: 900, color: INK, letterSpacing: '-0.5px', margin: '4px 2px 0', lineHeight: 1.3 }}>{t.lead}</h1>

        {/* Inline chat thread (home is a working chat) */}
        {msgs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {msgs.map((m, i) => m.role === 'user' ? (
              <div key={i} style={{ alignSelf: 'flex-end', background: PURPLE, color: '#fff', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', maxWidth: '85%', fontFamily: DEVA, fontSize: 14, lineHeight: 1.5 }}>{m.content}</div>
            ) : (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <PortraitAvatar size={28} />
                <div style={{ background: '#fff', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', maxWidth: '85%', fontFamily: DEVA, fontSize: 14, lineHeight: 1.55, color: INK }}>{m.content || '…'}</div>
              </div>
            ))}
            {busy && <div style={{ marginLeft: 36, fontFamily: DEVA, fontSize: 12, color: '#888780' }}>मुकुंद सोच रहा है…</div>}
            <div ref={endRef} />
          </div>
        )}

        {/* Card 1 — पैसे की बात पूछिए (violet, primary) */}
        <div className="animate-fade-in" style={{ animationDelay: '60ms', background: PURPLE, borderRadius: '20px', padding: '18px' }}>
          <button onClick={() => nav('/chat')} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ fontFamily: DEVA, fontSize: 18, fontWeight: 800, color: '#fff' }}>{t.askTitle}</div>
            <div style={{ fontFamily: DEVA, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>{t.askSub}</div>
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 12 }}>
            {[t.chip1, t.chip2].map(c => (
              <button key={c} onClick={() => send(c)} style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontFamily: DEVA, fontSize: 13, fontWeight: 600, color: '#fff', textAlign: 'left' }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Card 2 — Document समझिए (page icon, opens attach sheet) */}
        <button className="animate-fade-in" onClick={() => setAttachOpen(true)} style={{ animationDelay: '120ms', display: 'flex', alignItems: 'center', gap: '16px', width: '100%', boxSizing: 'border-box', background: '#fff', border: 'none', borderRadius: '20px', padding: '18px', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ width: 48, height: 48, borderRadius: '14px', flexShrink: 0, background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: DEVA, fontSize: 16, fontWeight: 700, color: INK }}>{t.docTitle}</span>
            <span style={{ display: 'block', fontFamily: DEVA, fontSize: 13, color: '#5F5E5A', marginTop: 4 }}>{t.docSub}</span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={20} height={20} style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
        </button>

        {/* Card 3 — आपका हिसाब (receipt icon, अंक pill, opens ledger) */}
        <button className="animate-fade-in" onClick={() => nav('/passbook')} style={{ animationDelay: '180ms', display: 'flex', alignItems: 'center', gap: '16px', width: '100%', boxSizing: 'border-box', background: '#fff', border: 'none', borderRadius: '20px', padding: '18px', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ width: 48, height: 48, borderRadius: '14px', flexShrink: 0, background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcReceipt size={24} color={PURPLE} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: DEVA, fontSize: 16, fontWeight: 700, color: INK }}>{t.ledgerTitle}</span>
            <span style={{ display: 'block', fontFamily: DEVA, fontSize: 13, color: '#5F5E5A', marginTop: 4 }}>{t.ledgerSub}</span>
          </span>
          <span style={{ flexShrink: 0, background: PURPLE_LIGHT, color: PURPLE, borderRadius: 999, padding: '4px 10px', fontFamily: DEVA, fontSize: 11, fontWeight: 700 }}>{t.pill}</span>
        </button>
      </div>

      {/* Universal dock — + (attach) · ask (inline) · voice */}
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
