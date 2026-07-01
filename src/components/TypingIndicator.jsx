import PersonaAvatar from './PersonaAvatar';

// JDS typing indicator (§11.89) — three dots using primary-50, tokens only.
export default function TypingIndicator({ persona }) {
  return (
    <div className="animate-fade-in flex items-end gap-2">
      <PersonaAvatar persona={persona} size="sm" />
      <div className="bg-surface border-stroke-subtle flex h-11 items-center gap-1.5 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm border px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="bg-primary-50 inline-block size-1.5 rounded-full"
            style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.18}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
