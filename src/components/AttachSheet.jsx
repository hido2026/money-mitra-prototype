// AttachSheet — the one JBIQ attach sheet used by `+`, the Document card, and the
// हिसाब add (CLAUDE.md §Universal shell). Three options: कैमरा / गैलरी / फ़ाइल-PDF.
// On pick → onFile(file); the caller routes it into the decode flow.

import { useRef } from 'react';
import { IcCamera } from './icons/Icons';

const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const PURPLE = '#6D17CE';
const PURPLE_LIGHT = '#EDE7FF';
const INK = '#2C2C2A';

export default function AttachSheet({ open, onClose, onFile }) {
  const camRef = useRef(null);
  const galRef = useRef(null);
  const pdfRef = useRef(null);

  if (!open) return null;

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) { onClose?.(); onFile?.(f); }
  };

  const Row = ({ onClick, icon, label, sub }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', background: '#fff', border: 'none', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}>
      <span style={{ width: 44, height: 44, borderRadius: '12px', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontFamily: DEVA, fontSize: 15, fontWeight: 700, color: INK }}>{label}</span>
        <span style={{ display: 'block', fontFamily: DEVA, fontSize: 12, color: '#888780' }}>{sub}</span>
      </span>
    </button>
  );

  const galleryIcon = (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
  const fileIcon = (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <button aria-label="बंद करें" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer' }} />
      <div className="toast-animate" style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#F6F5FB', borderRadius: '20px 20px 0 0', padding: '20px 16px calc(env(safe-area-inset-bottom,0px) + 20px)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: '#d8d5e0', margin: '0 auto 8px' }} />
        <p style={{ fontFamily: DEVA, fontSize: 14, fontWeight: 800, color: INK, margin: '0 0 4px 4px' }}>Document दिखाइए</p>
        <Row onClick={() => camRef.current?.click()} icon={<IcCamera size={22} color={PURPLE} />} label="कैमरा" sub="कागज़ की फ़ोटो खींचें" />
        <Row onClick={() => galRef.current?.click()} icon={galleryIcon} label="गैलरी" sub="WhatsApp/फ़ोटो में से चुनें" />
        <Row onClick={() => pdfRef.current?.click()} icon={fileIcon} label="फ़ाइल / PDF" sub="PDF भी चलेगा" />

        <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={pick} style={{ display: 'none' }} />
        <input ref={galRef} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
        <input ref={pdfRef} type="file" accept="application/pdf,image/*" onChange={pick} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
