// AnswerBank — guided "Ask about money" drilldown (PRD v6 §3, §4.4, §12.1 DS-2).
// Home category grid → question list → optional state selector → answer card.
// Every tap resolves deterministically to one Answer Bank row (§5.1) — no LLM
// call anywhere in this component. Free text stays on Chat's existing engine
// (DS-3, L1 non-goal) — this only replaces the empty-state welcome content.

import { useState } from 'react';
import { useLang } from '../hooks/useLang';
import { TagChip, jdsBtn } from './jds';
import { speakMukund } from '../utils/tts';
import { ANSWER_BANK, TYPE_LABEL, TYPE_TONE, VER_LABEL, findBucket, findItem } from '../data/answer-bank';
import {
  IcUpi, IcBuilding, IcGift, IcStamp, IcFileDollar, IcCoins, IcShield, IcReceipt,
  IcChevronLeft,
} from './icons/Icons';

const BUCKET_ICON = {
  upi: IcUpi, bank: IcBuilding, schemes: IcGift, kyc: IcStamp,
  loans: IcFileDollar, savings: IcCoins, fraud: IcShield, bills: IcReceipt,
};

const COPY = {
  en: {
    lead: 'What would you like to ask about?',
    note: "Answers to money's top questions, checked against official sources.",
    whichState: 'Which state are you in?',
    listen: 'Listen', playing: 'Playing',
    source: 'Source', lastChecked: 'Last checked',
    disclaimer: 'This is official information — please confirm at the source.',
    safetyTitle: 'Remember',
    safety: ['Mukund never asks for your OTP, PIN, or password.', 'Never pay anyone to get your money released.', 'Only trust the official website or a bank branch.', 'Fraud complaints → 1930.'],
    related: 'You might also ask', back: 'Back to categories',
  },
  hi: {
    lead: 'किस बारे में पूछना है?',
    note: 'पैसों से जुड़े सबसे ज़्यादा पूछे जाने वाले सवालों के जवाब, आधिकारिक स्रोतों से जांचे गए।',
    whichState: 'आप किस राज्य से हैं?',
    listen: 'सुनें', playing: 'चल रहा है',
    source: 'स्रोत', lastChecked: 'जाँचा',
    disclaimer: 'सरकारी जानकारी — आधिकारिक स्रोत पर पुष्टि करें।',
    safetyTitle: 'याद रखिए',
    safety: ['मुकुंद कभी OTP, PIN या पासवर्ड नहीं मांगता।', 'पैसा छुड़ाने के लिए किसी को पैसे मत दीजिए।', 'सिर्फ आधिकारिक वेबसाइट या बैंक ब्रांच पर भरोसा कीजिए।', 'ठगी की शिकायत: 1930।'],
    related: 'यह भी पूछ सकते हैं', back: 'श्रेणियों पर वापस जाएं',
  },
};

