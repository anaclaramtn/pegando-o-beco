// Instruções faladas em português

import { S } from './state.js';

const supported = 'speechSynthesis' in window;
let ptVoice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  ptVoice = voices.find(v => /pt[-_]BR/i.test(v.lang)) || voices.find(v => /^pt/i.test(v.lang)) || null;
}

if (supported) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

/** Fala o texto (se a voz estiver ligada). */
export function say(text) {
  if (!S.voice || !supported) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    if (ptVoice) u.voice = ptVoice;
    u.rate = 1.02;
    speechSynthesis.speak(u);
  } catch (e) { /* ignora */ }
}

/** Interrompe a fala atual. */
export function stopSpeech() {
  try { speechSynthesis.cancel(); } catch (e) { /* ignora */ }
}

/** iOS só libera a voz depois de um toque do usuário: fala algo mudo para destravar. */
export function unlockAudio() {
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch (e) { /* ignora */ }
}
