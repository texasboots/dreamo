// The four places a house can stand: forest, beach, snowy mountain, city.
import * as THREE from 'three';
import { mat, rng } from './materials.js';
import { treeGeo, treeMat } from '../catalog/parts.js';
import { PLOT } from '../model.js';
import { placeSpec } from '../places.js';
import { buildItem } from '../catalog/items.js';

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
  const g = new THREE.Group(), r = rng(42);
  if (!ENV_LOOK[env]) return buildPlace(placeSpec(env), g, r);
  const look = { ...ENV_LOOK[env], darkGrid: env === 'snow' || env === 'beach' };
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
    city(g, r);
  }
  return { group: g, look };
}

function city(g, r) {
    g.add(flat(900, 9, 'asphalt', 0, 0.03, 31)); g.add(flat(900, 2.4, 'concrete', 0, 0.05, 25.2)); g.add(flat(900, 2.4, 'concrete', 0, 0.05, 36.8));
  for (let x = -440; x < 440; x += 8) g.add(flat(3.5, 0.2, 'color:#f1ead0', x, 0.04, 31));
  const cols = ['#b9aea0', '#8f99a6', '#c9b8a0', '#a7a29c', '#9aa7b0', '#c4a58e', '#7f8791'];
  const tower = (x, z, w, d, h) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat('facade:' + cols[r() * cols.length | 0])); const uv = b.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (i >= 16 ? w : (i < 8 ? d : w)), uv.getY(i) * h); b.position.set(x, h / 2, z); b.castShadow = b.receiveShadow = true; g.add(b); const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), mat('color:#6a6f76')); top.position.set(x, h + 0.25, z); g.add(top); };
  for (let x = -300; x <= 300; x += 26) { tower(x + r() * 4, 52 + r() * 6, 18 + r() * 6, 16, 12 + r() * 46); tower(x + r() * 4, 86 + r() * 10, 20, 20, 30 + r() * 70); tower(x + r() * 4, -48 - r() * 8, 18 + r() * 5, 16, 9 + r() * 30); tower(x, -90 - r() * 20, 22, 22, 30 + r() * 80); }
  for (let z = -20; z <= 20; z += 26) for (const s of [-1, 1]) { tower(s * (44 + r() * 4), z, 16, 20, 9 + r() * 16); tower(s * (78 + r() * 8), z, 22, 22, 20 + r() * 50); }
  scatter(g, 'leafy', 26, r, r2 => { const x = (r2() - 0.5) * 500; return Math.abs(x) > 4 ? [x, r2() < 0.5 ? 26.2 : 37] : null; }, false, [0.6, 0.9]);
}

