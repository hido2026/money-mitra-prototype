// Tabler-style inline icons used across home + corridor screens.
// Each icon takes { size, color } and emits a stroke-only SVG.

const base = (size, color) => ({
  width: size, height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export const IcChevronLeft = ({ size = 24, color = '#2C2C2A' }) => (
  <svg {...base(size, color)}><path d="M15 6l-6 6 6 6"/></svg>
);

export const IcChevronUp = ({ size = 14, color = '#888780' }) => (
  <svg {...base(size, color)}><path d="M6 15l6-6 6 6"/></svg>
);

export const IcEdit = ({ size = 22, color = '#2C2C2A' }) => (
  <svg {...base(size, color)}>
    <path d="M4 20h4l10-10a2.83 2.83 0 1 0-4-4L4 16v4"/>
    <path d="M13.5 6.5l4 4"/>
  </svg>
);

export const IcDots = ({ size = 22, color = '#2C2C2A' }) => (
  <svg {...base(size, color)}>
    <circle cx="5"  cy="12" r="1"/>
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
  </svg>
);

export const IcPlus = ({ size = 20, color = '#6D17CE' }) => (
  <svg {...base(size, color)}><path d="M12 5v14M5 12h14"/></svg>
);

export const IcMicrophone = ({ size = 18, color = '#FFFFFF' }) => (
  <svg {...base(size, color)}>
    <rect x="9" y="2" width="6" height="11" rx="3"/>
    <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/>
  </svg>
);

export const IcBulb = ({ size = 15, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
    <path d="M8.5 14a5 5 0 1 1 7 0 3 3 0 0 0-1 2v0a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v0a3 3 0 0 0-1-2"/>
  </svg>
);

export const IcPiggyBank = ({ size = 15, color = '#D85A30' }) => (
  <svg {...base(size, color)}>
    <path d="M15 11l0 .01"/>
    <path d="M5.41 10.42a5 5 0 0 1 4.59-3.42h4a5 5 0 0 1 5 5v0a5 5 0 0 1-3 4.58v2.42h-3v-2h-2v2h-3v-3a5 5 0 0 1-3-3.58l-1.41-.42a1 1 0 0 1 -.59-1.58z"/>
    <path d="M2 8c1.5 -1.5 3 -2 4.5 -1.5"/>
  </svg>
);

export const IcRocket = ({ size = 15, color = '#3B6D11' }) => (
  <svg {...base(size, color)}>
    <path d="M4 13a8 8 0 0 1 7-7 18 18 0 0 1 7 7 8 8 0 0 1-7 7 18 18 0 0 1-7-7"/>
    <path d="M9 9c-2 1-4 4-5 9 5-1 8-3 9-5"/>
    <circle cx="14" cy="10" r="1.5"/>
  </svg>
);

export const IcReceipt = ({ size = 15, color = '#888780' }) => (
  <svg {...base(size, color)}>
    <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2"/>
    <path d="M9 7h6M9 11h6M9 15h4"/>
  </svg>
);

export const IcChartLine = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M4 19h16"/>
    <path d="M4 15l4-6 4 2 6-8"/>
  </svg>
);

export const IcScale = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M7 20h10M12 3v17M5 12l2-7 2 7a3 3 0 0 1-4 0M15 9l2-7 2 7a3 3 0 0 1-4 0"/>
  </svg>
);

export const IcStamp = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M5 21h14"/>
    <path d="M6 18h12v-2a2 2 0 0 0-2-2h-1a2 2 0 0 1-2-2V9a2 2 0 1 0-4 0v3a2 2 0 0 1-2 2H6a2 2 0 0 0-2 2v2h2z"/>
  </svg>
);

export const IcPencil = ({ size = 16, color = '#888780' }) => (
  <svg {...base(size, color)}>
    <path d="M4 20h4l10-10a2.83 2.83 0 1 0-4-4L4 16v4"/>
  </svg>
);

