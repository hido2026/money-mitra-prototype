import { useApp } from '../context/AppContext';

const PURPLE      = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const DEVA        = "'Noto Sans Devanagari','JioType',sans-serif";

// useLang — reads from AppContext (single global source of truth).
// Toggling on any screen re-renders all mounted components instantly.
export function useLang() {
  const { state, dispatch } = useApp();
  const lang = state.lang ?? 'hi';
  const setLang = (l) => dispatch({ type: 'SET_LANG', payload: l });
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
