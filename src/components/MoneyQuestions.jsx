// MoneyQuestions — guided "Ask about money" screen (replaces AnswerBank.jsx).
// Home (Most Asked banner + category grid) -> bucket (topic list) -> all-300
// paginated list -> question detail. Every tap resolves deterministically to
// one row in money-questions.js (sourced from the Money Mitra Knowledge
// Graph) -- no LLM call anywhere in this component except the optional
// "next question" hand-off into Chat's free-text engine.
//
// Every row follows the KG's 4-beat answer shape (understand/answer/doNow/
// nextQuestion) with a reviewed Hinglish + English version of each. In hi.
// mode we show Hinglish as primary with the English gloss underneath; in EN
// mode we show English only -- no Hinglish left on screen.

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TagChip, jdsBtn } from './jds';
import { speakMukund } from '../utils/tts';
import { useLang } from '../hooks/useLang';
import {
  CATEGORIES, NEEDS, TYPE_LABEL, TYPE_TONE, VER_LABEL, VER_TONE, CATEGORY_STYLE, BUCKET_ICON, PAGE_SIZE,
  findBucketMeta, findNeedMeta, subtopicsForBucket, findSubtopicMeta, questionsForSubtopic,
  findByRank, totalPages, pageOf,
} from '../data/money-questions';
import { IcChevronLeft, IcFlame, IcMicrophone, IcShield } from './icons/Icons';

// Screen chrome copy -- previously hardcoded English-only throughout this
// file, so the hi/en toggle silently did nothing here even though every
// other screen in the app respects it. Also drops internal jargon ("Grounded
// answer", "Handpicked") and the accidental Gemini mention in the alltop
// helper line, per the vernacular copy review.
const COPY = {
  hi: {
    trust: 'हम कभी आपसे OTP, PIN या पैसे नहीं माँगेंगे।',
    mostAsked: 'लोग सबसे ज़्यादा क्या पूछते हैं',
    mostAskedSub: 'सही और पक्की जानकारी',
    allTop: 'सबसे ज़रूरी सवाल',
    allTopSub: 'लोगों की ज़रूरत के हिसाब से, और पक्की जगह से जाँचा हुआ।',
    answer: 'जवाब',
    safetyAlert: 'ज़रूरी सावधानी',
    groundedAnswer: 'पक्का जवाब',
    doThisNow: 'अभी यह करें',
    source: 'जानकारी कहाँ से मिली: ',
    disclaimer: 'सही जगह से जाँचा गया · लेकिन फ़ैसला अपनी समझ से लें।',
    listen: 'सुनें',
    playing: 'चल रहा है',
    wantMore: 'और जानना है?',
  },
  en: {
    trust: "We'll never ask for your OTP, PIN, or money.",
    mostAsked: 'Most asked questions',
    mostAskedSub: 'Checked and reliable',
    allTop: 'Most important questions',
    allTopSub: 'Ranked by what people actually ask, checked against official sources.',
    answer: 'Answer',
    safetyAlert: 'Safety alert',
    groundedAnswer: 'Verified answer',
    doThisNow: 'Do this now',
    source: 'Where this comes from: ',
    disclaimer: 'Checked against official sources — but the decision is yours to make.',
    listen: 'Listen',
    playing: 'Playing',
    wantMore: 'Want to know more?',
  },
};

function SafetyLine({ t }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      <IcShield size={14} color="var(--color-success)" />
      <span className="font-deva text-success text-[11.5px] font-semibold">
        {t.trust}
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

// Horizontal scroll row with visible prev/next buttons -- swipe-only carousels
// hide most items behind a gesture a first-time-digital user may not think to
// try, so the arrow buttons are the primary affordance, not a decoration.
function ScrollRow({ children }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => scroll(-1)} aria-label="Scroll left" className="bg-surface-ghost flex size-7 shrink-0 items-center justify-center rounded-full">
        <IcChevronLeft size={13} color="var(--color-ink)" />
      </button>
      <div ref={ref} className="flex flex-1 gap-2.5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      <button onClick={() => scroll(1)} aria-label="Scroll right" className="bg-surface-ghost flex size-7 shrink-0 items-center justify-center rounded-full">
        <IcChevronLeft size={13} color="var(--color-ink)" className="rotate-180" />
      </button>
    </div>
  );
}

