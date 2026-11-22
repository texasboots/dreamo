// Every surface in DREAMO. Textures are painted in code, so nothing has to be downloaded.
import * as THREE from 'three';

export const glow = [];           // materials that light up at night: { m, k }
export const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const texCache = new Map();
function tex(name, meters, col) {
  const k = name + '|' + (col || '') + '|' + meters;
  if (texCache.has(k)) return texCache.get(k);
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s;
  DRAW[name](c.getContext('2d'), s, rng(name.length * 977 + 13), col);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.repeat.set(1 / meters, 1 / meters);
  texCache.set(k, t); return t;
}
function speck(g, s, r, n, a, size = 2) {
  for (let i = 0; i < n; i++) { const v = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${r() * a})`; g.fillRect(r() * s, r() * s, 1 + r() * size, 1 + r() * size); }
}
const fill = (g, s, c) => { g.fillStyle = c; g.fillRect(0, 0, s, s); };
function bricks(g, s, r, mortar, color) {
  fill(g, s, mortar); const bw = s / 4, bh = s / 8;
  for (let row = 0; row < 8; row++) for (let c = -1; c < 4; c++) { g.fillStyle = color(); g.fillRect(c * bw + (row % 2 ? bw / 2 : 0) + 3, row * bh + 3, bw - 6, bh - 6); }
  speck(g, s, r, 5000, 0.08);
}
function grainLines(g, s, r, n) {
  for (let i = 0; i < n; i++) { g.strokeStyle = `rgba(90,55,25,${0.03 + r() * 0.07})`; g.lineWidth = 1 + r() * 2; const y = r() * s, x = r() * s; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 60, y + r() * 6 - 3, x + 120, y + r() * 6 - 3, x + 80 + r() * 200, y); g.stroke(); }
}
function windowsGrid(g, s, r, lit) {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const on = r() < 0.4;
    g.fillStyle = lit ? (on ? `hsl(${38 + r() * 14},90%,${60 + r() * 15}%)` : '#000') : (r() < 0.2 ? '#5d7890' : '#2f4052');
    g.fillRect(x * 64 + 14, y * 64 + 12, 36, 40);
  }
}

const DRAW = {
  plaster(g, s, r) { fill(g, s, '#fff'); speck(g, s, r, 9000, 0.05); },
  brick(g, s, r) { bricks(g, s, r, '#b9b2a6', () => `hsl(${8 + r() * 12},48%,${33 + r() * 13}%)`); },
  brickwhite(g, s, r) { bricks(g, s, r, '#cfcbc3', () => `hsl(40,12%,${84 + r() * 9}%)`); },
  siding(g, s) { const h = s / 6; for (let i = 0; i < 6; i++) { const gr = g.createLinearGradient(0, i * h, 0, (i + 1) * h); gr.addColorStop(0, '#fff'); gr.addColorStop(0.85, '#e4e4e4'); gr.addColorStop(1, '#8a8a8a'); g.fillStyle = gr; g.fillRect(0, i * h, s, h); } },
  stone(g, s, r) {
    fill(g, s, '#77736c'); const h = s / 6;
    for (let row = 0; row < 6; row++) for (let x = -r() * 80; x < s;) { const w = 60 + r() * 90; g.fillStyle = `hsl(${28 + r() * 14},${6 + r() * 8}%,${50 + r() * 22}%)`; g.beginPath(); g.roundRect(x + 4, row * h + 4, w - 8, h - 8, 9); g.fill(); x += w; }
    speck(g, s, r, 6000, 0.1);
  },
  wood(g, s, r) {
    const h = s / 8;
    for (let row = 0; row < 8; row++) for (let x = -r() * 300; x < s;) { const w = 220 + r() * 200; g.fillStyle = `hsl(${30 + r() * 6},32%,${74 + r() * 10}%)`; g.fillRect(x, row * h, w, h); g.fillStyle = 'rgba(40,20,5,.35)'; g.fillRect(x, row * h, 2, h); x += w; }
    grainLines(g, s, r, 500);
    g.fillStyle = 'rgba(40,20,5,.3)'; for (let row = 0; row < 8; row++) g.fillRect(0, row * h, s, 2);
  },
  grain(g, s, r) { fill(g, s, 'hsl(32,30%,82%)'); grainLines(g, s, r, 380); },
  tile(g, s) { fill(g, s, '#bdbdb8'); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const gr = g.createLinearGradient(x * 256, y * 256, x * 256 + 256, y * 256 + 256); gr.addColorStop(0, '#fbfbf9'); gr.addColorStop(1, '#eeeeea'); g.fillStyle = gr; g.fillRect(x * 256 + 4, y * 256 + 4, 248, 248); } },
  checker(g, s) { fill(g, s, '#8b8b88'); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#2a2a2c' : '#f3f3f0'; g.fillRect(x * 256 + 2, y * 256 + 2, 252, 252); } },
  carpet(g, s, r) { fill(g, s, '#fff'); speck(g, s, r, 26000, 0.13, 3); },
  marble(g, s, r) {
    fill(g, s, '#f6f4f0');
    for (let i = 0; i < 16; i++) { g.strokeStyle = `rgba(110,112,125,${0.08 + r() * 0.2})`; g.lineWidth = 1 + r() * 3; g.beginPath(); let x = r() * s, y = 0; g.moveTo(x, y); while (y < s) { x += r() * 90 - 45; y += 30 + r() * 50; g.lineTo(x, y); } g.stroke(); }
  },
  concrete(g, s, r) { fill(g, s, '#c4c4c0'); speck(g, s, r, 16000, 0.1, 4); },
  pavers(g, s, r) { fill(g, s, '#8a867f'); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = `hsl(30,5%,${60 + r() * 13}%)`; g.fillRect(x * 128 + 4, y * 128 + 4, 120, 120); } speck(g, s, r, 6000, 0.08); },
  grass(g, s, r) {
    fill(g, s, '#6a9a42');
    for (let i = 0; i < 16000; i++) { g.strokeStyle = `hsl(${82 + r() * 30},${38 + r() * 22}%,${27 + r() * 22}%)`; const x = r() * s, y = r() * s, a = r() * 6.3, l = 2 + r() * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  },
  sand(g, s, r) { fill(g, s, '#e6d3a3'); speck(g, s, r, 20000, 0.12, 2); },
  snow(g, s, r) { fill(g, s, '#f4f7fb'); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(150,180,215,${r() * 0.08})`; g.fillRect(r() * s, r() * s, 3 + r() * 6, 3 + r() * 6); } },
  asphalt(g, s, r) { fill(g, s, '#3a3c3f'); speck(g, s, r, 20000, 0.14, 2); },
  rooftile(g, s, r) {
    fill(g, s, '#777'); const rh = s / 8, cw = s / 6;
    for (let row = 0; row < 8; row++) for (let c = -1; c < 6; c++) {
      const x = c * cw + (row % 2 ? cw / 2 : 0), y = row * rh;
      g.fillStyle = `hsl(0,0%,${78 + r() * 17}%)`; g.beginPath(); g.roundRect(x + 2, y - 6, cw - 4, rh + 2, [0, 0, 16, 16]); g.fill();
      const gr = g.createLinearGradient(0, y, 0, y + rh * 0.45); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + 2, y, cw - 4, rh * 0.45);
    }
  },
  stripes(g, s, r, col) { fill(g, s, '#fbf8f2'); g.fillStyle = col; for (let i = 0; i < 8; i++) g.fillRect(i * 64 + 16, 0, 32, s); },
  dots(g, s, r, col) { fill(g, s, '#fbf8f2'); g.fillStyle = col; for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(x * 128 + (y % 2 ? 96 : 32), y * 64 + 32, 15, 0, 7); g.fill(); } },
  stars(g, s, r, col) {
    fill(g, s, col); g.fillStyle = '#ffe9a8';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 128 + (y % 2 ? 96 : 32), cy = y * 128 + 64, R = 12 + r() * 12; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? R * 0.45 : R; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.fill(); }
  },
  facade(g, s, r, col) { fill(g, s, col); windowsGrid(g, s, r, false); },
  facadeLit(g, s, r) { fill(g, s, '#000'); windowsGrid(g, s, r, true); },
};

