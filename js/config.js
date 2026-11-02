// Configurações gerais do app

export const APP_NAME = 'Pegando o Beco';

// Serviços externos
export const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const ROUTER_URL = 'https://router.project-osrm.org/route/v1/driving/';
export const GEOCODER_URL = 'https://photon.komoot.io/api/';
export const REVERSE_GEOCODER_URL = 'https://photon.komoot.io/reverse';

// Posição inicial do mapa antes do GPS responder (São Paulo)
export const FALLBACK_POSITION = [-46.6333, -23.5505];

// Distância (m) a partir da qual consideramos que o motorista saiu da rota
export const OFF_ROUTE_METERS = 45;

// Distância (m) restante para considerar que chegou ao destino
export const ARRIVAL_METERS = 25;

// Chaves de armazenamento local
export const STORAGE_KEY = 'beco-opts';
export const LEGACY_STORAGE_KEY = 'rumo-opts';
