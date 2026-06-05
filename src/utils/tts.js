// tts.js — SpeechSynthesis with voice availability detection.
//
// Key insight: setting lang='hi-IN' when no Hindi voice is installed
// causes Chrome to silently queue but never play the utterance.
// Fix: only set lang/voice if a compatible voice exists; otherwise
// speak with default voice (any voice is better than silence).

export function primeAudio() {}
export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch {}
}

export function speakMukund(text) {
  if (!text?.trim() || !window.speechSynthesis) {
    showNoVoiceToast();
    return;
  }

  const doSpeak = () => {
    window.speechSynthesis.cancel();

    const utt    = new SpeechSynthesisUtterance(text.trim());
    utt.rate     = 0.85;
    utt.volume   = 1;

    const voices      = window.speechSynthesis.getVoices();
    const hindiVoice  = voices.find(v => v.lang?.startsWith('hi'));
    const anyVoice    = voices[0];

    if (hindiVoice) {
      utt.voice = hindiVoice;
      utt.lang  = 'hi-IN';
    } else if (anyVoice) {
      // No Hindi voice — use default voice without restricting lang
      utt.voice = anyVoice;
      // Don't set lang; letting it default avoids silent-fail
    }
    // If no voices at all, just speak with no voice set (browser picks)

    let started = false;
    utt.onstart = () => { started = true; };

    // If speech hasn't started within 1s, it silently failed
    setTimeout(() => {
      if (!started) showNoVoiceToast();
    }, 1000);

    window.speechSynthesis.speak(utt);
  };

  // Voices list may not be populated yet on first call
  if (window.speechSynthesis.getVoices().length === 0) {
    const onLoaded = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
    window.speechSynthesis.onvoiceschanged = onLoaded;
    setTimeout(doSpeak, 800); // safety fallback
  } else {
    doSpeak();
  }
}

// Show a brief toast explaining voice isn't available
function showNoVoiceToast() {
  if (document.getElementById('tts-toast')) return; // don't stack
  const toast = document.createElement('div');
  toast.id = 'tts-toast';
  toast.textContent = '🔇 आवाज़ नहीं — Mac पर Hindi TTS install नहीं है';
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
