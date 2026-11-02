// Menu de opções e botão de som

import { S, saveOptions } from './state.js';
import { $, show, toast } from './dom.js';
import { stopSpeech } from './voice.js';

const ICON_SOUND_ON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="#0f1b3d"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#0f1b3d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
const ICON_SOUND_OFF = `<svg width="22" height="22" viewBox="0 0 24 24" fill="#6b7385"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9l5 6M21 9l-5 6" stroke="#6b7385" stroke-width="2" stroke-linecap="round"/></svg>`;

/** Atualiza o ícone do botão de som. */
export function renderMute() {
  $('muteBtn').innerHTML = S.voice ? ICON_SOUND_ON : ICON_SOUND_OFF;
}

function setVoice(on) {
  S.voice = on;
  $('optVoice').checked = on;
  saveOptions();
  renderMute();
  if (!on) stopSpeech();
}

function updateSimSpeedLabel() {
  $('simSpeedLbl').textContent = S.simSpeed + ' km/h';
}

function openMenu() {
  $('optVoice').checked = S.voice;
  $('optSim').checked = S.sim;
  $('optSimSpeed').value = S.simSpeed;
  updateSimSpeedLabel();
  show('menu');
}

export function initOptions() {
  $('muteBtn').onclick = () => setVoice(!S.voice);
  $('menuBtn').onclick = openMenu;
  $('menuClose').onclick = () => show('menu', false);
  $('menu').onclick = e => { if (e.target.id === 'menu') show('menu', false); }; // toque fora do cartão fecha

  $('optVoice').onchange = e => setVoice(e.target.checked);
  $('optSim').onchange = e => {
    S.sim = e.target.checked;
    saveOptions();
    toast(S.sim ? 'Simulação ligada' : 'Simulação desligada');
  };
  $('optSimSpeed').oninput = e => {
    S.simSpeed = +e.target.value;
    updateSimSpeedLabel();
    saveOptions();
  };

  renderMute();
}
