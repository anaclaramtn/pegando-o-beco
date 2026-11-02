// Ponto de entrada: liga todas as partes do app

import { S } from './state.js';
import { map, onLongPress } from './mapView.js';
import { initSearch } from './search.js';
import { initPreview, selectDest, pickPoint } from './preview.js';
import { initNavigation, startNav } from './navigation.js';
import { initOptions } from './options.js';
import { initLocateButton } from './gps.js';
import { initSplash } from './splash.js';

initSearch(selectDest);
initPreview({ onGo: startNav });
initNavigation();
initOptions();
initLocateButton();
onLongPress(pickPoint);
initSplash();

// Cache para funcionar com sinal fraco
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Acesso pelo console do navegador, para depuração
window.__beco = S;
window.__becoMap = map;
