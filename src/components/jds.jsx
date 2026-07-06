/*
 * Canonical JDS component recipes (a2ui MCP), ported from the intelligence-prototype
 * shell's jds.tsx so both repos render the exact same recipes:
 *   StatusBadge §11.38 · TagChip §11.69 · InfoBox §11.50 · StatDisplay §11.59 ·
 *   IconCircle §11.44 · InsightRow §11.65 · FieldLabel §11.62 · jdsBtn (JDSButton §6).
 * Light mode only (this prototype has no dark mode) — tokens come from the
 * @theme mapping in index.css (primary-50 etc.), same names as the shell.
 */

// ── §11.38 StatusBadge — dot + label pill ────────────────────────────────────
const BADGE = {
  out: { bg: 'bg-warning-soft', text: 'text-warning', dot: 'bg-warning' },
  in: { bg: 'bg-success-soft', text: 'text-success', dot: 'bg-success' },
  borrowed: { bg: 'bg-primary-20', text: 'text-primary-50', dot: 'bg-primary-50' },
  due: { bg: 'bg-surface-ghost', text: 'text-ink-soft', dot: 'bg-ink-soft' },
};
export function StatusBadge({ variant, label }) {
  const s = BADGE[variant];
  return (
    <span className={`font-jio inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[11px] font-medium ${s.bg}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      <span className={s.text}>{label}</span>
    </span>
  );
}

// ── §11.69 TagChip ────────────────────────────────────────────────────────────
const TAG = {
  default: 'bg-surface-ghost text-ink',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-error-soft text-error',
  info: 'bg-topic-blue-soft text-topic-blue',
  muted: 'bg-surface-ghost text-ink-soft',
  brand: 'bg-primary-20 text-primary-50',
};
export function TagChip({ tone = 'default', children }) {
  return (
    <span className={`font-jio inline-flex items-center rounded-full px-3 py-[3px] text-[11px] font-medium ${TAG[tone]}`}>
      {children}
    </span>
  );
}

// ── §11.50 InfoBox — bg-only tone, no border ─────────────────────────────────
const INFO = {
  primary: 'bg-primary-20',
  warning: 'bg-warning-soft',
  success: 'bg-success-soft',
};
export function InfoBox({ tone = 'primary', icon, children }) {
  return (
    <div className={`flex flex-row items-start gap-3 rounded-lg p-3 ${INFO[tone]}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <p className="font-jio text-ink text-[13px] leading-relaxed">{children}</p>
    </div>
  );
}

// ── §11.59 StatDisplay ─────────────────────────────────────────────────────────
export function StatDisplay({ value, label, colorClass = 'text-primary-50', align = 'center' }) {
  const a =
    align === 'center'
      ? 'items-center text-center'
      : align === 'right'
        ? 'items-end text-right'
        : 'items-start text-left';
  return (
    <div className={`flex flex-col gap-1 ${a}`}>
      <span className={`font-jio text-xl font-black tracking-tight ${colorClass}`}>{value}</span>
      <span className="font-jio text-ink-soft text-[11px] tracking-wide uppercase">{label}</span>
    </div>
  );
}

// ── §11.44 IconCircle ─────────────────────────────────────────────────────────
export function IconCircle({ size = 'md', tinted = false, icon }) {
  const s = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-10';
  const bg = tinted ? 'bg-primary-20' : 'bg-surface-ghost';
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full ${s} ${bg}`}>
      {icon}
    </div>
  );
}

// ── §11.65 InsightRow ─────────────────────────────────────────────────────────
export function InsightRow({ icon, metric, valueLabel }) {
  return (
    <div className="flex flex-row items-center gap-3">
      <IconCircle size="md" tinted icon={icon} />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="font-jio text-ink-soft text-[11px]">{metric}</span>
        <span className="font-jio text-ink text-sm">{valueLabel}</span>
      </div>
    </div>
  );
}

// ── §11.62 FieldLabel ─────────────────────────────────────────────────────────
export function FieldLabel({ children }) {
  return (
    <label className="font-jio text-ink-soft block text-[11px] leading-4">{children}</label>
  );
}

// ── §6 JDSButton — class helper (used on <button>/<a> with our own handlers) ──
const BTN_BASE =
  'font-jio text-sm font-bold inline-flex h-11 items-center justify-center gap-2 rounded-full px-[22px] transition-transform duration-200 ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
const BTN_VARIANT = {
  primary: 'bg-primary-50 text-white',
  secondary: 'bg-primary-20 text-primary-50',
  tertiary: 'bg-surface text-primary-50 border border-primary-50',
};
export function jdsBtn(variant = 'primary') {
  return `${BTN_BASE} ${BTN_VARIANT[variant]}`;
}
