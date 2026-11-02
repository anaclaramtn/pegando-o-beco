// Comunicação com os serviços de rotas e de busca de endereços

import { ROUTER_URL, GEOCODER_URL, REVERSE_GEOCODER_URL } from './config.js';

/** Calcula a rota de carro entre dois pontos. */
export async function fetchRoute(from, to) {
  const url = `${ROUTER_URL}${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson&steps=true&alternatives=false`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code !== 'Ok' || !json.routes || !json.routes.length) throw new Error(json.message || 'Sem rota');
  return json.routes[0];
}

/** Converte um resultado do Photon em { name, addr, coord }. */
function toPlace(feature) {
  const p = feature.properties || {};
  const street = [p.street, p.housenumber].filter(Boolean).join(', ');
  const name = p.name || street || p.city || 'Local';
  const parts = [];
  if (p.name && street) parts.push(street);
  if (p.district && p.district !== name) parts.push(p.district);
  if (p.city && p.city !== name) parts.push(p.city);
  if (p.state) parts.push(p.state);
  return { name, addr: parts.join(' · '), coord: feature.geometry.coordinates };
}

/** Busca lugares pelo texto, priorizando os próximos de `near`. */
export async function searchPlaces(query, near) {
  const url = `${GEOCODER_URL}?q=${encodeURIComponent(query)}&limit=7&lat=${near[1]}&lon=${near[0]}&location_bias_scale=0.4`;
  const res = await fetch(url);
  const json = await res.json();
  return (json.features || []).map(toPlace);
}

/** Descobre o endereço de uma coordenada (ou null). */
export async function reverseGeocode(coord) {
  const res = await fetch(`${REVERSE_GEOCODER_URL}?lon=${coord[0]}&lat=${coord[1]}`);
  const json = await res.json();
  return json.features && json.features[0] ? toPlace(json.features[0]) : null;
}
