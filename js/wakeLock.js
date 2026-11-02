// Mantém a tela ligada durante a navegação

import { S } from './state.js';

export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) S.wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { /* não suportado ou recusado */ }
}

export function releaseWakeLock() {
  try { if (S.wakeLock) S.wakeLock.release(); } catch (e) { /* ignora */ }
  S.wakeLock = null;
}

// O navegador solta a trava quando o app vai para o fundo; pede de novo ao voltar
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S.navigating) requestWakeLock();
});
