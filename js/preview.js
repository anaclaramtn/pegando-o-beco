// Prévia da rota: escolha do destino, tempo, distância e horário de chegada

import { S } from './state.js';
import { $, show, toast } from './dom.js';
import { fetchRoute, reverseGeocode } from './api.js';
import { setRoute, clearRouteState } from './route.js';
import { formatDistance, formatDuration, formatClock } from './format.js';
import { map, showDestination, hideDestination, clearRoute, fitRoute, viewFromAbove } from './mapView.js';

let waitingFor = null;

function setTimeText(text, small = false) {
  $('pvTime').textContent = text;
  $('pvTime').classList.toggle('small', small);
}

/** Espera o GPS dar a primeira posição e então chama `callback`. */
function whenPositionReady(callback) {
  waitingFor = callback;
  const iv = setInterval(() => {
    if (!S.pos) return;
    clearInterval(iv);
    if (waitingFor === callback) callback();
  }, 700);
}

/** Define o destino, calcula a rota e mostra a prévia. */
export async function selectDest(dest) {
  S.dest = dest;
  showDestination(dest.coord);
  $('pvDest').textContent = dest.name;
  $('pvAddr').textContent = dest.addr || '';
  setTimeText('…');
  $('pvDist').textContent = '';
  $('pvArrive').textContent = '';
  show('preview');
  show('locateBtn', false);

  if (!S.pos && !S.sim) {
    setTimeText('Aguardando GPS', true);
    map.flyTo({ center: dest.coord, zoom: 15 });
    whenPositionReady(() => selectDest(dest));
    return;
  }

  const from = S.pos || [map.getCenter().lng, map.getCenter().lat];
  try {
    const route = await fetchRoute(from, dest.coord);
    if (S.dest !== dest) return; // usuário trocou de destino nesse meio tempo
    setRoute(route);
    setTimeText(formatDuration(route.duration));
    $('pvDist').textContent = formatDistance(route.distance);
    $('pvArrive').textContent = 'Chegada ' + formatClock(route.duration);
    fitRoute(S.coords);
  } catch (e) {
    setTimeText('Rota indisponível', true);
    toast('Não foi possível calcular a rota');
  }
}

/** Usa um ponto tocado no mapa como destino. */
export async function pickPoint(lngLat) {
  const coord = [lngLat.lng, lngLat.lat];
  let place = { coord, name: 'Ponto no mapa', addr: coord[1].toFixed(5) + ', ' + coord[0].toFixed(5) };
  try {
    const found = await reverseGeocode(coord);
    if (found) place = { coord, name: found.name, addr: found.addr };
  } catch (e) { /* mantém as coordenadas */ }
  selectDest(place);
}

/** Fecha a prévia e apaga a rota. */
export function cancelPreview() {
  clearRouteState();
  waitingFor = null;
  hideDestination();
  show('preview', false);
  show('locateBtn');
  clearRoute();
  if (S.pos) viewFromAbove(S.pos);
}

export function initPreview({ onGo }) {
  $('pvCancel').onclick = cancelPreview;
  $('pvGo').onclick = onGo;
}
