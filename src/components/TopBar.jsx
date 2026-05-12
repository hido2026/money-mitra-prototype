// TopBar — matches JBIQ companion chat header pattern
// ← back | avatar+ring | companion name | ✏ edit (clears conversation)

import PersonaAvatar from './PersonaAvatar';

// JDS ic_arrow_back svg_path
const IcArrowBack = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path
      d="M2.29 12.71l6 6a1.004 1.004 0 101.42-1.42L5.41 13H21a1 1 0 100-2H5.41l4.3-4.29a1 1 0 000-1.42 1 1 0 00-1.42 0l-6 6a1 1 0 000 1.42z"
      fill="var(--jds-text-high)"
    />
  </svg>
);

// Pencil / edit icon (JDS ic_edit_pen style)
const IcPencil = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      fill="var(--jds-text-high)"
    />
  </svg>
);

export default function TopBar({ persona, onBack, onClearConversation }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'var(--jds-surface-default)',
      borderBottom: '1px solid var(--jds-stroke-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      gap: '12px',
      height: '60px',
    }}>
      {/* ← Back */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        title="Back"
      >
        <IcArrowBack />
      </button>

      {/* Avatar + ring + name (flex: grows to fill space) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        {/* Avatar with purple ring */}
        <div style={{
          padding: '2px',
          borderRadius: '50%',
          border: '2px solid var(--jds-primary-50)',
          flexShrink: 0,
        }}>
          <PersonaAvatar persona={persona} size="sm" />
        </div>
        {/* Name + subtitle */}
        <div>
          <p style={{
            margin: 0,
            fontFamily: "'JioType', sans-serif",
            fontWeight: 700,
            fontSize: '16px',
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

      {/* ✏ Edit = clear conversation */}
      <button
        onClick={onClearConversation}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        title="New conversation"
      >
        <IcPencil />
      </button>
    </header>
  );
}
