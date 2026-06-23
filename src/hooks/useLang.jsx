import { useState } from 'react';

const PURPLE      = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const DEVA        = "'Noto Sans Devanagari','JioType',sans-serif";

export function useLang() {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('mm_lang') === 'hi' ? 'hi' : 'en'; } catch { return 'en'; }
  });
  const setLang = (l) => {
    try { localStorage.setItem('mm_lang', l); } catch { /* ignore */ }
    setLangState(l);
  };
  return [lang, setLang];
}

// Reusable EN/हिं pill — drop anywhere in a header flex row.
export function LangToggle({ lang, setLang }) {
  return (
    <button
      onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
      style={{ display: 'flex', background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: 999, padding: 3, cursor: 'pointer', flexShrink: 0 }}
    >
      {['en', 'hi'].map(L => (
        <span key={L} style={{ fontFamily: DEVA, fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: lang === L ? PURPLE : 'transparent', color: lang === L ? '#fff' : '#888780' }}>
          {L === 'hi' ? 'हिं' : 'EN'}
        </span>
      ))}
    </button>
  );
}
