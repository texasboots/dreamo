// Doors and windows that sit inside the holes in a wall. Built in the wall's own frame.
import * as THREE from 'three';
import { box, cyl, sph, group } from '../catalog/parts.js';
import { OPENINGS, WALL_T } from '../model.js';

export function openingMesh(o) {
  const d = OPENINGS[o.kind], w = d.w, h = d.h, fw = 0.06, dep = WALL_T + 0.06, F = 'color:#f7f5f0', parts = [];
  parts.push(box(fw, h, dep, F, -w / 2 + fw / 2, 0, 0), box(fw, h, dep, F, w / 2 - fw / 2, 0, 0), box(w, fw, dep, F, 0, h - fw, 0));
  const iw = w - 2 * fw, ih = h - fw;
  const handle = (x, y) => [-1, 1].map(s => [sph(0.035, 'metal', x, y, s * 0.06), cyl(0.012, 0.05, 'metal', x, y - 0.025, s * 0.04, 0.012, 6)]);
  if (o.kind === 'door') {
    const c = 'grain:' + (o.color || '#8a5a3a');
    parts.push(box(iw - 0.01, ih - 0.01, 0.05, c), [0.25, 1.15].map(y => box(iw - 0.3, 0.7, 0.062, c, 0, y, 0)), handle(iw / 2 - 0.1, 1.0));
  } else if (o.kind === 'doorDouble') {
    const c = 'grain:' + (o.color || '#8a5a3a');
    for (const s of [-1, 1]) parts.push(box(iw / 2 - 0.01, ih - 0.01, 0.05, c, s * iw / 4, 0, 0), box(iw / 2 - 0.2, 0.7, 0.062, c, s * iw / 4, 0.25, 0), box(iw / 2 - 0.2, 0.7, 0.062, c, s * iw / 4, 1.15, 0), handle(s * 0.09, 1.0));
  } else if (o.kind === 'slider') {
    const K = 'color:#2f3336';
    for (const s of [-1, 1]) parts.push(box(iw / 2, ih, 0.02, 'glass', s * iw / 4, 0, s * 0.02), box(0.04, ih, 0.04, K, s * 0.02, 0, s * 0.02), box(0.04, ih, 0.04, K, s * (iw / 2 - 0.02), 0, s * 0.02), box(iw / 2, 0.04, 0.04, K, s * iw / 4, 0, s * 0.02), box(iw / 2, 0.04, 0.04, K, s * iw / 4, ih - 0.04, s * 0.02));
  } else if (o.kind === 'garage') {
    const c = 'color:' + (o.color || '#e6e6e6');
    parts.push(box(iw, ih, 0.05, c), [1, 2, 3, 4].map(i => box(iw, 0.02, 0.06, 'color:#9a9a9a', 0, i * ih / 5, 0)), box(0.3, 0.03, 0.08, 'metal', 0, 0.5, 0));
  } else if (o.kind !== 'arch') {
    parts.push(box(w, fw, dep, F, 0, 0, 0), box(w + 0.1, 0.04, dep + 0.1, F, 0, -0.04, 0), box(iw, h - 2 * fw, 0.02, 'glass', 0, fw, 0));
    const bars = Math.max(0, Math.round(w / 1.0) - 1);
    for (let i = 1; i <= bars; i++) parts.push(box(0.04, h - 2 * fw, 0.05, F, -iw / 2 + i * iw / (bars + 1), fw, 0));
    if (h >= 1.2) parts.push(box(iw, 0.04, 0.05, F, 0, h * 0.55, 0));
  }
  const g = group(parts); g.position.set(o.t, d.sill, 0);
  return g;
}
