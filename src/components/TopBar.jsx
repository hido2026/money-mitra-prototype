// TopBar — renders first in HTML so Mukund identity appears
// on 2G/3G before chat content finishes loading.
// Row 1: "Money Mitra" (violet brand) + "⋯" menu
// Row 2: portrait avatar (pulsing when typing) + "Mukund" + subtitle
// JDS: violet brand tokens throughout (was a legacy maroon/cream skin).

import { useState } from 'react';
import PersonaAvatar from './PersonaAvatar';
import { LangToggle } from '../hooks/useLang';

const IcMore = ({ size = 20, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);

export default function TopBar({ onClear, isTyping = false, lang, setLang }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-primary-20 sticky top-0 z-10 border-b bg-surface-minimal px-4 pt-3 pb-2.5">
      {/* ── Row 1: title + menu ── */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-jio text-primary-50 text-xl font-black tracking-tight">
          Money Mitra
        </span>

        <div className="flex items-center gap-2">
          {lang != null && setLang != null && (
            <LangToggle lang={lang} setLang={setLang} />
          )}

          {/* ⋯ menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="text-primary-50 flex bg-transparent p-1.5"
              title="Menu"
              aria-label="Menu"
            >
              <IcMore size={20} color="var(--color-primary-50)" />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40"
                />
                {/* Dropdown */}
                <div className="border-primary-20 absolute top-[calc(100%+6px)] right-0 z-50 min-w-[200px] overflow-hidden rounded-lg border bg-surface">
                  <button
                    onClick={() => { onClear(); setMenuOpen(false); }}
                    className="font-jio text-ink block w-full bg-transparent px-4.5 py-3.5 text-left text-sm font-medium"
                  >
                    Conversation clear karein
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Mukund identity ── */}
      <div className="flex items-center gap-2">
        <PersonaAvatar persona="Mukund" size="sm" isTyping={isTyping} />
        <span className="font-jio text-ink text-[13px] font-bold">
          Mukund
        </span>
        <span className="font-deva text-ink-soft text-xs">
          · आपके पैसों का साथी
        </span>
      </div>
    </header>
  );
}
