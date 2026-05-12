import PersonaAvatar from './PersonaAvatar';

export default function TypingIndicator({ persona }) {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <PersonaAvatar persona={persona} size="sm" />
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm border"
        style={{ background: '#FAF7F2', borderColor: '#E8E0D5' }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#8B2C2C',
                opacity: 0.5,
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
