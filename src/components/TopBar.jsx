import { useState } from 'react';
import PersonaAvatar from './PersonaAvatar';

// JDS ic_trash_clear + ic_arrow_back SVG (from JDS icon library)
const IcTrash = () => (
  <img
    src="https://raw.githubusercontent.com/sunit1986/JioBharatIQ_Server/main/assets/icons/svg/ic_trash_clear.svg"
    width="20" height="20"
    style={{ opacity: 1, display: 'block' }}
    alt="clear"
  />
);

export default function TopBar({ persona, onTogglePersona, onClearConversation }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const otherPersona = persona === 'Mukund' ? 'Meera' : 'Mukund';

  return (
    <>
      {/* ── Header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--jds-surface-default)',
        borderBottom: '1px solid var(--jds-stroke-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
      }}>
        {/* Left: avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PersonaAvatar persona={persona} size="sm" />
          <div>
            <p style={{
              margin: 0,
              fontFamily: "'JioType', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              color: 'var(--jds-text-high)',
              lineHeight: 1.2,
            }}>
              {persona}
            </p>
            <p style={{
              margin: 0,
              fontFamily: "'JioType', sans-serif",
              fontWeight: 400,
              fontSize: '12px',
              color: 'var(--jds-text-low)',
            }}>
              Money Mitra
            </p>
          </div>
        </div>

        {/* Right: switch persona + clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Switch persona pill */}
          <button
            onClick={onTogglePersona}
            title={`Switch to ${otherPersona}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid var(--jds-stroke-subtle)',
              background: 'var(--jds-surface-ghost)',
              cursor: 'pointer',
              fontFamily: "'JioType', sans-serif",
              fontWeight: 500,
              fontSize: '13px',
              color: 'var(--jds-text-high)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--jds-text-low)' }}>Switch to</span>
            <strong style={{ color: 'var(--jds-primary-50)' }}>{otherPersona}</strong>
          </button>

          {/* Clear button */}
          <button
            onClick={() => setShowConfirm(true)}
            title="Clear conversation"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IcTrash />
          </button>
        </div>
      </header>

      {/* ── Confirm modal ── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.32)', padding: '16px',
        }}>
          <div style={{
            background: 'var(--jds-surface-default)',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '320px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
          }}>
            <p style={{
              margin: '0 0 4px',
              fontFamily: "'JioType', sans-serif",
              fontWeight: 700,
              fontSize: '16px',
              color: 'var(--jds-text-high)',
            }}>
              Conversation clear karein?
            </p>
            <p style={{
              margin: '0 0 20px',
              fontFamily: "'JioType', sans-serif",
              fontSize: '14px',
              color: 'var(--jds-text-low)',
            }}>
              Yeh action undo nahi hogi.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '999px',
                  border: '1px solid var(--jds-stroke-subtle)',
                  background: 'transparent',
                  fontFamily: "'JioType', sans-serif",
                  fontWeight: 700, fontSize: '14px',
                  color: 'var(--jds-text-high)',
                  cursor: 'pointer',
                }}
              >
                Raho
              </button>
              <button
                onClick={() => { onClearConversation(); setShowConfirm(false); }}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'var(--jds-error)',
                  fontFamily: "'JioType', sans-serif",
                  fontWeight: 700, fontSize: '14px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Haan, clear karein
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
