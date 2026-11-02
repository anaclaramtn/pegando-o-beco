// Atalhos para manipular a página

export const $ = id => document.getElementById(id);

/** Mostra (ou esconde, com visible=false) um elemento pelo id ou referência. */
export function show(el, visible = true) {
  const node = typeof el === 'string' ? $(el) : el;
  node.classList.toggle('hidden', !visible);
}

let toastTimer;
/** Mostra uma mensagem rápida no topo da tela. */
export function toast(message, ms = 2200) {
  $('toast').textContent = message;
  show('toast');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => show('toast', false), ms);
}
