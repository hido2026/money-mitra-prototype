// useVoiceInput — speech-to-text via Sarvam AI.
//
// We record mic audio with MediaRecorder, decode it with the Web Audio API,
// re-encode to a clean mono 16-bit WAV in the browser, and POST it to Sarvam's
// speech-to-text endpoint. This is reliable on EVERY browser.
//
// Why not the browser's webkitSpeechRecognition? It is silently broken on
// desktop Safari (mic activates but no transcript is ever returned). Sarvam STT
// works uniformly on Safari, Chrome, Android, and iOS — and CORS is open.

import { useState, useRef } from 'react';
import { primeAudio } from '../utils/tts';

export const SARVAM_API_KEY =
  import.meta.env.VITE_SARVAM_API_KEY || 'sk_afh7owtd_prjoh7ZH0nIN1HqF8wqRDuzU';

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';
const SARVAM_MODEL   = 'saarika:v2.5';
const MAX_RECORD_MS  = 7000;   // auto-stop so users don't have to find the button

// ── Hindi number / category parsers (unchanged — used by Passbook) ────────────

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

// ── Audio helpers ─────────────────────────────────────────────────────────────

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const t of ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/mpeg','audio/ogg']) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
  }
  return '';
}

// Decode the recorded blob (webm/opus on Chrome, mp4/aac on Safari) and
// re-encode to a mono 16-bit PCM WAV that Sarvam accepts everywhere.
async function blobToWav(blob) {
  const arrayBuf = await blob.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  let audioBuf;
  try {
    audioBuf = await ctx.decodeAudioData(arrayBuf);
  } finally {
    try { ctx.close?.(); } catch {}
  }
  return encodeWav(audioBuf);
}

function encodeWav(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const data = audioBuffer.getChannelData(0); // mono (first channel)
  const len  = data.length;
  const buf  = new ArrayBuffer(44 + len * 2);
  const view = new DataView(buf);
  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + len * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);          // PCM chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);           // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, len * 2, true);

  let off = 44;
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    off += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useVoiceInput
 * @param {{ onResult: (transcript: string) => void }} opts
 * @returns {{ status, transcript, toggle }}
 * status: 'idle'|'recording'|'processing'|'done'|'error'|'no_mic'
 */
export function useVoiceInput({ onResult }) {
  const [status,     setStatus]     = useState('idle');
  const [transcript, setTranscript] = useState('');

  const mrRef     = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef   = useRef('');
  const timerRef  = useRef(null);

  const stopRecorder = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    try { if (mrRef.current?.state === 'recording') mrRef.current.stop(); } catch {}
  };

  const toggle = async () => {
    primeAudio(); // unlock audio for Mukund's voice reply (same user gesture)

    // Second tap → stop early and transcribe what we have
    if (status === 'recording') { stopRecorder(); return; }

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('no_mic');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = getSupportedMimeType();
      mimeRef.current = mime;
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      mrRef.current   = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
        setStatus('processing');
        try {
          const recorded = new Blob(chunksRef.current, { type: mimeRef.current || 'audio/mp4' });
          if (recorded.size < 1000) throw new Error('empty_recording');

          const wav  = await blobToWav(recorded);
          const form = new FormData();
          form.append('file', wav, 'audio.wav');
          form.append('model', SARVAM_MODEL);
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
          if (tx) {
            onResult(tx);
            setStatus('done');
            setTimeout(() => setStatus('idle'), 1800);
          } else {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2500);
          }
        } catch (err) {
          console.error('[sarvam stt]', err?.message || err);
          setStatus('error');
          setTimeout(() => setStatus('idle'), 2500);
        }
      };

      mr.start();
      setStatus('recording');
      setTranscript('');
      timerRef.current = setTimeout(() => stopRecorder(), MAX_RECORD_MS);
    } catch (err) {
      console.error('[mic]', err?.message || err);
      setStatus('no_mic');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return { status, transcript, toggle };
}
