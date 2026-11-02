// Textos e ícones das manobras (curvas, rotatórias etc.)

import { toRad } from './geo.js';

const SIDE = {
  left: 'à esquerda',
  right: 'à direita',
  'slight left': 'à esquerda',
  'slight right': 'à direita',
  'sharp left': 'à esquerda',
  'sharp right': 'à direita',
};

const ARROW_ANGLE = {
  straight: 0,
  'slight right': 40,
  right: 90,
  'sharp right': 135,
  'slight left': -40,
  left: -90,
  'sharp left': -135,
};

const ROUNDABOUT_TYPES = ['roundabout', 'rotary', 'roundabout turn', 'exit roundabout', 'exit rotary'];

const streetOf = step => step.name || step.ref || '';

/** Instrução em português para uma manobra do OSRM. */
export function instruction(step) {
  const m = step.maneuver;
  const mod = m.modifier || '';
  const st = streetOf(step);
  const na = st ? ' na ' + st : '';
  const pela = st ? ' pela ' + st : '';
  const side = SIDE[mod] || '';

  const turnVerb = () => {
    if (mod === 'uturn') return 'Faça o retorno';
    if (mod === 'straight' || !mod) return 'Siga em frente';
    if (mod.startsWith('slight')) return 'Mantenha-se ' + side;
    if (mod.startsWith('sharp')) return 'Vire acentuadamente ' + side;
    return 'Vire ' + side;
  };

  switch (m.type) {
    case 'depart': return st ? 'Siga' + pela : 'Siga em frente';
    case 'arrive': return 'Você chegou ao destino';
    case 'turn': return turnVerb() + na;
    case 'continue': return mod && mod !== 'straight' ? turnVerb() + na : 'Continue' + (pela || ' em frente');
    case 'new name': return 'Continue' + (pela || ' em frente');
    case 'merge': return 'Entre' + (side ? ' ' + side : '') + (st ? ' na ' + st : ' na via');
    case 'on ramp': return 'Pegue o acesso' + (side ? ' ' + side : '') + (st ? ' para ' + st : '');
    case 'off ramp': return 'Pegue a saída' + (side ? ' ' + side : '') + (st ? ' para ' + st : '');
    case 'fork': return 'Na bifurcação, mantenha-se ' + (side || 'em frente') + na;
    case 'end of road': return 'No fim da via, vire ' + (side || '') + na;
    case 'roundabout':
    case 'rotary': return 'Na rotatória, pegue a ' + (m.exit || 1) + 'ª saída' + (st ? ' para ' + st : '');
    case 'roundabout turn': return 'Na rotatória, ' + turnVerb().toLowerCase() + na;
    case 'exit roundabout':
    case 'exit rotary': return 'Saia da rotatória' + (st ? ' para ' + st : '');
    default: return turnVerb() + na;
  }
}

/** Ícone SVG da manobra. */
export function maneuverIcon(step, color = '#fff') {
  const m = step.maneuver;
  const mod = m.modifier || 'straight';

  if (m.type === 'arrive') {
    return `<svg viewBox="0 0 48 48"><path d="M24 4c-7.7 0-14 6.1-14 13.7C10 28 24 44 24 44s14-16 14-26.3C38 10.1 31.7 4 24 4z" fill="${color}"/><circle cx="24" cy="18" r="5.5" fill="#0f1b3d"/></svg>`;
  }

  if (ROUNDABOUT_TYPES.includes(m.type)) {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="22" r="8"/><path d="M24 30v14"/><path d="M30 16l8-8M31 8h7v7"/><text x="24" y="26.5" text-anchor="middle" font-size="11" font-weight="800" fill="${color}" stroke="none" font-family="Arial">${m.exit || ''}</text></svg>`;
  }

  if (mod === 'uturn') {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 44V18a9 9 0 0 0-18 0v14"/><path d="M7 25l7 8 7-8"/></svg>`;
  }

  // Seta: haste saindo de baixo, dobra no centro, ponta na direção da manobra
  const cx = 24, cy = 22, len = 14, head = 8;
  const a = toRad(ARROW_ANGLE[mod] ?? 0);
  const ex = cx + len * Math.sin(a);
  const ey = cy - len * Math.cos(a);
  const a1 = a + toRad(150), a2 = a - toRad(150);
  const p1 = [ex + head * Math.sin(a1), ey - head * Math.cos(a1)];
  const p2 = [ex + head * Math.sin(a2), ey - head * Math.cos(a2)];
  const f = n => n.toFixed(1);
  return `<svg viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M${cx} 44V${cy} L${f(ex)} ${f(ey)}"/><path d="M${f(p1[0])} ${f(p1[1])} L${f(ex)} ${f(ey)} L${f(p2[0])} ${f(p2[1])}"/></svg>`;
}
