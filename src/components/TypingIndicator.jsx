import PersonaAvatar from './PersonaAvatar';

// JDS typing indicator — three dots using primary-50 color
export default function TypingIndicator({ persona }) {
  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}
    >
      <PersonaAvatar persona={persona} size="sm" />
      <div style={{
        padding: '14px 16px',
        borderRadius: '18px 18px 18px 4px',
        background: 'var(--jds-surface-default)',
        border: '1px solid var(--jds-stroke-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        height: '44px',
      }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--jds-primary-50)',
              display: 'inline-block',
              animation: `typing-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
