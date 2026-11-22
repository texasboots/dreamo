// Turns one wall (two end points plus doors and windows) into a 3D shape.
// Local frame: x runs along the wall from a to b, y is up, +z is the wall's "left" side.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WALL_T, OPENINGS } from '../model.js';

const H2 = WALL_T / 2;
const key = p => Math.round(p[0] * 1000) + ',' + Math.round(p[1] * 1000);
export const wallLen = w => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);

// Works out how each wall end should be trimmed so corners meet cleanly.
export function computeJoins(walls) {
  const verts = new Map(), out = new Map();
  for (const w of walls) {
    const L = wallLen(w); if (L < 1e-3) continue;
    const ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
    out.set(w.id, { L, la: 0, ra: 0, lb: L, rb: L, capA: true, capB: true });
    for (const [p, end, ang] of [[w.a, 'a', Math.atan2(uz, ux)], [w.b, 'b', Math.atan2(-uz, -ux)]]) {
      const k = key(p); if (!verts.has(k)) verts.set(k, []); verts.get(k).push({ w, end, ang });
    }
  }
  const lim = H2 * 3, off = th => Math.max(-lim, Math.min(lim, H2 / Math.tan(th / 2)));
  const norm = a => { a %= Math.PI * 2; return a <= 1e-6 ? a + Math.PI * 2 : a; };
  for (const list of verts.values()) {
    if (list.length < 2) continue;
    list.sort((p, q) => p.ang - q.ang);
    list.forEach((cur, i) => {
      const next = list[(i + 1) % list.length], prev = list[(i - 1 + list.length) % list.length];
      const sL = off(norm(next.ang - cur.ang)), sR = off(norm(cur.ang - prev.ang)), j = out.get(cur.w.id);
      if (cur.end === 'a') { j.la = sL; j.ra = sR; j.capA = false; } else { j.rb = j.L - sL; j.lb = j.L - sR; j.capB = false; }
    });
  }
  return out;
}

export function wallOpenings(w, L) {
  const list = (w.openings || []).map(o => { const d = OPENINGS[o.kind]; return { o, x0: o.t - d.w / 2, x1: o.t + d.w / 2, y0: d.sill, y1: d.sill + d.h }; })
    .filter(o => o.x0 >= 0.05 && o.x1 <= L - 0.05).sort((a, b) => a.x0 - b.x0);
  return list.filter((o, i) => i === 0 || o.x0 >= list[i - 1].x1 - 1e-6);
}

function quads() {
  const pos = [], nor = [], uv = [];
  return {
    add(a, b, c, d, n) {
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const tri = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] >= 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
      for (const p of tri) { pos.push(...p); nor.push(...n); uv.push(0, 0); }
    },
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      return g;
    },
    get empty() { return pos.length === 0; },
  };
}

// A flat polygon lying in the ground plane at height y. pts are [x, z].
export function flatPoly(pts, y = 0, up = true, holes = []) {
  const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], up ? -p[1] : p[1])));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], up ? -p[1] : p[1]))));
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(up ? -Math.PI / 2 : Math.PI / 2); g.translate(0, y, 0);
  return g;
}
// A slab: the polygon given thickness, sitting between y and y + depth.
export function slabGeo(pts, y, depth, holes = []) {
  const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], -p[1])));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], -p[1]))));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  return g;
}

function face(side, xs, xe, H, doors, wins) {
  const m = side === 0 ? 1 : -1, P = (x, y) => new THREE.Vector2(x * m, y), pts = [P(xs, 0)];
  for (const d of doors) pts.push(P(d.x0, 0), P(d.x0, d.y1), P(d.x1, d.y1), P(d.x1, 0));
  pts.push(P(xe, 0), P(xe, H), P(xs, H));
  const s = new THREE.Shape(pts);
  for (const w of wins) s.holes.push(new THREE.Path([P(w.x0, w.y0), P(w.x1, w.y0), P(w.x1, w.y1), P(w.x0, w.y1)]));
  const g = new THREE.ShapeGeometry(s);
  if (side === 1) g.rotateY(Math.PI);
  g.translate(0, 0, side === 0 ? H2 : -H2);
  return g.toNonIndexed();
}

// low = a knee-high cutaway wall, with gaps where the doors are.
export function wallGeometry(w, j, H, low) {
  const L = j.L, ops = wallOpenings(w, L);
  const doors = ops.filter(o => o.y0 < 0.001), wins = low ? [] : ops.filter(o => o.y0 >= 0.001);
  const left = [], right = [], tops = [], q = quads();
  const cap = (x, dir) => q.add([x, 0, -H2], [x, 0, H2], [x, H, H2], [x, H, -H2], [dir, 0, 0]);
  if (low) {
    const stops = [{ l: j.la, r: j.ra, end: true, x: 0 }];
    for (const d of doors) stops.push({ l: d.x0, r: d.x0, x: d.x0 }, { l: d.x1, r: d.x1, x: d.x1 });
    stops.push({ l: j.lb, r: j.rb, end: true, x: L });
    for (let i = 0; i + 1 < stops.length; i += 2) {
      const s = stops[i], e = stops[i + 1];
      if (e.l - s.l < 0.02 || e.r - s.r < 0.02) continue;
      left.push(face(0, s.l, e.l, H, [], [])); right.push(face(1, s.r, e.r, H, [], []));
      const top = [[s.l, H2], [e.l, H2]]; if (e.end) top.push([L, 0]); top.push([e.r, -H2], [s.r, -H2]); if (s.end) top.push([0, 0]);
      tops.push(flatPoly(top, H).toNonIndexed());
      if (!s.end) cap(s.x, -1); if (!e.end) cap(e.x, 1);
    }
  } else {
    left.push(face(0, j.la, j.lb, H, doors, wins)); right.push(face(1, j.ra, j.rb, H, doors, wins));
    tops.push(flatPoly([[j.la, H2], [j.lb, H2], [L, 0], [j.rb, -H2], [j.ra, -H2], [0, 0]], H).toNonIndexed());
    for (const o of ops) {
      q.add([o.x0, o.y0, -H2], [o.x0, o.y0, H2], [o.x0, o.y1, H2], [o.x0, o.y1, -H2], [1, 0, 0]);
      q.add([o.x1, o.y0, -H2], [o.x1, o.y0, H2], [o.x1, o.y1, H2], [o.x1, o.y1, -H2], [-1, 0, 0]);
      q.add([o.x0, o.y1, -H2], [o.x1, o.y1, -H2], [o.x1, o.y1, H2], [o.x0, o.y1, H2], [0, -1, 0]);
      if (o.y0 > 0.001) q.add([o.x0, o.y0, -H2], [o.x1, o.y0, -H2], [o.x1, o.y0, H2], [o.x0, o.y0, H2], [0, 1, 0]);
    }
  }
  if (j.capA) cap(Math.min(j.la, j.ra), -1);
  if (j.capB) cap(Math.max(j.lb, j.rb), 1);
  if (!left.length) return null;
  const trim = q.empty ? tops : [...tops, q.geo()];
  const parts = [mergeGeometries(left), mergeGeometries(right), mergeGeometries(trim)];
  const g = mergeGeometries(parts, true);
  parts.forEach(p => p.dispose());
  return g;
}

// Where a wall sits in the world.
export function placeWall(obj, w, y = 0) {
  const L = wallLen(w), ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
  obj.position.set(w.a[0], y, w.a[1]); obj.rotation.y = Math.atan2(-uz, ux);
}
