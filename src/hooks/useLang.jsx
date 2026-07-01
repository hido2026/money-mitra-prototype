import { useApp } from '../context/AppContext';

// useLang — reads from AppContext (single global source of truth).
// Toggling on any screen re-renders all mounted components instantly.
export function useLang() {
  const { state, dispatch } = useApp();
  const lang = state.lang ?? 'hi';
  const setLang = (l) => dispatch({ type: 'SET_LANG', payload: l });
  return [lang, setLang];
}

// Reusable EN/हिं pill — drop anywhere in a header flex row. JDS tokens only.
export function LangToggle({ lang, setLang }) {
  return (
    <button
      aria-label="Toggle language"
      onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
      className="border-primary-20 flex shrink-0 rounded-full border bg-surface p-[3px]"
    >
      {['en', 'hi'].map(L => (
        <span
          key={L}
          className={`font-deva rounded-full px-2.5 py-1 text-xs font-extrabold ${
            lang === L ? 'bg-primary-50 text-white' : 'text-ink-soft bg-transparent'
          }`}
        >
          {L === 'hi' ? 'हिं' : 'EN'}
        </span>
      ))}
    </button>
  );
}
