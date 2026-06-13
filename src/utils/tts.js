// tts.js — Mukund's voice.
//
// PRIMARY: Sarvam AI TTS (bulbul:v2, male speaker "abhilash") → returns base64
//          WAV, played via an <audio> element. Works on EVERY device (incl. Macs
//          with no Hindi voice installed) and Sarvam allows browser CORS.
// FALLBACK: browser SpeechSynthesis — only used if Sarvam fails (network/quota).
//
// All callers use speakMukund(text) / stopSpeaking() / primeAudio() — unchanged.

const SARVAM_API_KEY =
  import.meta.env.VITE_SARVAM_API_KEY || 'sk_afh7owtd_prjoh7ZH0nIN1HqF8wqRDuzU';
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';
const SPEAKER        = 'abhilash';   // calm male Hindi voice
const MODEL          = 'bulbul:v2';

let currentAudio   = null;   // the <audio> element currently playing
let audioUnlocked  = false;  // becomes true after the first user gesture
let playSeq        = 0;       // bumps on every call/stop; only the latest may play (no echo)

// ── primeAudio — call inside a user gesture (tap) so later programmatic
//    .play() is permitted by the browser's autoplay policy. ──────────────────
export function primeAudio() {
  if (audioUnlocked) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      ctx.resume?.();
      ctx.close?.();
    }
    audioUnlocked = true;
  } catch { /* non-fatal */ }
}

export function stopSpeaking() {
  playSeq++; // invalidate any in-flight speakMukund so it won't play when its fetch resolves
  try { window.speechSynthesis?.cancel(); } catch {}
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    }
  } catch {}
}

// ── speakMukund — Sarvam first, browser fallback ─────────────────────────────
export async function speakMukund(text) {
  // Strip stray markdown, collapse whitespace, cap to Sarvam's 500-char limit.
  const clean = (text || '').replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 480);
  if (!clean) return;

  stopSpeaking();          // stops anything playing AND bumps playSeq
  const myTurn = playSeq;  // this call's claim on the speaker

  try {
    const res = await fetch(SARVAM_TTS_URL, {
      method:  'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type':         'application/json',
      },
      body: JSON.stringify({
        inputs:               [clean],
        target_language_code: 'hi-IN',
        speaker:              SPEAKER,
        model:                MODEL,
        speech_sample_rate:   22050,
      }),
    });

    if (!res.ok) throw new Error(`sarvam_${res.status}`);

    const data = await res.json();
    const b64  = data?.audios?.[0];
    if (!b64) throw new Error('sarvam_empty');

    // A newer speakMukund (or stopSpeaking) ran while we were fetching → abandon,
    // else two clips overlap and you hear an echo.
    if (myTurn !== playSeq) return;

    const audio  = new Audio(`data:audio/wav;base64,${b64}`);
    currentAudio = audio;
    audio.onended = () => { if (currentAudio === audio) currentAudio = null; };
    await audio.play();
    return;
  } catch (err) {
    if (myTurn !== playSeq) return; // superseded — don't fall back either
    console.warn('[tts] Sarvam failed → browser fallback:', err?.message || err);
    browserSpeak(clean);
  }
}

// ── Fallback: browser SpeechSynthesis (silent on Macs w/o Hindi voice) ───────
function browserSpeak(text) {
  if (!window.speechSynthesis) { showNoVoiceToast(); return; }

  const doSpeak = () => {
    window.speechSynthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.rate   = 0.9;
    utt.volume = 1;

    const voices     = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang?.startsWith('hi'));
    if (hindiVoice) { utt.voice = hindiVoice; utt.lang = 'hi-IN'; }
    else if (voices[0]) { utt.voice = voices[0]; }   // don't force hi-IN → avoids silent-fail

    let started = false;
    utt.onstart = () => { started = true; };
    setTimeout(() => { if (!started) showNoVoiceToast(); }, 1200);

    window.speechSynthesis.speak(utt);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
    setTimeout(doSpeak, 800);
  } else {
    doSpeak();
  }
}

function showNoVoiceToast() {
  if (document.getElementById('tts-toast')) return;
  const toast = document.createElement('div');
  toast.id = 'tts-toast';
  toast.textContent = '🔇 आवाज़ अभी उपलब्ध नहीं — दोबारा कोशिश करें';
  Object.assign(toast.style, {
    position: 'fixed', bottom: '96px', left: '50%',
    transform: 'translateX(-50%)',
    background: '#2C2C2A', color: '#fff',
    fontFamily: 'sans-serif', fontSize: '13px',
    padding: '10px 18px', borderRadius: '999px',
    zIndex: '500', whiteSpace: 'nowrap',
    boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
