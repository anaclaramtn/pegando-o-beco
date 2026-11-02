// Geometria da rota: preparação, projeção da posição e pontos ao longo do caminho

import { S } from './state.js';
import { distance, bearing, lineLength, toRad } from './geo.js';
import { drawRoute } from './mapView.js';

/** Guarda a rota no estado, pré-calcula distâncias e desenha no mapa. */
export function setRoute(route) {
  S.route = route;
  S.coords = route.geometry.coordinates;

  S.cum = [0];
  S.segLen = [];
  for (let i = 0; i < S.coords.length - 1; i++) {
    const len = distance(S.coords[i], S.coords[i + 1]);
    S.segLen.push(len);
    S.cum.push(S.cum[i] + len);
  }
  S.total = S.cum[S.cum.length - 1];

  // Início de cada manobra, ajustado à geometria geral da rota
  S.steps = route.legs[0].steps;
  let acc = 0;
  const starts = S.steps.map(st => { const s = acc; acc += lineLength(st.geometry.coordinates); return s; });
  const scale = S.total / (acc || 1);
  S.stepStart = starts.map(v => v * scale);

  S.stepIdx = 0;
  S.spoken = {};
  S.offCount = 0;
  drawRoute(route.geometry);
}

/** Limpa a rota do estado. */
export function clearRouteState() {
  S.dest = null;
  S.route = null;
  S.coords = [];
}

/**
 * Encontra o ponto da rota mais próximo de `p`.
 * Retorna { d (distância até a rota), i (trecho), point, along (metros percorridos), bearing }.
 */
export function projectOnRoute(p) {
  const c = S.coords;
  if (c.length < 2) return null;
  const kx = Math.cos(toRad(p[1])) * 111320;
  const ky = 110540;
  let best = { d: Infinity, i: 0, t: 0 };

  for (let i = 0; i < c.length - 1; i++) {
    const ax = (c[i][0] - p[0]) * kx, ay = (c[i][1] - p[1]) * ky;
    const bx = (c[i + 1][0] - p[0]) * kx, by = (c[i + 1][1] - p[1]) * ky;
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 ? -(ax * dx + ay * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best.d) best = { d, i, t };
  }

  const a = c[best.i], b = c[best.i + 1];
  best.point = [a[0] + (b[0] - a[0]) * best.t, a[1] + (b[1] - a[1]) * best.t];
  best.along = S.cum[best.i] + S.segLen[best.i] * best.t;
  best.bearing = bearing(a, b);
  return best;
}

/** Ponto e direção da rota a `along` metros do início. */
export function pointAt(along) {
  const c = S.coords;
  if (!c.length) return null;
  if (along <= 0) return { point: c[0], bearing: bearing(c[0], c[1] || c[0]) };

  for (let i = 0; i < c.length - 1; i++) {
    if (S.cum[i + 1] >= along) {
      const t = S.segLen[i] ? (along - S.cum[i]) / S.segLen[i] : 0;
      return {
        point: [c[i][0] + (c[i + 1][0] - c[i][0]) * t, c[i][1] + (c[i + 1][1] - c[i][1]) * t],
        bearing: bearing(c[i], c[i + 1]),
      };
    }
  }
  const n = c.length;
  return { point: c[n - 1], bearing: bearing(c[n - 2], c[n - 1]) };
}
