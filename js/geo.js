// Cálculos geográficos (coordenadas no formato [lon, lat])

export const toRad = d => d * Math.PI / 180;
export const toDeg = r => r * 180 / Math.PI;

/** Distância em metros entre dois pontos. */
export function distance(a, b) {
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Direção (0–360°) de a para b. */
export function bearing(a, b) {
  const y = Math.sin(toRad(b[0] - a[0])) * Math.cos(toRad(b[1]));
  const x = Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) -
    Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(toRad(b[0] - a[0]));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Comprimento em metros de uma linha. */
export function lineLength(coords) {
  let sum = 0;
  for (let i = 1; i < coords.length; i++) sum += distance(coords[i - 1], coords[i]);
  return sum;
}
