// When someone types a thing DREAMO doesn't have, make one up: pick a shape that fits the words,
// then colour, size and decorate it. The same words always make the same thing.
import { box, cyl, sph, cone, torus, rbox, turn, legs, group, rand } from './parts.js';
import { parse, RAINBOW } from './words.js';

const WOOD = 'grain:#c79a66', DARK = 'grain:#6b4a32', BLACK = 'color:#2f3336', STEEL = 'metal', GOLD = 'metal:#d9a441';
const col = c => 'color:' + c, gl = c => 'gloss:' + c, fab = c => 'fabric:' + c;
const FUN = ['#e2574c', '#f6a25a', '#f6d77a', '#8cc084', '#7fb7e0', '#a98ad6', '#f4b6dc', '#3f9f9a'];
const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (r, a) => a[(r() * a.length) | 0];
const face = m => turn(m, Math.PI / 2);

// shape: [w, d, h, light?, flat?, make(c, r, paint)] — paint(i) gives a colour (rainbow cycles).
const SHAPES = {
  table: [1.4, 0.8, 0.76, 0, 0, (c, r, p) => [rbox(1.4, 0.05, 0.8, gl(p(0)), 0, 0.71, 0, 0.02), legs(1.4, 0.8, 0.71, gl(p(1)), 0.06)]],
  chair: [0.55, 0.55, 1, 0, 0, (c, r, p) => [rbox(0.5, 0.08, 0.5, fab(p(0)), 0, 0.43, 0, 0.03), rbox(0.5, 0.55, 0.06, gl(p(1)), 0, 0.48, -0.22, 0.03), legs(0.5, 0.5, 0.43, gl(p(2)), 0.04)]],
  seat: [1.8, 0.95, 0.85, 0, 0, (c, r, p) => [rbox(1.8, 0.35, 0.95, fab(p(0)), 0, 0.08, 0, 0.1), rbox(1.8, 0.5, 0.25, fab(p(1)), 0, 0.4, -0.35, 0.1), [-1, 1].map(s => rbox(0.22, 0.4, 0.95, fab(p(2)), s * 0.79, 0.2, 0, 0.08)), legs(1.7, 0.85, 0.08, DARK)]],
  stool: [0.45, 0.45, 0.7, 0, 0, (c, r, p) => [cyl(0.2, 0.06, fab(p(0)), 0, 0.64, 0), cyl(0.03, 0.64, gl(p(1)), 0, 0, 0, 0.03, 8), cyl(0.18, 0.03, gl(p(1)))]],
  bed: [1.6, 2.2, 1, 0, 0, (c, r, p) => [box(1.6, 0.25, 2.1, gl(p(1)), 0, 0.1, 0), rbox(1.5, 0.2, 2, fab('#ffffff'), 0, 0.35, 0, 0.06), rbox(1.55, 0.1, 1.3, fab(p(0)), 0, 0.52, 0.35, 0.04), rbox(1.6, 0.9, 0.1, gl(p(2)), 0, 0.1, -1.05, 0.04), [-0.38, 0.38].map(x => rbox(0.55, 0.13, 0.36, fab('#ffffff'), x, 0.55, -0.75, 0.06))]],
  shelf: [1, 0.4, 1.9, 0, 0, (c, r, p) => [[-0.48, 0.48].map(x => box(0.04, 1.9, 0.4, gl(p(0)), x)), [0, 0.47, 0.94, 1.41, 1.86].map(y => box(1, 0.04, 0.4, gl(p(0)), 0, y)), [0.05, 0.52, 0.99, 1.46].map((y, i) => Array.from({ length: 4 }, (_, j) => box(0.18, 0.25 + r() * 0.12, 0.25, col(pick(r, FUN)), -0.33 + j * 0.22, y, 0)))]],
  cabinet: [1.2, 0.5, 1, 0, 0, (c, r, p) => [rbox(1.2, 0.9, 0.5, gl(p(0)), 0, 0.1, 0, 0.02), legs(1.1, 0.45, 0.1, DARK, 0.04), [0.3, 0.6].map(y => box(1.14, 0.008, 0.01, BLACK, 0, y + 0.1, 0.25)), [-0.3, 0.3].map(x => sph(0.03, GOLD, x, 0.75, 0.26))]],
  chest: [1, 0.6, 0.75, 0, 0, (c, r, p) => [box(0.95, 0.5, 0.55, gl(p(0))), turn(cyl(0.275, 0.95, gl(p(0)), 0, 0.5, 0, 0.275, 12), 0, 0, Math.PI / 2), [-0.3, 0.3].map(x => box(0.06, 0.52, 0.57, GOLD, x)), box(0.12, 0.14, 0.03, GOLD, 0, 0.42, 0.28)]],
  lamp: [0.5, 0.5, 1.7, [0, 1.5, 0], 0, (c, r, p) => [cyl(0.18, 0.04, gl(p(1))), cyl(0.02, 1.4, gl(p(1)), 0, 0.04, 0, 0.02, 8), cyl(0.25, 0.32, 'bulb:' + p(0), 0, 1.38, 0, 0.15)]],
  screen: [1.8, 0.5, 1.4, [0, 1, 0.6], 0, (c, r, p) => [rbox(1.6, 0.45, 0.45, gl(p(1)), 0, 0.05, 0, 0.02), legs(1.6, 0.45, 0.05, BLACK), rbox(1.5, 0.85, 0.05, BLACK, 0, 0.55, 0, 0.02), box(1.42, 0.77, 0.01, 'screen:' + p(0), 0, 0.59, 0.03)]],
  statue: [0.8, 0.8, 2, 0, 0, (c, r, p) => [box(0.7, 0.6, 0.7, 'marble'), cyl(0.2, 0.7, gl(p(0)), 0, 0.6, 0, 0.14, 12), sph(0.28, gl(p(0)), 0, 1.5, 0), sph(0.17, gl(p(1)), 0, 1.9, 0)]],
  plant: [0.8, 0.8, 1.6, 0, 0, (c, r, p) => [cyl(0.22, 0.4, gl(p(1)), 0, 0, 0, 0.26), Array.from({ length: 7 }, (_, i) => sph(0.22 + r() * 0.1, col(i % 2 ? '#3d8f3f' : '#5aa84e'), (r() - 0.5) * 0.4, 0.7 + r() * 0.7, (r() - 0.5) * 0.4, 1, 8)), Array.from({ length: 5 }, () => sph(0.07, col(p(0)), (r() - 0.5) * 0.6, 0.8 + r() * 0.7, (r() - 0.5) * 0.6 + 0.1, 1, 8))]],
  rug: [2.2, 1.5, 0.03, 0, 1, (c, r, p) => [rbox(2.2, 0.02, 1.5, fab(p(0)), 0, 0.005, 0, 0.01), box(1.9, 0.022, 1.2, fab(p(1)), 0, 0.005, 0), box(1.5, 0.024, 0.8, fab(p(2)), 0, 0.005, 0)]],
  machine: [1, 0.8, 1.8, [0, 1.2, 0.6], 0, (c, r, p) => [rbox(1, 1.8, 0.8, gl(p(0)), 0, 0, 0, 0.04), box(0.7, 0.5, 0.01, 'screen:' + pick(r, ['#5ab0ff', '#ffcf4a', '#5ff0a0']), 0, 1.1, 0.405), Array.from({ length: 6 }, (_, i) => sph(0.04, col(pick(r, FUN)), -0.25 + (i % 3) * 0.25, 0.7 + (i > 2 ? 0.12 : 0), 0.41)), box(0.6, 0.12, 0.02, BLACK, 0, 0.25, 0.405)]],
  tower: [1.4, 1.4, 4, 0, 0, (c, r, p) => [cyl(0.6, 3, gl(p(0)), 0, 0, 0, 0.5, 12), cone(0.7, 1, gl(p(1)), 0, 3, 0, 12), box(0.4, 0.8, 0.05, DARK, 0, 0, 0.58), [1.2, 2.1].map(y => face(cyl(0.12, 0.05, 'glass', 0, y, 0.5)))]],
  ball: [1.2, 1.2, 1.2, 0, 0, (c, r, p) => [sph(0.6, gl(p(0)), 0, 0.6, 0, 1, 24), turn(torus(0.61, 0.05, gl(p(1)), 0, 0.6, 0), 0, 0, 0), turn(torus(0.61, 0.05, gl(p(2)), 0, 0.6, 0), Math.PI / 2)]],
  clock: [0.6, 0.4, 2, 0, 0, (c, r, p) => [rbox(0.55, 1.9, 0.35, gl(p(0)), 0, 0, 0, 0.03), face(cyl(0.2, 0.02, col('#ffffff'), 0, 1.55, 0.18)), box(0.01, 0.14, 0.01, BLACK, 0, 1.56, 0.2), box(0.1, 0.01, 0.01, BLACK, 0.04, 1.55, 0.2)]],
  tent: [1.8, 1.8, 2, 0, 0, (c, r, p) => [cone(0.9, 1.9, fab(p(0)), 0, 0, 0, 8), box(0.5, 0.8, 0.02, col('#3a2a1e'), 0, 0, 0.7)]],
  tank: [1.2, 0.5, 1.4, [0, 1.1, 0.3], 0, (c, r, p) => [rbox(1.2, 0.7, 0.5, gl(p(1)), 0, 0, 0, 0.02), box(1.16, 0.6, 0.46, 'glass', 0, 0.7, 0), box(1.1, 0.5, 0.4, 'water', 0, 0.72, 0), Array.from({ length: 5 }, () => sph(0.05, col(pick(r, FUN)), (r() - 0.5) * 0.9, 0.85 + r() * 0.3, (r() - 0.5) * 0.25, 0.7, 8))]],
  vehicle: [2, 4, 1.6, 0, 0, (c, r, p) => [rbox(1.9, 0.7, 4, gl(p(0)), 0, 0.3, 0, 0.2), rbox(1.6, 0.6, 2, gl(p(0)), 0, 0.95, -0.3, 0.2), box(1.62, 0.45, 1.6, 'glass', 0, 1.0, -0.3), [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z]) => turn(cyl(0.34, 0.24, BLACK, x * 0.85, 0.34 - 0.12, z * 1.3, 0.34, 16), 0, 0, Math.PI / 2))]],
  sign: [1.4, 0.3, 2, [0, 1.5, 0.4], 0, (c, r, p) => [box(0.08, 1.2, 0.08, BLACK), box(1.4, 0.8, 0.08, gl(p(1)), 0, 1.2, 0), box(1.2, 0.6, 0.02, 'screen:' + p(0), 0, 1.3, 0.05)]],
  critter: [1, 1.6, 1.3, 0, 0, (c, r, p) => { const ears = pick(r, ['round', 'pointy', 'long']), tall = 0.7 + r() * 0.3; return [rbox(0.7, 0.6, 1.1, gl(p(0)), 0, 0.45, 0, 0.25), [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z]) => cyl(0.1, 0.5, gl(p(0)), x * 0.22, 0, z * 0.38, 0.1, 8)), sph(0.32, gl(p(0)), 0, tall + 0.3, 0.55, 1, 16), sph(0.14, gl(p(1)), 0, tall + 0.22, 0.82, 0.8, 10), [-1, 1].map(s => [sph(0.05, BLACK, s * 0.13, tall + 0.4, 0.82, 1, 8), ears === 'round' ? sph(0.1, gl(p(0)), s * 0.22, tall + 0.58, 0.5, 1, 8) : ears === 'pointy' ? cone(0.1, 0.22, gl(p(0)), s * 0.2, tall + 0.5, 0.5, 8) : turn(sph(0.08, gl(p(0)), s * 0.14, tall + 0.72, 0.48, 2.6, 8), 0, 0, s * 0.2)]), turn(cyl(0.05, 0.6, gl(p(1)), 0, 0.6, -0.55, 0.03, 6), -0.9)]; }],
  monster: [1.6, 1.4, 2.4, 0, 0, (c, r, p) => [sph(0.7, gl(p(0)), 0, 0.85, 0, 1.15, 18), [-1, 1].map(s => [sph(0.2, col('#ffffff'), s * 0.25, 1.55, 0.5), sph(0.09, BLACK, s * 0.25, 1.55, 0.67), cone(0.12, 0.45, gl(p(1)), s * 0.35, 1.75, 0, 8), cyl(0.15, 0.4, gl(p(0)), s * 0.35, 0, 0.1, 0.15, 8), turn(cyl(0.1, 0.6, gl(p(0)), s * 0.75, 0.85, 0.1, 0.1, 8), 0, 0, s * 0.9)]), box(0.5, 0.06, 0.05, BLACK, 0, 1.15, 0.67), Array.from({ length: 5 }, (_, i) => cone(0.08, 0.2, gl(p(2)), 0, 1.55 + Math.sin(i / 4 * 3) * 0.3, -0.3 - i * 0.12, 6))]],
  box: [1, 1, 1, 0, 0, (c, r, p) => [rbox(1, 1, 1, gl(p(0)), 0, 0, 0, 0.06), box(1.02, 0.12, 0.2, gl(p(1)), 0, 0.5, 0), box(0.2, 1.02, 1.02, gl(p(1)), 0, -0.01, 0)]],
  food: [1.2, 1.2, 1, 0, 0, (c, r, p) => [cyl(0.6, 0.4, col('#d9a45a'), 0, 0, 0, 0.6, 24), cyl(0.62, 0.15, gl(p(0)), 0, 0.4, 0, 0.62, 24), Array.from({ length: 12 }, () => sph(0.06, col(pick(r, FUN)), (r() - 0.5) * 0.9, 0.57, (r() - 0.5) * 0.9, 0.6, 6)), sph(0.13, gl('#c22d2d'), 0, 0.65, 0)]],
  house: [2, 2, 2.4, 0, 0, (c, r, p) => [box(1.9, 1.4, 1.9, gl(p(0))), turn(cone(1.5, 1, gl(p(1)), 0, 1.4, 0, 4), 0, Math.PI / 4), box(0.6, 1, 0.02, DARK, 0, 0, 0.96), [-0.55, 0.55].map(x => box(0.35, 0.35, 0.02, 'glass', x, 0.7, 0.96))]],
  flower: [1, 1, 1.4, 0, 0, (c, r, p) => [cyl(0.03, 1.1, col('#4f8f3f'), 0, 0, 0, 0.03, 6), Array.from({ length: 6 }, (_, i) => face(cyl(0.16, 0.04, col(p(0)), Math.cos(i * 1.05) * 0.2, 1.15 + Math.sin(i * 1.05) * 0.2, 0, 0.16, 10))), face(cyl(0.13, 0.06, col('#f6d77a'), 0, 1.15, 0.02, 0.13, 12)), turn(sph(0.15, col('#5aa84e'), 0.15, 0.5, 0, 0.3, 8), 0, 0, -0.5)]],
};

