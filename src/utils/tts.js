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

// ── Indian number words: speak ₹ amounts as हज़ार/लाख/करोड़, not digit-by-digit ──
const NUM_0_99 = [
  'शून्य','एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस',
  'ग्यारह','बारह','तेरह','चौदह','पंद्रह','सोलह','सत्रह','अठारह','उन्नीस','बीस',
  'इक्कीस','बाईस','तेईस','चौबीस','पच्चीस','छब्बीस','सत्ताईस','अट्ठाईस','उनतीस','तीस',
  'इकतीस','बत्तीस','तैंतीस','चौंतीस','पैंतीस','छत्तीस','सैंतीस','अड़तीस','उनतालीस','चालीस',
  'इकतालीस','बयालीस','तैंतालीस','चौवालीस','पैंतालीस','छियालीस','सैंतालीस','अड़तालीस','उनचास','पचास',
  'इक्यावन','बावन','तिरेपन','चौवन','पचपन','छप्पन','सत्तावन','अट्ठावन','उनसठ','साठ',
  'इकसठ','बासठ','तिरसठ','चौंसठ','पैंसठ','छियासठ','सड़सठ','अड़सठ','उनहत्तर','सत्तर',
  'इकहत्तर','बहत्तर','तिहत्तर','चौहत्तर','पचहत्तर','छिहत्तर','सतहत्तर','अठहत्तर','उन्यासी','अस्सी',
  'इक्यासी','बयासी','तिरासी','चौरासी','पचासी','छियासी','सत्तासी','अट्ठासी','नवासी','नब्बे',
  'इक्यानवे','बानवे','तिरानवे','चौरानवे','पचानवे','छियानवे','सत्तानवे','अट्ठानवे','निन्यानवे',
];

function below1000(x) {
  const h = Math.floor(x / 100), r = x % 100, parts = [];
  if (h) parts.push(NUM_0_99[h] + ' सौ');
  if (r) parts.push(NUM_0_99[r]);
  return parts.join(' ');
}

function amountToHindiWords(n) {
  n = Math.round(n);
  if (n <= 0) return '';
  const crore = Math.floor(n / 10000000);
  const lakh  = Math.floor((n % 10000000) / 100000);
  const thou  = Math.floor((n % 100000) / 1000);
  const rest  = n % 1000;
  const parts = [];
  if (crore) parts.push(amountToHindiWords(crore) + ' करोड़');
  if (lakh)  parts.push(NUM_0_99[lakh] + ' लाख');
  if (thou)  parts.push(NUM_0_99[thou] + ' हज़ार');
  if (rest)  parts.push(below1000(rest));
  return parts.join(' ');
}

// "₹4,500" → "चार हज़ार पाँच सौ रुपये" for speech. Display text is left untouched.
function speakableAmounts(text) {
  return text.replace(/₹\s?([\d,]+)/g, (m, d) => {
    const n = parseInt(d.replace(/,/g, ''), 10);
    return isNaN(n) || n <= 0 ? m : amountToHindiWords(n) + ' रुपये';
  });
}

// Transliterate Latin/English words to Devanagari so the Hindi voice pronounces
// them correctly ("Chicken Biryani" → "चिकन बिरयानी"). Existing Devanagari — incl.
// our Hindi number words — is preserved. Falls back to the input on ANY error so
// the voice can never break.
const SARVAM_TRANSLIT_URL = 'https://api.sarvam.ai/transliterate';
async function sarvamTransliterate(text) {
  try {
    const res = await fetch(SARVAM_TRANSLIT_URL, {
      method:  'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        input:                text,
        source_language_code: 'en-IN',
        target_language_code: 'hi-IN',
        spoken_form:          true,
      }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data?.transliterated_text || text;
  } catch { return text; }
}

// ── speakMukund — Sarvam first, browser fallback. onEnd() fires when playback
//    finishes (used for the "बोल रहा है…" cue + speaking bubbles in sequence). ─
export async function speakMukund(text, onEnd) {
  const done = () => { try { onEnd?.(); } catch {} };
  // Strip markdown, collapse whitespace, speak ₹ amounts as Hindi number words,
  // then cap to Sarvam's 500-char limit.
  const clean = speakableAmounts(
    (text || '').replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim(),
  ).slice(0, 480);
  if (!clean) { done(); return; }

  stopSpeaking();          // stops anything playing AND bumps playSeq
  const myTurn = playSeq;  // this call's claim on the speaker

  // Transliterate English words → Devanagari so they're spoken correctly.
  const spoken = (await sarvamTransliterate(clean)).slice(0, 480);

  try {
    const res = await fetch(SARVAM_TTS_URL, {
      method:  'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type':         'application/json',
      },
      body: JSON.stringify({
        inputs:               [spoken],
        target_language_code: 'hi-IN',
        speaker:              SPEAKER,
        model:                MODEL,
        speech_sample_rate:   22050,
        enable_preprocessing: true, // pronounce embedded English words correctly in mixed Hindi+English
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
    audio.onended = () => { if (currentAudio === audio) currentAudio = null; done(); };
    await audio.play();
    return;
  } catch (err) {
    if (myTurn !== playSeq) return; // superseded — don't fall back either
    console.warn('[tts] Sarvam failed → browser fallback:', err?.message || err);
    browserSpeak(clean);
    done();
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