// ---- places made from words
const disc = (rad, m, x, y, z, inner = 0) => { const me = new THREE.Mesh(inner ? new THREE.RingGeometry(inner, rad, 64) : new THREE.CircleGeometry(rad, 48), mat(m)); me.rotation.x = -Math.PI / 2; me.position.set(x, y, z); me.receiveShadow = true; return me; };
const HILLS = {
  rolling: (g, r, arc) => hills(g, r, 16, 330, 520, 40, 90, ['#3f6f3f', '#5c8f52'], false, arc),
  green: (g, r, arc) => { hills(g, r, 14, 260, 460, 70, 140, ['#2f6a35', '#4f8f45'], false, arc); hills(g, r, 10, 480, 640, 160, 280, ['#2f5a3a', '#5a8a5a'], true, arc); },
  dark: (g, r, arc) => hills(g, r, 16, 300, 500, 40, 100, ['#2a3328', '#46503e'], false, arc),
  pastel: (g, r, arc) => hills(g, r, 18, 280, 500, 40, 110, ['#f7a8d0', '#c8b0f0'], false, arc),
  reef: (g, r, arc) => hills(g, r, 16, 200, 400, 30, 80, ['#e0c890', '#f0a0b0'], false, arc),
  clouds: (g, r) => { hills(g, r, 22, 120, 500, 20, 70, ['#ffffff', '#fff0f8'], false); },
  crystal: (g, r, arc) => hills(g, r, 18, 380, 600, 120, 280, ['#4a3a78', '#c8b0ff'], true, arc),
  mountains: (g, r, arc, s) => { hills(g, r, 14, 430, 640, 170, 330, s.snowy ? ['#6f7f93', '#f7fafd'] : ['#5f6a5a', '#f2f6fa'], true, arc); hills(g, r, 12, 300, 380, 30, 60, s.snowy ? ['#dfe8f0', '#f7fafd'] : ['#4f7f45', '#6a9a55'], false, arc); },
  craters: (g, r, arc, s) => {
    const c = new THREE.Color(s.ground.replace('color:', '')), dark = '#' + c.clone().multiplyScalar(0.8).getHexString(), lite = '#' + c.clone().multiplyScalar(1.1).getHexString();
    hills(g, r, 16, 350, 600, 40, 120, [dark, lite], false, arc);
    for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = 40 + r() * 200, R = 4 + r() * 12; const t = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.25, 6, 24), mat('color:' + dark)); t.rotation.x = -Math.PI / 2; t.scale.z = 0.35; t.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); t.receiveShadow = true; g.add(t, disc(R, 'color:' + dark, t.position.x, 0.03, t.position.z)); }
  },
  mesas: (g, r, arc, s) => {
    const cols = s.hillColors || ['#b8683a', '#d9965a'];
    for (let i = 0; i < 22; i++) { const a = arc[0] + r() * (arc[1] - arc[0]), d = 150 + r() * 450, w = 20 + r() * 60, h = 20 + r() * 70; const m = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.8, w, h, 9), mat('color:' + cols[i % 2])); m.position.set(Math.cos(a) * d, h / 2, Math.sin(a) * d); m.rotation.y = r() * 6; m.castShadow = m.receiveShadow = true; g.add(m); const top = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.82, w * 0.82, 3, 9), mat('color:' + cols[(i + 1) % 2])); top.position.set(m.position.x, h - 1, m.position.z); top.rotation.y = m.rotation.y; g.add(top); }
  },
  volcano: (g, r, arc) => {
    hills(g, r, 12, 380, 600, 60, 160, ['#2f2828', '#4a3c38'], true, arc);
    const v = new THREE.Mesh(new THREE.CylinderGeometry(40, 210, 230, 14, 1, true), mat('color:#3a302e')); v.position.set(60, 112, -460); g.add(v);
    const top = disc(40, 'screen:#ff5a1a', 60, 227, -460); g.add(top);
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 120), mat('screen:#ff6a1a')); f.position.set(60 + (i - 1.5) * 30, 120 - i * 10, -400 + i * 5); f.rotation.set(-0.9, (i - 1.5) * 0.4, 0); g.add(f); }
  },
};

