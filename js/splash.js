// Tela inicial: exige o app instalado na tela inicial e pede a permissão
// de localização antes de liberar o mapa

import { S } from './state.js';
import { $, show, toast } from './dom.js';
import { startGPS, stopGPS, handlePosition, setOnPermissionDenied } from './gps.js';
import { stopNav } from './navigation.js';
import { IS_IOS, isInstalled, watchInstall, promptInstall } from './platform.js';

/**
 * Estados da tela inicial:
 * 'install' | 'loading' | 'ask' | 'denied' | 'unsupported' | 'done' (tela some e o mapa é liberado)
 */
function setState(state) {
  const splash = $('splash');
  show('spInstall', state === 'install');
  show('spLoading', state === 'loading');
  show('spAsk', state === 'ask');
  show('spDenied', state === 'denied' || state === 'unsupported');

  if (state === 'unsupported') {
    $('spDeniedText').textContent = 'Este aparelho ou navegador não oferece localização. O Pegando o Beco só funciona com acesso à localização.';
    show('spRetry', false);
    show('spDeniedHelp', false);
  }

  if (state === 'done') {
    document.body.classList.remove('locked');
    splash.classList.add('out');
    setTimeout(() => show(splash, false), 500);
  } else {
    document.body.classList.add('locked');
    show(splash);
    splash.classList.remove('out');
  }
}

const isLocked = () => document.body.classList.contains('locked');

/** Bloqueia o app quando a permissão é retirada. */
function lockDenied() {
  stopGPS();
  if (S.navigating) stopNav();
  setState('denied');
}

/** Pede a localização ao navegador. */
function requestLocation() {
  $('spLoadingText').textContent = 'Obtendo sua localização…';
  setState('loading');
  navigator.geolocation.getCurrentPosition(pos => {
    handlePosition(pos);
    setState('done');
    startGPS();
  }, err => {
    if (err.code === err.PERMISSION_DENIED) {
      setState('denied');
    } else {
      // Permissão dada, mas ainda sem sinal: libera o app e continua procurando
      setState('done');
      startGPS();
      toast('Procurando sinal de GPS…', 3000);
    }
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
}

/** Etapa 1: o app só abre se tiver sido aberto pelo ícone da tela inicial. */
function showInstallScreen() {
  show('installIOS', IS_IOS);
  show('installAndroid', !IS_IOS);
  setState('install');

  // Android/Chrome: botão que abre o pedido de instalação do próprio navegador
  watchInstall({
    available: () => show('spInstallBtn'),
    installed: () => {
      show('spInstallBtn', false);
      show('installAndroid', false);
      $('spInstallText').textContent = 'Pronto! Agora feche esta página e abra o Pegando o Beco pelo ícone na tela inicial.';
    },
  });
  $('spInstallBtn').onclick = async () => {
    if (!(await promptInstall())) show('spInstallBtn', false);
  };
}

/** Etapa 2: verifica a permissão de localização e mostra a tela certa. */
async function checkLocation() {
  if (!('geolocation' in navigator)) { setState('unsupported'); return; }

  let status = null;
  try {
    const perm = await navigator.permissions.query({ name: 'geolocation' });
    status = perm.state;
    perm.onchange = () => {
      if (perm.state === 'granted' && isLocked()) requestLocation();
      if (perm.state === 'denied') lockDenied();
    };
  } catch (e) { /* navegador sem Permissions API (ex.: Safari antigo) */ }

  if (status === 'granted') requestLocation();
  else if (status === 'denied') setState('denied');
  else setState('ask');
}

export function initSplash() {
  show('helpIOS', IS_IOS);
  show('helpAndroid', !IS_IOS);
  $('spAllow').onclick = requestLocation;
  $('spRetry').onclick = requestLocation;
  setOnPermissionDenied(lockDenied);

  if (isInstalled()) checkLocation();
  else showInstallScreen();
}
