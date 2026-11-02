// Barra de busca de destinos

import { S } from './state.js';
import { $, show } from './dom.js';
import { searchPlaces } from './api.js';
import { distance } from './geo.js';
import { formatDistance } from './format.js';
import { map } from './mapView.js';

const PIN_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#1e9be0"><path d="M12 2C8 2 5 5 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`;

let input;
let debounceTimer = null;
let searchSeq = 0;
let onSelect = () => {};

function showMessage(text) {
  $('results').innerHTML = `<div class="res msg">${text}</div>`;
  show('results');
}

function renderResult(place) {
  const el = document.createElement('div');
  el.className = 'res';
  el.innerHTML = `<div class="pin">${PIN_ICON}</div><div class="resText"><b></b><small></small></div><small class="resDist"></small>`;
  el.querySelector('b').textContent = place.name;
  el.querySelector('.resText small').textContent = place.addr;
  el.querySelector('.resDist').textContent = S.pos ? formatDistance(distance(S.pos, place.coord)) : '';
  el.onclick = () => {
    input.blur();
    show('results', false);
    onSelect(place);
  };
  return el;
}

async function search(query) {
  const seq = ++searchSeq;
  showMessage('Buscando…');
  const center = S.pos || [map.getCenter().lng, map.getCenter().lat];
  try {
    const places = await searchPlaces(query, center);
    if (seq !== searchSeq) return; // chegou uma busca mais nova
    if (!places.length) { showMessage('Nenhum resultado'); return; }
    const box = $('results');
    box.innerHTML = '';
    places.forEach(p => box.appendChild(renderResult(p)));
  } catch (e) {
    if (seq === searchSeq) showMessage('Sem conexão para buscar');
  }
}

/** Limpa o campo de busca. */
export function resetSearch() {
  input.value = '';
  show('clearBtn', false);
}

/** Liga a barra de busca. `handleSelect(place)` é chamado ao escolher um resultado. */
export function initSearch(handleSelect) {
  onSelect = handleSelect;
  input = $('searchInput');

  input.addEventListener('input', () => {
    show('clearBtn', !!input.value);
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 3) { show('results', false); return; }
    debounceTimer = setTimeout(() => search(q), 350);
  });

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q) search(q);
    input.blur();
  });

  input.addEventListener('focus', () => {
    if ($('results').children.length && input.value.trim().length >= 3) show('results');
  });

  $('clearBtn').onclick = () => {
    resetSearch();
    show('results', false);
    input.focus();
  };
}