export const IcAlertOctagon = ({ size = 16, color = '#D85A30' }) => (
  <svg {...base(size, color)}>
    <path d="M8.5 2h7l5 5v7l-5 5h-7l-5-5v-7z"/>
    <path d="M12 8v4M12 16h.01"/>
  </svg>
);

export const IcCoinOff = ({ size = 16, color = '#D85A30' }) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M3 3l18 18"/>
    <path d="M9 12h3"/>
  </svg>
);

export const IcFileDollar = ({ size = 16, color = '#D85A30' }) => (
  <svg {...base(size, color)}>
    <path d="M14 3v5h5M6 21V5a2 2 0 0 1 2-2h6l5 5v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/>
    <path d="M13 11h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H9M11 11v-1M11 17v1"/>
  </svg>
);

export const IcSchool = ({ size = 16, color = '#3B6D11' }) => (
  <svg {...base(size, color)}>
    <path d="M9 18h6M10 21h4"/>
    <path d="M15.5 14c.7-.8 1.5-1.7 1.5-3.5A5 5 0 1 0 7 10.5c0 1.8.8 2.7 1.5 3.5.5.6.9 1 .9 1.8v.2h5.2v-.2c0-.8.4-1.2.9-1.8z"/>
  </svg>
);

export const IcConfetti = ({ size = 16, color = '#3B6D11' }) => (
  <svg {...base(size, color)}>
    <path d="M4 5h.01M8 2h.01M18 5h.01M20 12h.01M14 3h.01"/>
    <path d="M4 19l8-8 5 5-8 8z"/>
    <path d="M14 4l3 3"/>
  </svg>
);

export const IcHome = ({ size = 16, color = '#3B6D11' }) => (
  <svg {...base(size, color)}>
    <path d="M3 11l9-8 9 8M5 10v10h14V10"/>
  </svg>
);

// ── New icons for Decoder / Passbook / Products ────────────────────────────────

export const IcCamera = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

export const IcZap = ({ size = 16, color = '#D85A30' }) => (
  <svg {...base(size, color)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

export const IcSmartphone = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <path d="M12 18h.01"/>
  </svg>
);

export const IcFileText = ({ size = 16, color = '#888780' }) => (
  <svg {...base(size, color)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

export const IcBookOpen = ({ size = 16, color = '#3B6D11' }) => (
  <svg {...base(size, color)}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z"/>
  </svg>
);

export const IcCoins = ({ size = 16, color = '#C8961E' }) => (
  <svg {...base(size, color)}>
    <circle cx="8" cy="8" r="6"/>
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
    <path d="M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>
  </svg>
);

export const IcBuilding = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
  </svg>
);

export const IcCheck = ({ size = 20, color = '#3B6D11' }) => (
  <svg {...base(size, color)}><path d="M20 6L9 17l-5-5"/></svg>
);

export const IcXMark = ({ size = 20, color = '#D85A30' }) => (
  <svg {...base(size, color)}><path d="M18 6L6 18M6 6l12 12"/></svg>
);

export const IcRepeat = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

export const IcTarget = ({ size = 16, color = '#3B6D11' }) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export const IcArrowUp = ({ size = 16, color = '#3B6D11' }) => (
  <svg {...base(size, color)}><path d="M12 19V5M5 12l7-7 7 7"/></svg>
);

export const IcArrowDown = ({ size = 16, color = '#D85A30' }) => (
  <svg {...base(size, color)}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
);

export const IcSparks = ({ size = 16, color = '#C8961E' }) => (
  <svg {...base(size, color)}>
    <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M1 12h2M20 12h2M4.22 19.78l.7-.7M18.36 5.64l.7-.7"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
);

export const IcShield = ({ size = 16, color = '#D85A30' }) => (
  <svg {...base(size, color)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

// ── Part E: icons for new doc types ──────────────────────────────────────────

export const IcWallet = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M20 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/>
    <circle cx="17" cy="13" r="1.5" fill={color} stroke="none"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

export const IcLock = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export const IcFork = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <line x1="12" y1="2" x2="12" y2="22"/>
    <path d="M8 2v4a4 4 0 0 0 8 0V2"/>
  </svg>
);

export const IcCart = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

export const IcGas = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M3 22V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v15"/>
    <line x1="3" y1="22" x2="21" y2="22"/>
    <path d="M10 22V16h4v6"/>
    <rect x="6" y="10" width="12" height="5" rx="1"/>
  </svg>
);

export const IcUpi = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M7 3l5 9 5-9"/>
    <path d="M7 21l5-9 5 9"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
  </svg>
);

export const IcCoin = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 3"/>
  </svg>
);

