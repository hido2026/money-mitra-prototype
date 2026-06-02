// useVoiceInput — Sarvam AI speech-to-text + Hindi number/category parser.
//
// Set VITE_SARVAM_API_KEY in your environment (recommended),
// OR hardcode the key in the line below for local testing.
//
// GitHub Actions secret: VITE_SARVAM_API_KEY
// Local .env.local: VITE_SARVAM_API_KEY=your_key_here

import { useState, useRef } from 'react';

export const SARVAM_API_KEY =
  import.meta.env.VITE_SARVAM_API_KEY || 'sk_afh7owtd_prjoh7ZH0nIN1HqF8wqRDuzU';

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text-translate';

// ── Hindi number words → integer ──────────────────────────────────────────────

const UNITS = {
  'शून्य':0, 'एक':1, 'दो':2, 'तीन':3, 'चार':4, 'पाँच':5, 'पांच':5,
  'छह':6, 'छः':6, 'सात':7, 'आठ':8, 'नौ':9, 'दस':10,
  'ग्यारह':11, 'बारह':12, 'तेरह':13, 'चौदह':14, 'पंद्रह':15,
  'सोलह':16, 'सत्रह':17, 'अठारह':18, 'उन्नीस':19, 'बीस':20,
  'इक्कीस':21, 'बाईस':22, 'तेईस':23, 'चौबीस':24, 'पच्चीस':25,
  'छब्बीस':26, 'सत्ताईस':27, 'अट्ठाईस':28, 'उनतीस':29,
  'तीस':30, 'चालीस':40, 'पचास':50, 'साठ':60, 'सत्तर':70,
  'अस्सी':80, 'नब्बे':90,
  // NOTE: "सौ" (100) is kept in MULTIPLIERS only — NOT here.
  // "दो सौ" = 2 × 100 = 200. Having it in UNITS would cause "दो सौ" → 2+100=102 (wrong).
};
const MULTIPLIERS = {
  'सौ':100, 'हज़ार':1000, 'हजार':1000, 'हज़ार':1000, 'लाख':100000,
};

/**
 * parseHindiAmount — map Hindi spoken phrase to integer rupee amount.
 * Examples:
 *   "दो हज़ार"         → 2000
 *   "पाँच सौ"          → 500
 *   "एक हज़ार पाँच सौ"  → 1500
 *   "दो सौ रुपये"       → 200
 *   "2000" / "₹2000"   → 2000  (digits are also handled)
 */
export function parseHindiAmount(text) {
  if (!text) return null;
  const t = text.trim();

  // Direct digit match (e.g., "2000", "₹2,000", "2000 rupees")
  const digitMatch = t.match(/(?:₹\s*)?([\d,]+)/);
  if (digitMatch) {
    const n = parseInt(digitMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(n) && n > 0) return n;
  }

  // Hindi word parsing
  const words = t
    .toLowerCase()
    .replace(/रुपये|रुपया|रुपए|₹/g, '')
    .split(/\s+/)
    .filter(Boolean);

  let total   = 0;
  let current = 0;

  for (const word of words) {
    if (UNITS[word] !== undefined) {
      current += UNITS[word];
    } else if (MULTIPLIERS[word]) {
      const mult = MULTIPLIERS[word];
      if (current === 0) current = 1;
      if (mult >= 1000) {
        // "दो हज़ार" → total += 2*1000; current = 0
        total   += current * mult;
        current  = 0;
      } else {
        // "दो सौ" → current = 2 → current = 200
        current *= mult;
      }
    }
  }

  total += current;
  return total > 0 ? total : null;
}

// ── Hindi category / source keyword matching ──────────────────────────────────

const CATEGORY_MAP = {
  'खाना':  ['खाना','खाने','खाद्य','राशन','खाना-पीना','किराना'],
  'यात्रा': ['यात्रा','बस','ट्रेन','ऑटो','रिक्शा','टैक्सी','taxi','uber','ola'],
  'बिल':   ['बिल','बिजली','पानी','गैस','electricity','bill'],
  'दवाई':  ['दवाई','दवा','अस्पताल','hospital','doctor','medicine'],
  'फ़ोन':  ['फ़ोन','फोन','रिचार्ज','mobile','मोबाइल','recharge'],
  'बच्चे': ['बच्चे','स्कूल','फीस','fee','school'],
  'घर':   ['घर','किराया','rent','मकान'],
  'अन्य':  ['अन्य','other','misc'],
};
const SOURCE_MAP = {
  'तनख़्वाह': ['तनख़्वाह','तनखाह','salary','तनख्वाह','महीना','सैलरी'],
  'उपहार':  ['उपहार','gift','तोहफ़ा'],
  'बेचा':   ['बेचा','बेची','बेचे','sell','sold'],
  'मिला':   ['मिला','मिली','मिले','found','receive','मिला-जुला'],
};