const S = o => new THREE.MeshStandardMaterial(o);
const textured = (name, meters, col, rough, bump, tint = '#ffffff') => { const t = tex(name, meters, col); return S({ map: t, color: tint, roughness: rough, ...(bump ? { bumpMap: t, bumpScale: bump } : {}) }); };
const night = (m, k) => { m.emissiveIntensity = 0; glow.push({ m, k }); return m; };

const MAKE = {
  paint: c => S({ map: tex('plaster', 1), color: c, roughness: 0.93 }),
  color: c => S({ color: c, roughness: 0.55 }),
  gloss: c => S({ color: c, roughness: 0.18, metalness: 0.1 }),
  fabric: c => S({ map: tex('carpet', 1), color: c, roughness: 1 }),
  grain: c => S({ map: tex('grain', 1), color: c || '#c79a66', roughness: 0.55 }),
  metal: c => S({ color: c || '#c9ccd1', roughness: 0.28, metalness: 1 }),
  brick: () => textured('brick', 1, null, 0.9, 2),
  brickwhite: () => textured('brickwhite', 1, null, 0.9, 2),
  stone: () => textured('stone', 1.6, null, 0.9, 3),
  siding: c => textured('siding', 1, null, 0.75, 2, c || '#ffffff'),
  planks: c => textured('wood', 1.2, null, 0.7, 0.6, c || '#c79a66'),
  stripes: c => textured('stripes', 1, c, 0.95),
  dots: c => textured('dots', 1, c, 0.95),
  stars: c => textured('stars', 1.4, c, 0.95),
  wood: c => textured('wood', 1.2, null, 0.5, 0.5, c || '#e2c08f'),
  tile: () => textured('tile', 1, null, 0.25, 1),
  checker: () => textured('checker', 1, null, 0.25, 0.6),
  carpet: c => textured('carpet', 1, null, 1, 0.6, c || '#b9c7d8'),
  marble: () => textured('marble', 2, null, 0.15),
  concrete: () => textured('concrete', 2, null, 0.85),
  pavers: () => textured('pavers', 2, null, 0.85, 1.5),
  grass: () => textured('grass', 4, null, 1),
  sand: () => textured('sand', 3, null, 1),
  snow: () => textured('snow', 5, null, 0.85),
  asphalt: () => textured('asphalt', 3, null, 0.9),
  rooftile: c => { const m = textured('rooftile', 1.6, null, 0.8, 3, c || '#b5533c'); m.side = THREE.DoubleSide; return m; },
  glass: () => night(S({ color: '#cfe6ee', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.3, emissive: '#ffcf8a', envMapIntensity: 1.6, depthWrite: false }), 1.3),
  water: () => S({ color: '#3fb4d8', roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.78 }),
  sea: () => S({ color: '#2a8fb5', roughness: 0.12, metalness: 0.35 }),
  screen: c => S({ color: '#111', emissive: c || '#4a86c5', emissiveIntensity: 0.9, roughness: 0.3 }),
  bulb: c => night(S({ color: '#fff6e0', emissive: c || '#ffd28a', roughness: 0.6 }), 2.2),
  facade: c => { const m = S({ map: tex('facade', 24, c), roughness: 0.8, emissiveMap: tex('facadeLit', 24), emissive: '#ffffff' }); return night(m, 1.4); },
  cut: () => S({ color: '#4a4f57', roughness: 0.8 }),
};

