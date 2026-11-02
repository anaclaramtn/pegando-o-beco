// Leitura contínua do GPS

import { S } from './state.js';
import { toast, $ } from './dom.js';
import { distance, bearing } from './geo.js';
import { map, viewFromAbove } from './mapView.js';
import { updatePosition } from './navigation.js';

let onDenied = () => {};
let firstFix = true;

/** Define o que fazer quando a permissão de localização é negada. */
export function setOnPermissionDenied(handler) {
  onDenied = handler;
}

/** Trata uma leitura do GPS. */
export function handlePosition(p) {
  if (S.sim && S.navigating) return; // na simulação, quem move o carro é ela
  const coord = [p.coords.longitude, p.coords.latitude];
  const speed = p.coords.speed != null && !isNaN(p.coords.speed) ? p.coords.speed : null;

  // Sem bússola: estima a direção pelo deslocamento
  let heading = p.coords.heading;
  if ((heading == null || isNaN(heading)) && S.pos && distance(S.pos, coord) > 3) heading = bearing(S.pos, coord);

  updatePosition(coord, speed, heading);

  if (firstFix) {
    firstFix = false;
    if (!S.navigating && !S.dest) map.jumpTo({ center: coord, zoom: 15.5 });
  }
}

export function startGPS() {
  if (!('geolocation' in navigator)) { toast('GPS não disponível neste aparelho'); return; }
  if (S.watchId !== null) return;
  S.watchId = navigator.geolocation.watchPosition(handlePosition, err => {
    if (err.code === err.PERMISSION_DENIED) { stopGPS(); onDenied(); }
    else toast('Procurando sinal de GPS…');
  }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
}

export function stopGPS() {
  if (S.watchId === null) return;
  navigator.geolocation.clearWatch(S.watchId);
  S.watchId = null;
}

/** Botão "minha localização". */
export function initLocateButton() {
  $('locateBtn').onclick = () => {
    if (S.pos) viewFromAbove(S.pos, 16);
    else { startGPS(); toast('Procurando sua localização…'); }
  };
}
