import PersonaAvatar from './PersonaAvatar';
import { speakMukund } from '../utils/tts';

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

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '72%' }}>
        <div style={{
          padding: '12px 16px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          fontFamily: "'JioType', sans-serif",
          fontWeight: 400,
          fontSize: '15px',
          lineHeight: 1.5,
          color: 'var(--jds-text-high)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: isUser ? 'var(--jds-primary-20)' : 'var(--jds-surface-default)',
          border: isUser ? 'none' : '1px solid var(--jds-stroke-subtle)',
        }}>
          {content}
        </div>
        {!isUser && content && (
          <button
            onClick={() => speakMukund(content)}
            style={{ marginTop: '4px', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#888780', padding: '2px 6px', borderRadius: '6px' }}
          >
            🔊 सुनिए
          </button>
        )}
      </div>
    </div>
  );
}
