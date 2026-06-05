// tts.js — browser SpeechSynthesis for Mukund's voice.
//
// Uses the browser's built-in TTS. On Chrome it uses Google's Hindi voice
// which is clear and natural. No API key needed, no CORS, no quota issues.
//
// To upgrade to a premium voice later: replace speakMukund() with an
// API call (Sarvam, ElevenLabs, etc.) and keep this as fallback.

export function primeAudio() {
  // No-op for SpeechSynthesis — kept so callers don't break
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch {}
}

export async function speakMukund(text) {
  if (!text?.trim()) return;
  if (!window.speechSynthesis) return;

  stopSpeaking();

  // Small delay so the browser has time to process previous cancel()
  await new Promise(r => setTimeout(r, 80));

  return new Promise((resolve) => {
    const utt    = new SpeechSynthesisUtterance(text.trim());
    utt.lang     = 'hi-IN';
    utt.rate     = 0.88;
    utt.pitch    = 0.85;
    utt.volume   = 1;
    utt.onend    = resolve;
    utt.onerror  = resolve; // resolve even on error so callers don't hang

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();

      // Priority order for best Hindi voice:
      // 1. Google हिन्दी (Chrome's online Hindi TTS — best quality)
      // 2. Any voice with 'hi' in lang
      // 3. Default (browser decides)
      const googleHindi = voices.find(v => v.name === 'Google हिन्दी');
      const anyHindi    = voices.find(v => v.lang?.startsWith('hi'));

      if (googleHindi)     utt.voice = googleHindi;
      else if (anyHindi)   utt.voice = anyHindi;

      window.speechSynthesis.speak(utt);

      // Chrome bug: sometimes speech gets stuck — kick it if needed
      setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 200);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      trySpeak();
    } else {
      // Voices not loaded yet — wait for them
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
      // Safety timeout — speak anyway after 1s even if voices never load
      setTimeout(trySpeak, 1000);
    }
  });
}
