// Small building blocks used to make furniture and garden things.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, rng } from '../scene/materials.js';

const M = m => (typeof m === 'string' ? mat(m) : m);
const put = (g, m, x, y, z) => { const me = new THREE.Mesh(g, M(m)); me.position.set(x, y, z); return me; };
const geoCache = new Map();
const cached = (k, make) => { if (!geoCache.has(k)) geoCache.set(k, make()); return geoCache.get(k); };

// y is always the height of the BOTTOM of the part.
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => put(cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y + h / 2, z);
export const cyl = (r, h, m, x = 0, y = 0, z = 0, rTop = r, seg = 24) => put(cached(`c${r},${h},${rTop},${seg}`, () => new THREE.CylinderGeometry(rTop, r, h, seg)), m, x, y + h / 2, z);
export const sph = (r, m, x = 0, y = 0, z = 0, sy = 1, seg = 16) => { const me = put(cached(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.75 | 0))), m, x, y, z); me.scale.y = sy; return me; };
export const cone = (r, h, m, x = 0, y = 0, z = 0, seg = 16) => put(cached(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, x, y + h / 2, z);
export const torus = (R, r, m, x = 0, y = 0, z = 0) => { const me = put(cached(`t${R},${r}`, () => new THREE.TorusGeometry(R, r, 10, 36)), m, x, y, z); me.rotation.x = Math.PI / 2; return me; };
// A soft-edged box, for sofas, beds and anything friendly.
export const rbox = (w, h, d, m, x = 0, y = 0, z = 0, r = 0.05) => {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const g = cached(`r${w},${h},${d},${r}`, () => {
    const s = new THREE.Shape(), a = w / 2, b = h / 2;
    s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r); s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b);
    s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b);
    const e = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelOffset: -r, bevelSegments: 3, curveSegments: 5 });
    e.translate(0, 0, -(d - 2 * r) / 2); return e;
  });
  return put(g, m, x, y + h / 2, z);
};
export const turn = (me, rx = 0, ry = 0, rz = 0) => { me.rotation.set(rx, ry, rz); return me; };
export const legs = (w, d, h, m, t = 0.05, y = 0) => [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => box(t, h, t, m, sx * (w / 2 - t / 2 - 0.03), y, sz * (d / 2 - t / 2 - 0.03)));
export function group(...parts) {
  const g = new THREE.Group();
  for (const p of parts.flat(3)) if (p) g.add(p);
  g.traverse(o => { if (o.isMesh) { o.castShadow = !o.material.transparent; o.receiveShadow = true; } });
  return g;
}
export const rand = rng;