function SafetyFooter({ t }) {
  return (
    <div className="border-primary-20 mt-3.5 border-t pt-3">
      <p className="font-deva text-ink-soft mb-1.5 text-[10px] font-bold tracking-wide uppercase">{t.safetyTitle}</p>
      <ul className="flex flex-col gap-1">
        {t.safety.map((line) => (
          <li key={line} className="font-deva text-ink-soft flex gap-1.5 text-[11px] leading-snug">
            <span className="text-primary-50">·</span>{line}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnswerBank({ onBack }) {
  const [lang] = useLang();
  const t = COPY[lang];
  const [stack, setStack] = useState([{ screen: 'home' }]);
  const [playingId, setPlayingId] = useState(null);
  const cur = stack[stack.length - 1];

  const push = (s) => setStack((prev) => [...prev, s]);
  const back = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const navigate = (bucketId, rank) => {
    const it = findItem(bucketId, rank);
    if (it.needsState) push({ screen: 'stateselect', bucketId, rank });
    else push({ screen: 'question', bucketId, rank });
  };

  const listen = (id, text) => {
    setPlayingId(id);
    speakMukund(text, undefined, lang);
    setTimeout(() => setPlayingId(null), 1400);
  };

  // ── Home — 8 category cards, no question-count subtitle ──────────────────
  if (cur.screen === 'home') {
    return (
      <div className="animate-fade-in flex flex-col gap-3">
        <div>
          <p className="font-deva text-ink text-[15px] font-bold">{t.lead}</p>
          <p className="font-deva text-ink-soft mt-0.5 text-[11px] leading-snug">{t.note}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {ANSWER_BANK.map((b) => {
            const Icon = BUCKET_ICON[b.icon];
            return (
              <button
                key={b.id}
                onClick={() => push({ screen: 'bucket', bucketId: b.id })}
                className="border-primary-20 flex flex-col gap-2 rounded-xl border bg-surface p-3.5 text-left active:scale-[0.98]"
              >
                <span className="bg-primary-20 flex size-9 items-center justify-center rounded-lg">
                  <Icon size={19} color="var(--color-primary-50)" />
                </span>
                <span className="font-deva text-ink text-[13px] leading-tight font-bold">{b.label[lang]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Bucket — question list ────────────────────────────────────────────────
  if (cur.screen === 'bucket') {
    const b = findBucket(cur.bucketId);
    const Icon = BUCKET_ICON[b.icon];
    return (
      <div className="animate-fade-in flex flex-col gap-2">
        <BackRow onBack={back} label={b.label[lang]} />
        {b.items.map((it) => (
          <button
            key={it.rank}
            onClick={() => navigate(b.id, it.rank)}
            className="border-primary-20 flex items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
          >
            <span className="bg-primary-20 flex size-8 shrink-0 items-center justify-center rounded-md">
              <Icon size={15} color="var(--color-primary-50)" />
            </span>
            <span className="font-deva text-ink flex-1 text-[13px] leading-snug font-semibold">{it.q[lang]}</span>
            <IcChevronLeft size={14} color="var(--color-ink-disabled)" />
          </button>
        ))}
      </div>
    );
  }

  // ── State selector (Type B rows only) ─────────────────────────────────────
  if (cur.screen === 'stateselect') {
    const it = findItem(cur.bucketId, cur.rank);
    return (
      <div className="animate-fade-in flex flex-col gap-2">
        <BackRow onBack={back} label={t.whichState} />
        <p className="font-deva text-ink-soft mb-1 text-[12px] leading-snug">{it.q[lang]}</p>
        {Object.keys(it.states).map((name) => (
          <button
            key={name}
            onClick={() => push({ screen: 'question', bucketId: cur.bucketId, rank: cur.rank, state: name })}
            className="border-primary-20 flex items-center justify-between rounded-lg border bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
          >
            <span className="font-deva text-ink text-[13px] font-semibold">{name}</span>
            <IcChevronLeft size={14} color="var(--color-primary-50)" />
          </button>
        ))}
      </div>
    );
  }

  // ── Answer card ────────────────────────────────────────────────────────────
  if (cur.screen === 'question') {
    const it = findItem(cur.bucketId, cur.rank);
    const b = findBucket(cur.bucketId);
    let d, verified, authority, verifiedOn, isFallback = false;
    if (it.needsState) {
      const c = it.states[cur.state];
      d = { answer: c.answer, url: c.url, linkText: c.linkText };
      verified = c.verified; authority = c.authority; verifiedOn = c.verifiedOn; isFallback = !!c.fallback;
    } else {
      d = { answer: it.answer, url: it.url, linkText: it.linkText };
      verified = it.verified; authority = it.authority; verifiedOn = it.verifiedOn;
    }
    const speakText = it.type === 'E' ? it.hardstop[lang] : d.answer?.[lang];
    const related = b.items.filter((x) => x.rank !== it.rank).slice(0, 2);

    return (
      <div className="animate-fade-in flex flex-col gap-3">
        <BackRow onBack={back} label={b.label[lang]} />
        <div className="border-primary-20 rounded-xl border bg-surface p-4">
          {!isFallback && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              <TagChip tone={TYPE_TONE[it.type]}>{TYPE_LABEL[lang][it.type]}</TagChip>
              {verified && <TagChip tone={verified === 'CANNOT-VERIFY' || verified === 'VARIES' ? 'warning' : 'success'}>{VER_LABEL[lang][verified]}</TagChip>}
            </div>
          )}

          {it.type === 'E' ? (
            <div className="bg-error-soft text-error mb-3 rounded-lg p-3 text-[13px] leading-relaxed font-semibold">
              {it.hardstop[lang]}
            </div>
          ) : (
            <>
              {!it.needsState || !isFallback ? (
                <p className="font-deva text-ink-soft mb-2.5 border-l-[3px] border-primary-50/40 bg-surface-minimal py-2 pl-3 text-[12px] leading-relaxed italic">
                  {it.empathy?.[lang]}
                </p>
              ) : null}
              <p className="font-deva text-ink mb-2.5 text-[14px] leading-relaxed">{d.answer[lang]}</p>
              {d.url ? (
                <a href={d.url} target="_blank" rel="noreferrer" className="bg-primary-20 text-primary-50 font-deva inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold">
                  ↗ {d.linkText[lang]}
                </a>
              ) : (
                <span className="bg-surface-ghost text-ink-soft font-deva inline-block rounded-lg px-3 py-2 text-[11px] font-semibold">{d.linkText[lang]}</span>
              )}
            </>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => listen(it.rank, speakText)} className={jdsBtn('tertiary') + ' !h-9 !px-3.5 !text-xs'}>
              {playingId === it.rank ? t.playing : t.listen}
            </button>
          </div>
          {it.followup && (
            <p className="font-deva text-ink-soft mt-2.5 text-[12px] font-semibold">{it.followup[lang]}</p>
          )}

          {!isFallback && authority && it.type !== 'E' && (
            <>
              <div className="bg-surface-minimal mt-3 rounded-lg px-3 py-2 text-[11px] font-semibold">
                <span className="text-ink-soft">{t.source}: </span><span className="text-ink">{authority}</span>
                <span className="text-ink-disabled"> · </span>
                <span className="text-ink-soft">{t.lastChecked}: </span><span className="text-ink">{verifiedOn}</span>
              </div>
              <p className="font-deva text-primary-50 bg-primary-20 mt-2 rounded-lg px-3 py-2 text-[11px] font-semibold">
                {t.disclaimer}
              </p>
            </>
          )}

          <SafetyFooter t={t} />
        </div>

        {related.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="font-deva text-ink-soft text-[10px] font-bold tracking-wide uppercase">{t.related}</p>
            {related.map((r) => (
              <button
                key={r.rank}
                onClick={() => navigate(b.id, r.rank)}
                className="border-primary-20 flex items-center justify-between rounded-lg border bg-surface px-3.5 py-2.5 text-left"
              >
                <span className="font-deva text-ink text-[12px] font-semibold">{r.q[lang]}</span>
                <IcChevronLeft size={13} color="var(--color-ink-disabled)" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function BackRow({ onBack, label }) {
  return (
    <button onClick={onBack} className="mb-0.5 flex items-center gap-2 self-start">
      <span className="bg-surface-ghost flex size-7 items-center justify-center rounded-full">
        <IcChevronLeft size={14} color="var(--color-ink)" />
      </span>
      <span className="font-deva text-ink text-[14px] font-bold">{label}</span>
    </button>
  );
}
