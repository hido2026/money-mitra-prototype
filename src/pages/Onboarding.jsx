// Onboarding — voice-first Day-0 flow (first run only). Mic + camera are the only
// two primary controls. Reward DISPLAY only (config in data/onboarding.config.js);
// NOT the points engine. Mission steps complete by reusing the real Decoder/Chat:
//   • 📷 कागज़ → real Decoder; a new doc in state.docs completes the next entry step
//   • 🎤 बोलिए → scripted spoken entry (demoable) → adds a sample doc the same way
//   • मुकुंद से पूछो → real Chat; first question marks the step (Chat hook)

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { speakMukund } from '../utils/tts';
import { Events } from '../engine/instrumentation';
import { ONBOARDING } from '../data/onboarding.config.js';
import { DECODE_CYCLE } from '../data/decoder-samples.js';
import MicCameraDual from '../components/MicCameraDual';
import PortraitAvatar from '../components/PortraitAvatar';
import { IcSparks, IcCheck, IcMicrophone } from '../components/icons/Icons';

const DEVA = "'Noto Sans Devanagari','JioType',sans-serif";
const PURPLE = '#534AB7';
const PURPLE_LIGHT = '#EEEDFE';
const GREEN = '#1a7d4b';
const INK = '#2C2C2A';
const WELCOME_KEY = 'mm_welcome_granted';
const ONBOARDED_KEY = 'mm_onboarded';

const EXAMPLE_LINE =
  'नमस्ते! मैं मुकुंद। कोई भी कागज़ दिखाइए, या बोलकर बताइए — जैसे "ये बिजली का बिल है"। मैं आसान भाषा में समझा दूँगा।';

