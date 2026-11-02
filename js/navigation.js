// Navegação curva a curva: posição do carro, instruções, voz, recálculo e chegada

import { S } from './state.js';
import { $, show, toast } from './dom.js';
import { OFF_ROUTE_METERS, ARRIVAL_METERS } from './config.js';
import { formatDistance, formatDistanceSpeech, formatDuration, formatClock, lowerFirst } from './format.js';
import { instruction, maneuverIcon } from './maneuvers.js';
import { say, stopSpeech, unlockAudio } from './voice.js';
import { map, placeCar, drawDriven, follow } from './mapView.js';
import { setRoute, projectOnRoute } from './route.js';
import { fetchRoute } from './api.js';
import { startSim, stopSim } from './simulation.js';
import { requestWakeLock, releaseWakeLock } from './wakeLock.js';
import { renderMute } from './options.js';
import { cancelPreview } from './preview.js';
import { resetSearch } from './search.js';

/** Recebe uma nova posição (do GPS ou da simulação) e atualiza tudo. */
export function updatePosition(coord, speed, heading) {
  S.pos = coord;
  if (speed != null) S.speed = speed;
  if (heading != null && !isNaN(heading)) S.heading = heading;

  let shown = coord;
  let hd = S.heading;

  if (S.navigating && S.coords.length) {
    const pr = projectOnRoute(coord);
    S.lastProj = pr;
    if (pr && pr.d < OFF_ROUTE_METERS) {
      // Na rota: "gruda" o carro na linha
      shown = pr.point;
      hd = pr.bearing;
      S.heading = hd;
      S.offCount = 0;
    } else if (pr) {
      // Fora da rota: depois de 3 leituras seguidas, recalcula
      S.offCount++;
      if (S.offCount >= 3 && !S.rerouting && !S.sim) reroute();
    }
    navTick(pr);
  }

  placeCar(shown, hd);
  $('speedVal').textContent = Math.round((S.speed || 0) * 3.6);
  if (S.navigating) follow();
}

// ---------- Início / fim ----------
export function startNav() {
  if (!S.route) return;
  unlockAudio();
  S.navigating = true;
  S.following = true;

  ['preview', 'searchBar', 'results', 'locateBtn'].forEach(id => show(id, false));
  ['banner', 'navBottom', 'speed'].forEach(id => show(id));
  requestWakeLock();
  renderMute();

  if (S.sim) startSim(updatePosition);
  else if (S.pos) updatePosition(S.pos, S.speed, S.heading);

  const next = S.steps[1] ? instruction(S.steps[1]) : '';
  say('Vamos lá. ' + instruction(S.steps[0]) + (next ? '. Depois, ' + lowerFirst(next) : ''));
  S.spoken[0] = true;
  follow(true);
}

export function stopNav() {
  S.navigating = false;
  stopSim();
  stopSpeech();
  ['banner', 'thenBox', 'navBottom', 'speed', 'recenter'].forEach(id => show(id, false));
  show('searchBar');
  releaseWakeLock();
  resetSearch();
  cancelPreview();
}

// ---------- A cada nova posição ----------
function navTick(pr) {
  if (!pr || !S.steps.length) return;
  const along = pr.along;
  const steps = S.steps;

  // Manobra atual = última cujo início já passou
  let i = 0;
  while (i + 1 < steps.length && S.stepStart[i + 1] <= along + 5) i++;
  S.stepIdx = i;

  const next = steps[i + 1] || steps[i];
  const nextStart = steps[i + 1] ? S.stepStart[i + 1] : S.total;
  const distToNext = Math.max(0, nextStart - along);
  const remaining = Math.max(0, S.total - along);
  const then = steps[i + 2];

  updateBanner(next, distToNext, then, nextStart, i);
  updateBottomBar(remaining);
  drawDriven(S.coords.slice(0, pr.i + 1).concat([pr.point]));
  speakIfNeeded(i, next, distToNext, then, nextStart);

  if (remaining < ARRIVAL_METERS) arrive();
}

function updateBanner(next, distToNext, then, nextStart, i) {
  $('mIcon').innerHTML = maneuverIcon(next);
  $('mDist').textContent = next.maneuver.type === 'arrive' && distToNext < 30 ? 'Agora' : formatDistance(distToNext);
  $('mText').textContent = instruction(next);

  // "Depois": mostra a manobra seguinte quando estão bem próximas
  const showThen = then && distToNext < 500 && (S.stepStart[i + 2] - nextStart) < 250;
  if (showThen) $('thenIcon').innerHTML = maneuverIcon(then);
  show('thenBox', !!showThen);
}

function updateBottomBar(remaining) {
  const remainingTime = S.route.duration * (remaining / (S.total || 1));
  $('etaTime').textContent = formatClock(remainingTime);
  $('etaSub').textContent = formatDuration(remainingTime) + ' · ' + formatDistance(remaining);
}

function speakIfNeeded(i, next, distToNext, then, nextStart) {
  const k = i + 1;
  if (!S.steps[k]) return;
  const text = instruction(next);

  // Aviso antecipado ("Em 300 metros, vire à direita"); mais cedo quanto maior a velocidade
  const far = S.speed > 20 ? 1200 : S.speed > 14 ? 700 : 350;
  const stepIsLong = (nextStart - S.stepStart[i]) > far;
  if (distToNext <= far && distToNext > far * 0.55 && !S.spoken[k + 'a'] && stepIsLong) {
    S.spoken[k + 'a'] = true;
    say('Em ' + formatDistanceSpeech(distToNext) + ', ' + lowerFirst(text));
  }

  // Aviso na hora da manobra
  const near = Math.max(40, (S.speed || 8) * 5);
  if (distToNext <= near && !S.spoken[k + 'b']) {
    S.spoken[k + 'b'] = true;
    S.spoken[k + 'a'] = true;
    let phrase = text;
    if (then && (S.stepStart[i + 2] - nextStart) < 150) phrase += ', e depois, ' + lowerFirst(instruction(then));
    if (next.maneuver.type !== 'arrive') say(phrase);
  }
}

// ---------- Recalcular rota ----------
async function reroute() {
  if (!S.dest || !S.pos) return;
  S.rerouting = true;
  toast('Recalculando rota…');
  say('Recalculando rota');
  try {
    setRoute(await fetchRoute(S.pos, S.dest.coord));
    S.spoken[0] = true;
  } catch (e) {
    toast('Sem conexão para recalcular');
  }
  setTimeout(() => { S.rerouting = false; S.offCount = 0; }, 4000);
}

// ---------- Chegada ----------
function arrive() {
  if (!S.navigating) return;
  S.navigating = false;
  stopSim();
  say('Você chegou ao seu destino');
  $('arrivedName').textContent = S.dest ? S.dest.name : '';
  show('arrived');
}

export function initNavigation() {
  // Arrastar o mapa durante a navegação para de seguir o carro
  map.on('dragstart', () => {
    if (S.navigating) { S.following = false; show('recenter'); }
  });
  $('recenter').onclick = () => {
    S.following = true;
    show('recenter', false);
    follow(true);
  };
  $('stopBtn').onclick = stopNav;
  $('arrivedOk').onclick = () => {
    show('arrived', false);
    stopNav();
  };
}