// Trees are one merged shape with colours baked in, so a whole forest is cheap to draw.
const tint = (g, hex) => { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.index ? g.toNonIndexed() : g; };
const at = (g, x, y, z) => { g.translate(x, y, z); return g; };
export const treeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true });
const leafyIn = (trunk, cs) => mergeGeometries([
  tint(at(new THREE.CylinderGeometry(0.2, 0.3, 2.2, 7), 0, 1.1, 0), trunk),
  ...[[0, 3.4, 0, 1.7], [0.9, 2.9, 0.3, 1.2], [-0.8, 3.0, -0.4, 1.25], [0.1, 4.3, -0.2, 1.1]].map(([x, y, z, r], i) => tint(at(new THREE.IcosahedronGeometry(r, 1), x, y, z), cs[i % cs.length])),
]);
const TREES = {
  pine: (snow) => mergeGeometries([
    tint(at(new THREE.CylinderGeometry(0.16, 0.24, 1.4, 7), 0, 0.7, 0), '#6b4a32'),
    ...[[1.7, 2.6, 1.0, '#2f6b3f'], [1.35, 2.3, 2.3, '#357a47'], [0.95, 2.0, 3.5, '#3d8a50']].map(([r, h, y, c]) => tint(at(new THREE.ConeGeometry(r, h, 9), 0, y + h / 2, 0), snow ? '#e8f0f4' : c)),
    ...(snow ? [[1.72, 0.9, 1.0], [1.37, 0.8, 2.3]].map(([r, h, y]) => tint(at(new THREE.CylinderGeometry(r * 0.72, r, h * 0.55, 9), 0, y + h * 0.27, 0), '#3b6d4c')) : []),
  ]),
  leafy: () => mergeGeometries([
    tint(at(new THREE.CylinderGeometry(0.2, 0.3, 2.2, 7), 0, 1.1, 0), '#73513a'),
    ...[[0, 3.4, 0, 1.7, '#4f9a45'], [0.9, 2.9, 0.3, 1.2, '#5aa84e'], [-0.8, 3.0, -0.4, 1.25, '#458c3e'], [0.1, 4.3, -0.2, 1.1, '#63b356']].map(([x, y, z, r, c]) => tint(at(new THREE.IcosahedronGeometry(r, 1), x, y, z), c)),
  ]),
  palm: () => {
    const parts = [];
    for (let i = 0; i < 6; i++) parts.push(tint(at(new THREE.CylinderGeometry(0.15 - i * 0.012, 0.17 - i * 0.012, 0.95, 7), i * i * 0.022, 0.47 + i * 0.9, 0), i % 2 ? '#9a7b55' : '#8a6d49'));
    for (let i = 0; i < 8; i++) { const g = new THREE.SphereGeometry(1, 6, 4); g.scale(1.5, 0.07, 0.38); g.translate(1.45, 0, 0); g.rotateZ(-0.35); g.rotateY(i * Math.PI / 4); parts.push(tint(at(g, 0.8, 5.6, 0), i % 2 ? '#3f9a4a' : '#57b05a')); }
    parts.push(tint(at(new THREE.SphereGeometry(0.28, 7, 5), 0.8, 5.55, 0), '#6b4a32'));
    return mergeGeometries(parts);
  },
  blossom: () => leafyIn('#6b4a3e', ['#f4b6dc', '#f7c6e3', '#ef9fcb', '#fbd5ea']),
  autumn: () => leafyIn('#6b4a32', ['#e07a2f', '#f0a33a', '#c9502c', '#e8c14a']),
  jungle: () => { const g = leafyIn('#5a4330', ['#2f7a3a', '#3d8f3f', '#256b33', '#4aa24a']); g.scale(1.35, 1.5, 1.35); return g; },
  apple: () => mergeGeometries([leafyIn('#73513a', ['#4f9a45', '#5aa84e', '#458c3e', '#63b356']), ...[[0.9, 3.3, 0.9], [-0.9, 3.6, 0.6], [0.3, 2.9, 1.3], [-0.5, 3.0, -1.1], [1.2, 3.8, -0.4], [0.2, 4.6, 0.8]].map(([x, y, z]) => tint(at(new THREE.SphereGeometry(0.16, 8, 6), x, y, z), '#d8352b'))]),
  cactus: () => mergeGeometries([
    tint(at(new THREE.CylinderGeometry(0.3, 0.34, 3.2, 9), 0, 1.6, 0), '#4f8f4a'), tint(at(new THREE.SphereGeometry(0.3, 9, 6), 0, 3.2, 0), '#4f8f4a'),
    tint(at(new THREE.CylinderGeometry(0.17, 0.17, 0.7, 8).rotateZ(Math.PI / 2), 0.55, 1.4, 0), '#4a8746'), tint(at(new THREE.CylinderGeometry(0.17, 0.17, 1.1, 8), 0.9, 1.95, 0), '#4a8746'), tint(at(new THREE.SphereGeometry(0.17, 8, 5), 0.9, 2.5, 0), '#4a8746'),
    tint(at(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8).rotateZ(Math.PI / 2), -0.5, 2.0, 0), '#4a8746'), tint(at(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8), -0.8, 2.4, 0), '#4a8746'), tint(at(new THREE.SphereGeometry(0.15, 8, 5), -0.8, 2.8, 0), '#4a8746'),
  ]),
  mushroom: () => mergeGeometries([
    tint(at(new THREE.CylinderGeometry(0.35, 0.5, 2.4, 12), 0, 1.2, 0), '#f3ead8'),
    tint(at(new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.75, 1), 0, 2.3, 0), '#d8352b'),
    ...[[0, 1.2, 0], [0.9, 0.8, 0.5], [-0.8, 0.85, 0.6], [0.4, 0.75, -1.0], [-0.7, 0.8, -0.8], [1.1, 0.55, -0.6]].map(([x, y, z]) => tint(at(new THREE.SphereGeometry(0.2, 8, 5).scale(1, 0.5, 1), x, 2.3 + y, z), '#ffffff')),
  ]),
  dead: () => mergeGeometries([
    tint(at(new THREE.CylinderGeometry(0.14, 0.3, 4, 7), 0, 2, 0), '#4a3d36'),
    ...[[0.6, 2.6, 0.9], [-0.7, 3.1, -0.8], [0.4, 3.5, -1.1], [-0.3, 2.2, 1.2]].map(([x, y, a]) => { const b = new THREE.CylinderGeometry(0.04, 0.09, 1.6, 5); b.translate(0, 0.8, 0); b.rotateZ(a); b.rotateY(x * 3); return tint(at(b, 0, y, 0), '#4a3d36'); }),
  ]),
  lolly: (c) => mergeGeometries([tint(at(new THREE.CylinderGeometry(0.08, 0.08, 3, 8), 0, 1.5, 0), '#ffffff'), tint(at(new THREE.SphereGeometry(1, 16, 10).scale(1, 1, 0.35), 0, 3.6, 0), c || '#ff6fae'), tint(at(new THREE.TorusGeometry(0.62, 0.12, 6, 20).scale(1, 1, 0.8), 0, 3.6, 0.3), '#ffffff')]),
  lolly2: () => TREES.lolly('#5fd0e8'),
  lolly3: () => TREES.lolly('#ffd23f'),
  crystal: () => mergeGeometries([[0, 0, 0, 0.5, 3.2, '#b48cff'], [0.6, 0, 0.2, 0.3, 2, '#d7b8ff'], [-0.5, 0, -0.3, 0.35, 2.4, '#8f6bff'], [0.1, 0, 0.6, 0.25, 1.5, '#c9a7ff']].map(([x, y, z, r, h, c]) => { const g = new THREE.ConeGeometry(r, h, 6); g.rotateZ((x - z) * 0.3); return tint(at(g, x, h / 2, z), c); })),
  bush: () => mergeGeometries([[0, 0.45, 0, 0.6, '#4f9a45'], [0.4, 0.38, 0.1, 0.42, '#5aa84e'], [-0.38, 0.36, -0.1, 0.44, '#458c3e']].map(([x, y, z, r, c]) => tint(at(new THREE.IcosahedronGeometry(r, 1), x, y, z), c))),
  rock: () => { const g = new THREE.IcosahedronGeometry(0.6, 1); g.scale(1.2, 0.7, 0.9); return tint(at(g, 0, 0.3, 0), '#8c8a86'); },
};
export const treeGeo = (kind, snow = false) => cached('tree' + kind + snow, () => TREES[kind](snow));
export const tree = (kind) => { const m = new THREE.Mesh(treeGeo(kind), treeMat); return m; };