export default function Onboarding({ onDone }) {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const { points, steps } = state.onboarding;

  const [reminder, setReminder] = useState(false);
  const baselineRef = useRef(state.docs.length); // docs present when onboarding began
  const processedRef = useRef(0); // how many new docs we've already turned into steps
  const bonusRef = useRef(false);
  const spokeRef = useRef(false);
  const voiceIdxRef = useRef(0);

  const allDone = steps.firstDoc && steps.secondEntry && steps.askedMukund;

  // Welcome bonus — once, on first open. NOT gated on consent/permission/PII.
  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) {
      localStorage.setItem(WELCOME_KEY, '1');
      dispatch({ type: 'ONBOARDING_AWARD', payload: ONBOARDING.WELCOME_BONUS });
    }
  }, [dispatch]);

  // Auto-play the example aloud (existing TTS) — once.
  useEffect(() => {
    if (spokeRef.current) return;
    spokeRef.current = true;
    speakMukund(EXAMPLE_LINE);
  }, []);

  // Watch the real हिसाब feed: each NEW doc completes the next entry step.
  useEffect(() => {
    const added = state.docs.length - baselineRef.current;
    if (added <= processedRef.current) return;
    processedRef.current = added;
    if (!steps.firstDoc) {
      dispatch({ type: 'ONBOARDING_STEP', payload: 'firstDoc' });
      dispatch({ type: 'ONBOARDING_AWARD', payload: ONBOARDING.STEP_FIRST_DOC });
    } else if (!steps.secondEntry) {
      dispatch({ type: 'ONBOARDING_STEP', payload: 'secondEntry' });
      dispatch({ type: 'ONBOARDING_AWARD', payload: ONBOARDING.STEP_SECOND });
    }
  }, [state.docs.length, steps.firstDoc, steps.secondEntry, dispatch]);

  // Mission complete → award the completion bonus once.
  useEffect(() => {
    if (allDone && !bonusRef.current) {
      bonusRef.current = true;
      dispatch({ type: 'ONBOARDING_AWARD', payload: ONBOARDING.MISSION_BONUS });
    }
  }, [allDone, dispatch]);

  // 📷 → real Decoder (attribution: mission). The docs-watcher marks the step on return.
  const onCamera = () => nav('/decoder', { state: { attribution: 'mission', returnTo: '/onboarding' } });

  // 🎤 → scripted spoken entry (demoable, no real STT). Adds a sample doc the same
  // way a photo would, fires the same upload_completed event (voice_checkin).
  const onVoice = () => {
    const sample = DECODE_CYCLE[voiceIdxRef.current % DECODE_CYCLE.length];
    voiceIdxRef.current += 1;
    dispatch({
      type: 'ADD_DOC',
      payload: {
        id: 'v' + Date.now(), docType: sample.docType, merchant: null,
        category: sample.category, dir: sample.dir, amount: sample.amount,
        points: sample.points, icon: sample.icon, borrowed: false,
        dueDate: null, ts: Date.now(), // match real decodes (time-of-entry)
      },
    });
    Events.uploadCompleted({ attribution: 'voice_checkin' });
    speakMukund(`आपने बताया — ${sample.docType}। ${sample.insight}`);
  };

  const askMukund = () => nav('/chat', { state: { onboardingAsk: true, autoVoice: true } });

  const finish = () => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    onDone?.();
    nav('/');
  };

  // ── Completion screen ──────────────────────────────────────────────────────
  if (allDone) {
    return (
      <Shell>
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '24px 4px' }}>
          <IcSparks size={48} color="#FFB300" />
          <h1 style={{ fontFamily: DEVA, fontSize: '24px', fontWeight: 900, color: INK, margin: '12px 0 4px' }}>
            मिशन पूरा! ₹{ONBOARDING.UNLOCK_RUPEES} अनलॉक
          </h1>
          <p style={{ fontFamily: DEVA, fontSize: '14px', color: '#5F5E5A', margin: '0 0 6px' }}>
            {points.toLocaleString('en-IN')} अंक · आज ₹{ONBOARDING.UNLOCK_RUPEES} ({ONBOARDING.UNLOCK_POINTS} अंक)
          </p>
          <p style={{ fontFamily: DEVA, fontSize: '13px', color: PURPLE, fontWeight: 700, margin: '0 0 20px' }}>
            {ONBOARDING.JOURNEY_LABEL}
          </p>

          <p style={{ fontFamily: DEVA, fontSize: '15px', color: INK, lineHeight: 1.6, margin: '0 0 20px' }}>
            कल का हिसाब आपका इंतज़ार कर रहा है — दो मिनट में पूरा हो जाएगा।
          </p>

          {/* Opt-in reminder — मर्ज़ी से, अंक पर कोई असर नहीं */}
          <button
            type="button"
            onClick={() => setReminder((r) => !r)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '14px',
              padding: '14px 16px', cursor: 'pointer', marginBottom: '20px',
            }}
          >
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontFamily: DEVA, fontSize: '14px', fontWeight: 700, color: INK }}>याद दिलाएँ</span>
              <span style={{ display: 'block', fontFamily: DEVA, fontSize: '12px', color: '#888780' }}>मर्ज़ी से · अंक पर कोई असर नहीं</span>
            </span>
            <span style={{ position: 'relative', width: 44, height: 26, borderRadius: 999, background: reminder ? GREEN : '#cbcbcb', flexShrink: 0, transition: 'background 150ms' }}>
              <span style={{ position: 'absolute', top: 3, left: reminder ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'left 150ms' }} />
            </span>
          </button>

          <button
            type="button"
            onClick={finish}
            style={{ width: '100%', background: PURPLE, border: 'none', borderRadius: '999px', padding: '16px', cursor: 'pointer', fontFamily: DEVA, fontSize: '16px', fontWeight: 800, color: '#fff' }}
          >
            शुरू करें
          </button>
        </div>
      </Shell>
    );
  }

  // ── Mission hub ──────────────────────────────────────────────────────────────
  const doneCount = [steps.firstDoc, steps.secondEntry, steps.askedMukund].filter(Boolean).length;
  return (
    <Shell>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 4px 24px' }}>
        {/* Mukund + greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PortraitAvatar size={48} />
          <div>
            <div style={{ fontFamily: DEVA, fontSize: '18px', fontWeight: 900, color: INK }}>नमस्ते! मैं मुकुंद।</div>
            <div style={{ fontFamily: DEVA, fontSize: '12px', color: '#888780' }}>कोई भी कागज़ दिखाइए या बोलिए — समझा दूँगा।</div>
          </div>
        </div>

        {/* Trust line */}
        <div style={{ background: '#e9f6ee', borderRadius: '12px', padding: '10px 14px', fontFamily: DEVA, fontSize: '12.5px', color: '#1a5c38', textAlign: 'center' }}>
          कोई फ़ॉर्म नहीं · पैसा नहीं माँगेंगे · आपकी जानकारी सुरक्षित
        </div>

        {/* Welcome + points tally */}
        <div style={{ background: PURPLE, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IcSparks size={28} color="#FFD479" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: DEVA, fontSize: '16px', fontWeight: 800, color: '#fff' }}>{points.toLocaleString('en-IN')} अंक मिले</div>
            <div style={{ fontFamily: DEVA, fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>स्वागत बोनस +{ONBOARDING.WELCOME_BONUS} · पूरा करने पर ₹{ONBOARDING.UNLOCK_RUPEES} अनलॉक</div>
          </div>
        </div>

        {/* Mission checklist */}
        <div style={{ background: '#fff', border: `1px solid ${PURPLE_LIGHT}`, borderRadius: '16px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: DEVA, fontSize: '14px', fontWeight: 800, color: INK }}>आज का मिशन</span>
            <span style={{ fontFamily: DEVA, fontSize: '12px', fontWeight: 700, color: PURPLE }}>{doneCount}/3</span>
          </div>
          <Step done={steps.firstDoc} label="पहला कागज़" pts={ONBOARDING.STEP_FIRST_DOC} />
          <Step done={steps.secondEntry} label="एक और (कागज़ या बोलकर)" pts={ONBOARDING.STEP_SECOND} />
          <Step done={steps.askedMukund} label="मुकुंद से कुछ पूछो" pts={ONBOARDING.STEP_ASK} />
          <div style={{ borderTop: `1px solid ${PURPLE_LIGHT}`, marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: DEVA, fontSize: '13px', fontWeight: 700, color: INK }}>मिशन पूरा बोनस</span>
            <span style={{ fontFamily: DEVA, fontSize: '13px', fontWeight: 800, color: GREEN }}>+{ONBOARDING.MISSION_BONUS}</span>
          </div>
        </div>

        {/* Primary controls: 📷 कागज़ / 🎤 बोलिए (the only two primary actions) */}
        <MicCameraDual onCamera={onCamera} onVoice={onVoice} />

        {/* Ask-Mukund step (voice/chat) — secondary */}
        {!steps.askedMukund && (
          <button
            type="button"
            onClick={askMukund}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: `1.5px dashed ${PURPLE_LIGHT}`, borderRadius: '14px', padding: '12px', cursor: 'pointer', fontFamily: DEVA, fontSize: '14px', fontWeight: 700, color: PURPLE }}
          >
            <IcMicrophone size={16} color={PURPLE} /> मुकुंद से कुछ पूछो
          </button>
        )}

        {/* Skip — secondary text link */}
        <button type="button" onClick={finish} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: DEVA, fontSize: '12px', color: '#b0adb8' }}>
          अभी नहीं — सीधे घर जाएँ
        </button>
      </div>
    </Shell>
  );
}

function Step({ done, label, pts }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
      <span style={{ width: 22, height: 22, borderRadius: 999, background: done ? GREEN : PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {done && <IcCheck size={13} color="#fff" />}
      </span>
      <span style={{ flex: 1, fontFamily: DEVA, fontSize: '14px', fontWeight: 600, color: done ? '#888780' : INK, textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
      <span style={{ fontFamily: DEVA, fontSize: '13px', fontWeight: 800, color: done ? GREEN : PURPLE }}>+{pts}</span>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#F6F5FB', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}