export function parseHindiCategory(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_MAP)) {
    if (kws.some(k => t.includes(k))) return cat;
  }
  return null;
}

export function parseHindiSource(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const [src, kws] of Object.entries(SOURCE_MAP)) {
    if (kws.some(k => t.includes(k))) return src;
  }
  return null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useVoiceInput
 *
 * @param {{ onResult: (transcript: string) => void }} opts
 * @returns {{ status, transcript, toggle }}
 *
 * status: 'idle' | 'recording' | 'processing' | 'done' | 'error' | 'no_key' | 'no_mic'
 */
export function useVoiceInput({ onResult }) {
  const [status,     setStatus]     = useState('idle');
  const [transcript, setTranscript] = useState('');

  const mrRef     = useRef(null);  // MediaRecorder instance
  const streamRef = useRef(null);  // MediaStream
  const chunksRef = useRef([]);    // recorded audio chunks
  const timerRef  = useRef(null);  // auto-stop timer

  const stopRecording = () => {
    if (timerRef.current)         clearTimeout(timerRef.current);
    if (mrRef.current?.state === 'recording') mrRef.current.stop();
  };

  const toggle = async () => {
    // If already recording → stop early
    if (status === 'recording') { stopRecording(); return; }

    // Check key first
    if (!SARVAM_API_KEY || SARVAM_API_KEY === 'REPLACE_WITH_SARVAM_KEY') {
      setStatus('no_key');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    // Check MediaRecorder support (iOS 14.3+ supports it, older does not)
    if (typeof MediaRecorder === 'undefined') {
      setStatus('no_mic');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('recording');
    setTranscript('');
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // iOS Safari uses audio/mp4; Chrome/Firefox use audio/webm
      // Pick the first supported MIME type
      const mimeType = (() => {
        for (const t of [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/mpeg',
          'audio/ogg',
        ]) {
          try { if (MediaRecorder.isTypeSupported(t)) return t; } catch { /* ignore */ }
        }
        return ''; // let browser choose
      })();

      const mrOptions = mimeType ? { mimeType } : {};
      const mr = new MediaRecorder(stream, mrOptions);
      mrRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setStatus('processing');

        try {
          // Use detected mimeType for the blob; fallback to mp4 (iOS safe)
          const blobType = mimeType || 'audio/mp4';
          const ext      = blobType.includes('webm') ? 'webm'
                         : blobType.includes('ogg')  ? 'ogg'
                         : 'mp4';

          const blob = new Blob(chunksRef.current, { type: blobType });
          const form = new FormData();
          form.append('file', blob, `audio.${ext}`);
          form.append('language_code', 'hi-IN'); // improves Hindi accuracy

          const res = await fetch(SARVAM_STT_URL, {
            method: 'POST',
            headers: { 'api-subscription-key': SARVAM_API_KEY },
            body: form,
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error('[sarvam] HTTP', res.status, errText);
            throw new Error(`sarvam_${res.status}`);
          }
          const data = await res.json();
          const tx   = (data.transcript || '').trim();

          setTranscript(tx);
          if (tx) onResult(tx);
          setStatus('done');
          setTimeout(() => setStatus('idle'), 2200);
        } catch (err) {
          console.error('[sarvam]', err);
          setStatus('error');
          setTimeout(() => setStatus('idle'), 2500);
        }
      };

      // Request data every 250ms so we get chunks even on short recordings
      mr.start(250);
      // Auto-stop after 5 s
      timerRef.current = setTimeout(() => {
        if (mr.state === 'recording') mr.stop();
      }, 5000);

    } catch (err) {
      console.error('[voice mic]', err);
      setStatus('no_mic');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return { status, transcript, toggle };
}
