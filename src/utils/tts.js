// tts.js — ElevenLabs text-to-speech for Mukund's responses.
// Silent fail — text always shows even if TTS is unavailable.
//
// Set both constants below, then call speakMukund(text) anywhere.
// Supports Hindi via eleven_multilingual_v2 model.

export const ELEVENLABS_API_KEY = 'sk_688942a31f08dcdf8ec4cfe3571ebe36130bbee5ab552f51';
export const ELEVENLABS_VOICE_ID = 'DQuoFsZ3oda1diTerwpq'; // Aaditya Kapur - Calm Conversational Hindi

const TTS_URL = (voiceId) =>
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

// Single audio instance so we stop previous before playing new
let _currentAudio = null;

export function stopSpeaking() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio = null;
  }
}

export async function speakMukund(text) {
  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'REPLACE_WITH_ELEVENLABS_KEY') return;
  if (!ELEVENLABS_VOICE_ID || ELEVENLABS_VOICE_ID === 'REPLACE_WITH_VOICE_ID') return;
  if (!text?.trim()) return;

  stopSpeaking(); // stop any in-progress audio first

  try {
    const res = await fetch(TTS_URL(ELEVENLABS_VOICE_ID), {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) throw new Error(`elevenlabs_${res.status}`);

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); _currentAudio = null; };
    audio.play();
  } catch (err) {
    console.error('[tts]', err); // silent fail — text still shows
  }
}
