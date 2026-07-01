// MicCameraDual — the only two primary controls on every onboarding screen.
// कागज़ (camera/photo) + बोलिए (voice). Voice-first app: both are equal.
// No text input, no other CTAs — onboarding is camera-or-voice only.
// JDS: no shadows (Hard Rule §9) — flat, tokens only.

import { IcCamera, IcMicrophone } from './icons/Icons';

export default function MicCameraDual({ onCamera, onVoice }) {
  return (
    <div className="flex w-full gap-3">
      <button
        type="button"
        onClick={onCamera}
        className="bg-primary-50 flex flex-1 flex-col items-center gap-2 rounded-xl px-3 py-5"
      >
        <IcCamera size={28} color="#fff" />
        <span className="font-deva text-base font-extrabold text-white">कागज़</span>
      </button>
      <button
        type="button"
        onClick={onVoice}
        className="bg-surface border-primary-50 flex flex-1 flex-col items-center gap-2 rounded-xl border-2 px-3 py-5"
      >
        <IcMicrophone size={28} color="var(--color-primary-50)" />
        <span className="font-deva text-primary-50 text-base font-extrabold">बोलिए</span>
      </button>
    </div>
  );
}
