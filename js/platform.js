// Detecção do aparelho e da instalação na tela inicial

/** iPhone, iPod ou iPad (iPads novos se identificam como Mac com tela de toque). */
export const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** true quando o app foi aberto pelo ícone da tela inicial. */
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true;
}

// No Android/Chrome o navegador oferece um pedido de instalação que podemos disparar por um botão
let installPrompt = null;
let onInstallAvailable = () => {};
let onInstalled = () => {};

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  onInstallAvailable();
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  onInstalled();
});

/** Registra o que fazer quando a instalação fica disponível e quando termina. */
export function watchInstall({ available, installed }) {
  onInstallAvailable = available;
  onInstalled = installed;
  if (installPrompt) available();
}

/** Abre o pedido de instalação do navegador (só Android/Chrome). */
export async function promptInstall() {
  if (!installPrompt) return false;
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  installPrompt = null;
  return outcome === 'accepted';
}
