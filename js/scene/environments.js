// The four places a house can stand: forest, beach, snowy mountain, city.
import * as THREE from 'three';
import { mat, rng } from './materials.js';
import { treeGeo, treeMat } from '../catalog/parts.js';
import { PLOT } from '../model.js';

export const ENV_LOOK = {
  forest: { ground: 'grass', fog: '#cfe3ee', sky: '#bcd8f0', bounce: '#5f7f45' },
  beach:  { ground: 'sand',  fog: '#d6ecf5', sky: '#bfe4f7', bounce: '#d9c79a' },
  snow:   { ground: 'snow',  fog: '#e3edf6', sky: '#cfe0f2', bounce: '#dfe8f0' },
  city:   { ground: 'grass', fog: '#d5dde6', sky: '#c3d6ea', bounce: '#7d8288' },
};

function scatter(group, kind, n, r, place, snow = false, scale = [0.8, 1.5]) {
  const m = new THREE.InstancedMesh(treeGeo(kind, snow), treeMat, n), d = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i < n * 6 && k < n; i++) {
    const p = place(r); if (!p) continue;
    d.position.set(p[0], 0, p[1]); d.rotation.y = r() * 6.28; d.scale.setScalar(scale[0] + r() * (scale[1] - scale[0])); d.updateMatrix(); m.setMatrixAt(k++, d.matrix);
  }
  m.count = k; m.castShadow = true; m.receiveShadow = true; group.add(m);
}
const ring = (r0, r1, ok = () => true) => r => { const a = r() * 6.283, d = r0 + (r1 - r0) * Math.sqrt(r()), p = [Math.cos(a) * d, Math.sin(a) * d]; return Math.max(Math.abs(p[0]), Math.abs(p[1])) > PLOT / 2 + 3 && ok(p) ? p : null; };
const flat = (w, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(m)); me.rotation.x = -Math.PI / 2; me.position.set(x, y, z); me.receiveShadow = true; const uv = me.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d); return me; };

function hills(group, r, n, r0, r1, h0, h1, colors, sharp, arc = [0, 6.283]) {
  for (let i = 0; i < n; i++) {
    const a = arc[0] + (i / n) * (arc[1] - arc[0]) + r() * 0.3, d = r0 + r() * (r1 - r0), h = h0 + r() * (h1 - h0), w = h * (sharp ? 1.1 : 2.4) + r() * 60;
    const g = sharp ? new THREE.ConeGeometry(w, h, 7, 4) : new THREE.SphereGeometry(w, 10, 6, 0, 6.283, 0, 1.57);
    const pos = g.attributes.position, c = new Float32Array(pos.count * 3), lo = new THREE.Color(colors[0]), hi = new THREE.Color(colors[1]), t = new THREE.Color();
    for (let k = 0; k < pos.count; k++) {
      if (sharp) { pos.setX(k, pos.getX(k) + (r() - 0.5) * w * 0.18); pos.setZ(k, pos.getZ(k) + (r() - 0.5) * w * 0.18); }
      const f = sharp ? (pos.getY(k) / h + 0.5) : pos.getY(k) / w;
      t.copy(lo).lerp(hi, sharp ? (f > 0.45 ? 1 : 0) : f); c.set([t.r, t.g, t.b], k * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, treeMat); m.position.set(Math.cos(a) * d, sharp ? h / 2 - 4 : -4, Math.sin(a) * d); if (!sharp) m.scale.y = h / w; m.rotation.y = r() * 6; group.add(m);
  }
}

export function buildEnvironment(env) {
  const g = new THREE.Group(), r = rng(42), look = ENV_LOOK[env] || ENV_LOOK.forest;
  g.add(flat(2400, 2400, look.ground, 0, 0, 0));
  if (env === 'forest') {
    scatter(g, 'pine', 170, r, ring(28, 170)); scatter(g, 'leafy', 150, r, ring(27, 150)); scatter(g, 'bush', 60, r, ring(25, 90)); scatter(g, 'rock', 20, r, ring(26, 120));
    hills(g, r, 16, 330, 520, 40, 90, ['#3f6f3f', '#5c8f52'], false);
  } else if (env === 'beach') {
    const sea = flat(2400, 1200, 'sea', 0, 0.12, -640); g.add(sea);
    g.add(flat(2400, 5, 'color:#f4fbfd', 0, 0.13, -39.5));
    scatter(g, 'palm', 70, r, ring(26, 150, p => p[1] > -34)); scatter(g, 'rock', 30, r, ring(26, 140, p => p[1] > -45)); scatter(g, 'bush', 30, r, ring(30, 130, p => p[1] > 10));
    hills(g, r, 9, 380, 520, 30, 70, ['#5a8f55', '#86b877'], false, [0.2, 2.9]);
  } else if (env === 'snow') {
    scatter(g, 'pine', 190, r, ring(28, 190), true); scatter(g, 'rock', 30, r, ring(26, 130));
    hills(g, r, 14, 430, 640, 170, 330, ['#6f7f93', '#f7fafd'], true);
    hills(g, r, 12, 300, 380, 30, 60, ['#dfe8f0', '#f7fafd'], false);
  } else if (env === 'city') {
    g.add(flat(900, 9, 'asphalt', 0, 0.03, 31)); g.add(flat(900, 2.4, 'concrete', 0, 0.05, 25.2)); g.add(flat(900, 2.4, 'concrete', 0, 0.05, 36.8));
    for (let x = -440; x < 440; x += 8) g.add(flat(3.5, 0.2, 'color:#f1ead0', x, 0.04, 31));
    const cols = ['#b9aea0', '#8f99a6', '#c9b8a0', '#a7a29c', '#9aa7b0', '#c4a58e', '#7f8791'];
    const tower = (x, z, w, d, h) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat('facade:' + cols[r() * cols.length | 0])); const uv = b.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (i >= 16 ? w : (i < 8 ? d : w)), uv.getY(i) * h); b.position.set(x, h / 2, z); b.castShadow = b.receiveShadow = true; g.add(b); const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), mat('color:#6a6f76')); top.position.set(x, h + 0.25, z); g.add(top); };
    for (let x = -300; x <= 300; x += 26) { tower(x + r() * 4, 52 + r() * 6, 18 + r() * 6, 16, 12 + r() * 46); tower(x + r() * 4, 86 + r() * 10, 20, 20, 30 + r() * 70); tower(x + r() * 4, -48 - r() * 8, 18 + r() * 5, 16, 9 + r() * 30); tower(x, -90 - r() * 20, 22, 22, 30 + r() * 80); }
    for (let z = -20; z <= 20; z += 26) for (const s of [-1, 1]) { tower(s * (44 + r() * 4), z, 16, 20, 9 + r() * 16); tower(s * (78 + r() * 8), z, 22, 22, 20 + r() * 50); }
    scatter(g, 'leafy', 26, r, r2 => { const x = (r2() - 0.5) * 500; return Math.abs(x) > 4 ? [x, r2() < 0.5 ? 26.2 : 37] : null; }, false, [0.6, 0.9]);
  }
  return { group: g, look };
}
