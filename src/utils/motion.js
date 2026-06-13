// motion.js — small motion helpers (transform/opacity only; reduced-motion safe).

import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(m.matches);
    sync();
    m.addEventListener?.('change', sync);
    return () => m.removeEventListener?.('change', sync);
  }, []);
  return reduced;
}

/** Counts 0 → value over ~ms (ease-out). Instant if reduced-motion. */
export function useCountUp(value, ms = 600) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced) { setN(value); return; }
    let raf = 0;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / ms);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const settle = setTimeout(() => setN(value), ms + 200); // guarantee final even if rAF throttled
    return () => { cancelAnimationFrame(raf); clearTimeout(settle); };
  }, [value, reduced, ms]);
  return n;
}

/** Format a number as ₹ with Indian commas + Latin digits. */
export function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
