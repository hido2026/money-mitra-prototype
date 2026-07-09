// Paisa Gyaan — daily money nuskha (paisa-gyaan/PRD.md, TECHNICAL_PLAN.md §5
// steps 1-2). Same content asset the guided Ask drilldown uses, served
// proactively instead of reactively: a short card set + streak, no LLM call,
// client-side rotation via localStorage. The follow-up chip bridges into
// Chat's existing free-text engine (same initialMessage hand-off Home uses).
//
// Scope note: "tomorrow's lesson" teaser is illustrative only (PRD §8) — real
// Hisaab-personalisation is Phase 3 and intentionally not wired here yet.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../hooks/useLang';
import { jdsBtn } from '../components/jds';
import { IcChevronLeft, IcFlame, IcSchool, IcThumbUp, IcMicrophone } from '../components/icons/Icons';
import { getSetForDay, totalSimDays, completeToday } from '../data/nuskha-bank';

const COPY = {
  hi: {
    title: 'पैसा ज्ञान', back: 'वापस',
    tag: (i, n) => `आज का नुस्खा · ${i}/${n}`,
    gotIt: 'समझ गया', next: 'अगला →', finish: 'पूरा करो',
    savedToast: 'सेव हुआ — यह आपके स्ट्रीक में गिना जाएगा',
    askMore: 'और जानना है?',
    streakLine: (n) => `${n}-दिन स्ट्रीक!`,
    doneBody: 'आज का ज्ञान पूरा। कल एक और नुस्खा — सोना, बीमा, या आपके खर्च पर।',
    tomorrowLabel: 'आपके लिए कल',
    tomorrowTeaser: '(हिसाब देख कर चुना गया एक पर्सनलाइज़्ड सबक — जल्द आ रहा है।)',
    restart: '↺ फिर से देखें', micro: 'आज करें:',
    nextDay: (n) => `दिन ${n} देखें →`,
    endOfBatch: 'फ़िलहाल के लिए 10 दिन पूरे — 270 और नुस्खे आ रहे हैं।',
    restartFromDay1: '↺ दिन 1 से फिर देखें',
  },
  en: {
    title: 'Paisa Gyaan', back: 'Back',
    tag: (i, n) => `Today's nuskha · ${i}/${n}`,
    gotIt: 'Got it', next: 'Next →', finish: 'Complete',
    savedToast: 'Saved — this counts toward your streak',
    askMore: 'Want to know more?',
    streakLine: (n) => `${n}-day streak!`,
    doneBody: "Today's lesson done. Tomorrow: gold, insurance, or something about your spending.",
    tomorrowLabel: 'For you tomorrow',
    tomorrowTeaser: '(A lesson personalised from your हिसाब — coming soon.)',
    restart: '↺ Watch again', micro: 'Try today:',
    nextDay: (n) => `See Day ${n} →`,
    endOfBatch: "That's all 10 days for now — 270 more tips are on the way.",
    restartFromDay1: '↺ Restart from Day 1',
  },
};