const cache = new Map();
export function mat(id) {
  let m = cache.get(id);
  if (!m) { const i = id.indexOf(':'), kind = i < 0 ? id : id.slice(0, i); m = (MAKE[kind] || MAKE.color)(i < 0 ? undefined : id.slice(i + 1)); cache.set(id, m); }
  return m;
}

// What the Paint step offers.
const hues = ['#ffffff', '#f3efe6', '#e8dcc6', '#d9cdb8', '#bfc3c7', '#8d949c', '#4a4f57', '#f7c9c4', '#f29b94', '#e2574c', '#f6b26b', '#f6d77a', '#fff1a8', '#cfe8a9', '#8cc084', '#3f7f6a', '#bfe3ee', '#7fb7e0', '#3f6f8f', '#2f3e6b', '#d7c6ee', '#a98ad6', '#f4b6dc', '#7a5a45'];
export const WALL_PAINTS = [
  ...hues.map(c => ({ id: 'paint:' + c, css: c, name: 'Paint' })),
  { id: 'brick', name: 'Red brick', css: 'repeating-linear-gradient(0deg,#9b4a36 0 7px,#c9c2b6 7px 9px)' },
  { id: 'brickwhite', name: 'White brick', css: 'repeating-linear-gradient(0deg,#eeeae2 0 7px,#c2beb6 7px 9px)' },
  { id: 'stone', name: 'Stone', css: 'radial-gradient(circle at 30% 30%,#b9b2a6,#7d776e)' },
  { id: 'planks:#c79a66', name: 'Wood boards', css: 'repeating-linear-gradient(0deg,#c79a66 0 8px,#9a7448 8px 9px)' },
  { id: 'planks:#6b4a32', name: 'Dark wood', css: 'repeating-linear-gradient(0deg,#6b4a32 0 8px,#49301f 8px 9px)' },
  ...['#ffffff', '#f6d77a', '#a9cbe6', '#b7d3b0', '#e59a8f', '#5d6b7a'].map(c => ({ id: 'siding:' + c, name: 'Siding', css: `repeating-linear-gradient(0deg,${c} 0 8px,rgba(0,0,0,.35) 8px 9px), ${c}` })),
  ...['#f4a6c0', '#8fc3ea', '#9bd3a7'].map(c => ({ id: 'stripes:' + c, name: 'Stripes', css: `repeating-linear-gradient(90deg,#fbf8f2 0 6px,${c} 6px 12px)` })),
  ...['#f29b94', '#7fb7e0', '#f6c453'].map(c => ({ id: 'dots:' + c, name: 'Dots', css: `radial-gradient(${c} 32%,#fbf8f2 36%) 0 0/14px 14px` })),
  ...['#2f3e6b', '#6b3f8f'].map(c => ({ id: 'stars:' + c, name: 'Stars', css: `radial-gradient(#ffe9a8 18%,${c} 24%) 0 0/16px 16px` })),
];
export const FLOOR_PAINTS = [
  { id: 'wood:#f0d9b0', name: 'Light wood', css: 'repeating-linear-gradient(0deg,#f0d9b0 0 8px,#d2b98c 8px 9px)' },
  { id: 'wood:#e2c08f', name: 'Oak', css: 'repeating-linear-gradient(0deg,#d9b27a 0 8px,#b99561 8px 9px)' },
  { id: 'wood:#b98a5a', name: 'Warm wood', css: 'repeating-linear-gradient(0deg,#a8754a 0 8px,#855a37 8px 9px)' },
  { id: 'wood:#7a563c', name: 'Walnut', css: 'repeating-linear-gradient(0deg,#6b4a32 0 8px,#49301f 8px 9px)' },
  { id: 'tile', name: 'White tile', css: 'linear-gradient(#bbb 1px,transparent 1px) 0 0/16px 16px,linear-gradient(90deg,#bbb 1px,#f6f6f3 1px) 0 0/16px 16px' },
  { id: 'checker', name: 'Checkers', css: 'conic-gradient(#2a2a2c 25%,#f3f3f0 0 50%,#2a2a2c 0 75%,#f3f3f0 0) 0 0/20px 20px' },
  { id: 'marble', name: 'Marble', css: 'linear-gradient(125deg,#f6f4f0 40%,#c9c9d2 44%,#f6f4f0 48%,#f6f4f0 70%,#d6d6de 73%,#f6f4f0 76%)' },
  { id: 'concrete', name: 'Concrete', css: '#bdbdb9' },
  { id: 'pavers', name: 'Stone pavers', css: 'linear-gradient(#77736c 2px,transparent 2px) 0 0/14px 14px,linear-gradient(90deg,#77736c 2px,#a9a59c 2px) 0 0/14px 14px' },
  { id: 'grass', name: 'Grass', css: '#6a9a42' },
  ...['#b9c7d8', '#d9cdb8', '#9fd3c7', '#f4b6dc', '#e2574c', '#6f7fb0', '#f6d77a', '#5a5f66'].map(c => ({ id: 'carpet:' + c, name: 'Carpet', css: c })),
];
export const ROOF_PAINTS = [
  ['#b5533c', 'Terracotta'], ['#7a3b2e', 'Dark red'], ['#555b63', 'Slate'], ['#2f3336', 'Charcoal'], ['#8a6a4a', 'Wood shingle'], ['#3f7f6a', 'Green'], ['#3f6f8f', 'Blue'], ['#e9e6df', 'White'],
].map(([c, name]) => ({ id: 'rooftile:' + c, name, css: c }));
export const ITEM_COLORS = ['#ffffff', '#d9cdb8', '#8d949c', '#2f3336', '#e2574c', '#f29b94', '#f6a25a', '#f6d77a', '#8cc084', '#3f7f6a', '#7fb7e0', '#3f6f8f', '#a98ad6', '#f4b6dc', '#7a5a45'];
