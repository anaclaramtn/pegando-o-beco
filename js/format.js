// Formatação de distâncias e horários em português

/** Distância para exibir na tela: "150 m", "2,3 km". */
export function formatDistance(m) {
  if (m < 1000) {
    const r = m < 100 ? Math.max(10, Math.round(m / 10) * 10) : Math.round(m / 50) * 50;
    return r + ' m';
  }
  return (m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',') + ' km';
}

/** Distância para ser falada: "150 metros", "2,3 quilômetros". */
export function formatDistanceSpeech(m) {
  if (m < 1000) {
    const r = m < 100 ? Math.round(m / 10) * 10 : Math.round(m / 50) * 50;
    return r + ' metros';
  }
  const km = m / 1000;
  const value = km < 10 ? km.toFixed(1).replace('.', ',').replace(',0', '') : Math.round(km);
  return value + ' quilômetros';
}

/** Duração: "12 min", "1 h 05". */
export function formatDuration(seconds) {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return h + ' h' + (rest ? ' ' + String(rest).padStart(2, '0') : '');
}

/** Horário daqui a N segundos: "14:35". */
export function formatClock(secondsFromNow) {
  const d = new Date(Date.now() + secondsFromNow * 1000);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Deixa a primeira letra minúscula (para juntar frases). */
export const lowerFirst = text => text.charAt(0).toLowerCase() + text.slice(1);
