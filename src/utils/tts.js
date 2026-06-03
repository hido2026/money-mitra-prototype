// tts.js — ElevenLabs TTS with SpeechSynthesis fallback.
//
// Two-tier approach (per brief C):
//   Tier 1: ElevenLabs (Aaditya Kapur — Calm Conversational Hindi)
//   Tier 2: browser SpeechSynthesis (hi-IN) — fires automatically if:
//     • ElevenLabs API fails (wrong key, rate limit, network)
//     • audio.play() is blocked by browser autoplay policy
//       (this happens when async API delay expires the user gesture)
//   Tier 3: silent — if neither works, text still shows.
//
// Text always shows. Voice is enhancement only, never required.

export const ELEVENLABS_API_KEY  = 'sk_688942a31f08dcdf8ec4cfe3571ebe36130bbee5ab552f51';
export const ELEVENLABS_VOICE_ID = 'DQuoFsZ3oda1diTerwpq'; // Aaditya Kapur — Calm Conversational Hindi

const TTS_URL = (id) => `https://api.elevenlabs.io/v1/text-to-speech/${id}`;

let _currentAudio = null;

// ── Tier 2: browser SpeechSynthesis ──────────────────────────────────────────
function fallbackSpeak(text) {
  try {
    if (!window.speechSynthesis || !text?.trim()) return;
    window.speechSynthesis.cancel();
    const utt   = new SpeechSynthesisUtterance(text);
    utt.lang    = 'hi-IN';
    utt.rate    = 0.88;   // slightly slower for clarity
    utt.pitch   = 1;
    utt.volume  = 1;
    window.speechSynthesis.speak(utt);
  } catch { /* tier 3: silent */ }
}

export function stopSpeaking() {
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  try { window.speechSynthesis?.cancel(); } catch {}
}

// ── Main: try ElevenLabs → fallback to SpeechSynthesis ───────────────────────
export async function speakMukund(text) {
  if (!text?.trim()) return;
  stopSpeaking();

  // If no valid ElevenLabs key, go straight to fallback
  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.includes('REPLACE')) {
    fallbackSpeak(text);
    return;
  }

  try {
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

    const blob  = await res.blob();
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); _currentAudio = null; };

    // await play() — if autoplay policy blocks it, catch and fallback immediately
    await audio.play();

  } catch (err) {
    // ElevenLabs failed OR autoplay blocked → browser TTS as fallback
    console.warn('[tts] falling back to SpeechSynthesis:', err.message);
    _currentAudio = null;
    fallbackSpeak(text);
  }
}
