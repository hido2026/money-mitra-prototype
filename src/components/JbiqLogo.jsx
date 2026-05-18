// JBIQ cloverleaf placeholder. Replace src with official asset post-ship.
export default function JbiqLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="30" cy="30" r="28" fill="#534AB7"/>
      <circle cx="70" cy="30" r="28" fill="#534AB7"/>
      <circle cx="30" cy="70" r="28" fill="#534AB7"/>
      <circle cx="70" cy="70" r="28" fill="#534AB7"/>
      <path d="M 50 44 L 56 50 L 50 56 L 44 50 Z" fill="#FFFFFF"/>
    </svg>
  );
}
