import PersonaAvatar from './PersonaAvatar';

export default function Message({ role, content, persona }) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex items-end gap-2 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && <PersonaAvatar persona={persona} size="sm" />}

      <div
        className="max-w-[78%] sm:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
        style={
          isUser
            ? {
                background: '#F0EBE3',
                color: '#1F1F1F',
                borderRadius: '18px 18px 4px 18px',
              }
            : {
                background: '#FAF7F2',
                color: '#1F1F1F',
                border: '1px solid #E8E0D5',
                borderRadius: '18px 18px 18px 4px',
              }
        }
      >
        {content}
      </div>
    </div>
  );
}
