// MoneyQuestions — guided "Ask about money" screen (replaces AnswerBank.jsx).
// Ported from MoneyMitra_MoneyQuestions_Interactive_v3.html: home (Most Asked
// banner + category grid) -> bucket (topic list) -> all-100 paginated list ->
// question detail. Every tap resolves deterministically to one row in
// money-questions.js -- no LLM call anywhere in this component.
//
// Content is Hinglish (as authored/reviewed) + an English gloss for the
// question only -- there's no separate verified English/Devanagari answer
// yet, so both render together always rather than switching on the app's
// EN/hi. toggle, which would otherwise show an empty answer in English.

import { useState } from 'react';
import { TagChip, jdsBtn } from './jds';
import { speakMukund } from '../utils/tts';
import {
  CATEGORIES, TYPE_LABEL, TYPE_TONE, VER_LABEL, VER_TONE, CATEGORY_STYLE, PAGE_SIZE,
  findBucketMeta, questionsForBucket, findByRank, totalPages, pageOf,
} from '../data/money-questions';
import {
  IcUpi, IcBuilding, IcGift, IcStamp, IcFileDollar, IcCoins, IcShield, IcReceipt,
  IcBriefcase, IcUmbrella, IcChevronLeft, IcFlame,
} from './icons/Icons';

const BUCKET_ICON = {
  upi: IcUpi, bank: IcBuilding, schemes: IcGift, kyc: IcStamp, loans: IcFileDollar,
  savings: IcCoins, fraud: IcShield, bills: IcReceipt, earn: IcBriefcase, insurance: IcUmbrella,
};

function SafetyLine() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      <IcShield size={14} color="var(--color-success)" />
      <span className="font-deva text-success text-[11.5px] font-semibold">
        We'll never ask for your OTP, PIN, or money.
      </span>
    </div>
  );
}

function BackRow({ onBack, label, count, icon }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <button onClick={onBack} aria-label="Back" className="bg-surface-ghost flex size-8 shrink-0 items-center justify-center rounded-full">
        <IcChevronLeft size={15} color="var(--color-ink)" />
      </button>
      {icon}
      <span className="font-deva text-ink flex-1 text-[15px] font-bold">{label}</span>
      {count != null && (
        <span className="bg-surface-ghost text-ink-soft rounded-full px-2.5 py-1 text-[11px] font-bold">{count}</span>
      )}
    </div>
  );
}

function Pager({ page, onGo }) {
  const total = totalPages();
  const nums = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...nums].sort((a, b) => a - b);
  const items = [];
  let last = 0;
  for (const p of sorted) {
    if (p - last > 1) items.push({ dots: true, key: `dots-${p}` });
    items.push({ p, key: p });
    last = p;
  }
  const btn = (extra = '') =>
    `flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-[12px] font-bold ${extra}`;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
      <button disabled={page <= 1} onClick={() => onGo(page - 1)} className={btn('bg-surface-ghost text-ink disabled:opacity-40')}>
        <IcChevronLeft size={13} color="currentColor" />
      </button>
      {items.map((it) =>
        it.dots ? (
          <span key={it.key} className="text-ink-disabled px-1 text-[12px]">…</span>
        ) : (
          <button
            key={it.key}
            onClick={() => onGo(it.p)}
            className={btn(it.p === page ? 'bg-primary-50 text-white' : 'bg-surface-ghost text-ink')}
          >
            {it.p}
          </button>
        ),
      )}
      <button disabled={page >= total} onClick={() => onGo(page + 1)} className={btn('bg-surface-ghost text-ink disabled:opacity-40 rotate-180')}>
        <IcChevronLeft size={13} color="currentColor" />
      </button>
    </div>
  );
}