export const IcFlame = ({ size = 16, color = '#B5740F' }) => (
  <svg {...base(size, color)}>
    <path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c2 2 3 5 3 7a7 7 0 1 1-14 0c0-3 2-5 3-8 .5 1.5 1.5 2 2 1-1-2-1-5 0-7z" />
  </svg>
);

export const IcThumbUp = ({ size = 16, color = '#0F8A6B' }) => (
  <svg {...base(size, color)}>
    <path d="M7 10v11" />
    <path d="M11 21h6.5a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 18.7 11H14V5.5a2.5 2.5 0 0 0-5 0L7 10H3v11h4" />
  </svg>
);

export const IcBriefcase = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 13h20"/>
  </svg>
);

export const IcUmbrella = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M12 2a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/>
    <path d="M12 11v9a2 2 0 0 1-4 0"/>
    <line x1="12" y1="2" x2="12" y2="4"/>
  </svg>
);

export const IcGift = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <rect x="3" y="8" width="18" height="4" rx="1"/>
    <path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
    <path d="M12 8a2.5 2.5 0 1 1-2.5-2.5c1.9 0 2.5 2.5 2.5 2.5zM12 8a2.5 2.5 0 1 0 2.5-2.5c-1.9 0-2.5 2.5-2.5 2.5z"/>
  </svg>
);

export const IcGoldCoin = ({ size = 16, color = '#C8961E' }) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="9"/>
    <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color} stroke="none">₹</text>
  </svg>
);

// ── Multi-color flat icons — still hand-drawn SVG (never emoji), but filled
// with a small fixed on-brand palette instead of one stroke color. Reserved
// for high-engagement accents (streak/most-asked badges, Paisa Gyaan) where
// we want the pop of the reference mock's emoji without the inconsistent
// cross-platform rendering an actual emoji glyph would bring. No `color`
// prop — the palette is fixed by design, unlike the monotone icons above.

export const IcFlameColor = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path fill="#E8491F" d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c2 2 3 5 3 7a7 7 0 1 1-14 0c0-3 2-5 3-8 .5 1.5 1.5 2 2 1-1-2-1-5 0-7z" />
    <path fill="#FF8C1A" d="M13.1 9.6c.5 1.9-1.4 2.7-1.4 4.9a3.1 3.1 0 0 0 6.2 0c0-2.2-1.9-3.6-2.2-5.6-.3 1.2-1 1.5-1.3 1-.4-.5-.5-1-1.3-.3z" />
    <circle cx="13" cy="17.3" r="1.9" fill="#FFD23F" />
  </svg>
);

export const IcSchoolColor = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path fill="#C8961E" d="M15.5 14c.7-.8 1.5-1.7 1.5-3.5A5 5 0 1 0 7 10.5c0 1.8.8 2.7 1.5 3.5.5.6.9 1 .9 1.8v.2h5.2v-.2c0-.8.4-1.2.9-1.8z" />
    <rect x="9" y="17.5" width="6" height="1.6" rx="0.8" fill="var(--color-primary-70)" />
    <rect x="10" y="20" width="4" height="1.4" rx="0.7" fill="var(--color-primary-70)" />
  </svg>
);