// Which words point to which shape.
const NOUNS = {
  table: 'table desk counter workbench altar podium', chair: 'chair throne seat', seat: 'sofa couch bench lounge futon', stool: 'stool', bed: 'bed mattress hammock cot',
  shelf: 'shelf bookcase rack library', cabinet: 'cabinet cupboard drawer dresser closet wardrobe locker safe', chest: 'chest trunk crate box treasure', lamp: 'lamp light lantern torch glow',
  screen: 'tv television monitor computer laptop screen tablet', statue: 'statue trophy sculpture bust idol', plant: 'plant tree bush cactus fern vine', rug: 'rug carpet mat blanket towel',
  machine: 'machine arcade console robot computer generator oven microwave toaster blender', tower: 'tower castle lighthouse rocket silo turret chimney', ball: 'ball planet globe orb egg bubble',
  clock: 'clock watch', tent: 'tent teepee tipi hut', tank: 'tank aquarium terrarium cage', vehicle: 'car truck bus van train jeep tank limo taxi wagon spaceship ship boat plane jet kart',
  sign: 'sign poster billboard banner neon', box: 'box present gift cube block package', food: 'cake pizza pie burger cookie donut sandwich taco cupcake waffle pancake',
  house: 'house shed cabin barn hut kennel coop', flower: 'flower rose daisy tulip lily orchid',
  critter: 'dog puppy cat kitten bunny rabbit bear panda pig cow horse pony sheep goat fox wolf lion tiger mouse hamster deer elephant giraffe zebra monkey koala penguin duck chicken owl bird frog turtle llama alpaca unicorn dragon dino pet animal sloth otter',
  monster: 'monster alien ghost zombie troll ogre goblin yeti creature beast slime',
};
const NOUN_OF = {};
for (const [shape, words] of Object.entries(NOUNS)) for (const w of words.split(' ')) NOUN_OF[w] ||= shape;
const MATS = { wood: 'grain:', wooden: 'grain:', metal: 'metal:', steel: 'metal:', gold: 'metal:', golden: 'metal:', glass: 'glass', crystal: 'glass', ice: 'glass', stone: 'stone', marble: 'marble', velvet: 'fabric:', fluffy: 'fabric:', soft: 'fabric:' };
const LIGHTY = /glow|light|lamp|neon|shiny|magic|lava|fire|sparkl/;

