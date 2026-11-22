// Checks for the maths behind DREAMO. Open tests.html to run them.
import { findRooms, roomAt } from '../geometry/rooms.js';
import { computeJoins, wallGeometry, wallOpenings } from '../geometry/walls.js';
import { asRect } from '../geometry/roof.js';
import { wall, newHouse, STARTERS, WALL_H, uid } from '../model.js';
import { History, store } from '../store.js';
import { ITEMS, DEFS } from '../catalog/items.js';
import { search } from '../catalog/words.js';
import { makeDef } from '../catalog/makeup.js';
import { placeSpec, placeInfo } from '../places.js';
import { buildEnvironment } from '../scene/environments.js';

const out = document.getElementById('out'); let pass = 0, fail = 0;
const test = (name, fn) => { let err; try { fn(); } catch (e) { err = e; } err ? fail++ : pass++; out.insertAdjacentHTML('beforeend', `<div class="${err ? 'bad' : 'ok'}">${err ? '✗' : '✓'} ${name}${err ? ' — ' + err.message : ''}</div>`); };
const eq = (a, b, msg = '') => { if (Math.abs(a - b) > 1e-6) throw new Error(`${msg} expected ${b}, got ${a}`); };
const rect = (x0, z0, x1, z1) => [wall(x0, z1, x1, z1), wall(x1, z1, x1, z0), wall(x1, z0, x0, z0), wall(x0, z0, x0, z1)];
const areas = r => r.rooms.map(x => x.area).sort((a, b) => a - b);

