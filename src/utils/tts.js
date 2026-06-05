// tts.js — SpeechSynthesis wrapper.
//
// speakMukund() is called from async code so autoplay may be blocked.
// The guaranteed path is the 🔊 replay button — a direct tap always works.
// speakMukund() still tries auto-play; if it fails, the button is the backup.

export function primeAudio() { /* kept for callers */ }

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch {}
}

export function speakMukund(text) {
  if (!text?.trim() || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.trim());
    utt.lang  = 'hi-IN';
    utt.rate  = 0.88;
    utt.pitch = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const hindi  = voices.find(v => v.lang?.startsWith('hi'));
    if (hindi) utt.voice = hindi;
    window.speechSynthesis.speak(utt);
  } catch {}
}
