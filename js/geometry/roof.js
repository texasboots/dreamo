// Roof shapes built from the outline of the top floor.
import * as THREE from 'three';
import { simplify } from './rooms.js';
import { slabGeo } from './walls.js';

// Push a polygon's edges outward by d (the polygon must go anticlockwise).
export function offsetPoly(poly, d) {
  const n = poly.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = poly[(i + n - 1) % n], b = poly[i], c = poly[(i + 1) % n];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
    const n1 = [(b[1] - a[1]) / l1, -(b[0] - a[0]) / l1], n2 = [(c[1] - b[1]) / l2, -(c[0] - b[0]) / l2];
    const k = d / Math.max(0.3, 1 + n1[0] * n2[0] + n1[1] * n2[1]);
    out.push([b[0] + (n1[0] + n2[0]) * k, b[1] + (n1[1] + n2[1]) * k]);
  }
  return out;
}

// If the outline is a rectangle (at any angle) return its centre, long axis and half sizes.
export function asRect(poly) {
  const p = simplify(poly); if (p.length !== 4) return null;
  for (let i = 0; i < 4; i++) {
    const a = p[i], b = p[(i + 1) % 4], c = p[(i + 2) % 4];
    const d = (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]);
    if (Math.abs(d) > 1e-3 * Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1])) return null;
  }
  const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1]], e2 = [p[2][0] - p[1][0], p[2][1] - p[1][1]];
  const l1 = Math.hypot(...e1), l2 = Math.hypot(...e2), long = l1 >= l2 ? e1 : e2, A = Math.max(l1, l2) / 2, B = Math.min(l1, l2) / 2;
  return { cx: (p[0][0] + p[2][0]) / 2, cz: (p[0][1] + p[2][1]) / 2, ang: Math.atan2(-long[1], long[0]), A, B };
}

function faces(list) {
  const pos = [], uv = [];
  for (const pts of list) {
    const v = pts.map(p => new THREE.Vector3(...p)), e1 = v[1].clone().sub(v[0]).normalize();
    const n = e1.clone().cross(v[2].clone().sub(v[0])).normalize(), e2 = n.clone().cross(e1);
    const tri = pts.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3];
    for (const i of tri) { pos.push(v[i].x, v[i].y, v[i].z); const r = v[i].clone().sub(v[0]); uv.push(r.dot(e1), r.dot(e2)); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// Returns { group, fellBack } where fellBack is true if a sloped roof was not possible.
export function buildRoof(outlines, roof, roofMat, wallMat) {
  const group = new THREE.Group(); let fellBack = false;
  const add = (g, m) => { const me = new THREE.Mesh(g, m); me.castShadow = me.receiveShadow = true; group.add(me); };
  for (const o of outlines) {
    const r = roof.style === 'flat' ? null : asRect(o);
    if (!r) {
      if (roof.style !== 'flat') fellBack = true;
      add(slabGeo(offsetPoly(o, 0.35), 0, 0.22), roofMat);
      continue;
    }
    const ov = 0.45, A = r.A + ov, B = r.B + ov, hgt = r.B * 0.75 + 0.2, drop = -0.18, list = [];
    if (roof.style === 'gable') {
      list.push([[-A, drop, B], [A, drop, B], [A, hgt, 0], [-A, hgt, 0]], [[A, drop, -B], [-A, drop, -B], [-A, hgt, 0], [A, hgt, 0]]);
      const y = hgt * (r.B + 0.1) / B, t = r.B + 0.1, x = r.A + 0.1;
      const ends = faces([[[x, 0, t], [x, 0, -t], [x, y, 0]], [[-x, 0, -t], [-x, 0, t], [-x, y, 0]]]);
      ends.rotateY(r.ang); ends.translate(r.cx, 0, r.cz); add(ends, wallMat);
    } else {
      const R = A - B;
      list.push([[-A, drop, B], [A, drop, B], [R, hgt, 0], [-R, hgt, 0]], [[A, drop, -B], [-A, drop, -B], [-R, hgt, 0], [R, hgt, 0]],
        [[A, drop, B], [A, drop, -B], [R, hgt, 0]], [[-A, drop, -B], [-A, drop, B], [-R, hgt, 0]]);
    }
    const g = faces(list); g.rotateY(r.ang); g.translate(r.cx, 0, r.cz); add(g, roofMat);
  }
  return { group, fellBack };
}