export const IcShieldColor = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path fill="var(--color-success)" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M8.5 12l2.3 2.3 4.7-4.9" />
  </svg>
);

// Tier 2/3 icon revision (UPI = the scan-to-pay QR mark everyone already
// recognises from kirana counters; the "UPI" text lives in the category
// label right next to this icon, not crammed into the glyph itself).
export const IcQrCode = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <line x1="14" y1="14" x2="14" y2="21"/>
    <line x1="14" y1="17.5" x2="21" y2="17.5"/>
    <line x1="18" y1="14" x2="21" y2="14"/>
    <line x1="21" y1="21" x2="21" y2="21"/>
  </svg>
);

// Govt schemes — a generic pillared/civic building, deliberately not the
// Ashoka Chakra or any state emblem (restricted symbol, not ours to reuse).
// Visually distinct from IcBuilding (Bank basics) via the triangular
// pediment + freestanding columns, a "classical civic" silhouette vs.
// Bank's plain modern rectangle.
export const IcLandmark = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <polygon points="12 2 20 8 4 8"/>
    <line x1="3" y1="21" x2="21" y2="21"/>
    <line x1="6" y1="18" x2="6" y2="11"/>
    <line x1="10" y1="18" x2="10" y2="11"/>
    <line x1="14" y1="18" x2="14" y2="11"/>
    <line x1="18" y1="18" x2="18" y2="11"/>
  </svg>
);

// KYC/Aadhaar/PAN — an ID card (face + fingerprint-style lines), the object
// people actually associate with identity proof, replacing the rubber-stamp
// metaphor (post-office, not identity).
export const IcIdCard = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <circle cx="8" cy="10" r="2"/>
    <path d="M5 16c0-1.7 1.3-3 3-3s3 1.3 3 3"/>
    <line x1="14" y1="8" x2="20" y2="8"/>
    <line x1="14" y1="12" x2="20" y2="12"/>
    <line x1="14" y1="16" x2="18" y2="16"/>
  </svg>
);

// Loans/CIBIL — a currency note with an interest-rate badge, so the glyph
// says "loan" specifically rather than just "money" (a plain wallet reads
// as savings/spending just as easily as borrowing).
export const IcPercentNote = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="12" cy="12" r="3.2"/>
    <text x="12" y="14.6" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={color} stroke="none">%</text>
  </svg>
);

// Earning income — a hand receiving a coin, deliberately not a briefcase
// (excludes gig workers, vendors, farmers — most of this app's audience
// don't have "corporate jobs").
export const IcCashHand = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M4 15c0-1.1 1.3-2 3-2h2.5l2.5-1.7 2.5 1.7H17c1.7 0 3 .9 3 2v3c0 1.1-1.3 2-3 2H7c-1.7 0-3-.9-3-2z"/>
    <circle cx="12" cy="6.5" r="2.5"/>
  </svg>
);

// Bills & utilities — a bill with a utility bolt, so it reads distinctly
// from हिसाब's plain receipt (same glyph on both was a real bug).
export const IcBillBolt = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M6 2h9l4 4v16H6z"/>
    <path d="M13 9l-3 5h3l-1 4 4-6h-3z"/>
  </svg>
);

// Water bill — a plain water drop, distinct from IcGas (used for LPG/gas bills).
export const IcDroplet = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M12 2c4 5 7 8.5 7 12.5A7 7 0 0 1 5 14.5C5 10.5 8 7 12 2z"/>
  </svg>
);

// Internet/broadband bill — a wifi signal.
export const IcWifi = ({ size = 16, color = '#6D17CE' }) => (
  <svg {...base(size, color)}>
    <path d="M2 8.5a15 15 0 0 1 20 0"/>
    <path d="M5 12.5a10 10 0 0 1 14 0"/>
    <path d="M8.5 16.5a5 5 0 0 1 7 0"/>
    <line x1="12" y1="20" x2="12" y2="20"/>
  </svg>
);
