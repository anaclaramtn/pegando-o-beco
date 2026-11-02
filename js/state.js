// Estado compartilhado do app e preferências salvas

import { STORAGE_KEY, LEGACY_STORAGE_KEY } from './config.js';

export const S = {
  // Posição atual
  pos: null,          // [lon, lat]
  heading: 0,
  speed: 0,           // m/s
  watchId: null,

  // Destino e rota
  dest: null,         // { coord, name, addr }
  route: null,        // rota do OSRM
  coords: [],         // pontos da rota
  cum: [],            // distância acumulada até cada ponto
  segLen: [],         // comprimento de cada trecho
  steps: [],          // manobras
  stepStart: [],      // distância onde cada manobra começa
  total: 0,           // comprimento total da rota

  // Navegação
  navigating: false,
  following: true,
  stepIdx: 0,
  spoken: {},
  offCount: 0,
  rerouting: false,
  lastProj: null,
  wakeLock: null,

  // Preferências
  voice: true,
  sim: false,
  simSpeed: 40,

  // Simulação
  simAlong: 0,
  simTimer: null,
};

function loadOptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || '{}';
    const p = JSON.parse(raw);
    S.voice = p.voice ?? true;
    S.sim = !!p.sim;
    S.simSpeed = p.simSpeed || 40;
  } catch (e) { /* mantém os padrões */ }
}

export function saveOptions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ voice: S.voice, sim: S.sim, simSpeed: S.simSpeed }));
  } catch (e) { /* armazenamento indisponível */ }
}

loadOptions();
