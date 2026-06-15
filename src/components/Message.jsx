import PersonaAvatar from './PersonaAvatar';
import { speakMukund } from '../utils/tts';

// Render chat text with clickable links. We support ONLY links — markdown
// [label](url) and bare http(s)/www URLs — and leave all other text untouched,
// so the pre-wrap layout is unchanged. (TTS still reads the raw `content`, which
// already strips markdown, so the spoken output is not affected.)
const MD_LINK  = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/g;

function Anchor({ href, children }) {
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#534AB7', textDecoration: 'underline', wordBreak: 'break-all' }}
    >
      {children}
    </a>
  );
}

function renderRichText(text) {
  // Pass 1: pull out markdown links.
  const segments = [];
  let last = 0, m;
  MD_LINK.lastIndex = 0;
  while ((m = MD_LINK.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', value: text.slice(last, m.index) });
    segments.push({ type: 'link', label: m[1], url: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });

  // Pass 2: linkify bare URLs inside the remaining text segments.
  const nodes = [];
  let key = 0;
  segments.forEach((seg) => {
    if (seg.type === 'link') {
      nodes.push(<Anchor key={key++} href={seg.url}>{seg.label}</Anchor>);
      return;
    }
    seg.value.split(BARE_URL).forEach((part) => {
      if (!part) return;
      if (/^(https?:\/\/|www\.)/.test(part)) nodes.push(<Anchor key={key++} href={part}>{part}</Anchor>);
      else nodes.push(<span key={key++}>{part}</span>);
    });
  });
  return nodes;
}

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
          {renderRichText(content)}
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
