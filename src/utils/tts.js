// tts.js — Sarvam AI TTS (Hindi-native) with SpeechSynthesis fallback.
//
// Tier 1: Sarvam bulbul:v1 — "amol" (warm male Hindi voice)
// Tier 2: browser SpeechSynthesis (hi-IN, low pitch) — if Sarvam fails
// Tier 3: silent — text always shows

const SARVAM_API_KEY = 'sk_afh7owtd_prjoh7ZH0nIN1HqF8wqRDuzU';
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

// Web Audio API context — unlocked at user gesture time via primeAudio()
let _ctx       = null;
let _curSource = null;

function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!_ctx || _ctx.state === 'closed') _ctx = new AC();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

export function primeAudio() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
}

export function stopSpeaking() {
  try { _curSource?.stop(); } catch {}
  _curSource = null;
  try { window.speechSynthesis?.cancel(); } catch {}
}

// ── Tier 2: SpeechSynthesis ───────────────────────────────────────────────────
function fallbackSpeak(text) {
  try {
    if (!window.speechSynthesis || !text?.trim()) return;
    window.speechSynthesis.cancel();
    const speak = () => {
      const utt  = new SpeechSynthesisUtterance(text);
      utt.lang   = 'hi-IN';
      utt.rate   = 0.85;
      utt.pitch  = 0.6;
      utt.volume = 1;
      const voices      = window.speechSynthesis.getVoices();
      const hindiVoices = voices.filter(v => v.lang?.startsWith('hi'));
      const maleHindi   = hindiVoices.find(v => /male|man|पुरुष/i.test(v.name));
      if (maleHindi)           utt.voice = maleHindi;
      else if (hindiVoices[0]) utt.voice = hindiVoices[0];
      window.speechSynthesis.speak(utt);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  } catch {}
}

// ── Tier 1: Sarvam TTS ────────────────────────────────────────────────────────
async function sarvamSpeak(text) {
  // Sarvam accepts up to ~500 chars per request — trim if needed
  const input = text.trim().slice(0, 500);
  if (!input) return;

  const res = await fetch(SARVAM_TTS_URL, {
    method:  'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY,
      'Content-Type':         'application/json',
    },
    body: JSON.stringify({
      inputs:               [input],
      target_language_code: 'hi-IN',
      speaker:              'amol',   // warm male Hindi voice
      pitch:                0,
      pace:                 0.9,
      loudness:             1.5,
      speech_sample_rate:   22050,
      enable_preprocessing: true,
      model:                'bulbul:v1',
    }),
  });

  if (!res.ok) throw new Error(`sarvam_${res.status}`);

  const data      = await res.json();
  const b64Audio  = data.audios?.[0];
  if (!b64Audio) throw new Error('sarvam_no_audio');

  // Decode base64 → ArrayBuffer → Web Audio (bypasses autoplay restrictions)
  const binary = atob(b64Audio);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ctx = getCtx();
  if (!ctx) throw new Error('no_audio_context');

  const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
  const source      = ctx.createBufferSource();
  source.buffer     = audioBuffer;
  source.connect(ctx.destination);
  source.start(0);
  source.onended = () => { if (_curSource === source) _curSource = null; };
  _curSource = source;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function speakMukund(text) {
  if (!text?.trim()) return;
  stopSpeaking();
  try {
    await sarvamSpeak(text);
  } catch (err) {
    console.warn('[tts] Sarvam failed, using SpeechSynthesis:', err.message);
    fallbackSpeak(text);
  }
}
