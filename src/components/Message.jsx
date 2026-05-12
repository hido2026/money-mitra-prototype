import PersonaAvatar from './PersonaAvatar';

// JDS chat bubbles
// User  → primary-20 (#e8e8fc), right-aligned
// Bot   → surface-default (#fff) + stroke-subtle border, left-aligned

export default function Message({ role, content, persona }) {
  const isUser = role === 'user';

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {!isUser && <PersonaAvatar persona={persona} size="sm" />}

      <div style={{
        maxWidth: '72%',
        padding: '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        fontFamily: "'JioType', sans-serif",
        fontWeight: 400,
        fontSize: '15px',           // body-m
        lineHeight: 1.5,
        color: 'var(--jds-text-high)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background: isUser
          ? 'var(--jds-primary-20)'
          : 'var(--jds-surface-default)',
        border: isUser
          ? 'none'
          : '1px solid var(--jds-stroke-subtle)',
      }}>
        {content}
      </div>
    </div>
  );
}
