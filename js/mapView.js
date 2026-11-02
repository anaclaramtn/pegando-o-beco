// Mapa, marcadores e desenho da rota

import { STYLE_URL, FALLBACK_POSITION, OFF_ROUTE_METERS } from './config.js';
import { S } from './state.js';

const EMPTY = { type: 'FeatureCollection', features: [] };

export const map = new maplibregl.Map({
  container: 'map',
  style: STYLE_URL,
  center: FALLBACK_POSITION,
  zoom: 13,
  attributionControl: { compact: true },
  pitchWithRotate: true,
  dragRotate: true,
});

// ---------- Marcador do carro ----------
const carEl = document.createElement('div');
carEl.className = 'car';
carEl.innerHTML = `<svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#fff"/><circle cx="22" cy="22" r="17" fill="#1e9be0"/><path d="M22 9l9 22-9-5-9 5z" fill="#fff"/></svg>`;
const carMarker = new maplibregl.Marker({ element: carEl, rotationAlignment: 'map', pitchAlignment: 'map' })
  .setLngLat(FALLBACK_POSITION);
let carAdded = false;

export function placeCar(lngLat, heading) {
  carMarker.setLngLat(lngLat).setRotation(heading);
  if (!carAdded) { carMarker.addTo(map); carAdded = true; }
}

// ---------- Marcador do destino ----------
const destEl = document.createElement('div');
destEl.className = 'destPin';
destEl.innerHTML = `<svg width="40" height="40" viewBox="0 0 48 48"><path d="M24 2C15 2 8 9 8 17.8 8 30 24 46 24 46s16-16 16-28.2C40 9 33 2 24 2z" fill="#ff5a5f" stroke="#fff" stroke-width="2.5"/><circle cx="24" cy="18" r="6" fill="#fff"/></svg>`;
const destMarker = new maplibregl.Marker({ element: destEl, anchor: 'bottom' });

export const showDestination = coord => destMarker.setLngLat(coord).addTo(map);
export const hideDestination = () => destMarker.remove();

// ---------- Camadas da rota ----------
function lineWidth(z10, z16, z19) {
  return ['interpolate', ['linear'], ['zoom'], 10, z10, 16, z16, 19, z19];
}

function ensureLayers() {
  if (map.getSource('route')) return;
  map.addSource('route', { type: 'geojson', data: EMPTY });
  map.addSource('done', { type: 'geojson', data: EMPTY });
  const layout = { 'line-cap': 'round', 'line-join': 'round' };
  map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout, paint: { 'line-color': '#0b6aa8', 'line-width': lineWidth(6, 16, 26) } });
  map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout, paint: { 'line-color': '#33c3ff', 'line-width': lineWidth(4, 11, 19) } });
  map.addLayer({ id: 'done-line', type: 'line', source: 'done', layout, paint: { 'line-color': '#a9b4c7', 'line-width': lineWidth(4, 11, 19) } });
}
map.on('load', ensureLayers);
map.on('styledata', () => { if (map.isStyleLoaded()) ensureLayers(); });

/** Desenha a rota inteira (azul). */
export function drawRoute(geometry) {
  ensureLayers();
  map.getSource('route').setData({ type: 'Feature', geometry });
  map.getSource('done').setData(EMPTY);
}

/** Pinta de cinza o trecho já percorrido. */
export function drawDriven(coords) {
  if (coords.length > 1 && map.getSource('done')) {
    map.getSource('done').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
  }
}

export function clearRoute() {
  if (!map.getSource('route')) return;
  map.getSource('route').setData(EMPTY);
  map.getSource('done').setData(EMPTY);
}

// ---------- Câmera ----------
export function fitRoute(coords) {
  const bounds = new maplibregl.LngLatBounds();
  coords.forEach(c => bounds.extend(c));
  map.fitBounds(bounds, { padding: { top: 110, bottom: 260, left: 50, right: 50 }, pitch: 0, bearing: 0, duration: 900 });
}

/** Câmera de navegação: acompanha o carro, inclinada e girada na direção do movimento. */
export function follow(force) {
  if (!S.following && !force) return;
  const onRoute = S.lastProj && S.lastProj.d < OFF_ROUTE_METERS;
  const target = onRoute ? S.lastProj.point : S.pos;
  if (!target) return;
  const zoom = S.speed > 22 ? 15.8 : S.speed > 12 ? 16.4 : 17;
  map.easeTo({
    center: target,
    bearing: S.heading,
    pitch: 55,
    zoom,
    offset: [0, window.innerHeight * 0.2],
    duration: force ? 800 : 950,
    easing: t => t,
  });
}

/** Visão normal (de cima) centrada em um ponto. */
export function viewFromAbove(center, zoom = 15.5) {
  map.easeTo({ center, zoom, pitch: 0, bearing: 0 });
}

// ---------- Toque longo no mapa ----------
export function onLongPress(callback) {
  let timer = null;
  let start = null;
  map.on('touchstart', e => {
    if (S.navigating || e.originalEvent.touches.length > 1) return;
    start = e.point;
    clearTimeout(timer);
    timer = setTimeout(() => callback(e.lngLat), 650);
  });
  map.on('touchmove', e => {
    if (start && Math.hypot(e.point.x - start.x, e.point.y - start.y) > 10) clearTimeout(timer);
  });
  map.on('touchend', () => clearTimeout(timer));
  map.on('contextmenu', e => { if (!S.navigating) callback(e.lngLat); }); // clique direito no computador
}
