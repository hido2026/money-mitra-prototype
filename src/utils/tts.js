// tts.js — Sarvam AI TTS (primary) → ElevenLabs (secondary) → browser SpeechSynthesis
//
// Why Sarvam first:
//   Native Indian-language TTS, better Hindi prosody than ElevenLabs.
//   Same API key already used for STT in useVoiceInput.js.
//
// Why Web Audio API instead of new Audio():
//   new Audio().play() is blocked by browser autoplay policy when called
//   3-5 seconds after a user gesture (the async TTS round-trip).
//   Web Audio API's AudioContext.decodeAudioData + createBufferSource
//   does NOT have this restriction once the context is running.
//
// Fallback chain: Sarvam TTS → ElevenLabs TTS → browser SpeechSynthesis (hi-IN) → silent.

// Sarvam (primary) — same key as STT in useVoiceInput.js
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';
const SARVAM_SPEAKER = 'amol';   // Male, conversational Hindi — closest to Mukund's voice
const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY || 'sk_afh7owtd_prjoh7ZH0nIN1HqF8wqRDuzU';

// ElevenLabs (secondary fallback)
export const ELEVENLABS_API_KEY  = 'sk_688942a31f08dcdf8ec4cfe3571ebe36130bbee5ab552f51';
export const ELEVENLABS_VOICE_ID = 'DQuoFsZ3oda1diTerwpq'; // Aaditya Kapur — Calm Conversational Hindi

const TTS_URL = (id) => `https://api.elevenlabs.io/v1/text-to-speech/${id}`;

// Module-level AudioContext — created once, reused for all playback
let _ctx       = null;
let _curSource = null;

function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new AC();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

/**
 * primeAudio — call on ANY user gesture (button tap, voice toggle) to
 * unlock the AudioContext so ElevenLabs playback works even seconds later.
 */
export function primeAudio() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    // Play a 0-sample silent buffer to fully unlock the context
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

// ── Tier 2: browser SpeechSynthesis ──────────────────────────────────────────
function fallbackSpeak(text) {
  try {
    if (!window.speechSynthesis || !text?.trim()) return;
    window.speechSynthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.lang   = 'hi-IN';
    utt.rate   = 0.88;
    utt.pitch  = 0.85; // lower pitch = sounds more male
    utt.volume = 1;

    // Try to find a male Hindi voice on the device
    const voices      = window.speechSynthesis.getVoices();
    const hindiVoices = voices.filter(v => v.lang?.startsWith('hi'));
    const maleHindi   = hindiVoices.find(v => /male|man|पुरुष/i.test(v.name));
    if (maleHindi)       utt.voice = maleHindi;
    else if (hindiVoices[0]) utt.voice = hindiVoices[0];

    window.speechSynthesis.speak(utt);
  } catch {}
}

// ── Shared: play an ArrayBuffer via Web Audio API ────────────────────────────
async function playArrayBuffer(arrayBuffer) {
  const ctx = getCtx();
  if (!ctx) throw new Error('no_audio_context');
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  const src         = ctx.createBufferSource();
  src.buffer        = audioBuffer;
  src.connect(ctx.destination);
  src.start(0);
  src.onended = () => { if (_curSource === src) _curSource = null; };
  _curSource = src;
}

// ── Tier 1: Sarvam TTS ───────────────────────────────────────────────────────
async function sarvamSpeak(text) {
  const res = await fetch(SARVAM_TTS_URL, {
    method:  'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs:               [text],
      target_language_code: 'hi-IN',
      speaker:              SARVAM_SPEAKER,
      pitch:                0,
      pace:                 1.0,
      loudness:             1.5,
      speech_sample_rate:   22050,
      enable_preprocessing: true,
      model:                'bulbul:v1',
    }),
  });
  if (!res.ok) throw new Error(`sarvam_tts_${res.status}`);
  const data = await res.json();
  // Sarvam returns base64-encoded WAV in data.audios[0]
  const b64  = data.audios?.[0];
  if (!b64) throw new Error('sarvam_tts_empty');
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  await playArrayBuffer(bytes.buffer);
}

// ── Tier 2: ElevenLabs TTS ───────────────────────────────────────────────────
async function elevenLabsSpeak(text) {
  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.includes('REPLACE')) {
    throw new Error('no_elevenlabs_key');
  }
  const res = await fetch(TTS_URL(ELEVENLABS_VOICE_ID), {
    method:  'POST',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      text,
      model_id:       'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) throw new Error(`elevenlabs_${res.status}`);
  await playArrayBuffer(await res.arrayBuffer());
}

// ── Main: Sarvam → ElevenLabs → browser SpeechSynthesis ─────────────────────
export async function speakMukund(text) {
  if (!text?.trim()) return;
  stopSpeaking();

  // Tier 1: Sarvam (native Indian language TTS)
  try {
    await sarvamSpeak(text);
    return;
  } catch (err) {
    console.warn('[tts] Sarvam failed, trying ElevenLabs:', err.message);
  }

  // Tier 2: ElevenLabs
  try {
    await elevenLabsSpeak(text);
    return;
  } catch (err) {
    console.warn('[tts] ElevenLabs failed, using SpeechSynthesis:', err.message);
  }

  // Tier 3: browser SpeechSynthesis
  fallbackSpeak(text);
}
