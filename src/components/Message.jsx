import PersonaAvatar from './PersonaAvatar';
import { speakMukund } from '../utils/tts';

// Render chat text with clickable links. We support ONLY links — markdown
// [label](url) and bare http(s)/www URLs — and leave all other text untouched,
// so the pre-wrap layout is unchanged. (TTS still reads the raw `content`, which
// already strips markdown, so the spoken output is not affected.)
const MD_LINK  = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/g;

// JDS SVG icon — never emoji (a2ui MCP Hard Rule §9).
const IcSpeaker = ({ size = 13, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9v6h4l5 5V4L7 9H3z" fill={color} stroke="none" />
    <path d="M16 8a5 5 0 0 1 0 8" />
  </svg>
);

function Anchor({ href, children }) {
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-50 break-all underline"
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
    <div className={`animate-fade-in flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <PersonaAvatar persona={persona} size="sm" />}

      <div className="flex max-w-[72%] flex-col items-start">
        <div
          className={`font-jio text-ink px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-primary-20 rounded-tl-2xl rounded-tr-2xl rounded-br-sm rounded-bl-2xl'
              : 'bg-surface border-stroke-subtle rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm border'
          }`}
        >
          {renderRichText(content)}
        </div>
        {!isUser && content && (
          <button
            onClick={() => speakMukund(content)}
            className="font-deva text-ink-soft mt-1 ml-1 inline-flex items-center gap-1 rounded-md bg-transparent px-1.5 py-0.5 text-xs"
          >
            <IcSpeaker size={13} color="var(--color-ink-soft)" /> सुनिए
          </button>
        )}
      </div>
    </div>
  );
}
