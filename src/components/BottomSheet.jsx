// BottomSheet — slide-up overlay panel.
// Props: open, onClose, title (optional), children

export default function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.42)',
        }}
      />
      {/* Sheet */}
      <div
        className="bottom-sheet-panel"
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: '420px',
          background: '#FFFFFF',
          borderRadius: '20px 20px 0 0',
          padding: '0 20px 32px',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: '36px', height: '4px', borderRadius: '999px',
          background: '#E0E0E0', margin: '14px auto 18px',
        }} />
        {title && (
          <div style={{
            fontFamily: "'Noto Sans Devanagari','JioType',sans-serif",
            fontSize: '16px', fontWeight: 700, color: '#2C2C2A',
            marginBottom: '18px',
          }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
