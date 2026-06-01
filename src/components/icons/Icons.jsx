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

export const IcPlus = ({ size = 20, color = '#534AB7' }) => (
  <svg {...base(size, color)}><path d="M12 5v14M5 12h14"/></svg>
);

export const IcMicrophone = ({ size = 18, color = '#FFFFFF' }) => (
  <svg {...base(size, color)}>
    <rect x="9" y="2" width="6" height="11" rx="3"/>
    <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/>
  </svg>
);

export const IcBulb = ({ size = 15, color = '#534AB7' }) => (
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

export const IcChartLine = ({ size = 16, color = '#534AB7' }) => (
  <svg {...base(size, color)}>
    <path d="M4 19h16"/>
    <path d="M4 15l4-6 4 2 6-8"/>
  </svg>
);

export const IcScale = ({ size = 16, color = '#534AB7' }) => (
  <svg {...base(size, color)}>
    <path d="M7 20h10M12 3v17M5 12l2-7 2 7a3 3 0 0 1-4 0M15 9l2-7 2 7a3 3 0 0 1-4 0"/>
  </svg>
);

export const IcStamp = ({ size = 16, color = '#534AB7' }) => (
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
    <path d="M22 9 12 5 2 9l10 4 10-4v6"/>
    <path d="M6 10.6V16a6 3 0 0 0 12 0v-5.4"/>
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

export const IcCamera = ({ size = 16, color = '#534AB7' }) => (
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

export const IcSmartphone = ({ size = 16, color = '#534AB7' }) => (
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

export const IcBuilding = ({ size = 16, color = '#534AB7' }) => (
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

export const IcRepeat = ({ size = 16, color = '#534AB7' }) => (
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