export default function PaisaGyaan() {
  const nav = useNavigate();
  const [lang] = useLang();
  const t = COPY[lang];
  // Simulation-mode day navigation (see nuskha-bank.js) — lets a tester walk
  // through day 1..10 in one sitting instead of waiting on real calendar
  // gating, which is a final-PRD concern, not wired up yet.
  const [simDay, setSimDay] = useState(1);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState('');
  const cards = getSetForDay(simDay);
  const card = cards[idx];
  const lastDay = simDay >= totalSimDays();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const next = () => {
    if (idx < cards.length - 1) { setIdx((i) => i + 1); return; }
    completeToday(cards.map((c) => c.id)); // real streak persists for whenever gating is wired up; ignored for the simDay-based badge below
    setDone(true);
  };

  const watchAgain = () => { setIdx(0); setDone(false); };
  const goToNextDay = () => { setSimDay((d) => Math.min(d + 1, totalSimDays())); setIdx(0); setDone(false); };
  const restartFromDay1 = () => { setSimDay(1); setIdx(0); setDone(false); };

  const askFollowUp = (prompt) => nav('/chat', { state: { initialMessage: prompt } });

  const isEn = lang === 'en';
  const hookQuestion = isEn ? card.hook_question_en : card.hook_question;
  const vizBody = isEn ? card.viz_body_en : card.viz_body;
  const microAction = isEn ? card.micro_action_en : card.micro_action;
  const followUpPrompt = isEn ? card.follow_up_prompt_en : card.follow_up_prompt;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col bg-surface-minimal">
      <header className="flex shrink-0 items-center gap-2.5 px-4 py-2.5">
        <button
          aria-label={t.back}
          onClick={() => nav('/')}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface"
        >
          <IcChevronLeft size={18} color="var(--color-ink)" />
        </button>
        <span className="bg-primary-20 flex size-8 shrink-0 items-center justify-center rounded-full">
          <IcSchool size={17} color="var(--color-primary-50)" />
        </span>
        <span className="font-deva text-ink flex-1 text-[17px] font-black tracking-tight">{t.title}</span>
        <span className="bg-reward-soft text-reward-ink flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-extrabold">
          <IcFlame size={13} color="var(--color-reward-ink)" />
          {t.streakLine(simDay)}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-1 pb-6">
        {!done ? (
          <>
            <div className="bg-primary-50 flex min-h-[260px] flex-col rounded-xl p-[18px]">
              <span className="font-deva text-[10px] font-extrabold tracking-wide text-white/75 uppercase">
                {t.tag(idx + 1, cards.length)}
              </span>
              <h1 className="font-deva mt-2 mb-3 text-[19px] leading-snug font-extrabold text-white">
                {hookQuestion}
              </h1>
              <div
                className="font-deva flex-1 rounded-lg bg-white/15 p-3.5 text-[13px] leading-relaxed text-white [&_b]:text-reward"
                dangerouslySetInnerHTML={{ __html: vizBody }}
              />
              <div className="mt-3 flex justify-center gap-1.5">
                {cards.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full bg-white/35 ${i === idx ? 'w-4.5 bg-white' : 'w-1.5'}`} />
                ))}
              </div>
            </div>

            {microAction && (
              <p className="font-deva text-ink-soft bg-surface rounded-lg px-3.5 py-2.5 text-[12px] leading-relaxed">
                <span className="text-ink font-bold">{t.micro} </span>{microAction}
              </p>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => showToast(t.savedToast)}
                className="border-success text-success font-deva flex flex-1 items-center justify-center gap-1.5 rounded-lg border-[1.5px] bg-surface py-3 text-[13px] font-extrabold"
              >
                <IcThumbUp size={15} color="var(--color-success)" />
                {t.gotIt}
              </button>
              <button onClick={next} className={jdsBtn('primary') + ' flex-1 !rounded-lg'}>
                {idx < cards.length - 1 ? t.next : t.finish}
              </button>
            </div>

            {followUpPrompt && (
              <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
                <span className="font-deva text-ink-soft text-xs">{t.askMore}</span>
                <button
                  onClick={() => askFollowUp(followUpPrompt)}
                  className="bg-primary-20 text-primary-50 font-deva inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold"
                >
                  <IcMicrophone size={14} color="var(--color-primary-50)" />
                  {followUpPrompt}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-primary-50 flex flex-col items-center gap-1.5 rounded-xl p-6 text-center">
              <IcFlame size={40} color="var(--color-reward)" />
              <p className="font-deva text-[19px] font-extrabold text-white">{t.streakLine(simDay)}</p>
              <p className="font-deva text-[13px] leading-relaxed text-white/85">{t.doneBody}</p>
            </div>

            {lastDay ? (
              <div className="bg-reward-soft rounded-lg p-3.5">
                <p className="font-deva text-reward-ink text-[12.5px] leading-relaxed">{t.endOfBatch}</p>
              </div>
            ) : (
              <div className="bg-reward-soft rounded-lg p-3.5">
                <p className="font-deva text-reward-ink text-[12.5px] leading-relaxed">
                  <span className="font-extrabold">{t.tomorrowLabel}:</span> {t.tomorrowTeaser}
                </p>
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              {lastDay ? (
                <button onClick={restartFromDay1} className={jdsBtn('primary') + ' !rounded-lg'}>
                  {t.restartFromDay1}
                </button>
              ) : (
                <button onClick={goToNextDay} className={jdsBtn('primary') + ' !rounded-lg'}>
                  {t.nextDay(simDay + 1)}
                </button>
              )}
              <button onClick={watchAgain} className="font-deva text-primary-50 text-[13px] font-bold">
                {t.restart}
              </button>
            </div>
          </>
        )}

        {toast && (
          <div className="bg-ink font-deva fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full px-4.5 py-2.5 text-[13px] font-semibold text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