test('a square makes one room', () => { const r = findRooms(rect(0, 0, 4, 3)); eq(r.rooms.length, 1); eq(r.rooms[0].area, 12); eq(r.outlines.length, 1); });
test('an open wall makes no room', () => { eq(findRooms(rect(0, 0, 4, 3).slice(0, 3)).rooms.length, 0); });
test('an L shape is one room', () => { const p = [[0, 0], [6, 0], [6, 2], [2, 2], [2, 5], [0, 5]]; const r = findRooms(p.map((a, i) => wall(...a, ...p[(i + 1) % 6]))); eq(r.rooms.length, 1); eq(r.rooms[0].area, 18); });
test('a dividing wall makes two rooms', () => { const r = findRooms([...rect(0, 0, 6, 4), wall(2, 0, 2, 4)]); eq(r.rooms.length, 2); eq(areas(r)[0], 8); eq(areas(r)[1], 16); eq(r.outlines.length, 1); });
test('walls that cross are split', () => { const r = findRooms([...rect(0, 0, 4, 4), wall(-1, 2, 5, 2), wall(2, -1, 2, 5)]); eq(r.rooms.length, 4); areas(r).forEach(a => eq(a, 4)); });
test('overlapping rectangles make three rooms', () => { const r = findRooms([...rect(0, 0, 4, 4), ...rect(2, 2, 6, 6)]); eq(r.rooms.length, 3); eq(areas(r).reduce((a, b) => a + b), 28); });
test('rooms that share a wall line', () => { const r = findRooms([...rect(0, 0, 4, 4), ...rect(4, 1, 7, 3)]); eq(r.rooms.length, 2); eq(r.outlines.length, 1); });
test('a small building inside a room cuts a hole', () => { const r = findRooms([...rect(0, 0, 10, 10), ...rect(4, 4, 6, 6)]); eq(r.rooms.length, 2); const big = r.rooms.find(x => x.area > 50); eq(big.holes.length, 1); eq(roomAt([big], 5, 5), -1); eq(roomAt([big], 1, 1), 0); });
test('a loose wall end does not break a room', () => { eq(findRooms([...rect(0, 0, 4, 4), wall(4, 4, 7, 7)]).rooms.length, 1); });
test('corners are mitred', () => { const ws = rect(0, 0, 4, 3), j = computeJoins(ws); for (const w of ws) { const x = j.get(w.id); if (x.capA || x.capB) throw new Error('corner left open'); eq(Math.abs(x.la), 0.1); eq(Math.abs(x.ra), 0.1); } });
test('a wall with a door and window builds', () => { const w = wall(0, 0, 6, 0, [['door', 1.5], ['window', 4]]), j = computeJoins([w]).get(w.id); eq(wallOpenings(w, j.L).length, 2); const g = wallGeometry(w, j, WALL_H, false); eq(g.groups.length, 3); if (!wallGeometry(w, j, 1, true)) throw new Error('no low wall'); });
test('openings that do not fit are skipped', () => { const w = wall(0, 0, 1, 0, [['garage', 0.5]]); eq(wallOpenings(w, 1).length, 0); });
test('rectangle outlines are recognised for sloped roofs', () => { const r = findRooms([...rect(0, 0, 8, 6), wall(3, 0, 3, 6)]); const q = asRect(r.outlines[0]); eq(q.A, 4); eq(q.B, 3); if (asRect([[0, 0], [6, 0], [6, 2], [2, 2], [2, 5], [0, 5]])) throw new Error('L is not a rectangle'); });
test('starter houses have rooms on every floor', () => { for (const k of Object.keys(STARTERS)) { const h = newHouse('t', 'forest', k); if (k !== 'blank') h.floors.forEach((f, i) => { if (!findRooms(f.walls).rooms.length) throw new Error(k + ' floor ' + i); }); } });
test('undo and redo', () => { const h = { n: 1 }, H = new History(h); h.n = 2; H.push(h); h.n = 3; H.push(h); eq(H.undo().n, 2); eq(H.undo().n, 1); eq(H.redo().n, 2); });
test('a house saved to a file comes back', () => {
  const real = { ...localStorage }; localStorage.clear();
  try {
    const a = newHouse('File test', 'beach', 'cottage'); store.save(a, 'data:image/jpeg;base64,AAAA');
    const file = store.toFile([a.id]); localStorage.clear();
    eq(store.fromFile(file, uid), 1); const b = store.load(a.id);
    if (JSON.stringify(b) !== JSON.stringify(a)) throw new Error('house changed'); if (!store.list()[0].thumb) throw new Error('picture lost');
    eq(store.fromFile(file, uid), 1, 'same file again adds a second house'); eq(store.list().length, 2);
    eq(store.fromFile('not a house', uid), 0); eq(store.fromFile('{"houses":[{"house":{"name":"x"}}]}', uid), 0);
  } finally { localStorage.clear(); for (const [k, v] of Object.entries(real)) localStorage.setItem(k, v); }
});
test('every catalog item builds', () => { for (const d of ITEMS) { const g = d.make(d.color); if (!g || !g.children.length) throw new Error(d.id); } });
test('every item has its own id', () => { const seen = new Set(); for (const d of ITEMS) { if (seen.has(d.id)) throw new Error('twice: ' + d.id); seen.add(d.id); } if (ITEMS.length < 180) throw new Error('only ' + ITEMS.length); });
test('search finds things by other names, plurals and typos', () => {
  const top = q => search(q, ITEMS).results[0]?.def.id;
  for (const [q, id] of [['couch', 'sofa'], ['beds', 'bedSingle'], ['refrigerator', 'fridge'], ['trampolene', 'trampoline'], ['pool table', 'poolTable'], ['t rex', 'dinosaur'], ['bouncy castle', 'bounceHouse'], ['hamper', 'laundryBasket']]) if (top(q) !== id) throw new Error(`${q} gave ${top(q)}`);
  const p = search('pink bed', ITEMS); if (p.parsed.color !== '#f4b6dc' || !p.results[0].def.id.toLowerCase().includes('bed')) throw new Error('pink bed');
});
test('made-up things are always the same and they build', () => {
  for (const q of ['purple dragon', 'giant glowing robot', 'rainbow pizza', 'flibberjab', 'golden throne', 'tiny cat']) {
    const a = makeDef(q), b = makeDef(q); if (a.made !== b.made || a.w !== b.w) throw new Error(q);
    const g = a.make(a.color); if (!g.children.length) throw new Error('empty ' + q);
  }
  if (makeDef('purple dragon').color !== '#a98ad6') throw new Error('colour'); if (makeDef('giant cat').w <= makeDef('cat').w) throw new Error('size');
  if (DEFS['made:blue alien'].name !== 'Blue Alien') throw new Error('DEFS');
});
test('typed places make a scene', () => {
  if (placeSpec('forest').preset !== 'forest') throw new Error('preset');
  const c = placeSpec('candy land'); if (!c.trees.some(t => t[0].startsWith('lolly'))) throw new Error('candy');
  if (!placeSpec('the moon').space) throw new Error('moon'); if (placeSpec('desert island').water !== 'island') throw new Error('island');
  for (const t of ['candy land', 'the moon', 'jungle with a lake', 'volcano', 'zorbleflax', 'farm village', 'underwater', 'arctic']) { const e = buildEnvironment(t); if (!e.group.children.length) throw new Error(t); if (!placeInfo(t).name) throw new Error('name ' + t); }
});
out.insertAdjacentHTML('afterbegin', `<h2 id="summary" class="${fail ? 'bad' : 'ok'}">${pass} passed, ${fail} failed</h2>`);