export function shapeFor(words, r) {
  for (let i = words.length - 1; i >= 0; i--) if (NOUN_OF[words[i]]) return NOUN_OF[words[i]];
  for (let i = words.length - 1; i >= 0; i--) { const w = words[i]; const k = Object.keys(NOUN_OF).find(n => n.length > 3 && (w.includes(n) || n.includes(w) && w.length > 3)); if (k) return NOUN_OF[k]; }
  return pick(r, ['critter', 'monster', 'statue', 'machine', 'box', 'tower', 'ball', 'cabinet', 'table', 'lamp', 'plant']);
}

export function makeDef(text) {
  const p = parse(text), key = p.raw, r0 = rand(hash(key) % 100000 + 1);
  const shape = shapeFor(p.words, r0), [w, d, h, light, flat, build] = SHAPES[shape];
  const base = p.color && p.color !== 'rainbow' ? p.color : pick(r0, FUN);
  const matWord = p.raw.split(' ').find(x => MATS[x]);
  const glows = LIGHTY.test(p.raw);
  const s = p.scale * (p.words.some(w => /^(dragon|elephant|giraffe|dino|dinosaur|horse|unicorn|whale|yeti|troll|ogre|bear|monster)$/.test(w)) ? 1.8 : 1);
  const name = (p.raw || 'Something').replace(/\b\w/g, m => m.toUpperCase());
  return {
    id: 'made:' + key, name, cat: 'made', made: shape, w: +(w * s).toFixed(2), d: +(d * s).toFixed(2), h: +(h * s).toFixed(2), color: base,
    flat: !!flat, light: light ? light.map(v => v * s) : glows ? [0, h * s * 0.7, 0] : undefined, lightColor: glows ? base : undefined,
    make: c => {
      const r = rand(hash(key) % 100000 + 7);
      const paint = p.color === 'rainbow' ? i => RAINBOW[i % RAINBOW.length] : i => i === 0 ? c : pick(rand(hash(key + i)), FUN);
      let parts = build(c, r, paint);
      const g = group(parts);
      if (matWord || glows) g.traverse(o => {
        if (!o.isMesh || !o.material?.color) return;
        if (matWord) { const m = MATS[matWord]; const hex = '#' + o.material.color.getHexString(); o.material = box(0.01, 0.01, 0.01, m.endsWith(':') ? m + (m === 'metal:' && /gold/.test(matWord) ? '#d9a441' : hex) : m).material; }
        if (glows && o.material.emissive && !o.material.userData?.glowed) { o.material = o.material.clone(); o.material.emissive.copy(o.material.color); o.material.emissiveIntensity = 0.35; o.material.userData.glowed = true; }
      });
      // a little extra so made-up things look special
      if (/rainbow|magic|sparkl|glitter|fairy/.test(p.raw)) for (let i = 0; i < 10; i++) g.add(sph(0.05, 'bulb:' + RAINBOW[i % 6], (r() - 0.5) * w, h * (0.3 + r() * 0.9), (r() - 0.5) * d, 1, 6));
      if (/crown|king|queen|royal|princess|prince/.test(p.raw)) g.add(group(cyl(0.2, 0.15, GOLD, 0, h, 0, 0.22, 10), Array.from({ length: 5 }, (_, i) => cone(0.04, 0.12, GOLD, Math.cos(i * 1.26) * 0.18, h + 0.15, Math.sin(i * 1.26) * 0.18, 5))));
      if (/fire|lava|flame|hot/.test(p.raw)) for (let i = 0; i < 3; i++) g.add(cone(0.12, 0.35, 'screen:' + ['#ff7a1a', '#ffd23f', '#ff4a1a'][i], (i - 1) * 0.15, h, 0, 6));
      if (/wing|flying|angel|fairy|dragon/.test(p.raw)) [-1, 1].forEach(sd => { const wg = sph(0.5, 'gloss:' + c, sd * w * 0.55, h * 0.75, 0, 0.12, 10); wg.scale.set(1, 0.12, 0.6); wg.rotation.z = sd * 0.5; g.add(wg); });
      if (/spike|spiky|dragon|dino/.test(p.raw)) for (let i = 0; i < 5; i++) g.add(cone(0.07, 0.2, 'gloss:#f6d77a', 0, h * 0.85, d * 0.25 - i * d * 0.12, 5));
      if (s !== 1) g.scale.setScalar(s);
      return g;
    },
  };
}
