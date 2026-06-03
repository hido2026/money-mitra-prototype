// useVoiceInput — speech-to-text with two-tier fallback:
//
//  Tier 1: Web Speech API (webkitSpeechRecognition / SpeechRecognition)
//          → native iOS Safari + Chrome, no API key, instant, reliable
//  Tier 2: MediaRecorder → Sarvam AI STT
//          → fallback when Web Speech unavailable (some Android browsers)
//
// The button in BottomInputBar reflects voiceStatus at all times.

import { useState, useRef } from 'react';
import { primeAudio } from '../utils/tts';

// ── Sarvam (Tier 2 only) ──────────────────────────────────────────────────────
export const SARVAM_API_KEY =
  import.meta.env.VITE_SARVAM_API_KEY || 'sk_afh7owtd_prjoh7ZH0nIN1HqF8wqRDuzU';

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text-translate';

// ── Hindi number / category parsers (unchanged) ───────────────────────────────

const UNITS = {
  'शून्य':0,'एक':1,'दो':2,'तीन':3,'चार':4,'पाँच':5,'पांच':5,
  'छह':6,'छः':6,'सात':7,'आठ':8,'नौ':9,'दस':10,'बीस':20,
  'तीस':30,'चालीस':40,'पचास':50,'साठ':60,'सत्तर':70,'अस्सी':80,'नब्बे':90,
};
const MULTIPLIERS = { 'सौ':100,'हज़ार':1000,'हजार':1000,'लाख':100000 };

export function parseHindiAmount(text) {
  if (!text) return null;
  const digitMatch = text.match(/(?:₹\s*)?([\d,]+)/);
  if (digitMatch) {
    const n = parseInt(digitMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(n) && n > 0) return n;
  }
  const words = text.toLowerCase().replace(/रुपये|रुपया|रुपए|₹/g, '').split(/\s+/).filter(Boolean);
  let total = 0, current = 0;
  for (const word of words) {
    if (UNITS[word] !== undefined) current += UNITS[word];
    else if (MULTIPLIERS[word]) {
      const m = MULTIPLIERS[word];
      if (current === 0) current = 1;
      if (m >= 1000) { total += current * m; current = 0; }
      else current *= m;
    }
  }
  total += current;
  return total > 0 ? total : null;
}

const CATEGORY_MAP = {
  'खाना':  ['खाना','खाने','खाद्य','राशन','किराना'],
  'यात्रा': ['यात्रा','बस','ट्रेन','ऑटो','रिक्शा','टैक्सी','uber','ola'],
  'बिल':   ['बिल','बिजली','पानी','गैस','electricity'],
  'दवाई':  ['दवाई','दवा','अस्पताल','hospital','medicine'],
  'फ़ोन':  ['फ़ोन','फोन','रिचार्ज','mobile','मोबाइल','recharge'],
  'बच्चे': ['बच्चे','स्कूल','फीस','school'],
  'घर':   ['घर','किराया','rent'],
};
const SOURCE_MAP = {
  'तनख़्वाह': ['तनख़्वाह','तनखाह','salary','महीना','सैलरी'],
  'उपहार':  ['उपहार','gift','तोहफ़ा'],
  'बेचा':   ['बेचा','बेची','sell','sold'],
  'मिला':   ['मिला','मिली','found','receive'],
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

// ── Tier 1: Web Speech API ────────────────────────────────────────────────────

function hasWebSpeech() {
  return typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// ── Tier 2: MediaRecorder → Sarvam ───────────────────────────────────────────

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const t of ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/mpeg','audio/ogg']) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
  }
  return '';
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useVoiceInput
 * @param {{ onResult: (transcript: string) => void }} opts
 * @returns {{ status, transcript, toggle }}
 *
 * status: 'idle'|'recording'|'processing'|'done'|'error'|'no_mic'
 */
export function useVoiceInput({ onResult }) {
  const [status,     setStatus]     = useState('idle');
  const [transcript, setTranscript] = useState('');

  // Tier 2 refs
  const mrRef     = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);
  // Tier 1 ref
  const srRef     = useRef(null);

  const stopAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try { mrRef.current?.state === 'recording' && mrRef.current.stop(); } catch {}
    try { srRef.current?.stop(); } catch {}
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
  };

  const toggle = async () => {
    // Prime AudioContext at tap time (user gesture) so ElevenLabs playback
    // works even after the async API delay — must be called synchronously here
    primeAudio();

    if (status === 'recording') { stopAll(); return; }

    // ── Tier 1: Web Speech API (iOS Safari, Chrome) ───────────────────────────
    if (hasWebSpeech()) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang            = 'hi-IN';
      recognition.interimResults  = false;
      recognition.maxAlternatives = 1;
      // iOS Safari only supports single-shot, so continuous = false is fine
      recognition.continuous = false;

      srRef.current = recognition;
      setStatus('recording');
      setTranscript('');

      recognition.onresult = (e) => {
        const tx = e.results[0]?.[0]?.transcript?.trim() || '';
        setTranscript(tx);
        if (tx) onResult(tx);
        setStatus('done');
        setTimeout(() => setStatus('idle'), 2000);
      };

      recognition.onerror = (e) => {
        console.error('[speech]', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setStatus('no_mic');
        } else {
          setStatus('error');
        }
        setTimeout(() => setStatus('idle'), 3000);
      };

      recognition.onend = () => {
        // If still 'recording' after end (no result, no error), go idle
        setStatus(s => s === 'recording' ? 'idle' : s);
      };

      try {
        recognition.start();
      } catch (err) {
        console.error('[speech start]', err);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2500);
      }
      return;
    }

    // ── Tier 2: MediaRecorder → Sarvam (fallback) ─────────────────────────────
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

      const mimeType  = getSupportedMimeType();
      const mrOptions = mimeType ? { mimeType } : {};
      const mr        = new MediaRecorder(stream, mrOptions);
      mrRef.current   = mr;

      mr.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setStatus('processing');
        try {
          const blobType = mimeType || 'audio/mp4';
          const ext      = blobType.includes('webm') ? 'webm' : blobType.includes('ogg') ? 'ogg' : 'mp4';
          const blob     = new Blob(chunksRef.current, { type: blobType });
          const form     = new FormData();
          form.append('file', blob, `audio.${ext}`);
          form.append('language_code', 'hi-IN');

          const res = await fetch(SARVAM_STT_URL, {
            method:  'POST',
            headers: { 'api-subscription-key': SARVAM_API_KEY },
            body:    form,
          });
          if (!res.ok) throw new Error(`sarvam_${res.status}`);

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

      mr.start(250);
      timerRef.current = setTimeout(() => {
        if (mr.state === 'recording') mr.stop();
      }, 5000);

    } catch (err) {
      console.error('[mic]', err);
      setStatus('no_mic');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return { status, transcript, toggle };
}
