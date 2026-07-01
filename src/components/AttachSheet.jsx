// AttachSheet — the one JBIQ attach sheet used by `+`, the Document card, and the
// हिसाब add (CLAUDE.md §Universal shell). Three options: कैमरा / गैलरी / फ़ाइल-PDF.
// On pick → onFile(file); the caller routes it into the decode flow.
// JDS (a2ui MCP §12.0a): scrim bg-[rgba(12,13,16,0.45)] backdrop-blur-md, tokens only.

import { useRef } from 'react';
import { IcCamera } from './icons/Icons';

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
    <button onClick={onClick} className="font-deva bg-surface flex w-full items-center gap-3.5 rounded-lg px-4 py-3.5 text-left">
      <span className="bg-primary-20 flex size-11 shrink-0 items-center justify-center rounded-lg">{icon}</span>
      <span className="flex-1">
        <span className="text-ink block text-[15px] font-bold">{label}</span>
        <span className="text-neutral block text-xs">{sub}</span>
      </span>
    </button>
  );

  const galleryIcon = (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-primary-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
  const fileIcon = (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-primary-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center">
      <button aria-label="बंद करें" onClick={onClose} className="absolute inset-0 border-0 bg-[rgba(12,13,16,0.45)] backdrop-blur-md" />
      <div className="toast-animate bg-surface-minimal relative flex w-full max-w-[420px] flex-col gap-2.5 rounded-t-2xl px-4 pt-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 20px)' }}>
        <div className="bg-ink-disabled mx-auto mb-2 h-1 w-10 rounded-full" />
        <p className="font-deva text-ink mb-1 ml-1 text-sm font-extrabold">Document दिखाइए</p>
        <Row onClick={() => camRef.current?.click()} icon={<IcCamera size={22} color="var(--color-primary-50)" />} label="कैमरा" sub="कागज़ की फ़ोटो खींचें" />
        <Row onClick={() => galRef.current?.click()} icon={galleryIcon} label="गैलरी" sub="WhatsApp/फ़ोटो में से चुनें" />
        <Row onClick={() => pdfRef.current?.click()} icon={fileIcon} label="फ़ाइल / PDF" sub="PDF भी चलेगा" />

        <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
        <input ref={galRef} type="file" accept="image/*" onChange={pick} className="hidden" />
        <input ref={pdfRef} type="file" accept="application/pdf,image/*" onChange={pick} className="hidden" />
      </div>
    </div>
  );
}
