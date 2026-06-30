// MicCameraDual — the only two primary controls on every onboarding screen.
// 📷 कागज़ (camera/photo) + 🎤 बोलिए (voice). Voice-first app: both are equal.
// No text input, no other CTAs — onboarding is camera-or-voice only.

import { IcCamera, IcMicrophone } from './icons/Icons';

const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const PURPLE = '#6D17CE';

export default function MicCameraDual({ onCamera, onVoice }) {
  return (
    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
      <button
        type="button"
        onClick={onCamera}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          background: PURPLE, border: 'none', borderRadius: '20px', padding: '20px 12px',
          cursor: 'pointer', boxShadow: '0 6px 20px rgba(83,74,183,0.22)',
        }}
      >
        <IcCamera size={28} color="#fff" />
        <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 800, color: '#fff' }}>कागज़</span>
      </button>
      <button
        type="button"
        onClick={onVoice}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          background: '#fff', border: `2px solid ${PURPLE}`, borderRadius: '20px', padding: '20px 12px',
          cursor: 'pointer',
        }}
      >
        <IcMicrophone size={28} color={PURPLE} />
        <span style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 800, color: PURPLE }}>बोलिए</span>
      </button>
    </div>
  );
}