export default function MoneyQuestions() {
  const [stack, setStack] = useState([{ screen: 'home' }]);
  const [playingRank, setPlayingRank] = useState(null);
  const cur = stack[stack.length - 1];

  const push = (s) => setStack((prev) => [...prev, s]);
  const back = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const listen = (rank, text) => {
    setPlayingRank(rank);
    speakMukund(text, undefined, 'hi');
    setTimeout(() => setPlayingRank(null), 1400);
  };

  // ── Home — Most Asked banner + category grid ──────────────────────────────
  if (cur.screen === 'home') {
    return (
      <div className="animate-fade-in flex flex-col gap-3">
        <button
          onClick={() => push({ screen: 'alltop', page: 1 })}
          className="border-primary-20 flex w-full items-center gap-3.5 rounded-xl border bg-surface p-4 text-left"
        >
          <span className="bg-primary-50 flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <IcFlame size={20} color="#fff" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-deva text-primary-50 block text-[15px] font-extrabold">Most asked questions</span>
            <span className="font-deva text-ink-soft mt-0.5 block text-xs">See all 100, handpicked and checked</span>
          </span>
          <IcChevronLeft size={16} color="var(--color-primary-50)" className="rotate-180" />
        </button>

        <p className="font-deva text-ink mt-1 text-sm font-bold">Browse by topic</p>
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map((c) => {
            const Icon = BUCKET_ICON[c.icon];
            const style = CATEGORY_STYLE[c.id];
            const count = questionsForBucket(c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => push({ screen: 'bucket', id: c.id })}
                className="border-primary-20 flex flex-col gap-2 rounded-xl border bg-surface p-3.5 text-left active:scale-[0.98]"
              >
                <span className={`flex size-9 items-center justify-center rounded-lg ${style.bg}`}>
                  <Icon size={18} color={style.fg} />
                </span>
                <span className="font-deva text-ink text-[12.5px] leading-tight font-bold">{c.label}</span>
                <span className="font-deva text-ink-soft text-[10.5px]">{count} questions</span>
              </button>
            );
          })}
        </div>
        <SafetyLine />
      </div>
    );
  }

  // ── Bucket — question list for one topic ──────────────────────────────────
  if (cur.screen === 'bucket') {
    const meta = findBucketMeta(cur.id);
    const Icon = BUCKET_ICON[meta.icon];
    const style = CATEGORY_STYLE[cur.id];
    const items = questionsForBucket(cur.id);
    return (
      <div className="animate-fade-in flex flex-col gap-2">
        <BackRow
          onBack={back}
          label={meta.label}
          count={items.length}
          icon={
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
              <Icon size={16} color={style.fg} />
            </span>
          }
        />
        {items.map((it) => (
          <button
            key={it.rank}
            onClick={() => push({ screen: 'question', rank: it.rank })}
            className="border-primary-20 flex items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${style.bg}`}>
              <Icon size={15} color={style.fg} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-deva text-ink block text-[13px] leading-snug font-semibold">{it.q}</span>
              <span className="text-ink-soft block text-[11px]">{it.qEn}</span>
            </span>
            <IcChevronLeft size={14} color="var(--color-ink-disabled)" className="rotate-180" />
          </button>
        ))}
      </div>
    );
  }

  // ── All 100, paginated ──────────────────────────────────────────────────
  if (cur.screen === 'alltop') {
    const page = cur.page || 1;
    const items = pageOf(page);
    return (
      <div className="animate-fade-in flex flex-col gap-2">
        <BackRow onBack={back} label="All top questions" count={100} />
        <p className="font-deva text-ink-soft mb-1 text-[11.5px] leading-snug">
          Ranked by real demand (Gemini + Meta research), checked against official sources.
        </p>
        {items.map((it) => (
          <button
            key={it.rank}
            onClick={() => push({ screen: 'question', rank: it.rank })}
            className="border-primary-20 flex items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
          >
            <span className="font-deva text-ink-soft w-5 shrink-0 text-right text-[12px] font-bold">{it.rank}</span>
            <span className="min-w-0 flex-1">
              <span className="font-deva text-ink block text-[13px] leading-snug font-semibold">{it.q}</span>
              <span className="text-ink-soft block text-[11px]">{it.qEn}</span>
            </span>
            <IcChevronLeft size={14} color="var(--color-ink-disabled)" className="rotate-180" />
          </button>
        ))}
        <Pager page={page} onGo={(p) => setStack((prev) => [...prev.slice(0, -1), { screen: 'alltop', page: p }])} />
        <SafetyLine />
      </div>
    );
  }

  // ── Question detail ────────────────────────────────────────────────────
  if (cur.screen === 'question') {
    const it = findByRank(cur.rank);
    const isFraud = it.type === 'E';
    const showLink = it.link && !isFraud;
    return (
      <div className="animate-fade-in flex flex-col gap-3">
        <BackRow onBack={back} label="Answer" />
        <div className="border-primary-20 rounded-xl border bg-surface p-4">
          <div className="bg-primary-50 -m-4 mb-4 rounded-t-xl p-4">
            <span className="font-deva text-[10px] font-extrabold tracking-wide text-white/75 uppercase">
              {isFraud ? 'Safety alert' : 'Grounded answer'}
            </span>
            <p className="font-deva mt-1.5 text-[17px] leading-snug font-extrabold text-white">{it.q}</p>
            <p className="mt-1 text-[12px] text-white/85">{it.qEn}</p>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            <TagChip tone={TYPE_TONE[it.type]}>{TYPE_LABEL[it.type]}</TagChip>
            <TagChip tone={VER_TONE[it.verified]}>{VER_LABEL[it.verified]}</TagChip>
          </div>

          {isFraud && (
            <div className="bg-error-soft text-error mb-3 rounded-lg p-3 text-[13px] leading-relaxed font-semibold">
              Don't share your OTP or PIN. Call <b>1930</b> or report at cybercrime.gov.in right away.
            </div>
          )}

          <p className="font-deva text-ink mb-3 text-[14px] leading-relaxed">{it.answer}</p>

          {showLink ? (
            <a href={`https://${it.link.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="bg-primary-20 text-primary-50 font-deva mb-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold">
              ↗ {it.link}
            </a>
          ) : it.linkText ? (
            <p className="font-deva bg-surface-ghost text-ink-soft mb-3 inline-block rounded-lg px-3 py-2 text-[11px] font-semibold">{it.linkText}</p>
          ) : null}

          <button onClick={() => listen(it.rank, it.answer)} className={jdsBtn('tertiary') + ' !h-9 !px-3.5 !text-xs'}>
            {playingRank === it.rank ? 'Playing' : 'Listen'}
          </button>

          {it.authority && (
            <div className="bg-surface-minimal mt-3 rounded-lg px-3 py-2 text-[11px] font-semibold">
              <span className="text-ink-soft">Source: </span><span className="text-ink">{it.authority}</span>
            </div>
          )}
          <p className="font-deva text-ink-soft mt-2 text-center text-[10.5px]">
            Checked against official sources · this is not financial advice.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
