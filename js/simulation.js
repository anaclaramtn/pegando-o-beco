// Modo simulação: o carro percorre a rota sozinho

import { S } from './state.js';
import { pointAt } from './route.js';
import { OFF_ROUTE_METERS } from './config.js';

/** Começa a simulação. `onPosition(point, speed, heading)` é chamado a cada segundo. */
export function startSim(onPosition) {
  stopSim();
  const offRoute = !S.pos || (S.lastProj && S.lastProj.d > OFF_ROUTE_METERS);
  S.simAlong = !offRoute && S.lastProj ? S.lastProj.along : 0;

  let last = performance.now();
  S.simTimer = setInterval(() => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    // Reduz a velocidade perto das manobras, para ficar mais realista
    const v = S.simSpeed / 3.6;
    const nextStart = S.steps[S.stepIdx + 1] ? S.stepStart[S.stepIdx + 1] : S.total;
    const speed = nextStart - S.simAlong < 60 ? Math.max(v * 0.45, 4) : v;

    S.simAlong = Math.min(S.total, S.simAlong + speed * dt);
    const p = pointAt(S.simAlong);
    onPosition(p.point, speed + (Math.random() - 0.5) * 0.6, p.bearing);
  }, 1000);
}

export function stopSim() {
  if (S.simTimer) {
    clearInterval(S.simTimer);
    S.simTimer = null;
  }
}
