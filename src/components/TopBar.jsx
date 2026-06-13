// TopBar — renders first in HTML so Mukund identity appears
// on 2G/3G before chat content finishes loading.
// Row 1: "Money Mitra" (serif, deep red) + "⋯" menu
// Row 2: portrait avatar (pulsing when typing) + "Mukund" + subtitle

import { useState } from 'react';
import PersonaAvatar from './PersonaAvatar';

export default function TopBar({ onClear, isTyping = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: '#FAF7F2',
      borderBottom: '1px solid rgba(139,44,44,0.18)',
      padding: '12px 16px 10px',
    }}>
      {/* ── Row 1: title + menu ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 600,
          fontSize: '20px',
          color: '#8B2C2C',
          letterSpacing: '-0.01em',
        }}>
          Money Mitra
        </span>

        {/* ⋯ menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '22px',
              color: '#8B2C2C',
              padding: '2px 8px',
              lineHeight: 1,
              letterSpacing: '2px',
            }}
            title="Menu"
          >
            ···
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              />
              {/* Dropdown */}
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                zIndex: 50,
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
                minWidth: '200px',
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => { onClear(); setMenuOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px 18px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'JioType', sans-serif",
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#1F1F1F',
                  }}
                >
                  Conversation clear karein
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: Mukund identity ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PersonaAvatar persona="Mukund" size="sm" isTyping={isTyping} />
        <span style={{
          fontFamily: "'JioType', sans-serif",
          fontWeight: 700,
          fontSize: '13px',
          color: '#1F1F1F',
        }}>
          Mukund
        </span>
        <span style={{
          fontFamily: "'JioType', sans-serif",
          fontWeight: 400,
          fontSize: '12px',
          color: 'rgba(25,27,30,0.55)',
        }}>
          · आपका पैसे का साथी
        </span>
      </div>
    </header>
  );
}