function CarouselTile({ label, Icon, style, onClick }) {
  return (
    <button
      onClick={onClick}
      className="border-primary-20 flex w-[84px] shrink-0 flex-col items-center gap-2 rounded-xl border bg-surface p-3 text-center active:scale-[0.98]"
    >
      <span className={`flex size-9 items-center justify-center rounded-lg ${style.bg}`}>
        <Icon size={17} color={style.fg} />
      </span>
      <span className="font-deva text-ink text-[11px] leading-tight font-bold">{label}</span>
    </button>
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
  const nav = useNavigate();
  const [lang] = useLang();
  const [stack, setStack] = useState([{ screen: 'home' }]);
  const [playingRank, setPlayingRank] = useState(null);
  const cur = stack[stack.length - 1];
  const isEn = lang === 'en';
  const t = COPY[isEn ? 'en' : 'hi'];

  const push = (s) => setStack((prev) => [...prev, s]);
  const back = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  // Primary line always shown; secondary only in hi. mode (the English gloss).
  const qPrimary = (it) => (isEn ? it.qEn : it.q);
  const qSecondary = (it) => (isEn ? null : it.qEn);
  const understandText = (it) => (isEn ? it.understandEn : it.understand);
  const answerText = (it) => (isEn ? it.answerEn : it.answer);
  const doNowText = (it) => (isEn ? it.doNowEn : it.doNow);
  const nextQuestionText = (it) => (isEn ? it.nextQuestionEn : it.nextQuestion);

  const listen = (rank, text) => {
    setPlayingRank(rank);
    speakMukund(text, undefined, isEn ? 'en' : 'hi');
    setTimeout(() => setPlayingRank(null), 1400);
  };

  const askNext = (prompt) => nav('/chat', { state: { initialMessage: prompt } });

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
            <span className="font-deva text-primary-50 block text-[15px] font-extrabold">{t.mostAsked}</span>
            <span className="font-deva text-ink-soft mt-0.5 block text-xs">{t.mostAskedSub}</span>
          </span>
          <IcChevronLeft size={16} color="var(--color-primary-50)" className="rotate-180" />
        </button>

        <p className="font-deva text-ink mt-1 text-sm font-bold">{isEn ? 'By need' : 'ज़रूरत के हिसाब से'}</p>
        <ScrollRow>
          {NEEDS.map((n) => {
            const primaryBucket = n.buckets[0];
            const Icon = BUCKET_ICON[primaryBucket];
            const style = CATEGORY_STYLE[primaryBucket];
            return (
              <CarouselTile
                key={n.id}
                label={isEn ? n.label : n.labelHi}
                Icon={Icon}
                style={style}
                onClick={() =>
                  n.buckets.length > 1
                    ? push({ screen: 'need', id: n.id })
                    : push({ screen: 'bucket', id: n.buckets[0] })
                }
              />
            );
          })}
        </ScrollRow>

        <p className="font-deva text-ink mt-1 text-sm font-bold">{isEn ? 'By topic' : 'विषय के हिसाब से'}</p>
        <ScrollRow>
          {CATEGORIES.map((c) => {
            const Icon = BUCKET_ICON[c.icon];
            const style = CATEGORY_STYLE[c.id];
            return (
              <CarouselTile
                key={c.id}
                label={isEn ? c.label : c.labelHi}
                Icon={Icon}
                style={style}
                onClick={() => push({ screen: 'bucket', id: c.id })}
              />
            );
          })}
        </ScrollRow>
        <SafetyLine t={t} />
      </div>
    );
  }

  // ── Need — topic picker for needs spanning 2+ buckets (e.g. Protection
  // covers both fraud and insurance) ─────────────────────────────────────────
  if (cur.screen === 'need') {
    const need = findNeedMeta(cur.id);
    return (
      <div className="animate-fade-in flex flex-col gap-2">
        <BackRow onBack={back} label={isEn ? need.label : need.labelHi} />
        {need.buckets.map((bid) => {
          const meta = findBucketMeta(bid);
          const Icon = BUCKET_ICON[meta.icon];
          const style = CATEGORY_STYLE[bid];
          return (
            <button
              key={bid}
              onClick={() => push({ screen: 'bucket', id: bid })}
              className="border-primary-20 flex items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
            >
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${style.bg}`}>
                <Icon size={15} color={style.fg} />
              </span>
              <span className="font-deva text-ink flex-1 text-[13px] font-semibold">{isEn ? meta.label : meta.labelHi}</span>
              <IcChevronLeft size={14} color="var(--color-ink-disabled)" className="rotate-180" />
            </button>
          );
        })}
      </div>
    );
  }

  // ── Bucket — sub-topic list for one topic (level 2, e.g. inside UPI:
  // PIN & setup / Payments & QR / Fraud & scams / ...) ───────────────────────
  if (cur.screen === 'bucket') {
    const meta = findBucketMeta(cur.id);
    const Icon = BUCKET_ICON[meta.icon];
    const style = CATEGORY_STYLE[cur.id];
    const subtopics = subtopicsForBucket(cur.id);
    return (
      <div className="animate-fade-in flex flex-col gap-2">
        <BackRow
          onBack={back}
          label={isEn ? meta.label : meta.labelHi}
          icon={
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
              <Icon size={16} color={style.fg} />
            </span>
          }
        />
        {subtopics.map((s) => (
          <button
            key={s.id}
            onClick={() => push({ screen: 'subtopic', bucketId: cur.id, id: s.id })}
            className="border-primary-20 flex items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${style.bg}`}>
              <Icon size={15} color={style.fg} />
            </span>
            <span className="font-deva text-ink flex-1 text-[13px] font-semibold">{isEn ? s.label : s.labelHi}</span>
            <IcChevronLeft size={14} color="var(--color-ink-disabled)" className="rotate-180" />
          </button>
        ))}
      </div>
    );
  }

  // ── Subtopic — actual question list (level 3) ─────────────────────────────
  if (cur.screen === 'subtopic') {
    const meta = findBucketMeta(cur.bucketId);
    const sub = findSubtopicMeta(cur.bucketId, cur.id);
    const Icon = BUCKET_ICON[meta.icon];
    const style = CATEGORY_STYLE[cur.bucketId];
    const items = questionsForSubtopic(cur.bucketId, cur.id);
    return (
      <div className="animate-fade-in flex flex-col gap-2">
        <BackRow
          onBack={back}
          label={isEn ? sub.label : sub.labelHi}
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
              <span className="font-deva text-ink block text-[13px] leading-snug font-semibold">{qPrimary(it)}</span>
              {qSecondary(it) && <span className="text-ink-soft block text-[11px]">{qSecondary(it)}</span>}
            </span>
            <IcChevronLeft size={14} color="var(--color-ink-disabled)" className="rotate-180" />
          </button>
        ))}
      </div>
    );
  }

  // ── All 300, paginated ──────────────────────────────────────────────────
  if (cur.screen === 'alltop') {
    const page = cur.page || 1;
    const items = pageOf(page);
    return (
      <div className="animate-fade-in flex flex-col gap-2">
        <BackRow onBack={back} label={t.allTop} />
        <p className="font-deva text-ink-soft mb-1 text-[11.5px] leading-snug">
          {t.allTopSub}
        </p>
        {items.map((it) => (
          <button
            key={it.rank}
            onClick={() => push({ screen: 'question', rank: it.rank })}
            className="border-primary-20 flex items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
          >
            <span className="font-deva text-ink-soft w-5 shrink-0 text-right text-[12px] font-bold">{it.rank}</span>
            <span className="min-w-0 flex-1">
              <span className="font-deva text-ink block text-[13px] leading-snug font-semibold">{qPrimary(it)}</span>
              {qSecondary(it) && <span className="text-ink-soft block text-[11px]">{qSecondary(it)}</span>}
            </span>
            <IcChevronLeft size={14} color="var(--color-ink-disabled)" className="rotate-180" />
          </button>
        ))}
        <Pager page={page} onGo={(p) => setStack((prev) => [...prev.slice(0, -1), { screen: 'alltop', page: p }])} />
        <SafetyLine t={t} />
      </div>
    );
  }

  // ── Question detail — KG's 4-beat answer: understand -> answer -> doNow ->
  // nextQuestion. doNow renders as a highlighted action row (not plain text)
  // per the KG integration guide; for fraud rows it's folded into the
  // hard-stop banner instead of repeated below. ─────────────────────────────
  if (cur.screen === 'question') {
    const it = findByRank(cur.rank);
    const isFraud = it.type === 'E';
    const showLink = it.link && !isFraud;
    return (
      <div className="animate-fade-in flex flex-col gap-3">
        <BackRow onBack={back} label={t.answer} />
        <div className="border-primary-20 rounded-xl border bg-surface p-4">
          <div className="bg-primary-50 -m-4 mb-4 rounded-t-xl p-4">
            <span className="font-deva text-[10px] font-extrabold tracking-wide text-white/75 uppercase">
              {isFraud ? t.safetyAlert : t.groundedAnswer}
            </span>
            <p className="font-deva mt-1.5 text-[17px] leading-snug font-extrabold text-white">{qPrimary(it)}</p>
            {qSecondary(it) && <p className="mt-1 text-[12px] text-white/85">{qSecondary(it)}</p>}
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            <TagChip tone={TYPE_TONE[it.type]}>{TYPE_LABEL[it.type][isEn ? 'en' : 'hi']}</TagChip>
            <TagChip tone={VER_TONE[it.verified]}>{VER_LABEL[it.verified][isEn ? 'en' : 'hi']}</TagChip>
          </div>

          {isFraud && (
            <div className="bg-error-soft text-error mb-3 rounded-lg p-3 text-[13px] leading-relaxed font-semibold">
              {doNowText(it)}
            </div>
          )}

          <p className="font-deva text-ink-soft mb-2 text-[12.5px] leading-relaxed italic">{understandText(it)}</p>
          <p className="font-deva text-ink mb-3 text-[14px] leading-relaxed">{answerText(it)}</p>

          {!isFraud && (
            <div className="bg-primary-20 mb-3 rounded-lg p-3">
              <span className="font-deva text-primary-50 block text-[10px] font-extrabold tracking-wide uppercase">{t.doThisNow}</span>
              <p className="font-deva text-ink mt-1 text-[13px] leading-relaxed font-semibold">{doNowText(it)}</p>
            </div>
          )}

          {showLink && (
            <a href={`https://${it.link.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="bg-primary-20 text-primary-50 font-deva mb-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold">
              ↗ {it.link.replace(/^https?:\/\//, '')}
            </a>
          )}

          <button onClick={() => listen(it.rank, answerText(it))} className={jdsBtn('tertiary') + ' !h-9 !px-3.5 !text-xs'}>
            {playingRank === it.rank ? t.playing : t.listen}
          </button>

          {it.authority && (
            <div className="bg-surface-minimal mt-3 rounded-lg px-3 py-2 text-[11px] font-semibold">
              <span className="text-ink-soft">{t.source}</span><span className="text-ink">{it.authority}</span>
            </div>
          )}
          <p className="font-deva text-ink-soft mt-2 text-center text-[10.5px]">
            {t.disclaimer}
          </p>
        </div>

        {nextQuestionText(it) && (
          <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
            <span className="font-deva text-ink-soft text-xs">{t.wantMore}</span>
            <button
              onClick={() => askNext(nextQuestionText(it))}
              className="bg-primary-20 text-primary-50 font-deva inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold"
            >
              <IcMicrophone size={14} color="var(--color-primary-50)" />
              {nextQuestionText(it)}
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