function buildPlace(s, g, r) {
  const look = { ...s.look, space: !!s.space, underwater: !!s.underwater };
  const lum = new THREE.Color(s.ground.startsWith('color:') ? s.ground.slice(6) : ({ sand: '#ecd9a6', snow: '#f6f9fc' })[s.ground] || '#6a9a42');
  look.darkGrid = lum.r * 0.3 + lum.g * 0.59 + lum.b * 0.11 > 0.62;
  g.add(flat(2400, 2400, s.ground, 0, 0, 0));
  let ok = () => true, far = 170, arc = [0, 6.283];
  if (s.water === 'sea') { g.add(flat(2400, 1200, 'sea', 0, 0.12, -640), flat(2400, 5, 'color:#f4fbfd', 0, 0.13, -39.5)); ok = p => p[1] > -34; arc = [0.2, 2.9]; }
  if (s.water === 'island') { g.add(disc(1500, 'sea', 0, 0.12, 0, 74), disc(75, 'color:#f4fbfd', 0, 0.11, 0, 72)); ok = p => Math.hypot(p[0], p[1]) < 66; far = 70; }
  if (s.water === 'lake' || s.water === 'lava' || s.water === 'swamp') {
    const m = { lake: 'sea', lava: 'screen:#ff5a1a', swamp: 'gloss:#3f5236' }[s.water];
    g.add(disc(42, s.water === 'lava' ? 'color:#1f1a1a' : 'sand', 0, 0.06, -80), disc(38, m, 0, 0.1, -80));
    ok = p => Math.hypot(p[0], p[1] + 80) > 46;
  }
  if (s.icebergs) for (let i = 0; i < 14; i++) { const a = r() * 3 + 3.3, d = 70 + r() * 260, h = 4 + r() * 16; const b = new THREE.Mesh(new THREE.ConeGeometry(h * 0.9, h, 6), mat('snow')); b.position.set(Math.cos(a) * d * 1.4, h / 2 - 1, -Math.abs(Math.sin(a) * d) - 50); b.castShadow = true; g.add(b); }
  if (s.city) city(g, r);
  if (s.village) village(g, r, ok);
  if (s.farm) { for (let i = 0; i < 8; i++) { const f = flat(40, 26, 'color:' + ['#c9b04a', '#8aa84a', '#a8c060', '#b89a4a'][i % 4], (i % 4 - 1.5) * 46, 0.03, i < 4 ? 70 : -70); g.add(f); for (let k = 0; k < 6; k++) g.add(flat(40, 0.6, 'color:#6a5a3a', f.position.x, 0.035, f.position.z - 11 + k * 4.4)); } ok = (o => p => o(p) && !(Math.abs(p[1]) > 56 && Math.abs(p[1]) < 84 && Math.abs(p[0]) < 92))(ok); }
  for (const [kind, n] of s.trees) scatter(g, kind, n, r, ring(27, far, ok), !!s.snowy && kind === 'pine', kind === 'jungle' ? [0.9, 1.6] : kind === 'rock' ? [0.8, 2.2] : [0.8, 1.5]);
  if (s.flowers) flowers(g, r, ring(24, 80, ok));
  for (const [type, n] of s.extras || []) for (let i = 0; i < n; i++) { const p = ring(26, Math.min(far, 70), ok)(r); if (!p) continue; const it = buildItem({ type }); if (!it) break; it.position.set(p[0], 0, p[1]); it.rotation.y = r() * 6; g.add(it); }
  if (s.hills && HILLS[s.hills]) HILLS[s.hills](g, r, arc, s);
  return { group: g, look };
}

function flowers(g, r, place) {
  const n = 500, m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 4), new THREE.MeshStandardMaterial({ roughness: 0.8 }), n), d = new THREE.Object3D(), cols = ['#f4b6dc', '#f6d77a', '#ffffff', '#e2574c', '#a98ad6', '#7fb7e0'].map(c => new THREE.Color(c));
  let k = 0;
  for (let i = 0; i < n * 4 && k < n; i++) { const p = place(r); if (!p) continue; d.position.set(p[0], 0.18, p[1]); d.updateMatrix(); m.setMatrixAt(k, d.matrix); m.setColorAt(k++, cols[r() * cols.length | 0]); }
  m.count = k; g.add(m);
}

function village(g, r, ok) {
  const walls = ['#f3efe6', '#f6d77a', '#bfe3ee', '#f7c9c4', '#cfe8a9', '#e8dcc6'], roofs = ['#b5533c', '#555b63', '#3f6f8f', '#7a3b2e'];
  for (let i = 0; i < 40; i++) {
    const p = ring(36, 150, ok)(r); if (!p) continue;
    const w = 7 + r() * 4, d = 6 + r() * 3, h = 3 + r() * 3, house = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat('siding:' + walls[r() * walls.length | 0])); b.position.y = h / 2; b.castShadow = b.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.08, 2.8, 4), mat('rooftile:' + roofs[r() * roofs.length | 0])); roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.hypot(w, d) * 1.4, 1, d / Math.hypot(w, d) * 1.4); roof.position.y = h + 1.4; roof.castShadow = true;
    house.add(b, roof); house.position.set(p[0], 0, p[1]); house.rotation.y = Math.atan2(-p[0], -p[1]); g.add(house);
  }
}

