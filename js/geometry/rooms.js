// Finds the rooms that a set of walls encloses. Pure maths: no 3D, easy to test.
const cross = (ax, ay, bx, by) => ax * by - ay * bx;
const key = p => Math.round(p[0] * 1000) + ',' + Math.round(p[1] * 1000);
const clamp01 = t => Math.max(0, Math.min(1, t));

export function pointInPoly(x, z, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
export function polyArea(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; }
  return a / 2;
}
export const inRoom = (room, x, z) => pointInPoly(x, z, room.poly) && !room.holes.some(h => pointInPoly(x, z, h));
export const roomAt = (rooms, x, z) => rooms.findIndex(r => inRoom(r, x, z));

// Drop points that sit on a straight line between their neighbours.
export function simplify(poly) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[(i + poly.length - 1) % poly.length], b = poly[i], c = poly[(i + 1) % poly.length];
    if (Math.abs(cross(b[0] - a[0], b[1] - a[1], c[0] - b[0], c[1] - b[1])) > 1e-6) out.push(b);
  }
  return out;
}

export function findRooms(walls) {
  const segs = walls.filter(w => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) > 1e-3).map(w => ({ a: w.a, b: w.b }));
  const cuts = segs.map(() => [0, 1]);
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const A = segs[i], B = segs[j];
    const rx = A.b[0] - A.a[0], ry = A.b[1] - A.a[1], sx = B.b[0] - B.a[0], sy = B.b[1] - B.a[1];
    const qx = B.a[0] - A.a[0], qy = B.a[1] - A.a[1];
    const lA = Math.hypot(rx, ry), lB = Math.hypot(sx, sy), den = cross(rx, ry, sx, sy);
    if (Math.abs(den) < 1e-7 * lA * lB) {
      if (Math.abs(cross(qx, qy, rx, ry)) > 1e-4 * lA) continue;   // parallel, apart
      for (const p of [B.a, B.b]) { const t = ((p[0] - A.a[0]) * rx + (p[1] - A.a[1]) * ry) / (lA * lA); if (t > 0 && t < 1) cuts[i].push(t); }
      for (const p of [A.a, A.b]) { const t = ((p[0] - B.a[0]) * sx + (p[1] - B.a[1]) * sy) / (lB * lB); if (t > 0 && t < 1) cuts[j].push(t); }
      continue;
    }
    const t = cross(qx, qy, sx, sy) / den, u = cross(qx, qy, rx, ry) / den, eA = 0.005 / lA, eB = 0.005 / lB;
    if (t >= -eA && t <= 1 + eA && u >= -eB && u <= 1 + eB) { cuts[i].push(clamp01(t)); cuts[j].push(clamp01(u)); }
  }

  const V = new Map();
  const vert = p => { const k = key(p); if (!V.has(k)) V.set(k, { k, p: [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000], n: new Set(), comp: -1 }); return V.get(k); };
  segs.forEach((s, i) => {
    const ts = [...new Set(cuts[i])].sort((a, b) => a - b);
    for (let k = 0; k + 1 < ts.length; k++) {
      const at = t => [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t];
      const v1 = vert(at(ts[k])), v2 = vert(at(ts[k + 1]));
      if (v1 !== v2) { v1.n.add(v2.k); v2.n.add(v1.k); }
    }
  });

  let comp = 0;                                   // which walls are joined together
  for (const v of V.values()) {
    if (v.comp >= 0) continue;
    const todo = [v]; v.comp = comp;
    while (todo.length) for (const nk of todo.pop().n) { const o = V.get(nk); if (o.comp < 0) { o.comp = comp; todo.push(o); } }
    comp++;
  }
  for (let again = true; again;) {                 // trim walls that lead nowhere
    again = false;
    for (const v of V.values()) if (v.n.size === 1) { const o = V.get([...v.n][0]); o.n.delete(v.k); v.n.clear(); again = true; }
  }
  for (const v of V.values()) v.out = [...v.n].sort((a, b) => {
    const pa = V.get(a).p, pb = V.get(b).p;
    return Math.atan2(pa[1] - v.p[1], pa[0] - v.p[0]) - Math.atan2(pb[1] - v.p[1], pb[0] - v.p[0]);
  });

  const rooms = [], outer = [], seen = new Set();
  for (const v of V.values()) for (const nk of v.out) {
    if (seen.has(v.k + '>' + nk)) continue;
    const poly = []; let a = v, bk = nk, guard = 10000;
    do {
      seen.add(a.k + '>' + bk); poly.push(a.p);
      const b = V.get(bk), idx = b.out.indexOf(a.k);
      const nx = b.out[(idx - 1 + b.out.length) % b.out.length];
      a = b; bk = nx;
    } while (!(a === v && bk === nk) && guard--);
    const area = polyArea(poly);
    if (area > 1e-3) rooms.push({ poly, area, comp: v.comp, holes: [] });
    else if (area < -1e-3) outer.push({ poly: poly.reverse(), area: -area, comp: v.comp });
  }
  const outlines = [];
  for (const o of outer) {                        // a building inside a room cuts a hole in that room's floor
    const host = rooms.filter(r => r.comp !== o.comp && pointInPoly(o.poly[0][0], o.poly[0][1], r.poly)).sort((a, b) => a.area - b.area)[0];
    if (host) host.holes.push(o.poly); else outlines.push(o.poly);
  }
  for (const r of rooms) {
    r.cx = r.poly.reduce((s, p) => s + p[0], 0) / r.poly.length;
    r.cz = r.poly.reduce((s, p) => s + p[1], 0) / r.poly.length;
  }
  return { rooms, outlines };
}
