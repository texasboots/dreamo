// The shape of a DREAMO house. Everything on screen is rebuilt from this plain data.
export const WALL_H = 2.7, WALL_T = 0.2, FLOOR_H = 3, SLAB = 0.3, GRID = 0.5, PLOT = 44;
export const DEF_WALL = 'paint:#f3efe6', DEF_FLOOR = 'wood:#e2c08f';
export const uid = () => Math.random().toString(36).slice(2, 9);
export const floorBase = i => i * FLOOR_H;          // level -1 is the basement, 3 m underground
// Every level of a house, lowest first: [level, floor]. The basement (if dug) is level -1.
export const levels = h => [...(h.basement ? [[-1, h.basement]] : []), ...h.floors.map((f, i) => [i, f])];
export const floorAt = (h, i) => (i === -1 ? h.basement : h.floors[i]);

export const OPENINGS = {
  door:          { name: 'Door',            w: 0.9, h: 2.1, sill: 0 },
  doorDouble:    { name: 'Double door',     w: 1.6, h: 2.1, sill: 0 },
  slider:        { name: 'Glass door',      w: 2.4, h: 2.2, sill: 0 },
  arch:          { name: 'Open doorway',    w: 1.2, h: 2.2, sill: 0 },
  garage:        { name: 'Garage door',     w: 3.0, h: 2.3, sill: 0 },
  window:        { name: 'Window',          w: 1.0, h: 1.2, sill: 0.9 },
  windowWide:    { name: 'Wide window',     w: 2.0, h: 1.4, sill: 0.7 },
  windowTall:    { name: 'Tall window',     w: 0.8, h: 2.0, sill: 0.3 },
  windowSquare:  { name: 'Small window',    w: 0.6, h: 0.6, sill: 1.4 },
  windowPicture: { name: 'Picture window',  w: 3.0, h: 1.8, sill: 0.4 },
};

export const ENVS = {
  forest: { name: 'Forest',         emoji: '🌲', css: 'linear-gradient(#9ed0ee,#cfe9c4 55%,#5c9a48 56%)' },
  beach:  { name: 'Beach',          emoji: '🏝️', css: 'linear-gradient(#8fd3f4,#bfeaf5 45%,#3fa7c9 46%,#3fa7c9 62%,#ecd9a6 63%)' },
  snow:   { name: 'Snowy mountain', emoji: '🏔️', css: 'linear-gradient(#a9c8e8,#e4eef7 55%,#f6f9fc 56%)' },
  city:   { name: 'City',           emoji: '🏙️', css: 'linear-gradient(#b7d3ea,#e6eef5 50%,#8d949c 51%,#8d949c 70%,#6a9a42 71%)' },
};

export function wall(ax, az, bx, bz, ops = [], paint) {
  return { id: uid(), a: [ax, az], b: [bx, bz], paint: paint ? [...paint] : [DEF_WALL, DEF_WALL],
    openings: ops.map(([kind, t, color]) => ({ id: uid(), kind, t, ...(color ? { color } : {}) })) };
}
export const item = (type, x, z, rot = 0, color) => ({ id: uid(), type, x, z, rot, ...(color ? { color } : {}) });
export const newFloor = () => ({ walls: [], items: [], floorPaint: [] });

// Four walls going round a rectangle, outside faces on the left of each wall.
function box(x0, z0, x1, z1, ops = {}, paint) {
  return [
    wall(x0, z1, x1, z1, ops.front, paint), wall(x1, z1, x1, z0, ops.right, paint),
    wall(x1, z0, x0, z0, ops.back, paint),  wall(x0, z0, x0, z1, ops.left, paint),
  ];
}

export const STARTERS = {
  blank: { name: 'Blank land', emoji: '🌱', note: 'Build everything yourself', make() {} },
  cottage: { name: 'Cozy cottage', emoji: '🏡', note: 'Small and sweet, two rooms', make(h) {
    const f = h.floors[0], out = ['brick', DEF_WALL];
    f.walls.push(...box(-4, -3, 4, 3, {
      front: [['window', 1.5], ['door', 4, '#3f6f8f'], ['window', 6.5]], right: [['window', 3]],
      back: [['windowWide', 2.5], ['window', 6]], left: [['window', 3]] }, out));
    f.walls.push(wall(0.5, -3, 0.5, 3, [['door', 4.2]]));
    f.floorPaint.push({ x: 2.5, z: 0, m: 'carpet:#b9c7d8' });
    f.items.push(item('sofa', -2, -2.2), item('rug', -2, -0.3, 0, '#c96f6f'), item('coffeeTable', -2, -0.6), item('tv', -2, 2.6, Math.PI),
      item('plant', -3.5, 2.4), item('bed', 2.6, -1.8), item('nightstand', 1.1, -2.6), item('wardrobe', 3.6, 1.6, -Math.PI / 2),
      item('ceilingLamp', -2, 0), item('ceilingLamp', 2.5, 0), item('gardenLamp', 5.5, 4.5), item('treeLeafy', -7, 5), item('flowers', -2, 4), item('flowers', 2, 4, 0, '#f2c14e'), item('mailbox', 5.5, 6));
    h.roof = { style: 'gable', mat: 'rooftile:#b5533c' };
  } },
  modern: { name: 'Modern home', emoji: '🏢', note: 'Two floors, big windows, a pool', make(h) {
    const f = h.floors[0], out = ['paint:#ffffff', DEF_WALL];
    f.walls.push(...box(-6, -4, 6, 4, {
      front: [['windowPicture', 3], ['doorDouble', 6.6, '#2f3336'], ['windowPicture', 10]], right: [['slider', 4]],
      back: [['windowWide', 3], ['windowWide', 9]], left: [['windowTall', 2.5], ['windowTall', 5.5]] }, out));
    f.walls.push(wall(1, -4, 1, 0, [['arch', 2]]), wall(1, 0, 6, 0, [['door', 3.5]]));
    f.floorPaint.push({ x: -2, z: 0, m: 'wood:#b98a5a' }, { x: 3, z: -2, m: 'tile' }, { x: 3, z: 2, m: 'wood:#b98a5a' });
    f.items.push(item('stairs', -5.2, 0.5), item('sofa', -2.2, 2.9, Math.PI), item('coffeeTable', -2.2, 1.6), item('tv', -2.2, -3.6),
      item('counter', 2, -3.6), item('sinkCounter', 3, -3.6), item('stove', 3.9, -3.6), item('fridge', 5.4, -3.5),
      item('diningTable', 3.5, 2), item('chair', 3, 2.9, Math.PI), item('chair', 4, 2.9, Math.PI), item('chair', 3, 1.1), item('chair', 4, 1.1),
      item('ceilingLamp', -2, 0), item('ceilingLamp', 3.5, -2), item('ceilingLamp', 3.5, 2), item('floorLamp', -0.3, 3.3), item('gardenLamp', 7.5, -3), item('gardenLamp', -3, 6), item('pool', 11, 0, Math.PI / 2), item('lounger', 8, 5.5), item('lounger', 9.2, 5.5), item('palm', -9, 6), item('car', -1, 9, Math.PI / 2, '#d94f4f'));
    const u = newFloor(); h.floors.push(u);
    u.walls.push(...box(-6, -4, 3, 4, {
      front: [['windowPicture', 4.5]], right: [['slider', 4]], back: [['windowWide', 3]], left: [['windowTall', 6]] }, out));
    u.walls.push(wall(-1.5, -4, -1.5, 1, [['door', 4]]));
    u.floorPaint.push({ x: 1, z: -2, m: 'carpet:#d9cdb8' });
    u.items.push(item('ceilingLamp', 0.8, -1.5), item('ceilingLamp', -3.8, 0), item('bed', 1.6, -2.6), item('nightstand', 0.2, -3.6), item('desk', -3.6, -3.5), item('chair', -3.6, -2.8, Math.PI), item('bookshelf', -1.9, 3.7, Math.PI));
    h.roof = { style: 'flat', mat: 'rooftile:#555b63' };
  } },
  funhouse: { name: 'Fun house', emoji: '🎢', note: 'L-shaped, with a slide and trampoline', make(h) {
    const f = h.floors[0], out = ['siding:#f6d77a', 'paint:#fdf3e2'];
    const p = [[-6, 4], [2, 4], [2, 0], [7, 0], [7, -5], [-6, -5]];
    const ops = [[['window', 1.5], ['door', 4, '#e2574c'], ['window', 6.5]], [], [['slider', 2.5]], [['windowWide', 2.5]], [['window', 2], ['windowWide', 6], ['window', 11]], [['window', 2.5], ['window', 6.5]]];
    p.forEach((a, i) => { const b = p[(i + 1) % p.length]; f.walls.push(wall(a[0], a[1], b[0], b[1], ops[i], out)); });
    f.walls.push(wall(-1, -5, -1, 0, [['door', 3.5]]), wall(-6, 0, -1, 0, [['arch', 3]]));
    f.floorPaint.push({ x: -3, z: -3, m: 'carpet:#9fd3c7' }, { x: -3, z: 2, m: 'checker' });
    f.items.push(item('bunkBed', -5.3, -3.6), item('arcade', -1.6, -4.4, 0), item('ballPit', -3.3, -1.5), item('sofa', 4.5, -4.3), item('rugRound', 4, -2.4, 0, '#f2a65a'),
      item('tv', 6.6, -2.4, -Math.PI / 2), item('pingPong', 0.5, -2.4, Math.PI / 2), item('diningTable', -3.5, 2), item('counter', -5.6, 3.2, Math.PI / 2), item('fridge', -5.5, 1),
      item('ceilingLamp', -3.5, -2.5), item('discoBall', 3, -2.5), item('ceilingLamp', -2, 2), item('gardenLamp', 4, 6), item('trampoline', 6, 4.5), item('slide', 11, -2), item('swingSet', 11, 4), item('treehouse', -11, -2), item('treeLeafy', -10, 6), item('sandbox', 2, 8));
    h.roof = { style: 'flat', mat: 'rooftile:#3f7f6a' };
  } },
};

export function newHouse(name, env, starter) {
  const h = { id: uid(), v: 1, name, env, time: 13, roof: { style: 'flat', mat: 'rooftile:#b5533c' }, floors: [newFloor()] };
  (STARTERS[starter] || STARTERS.blank).make(h);
  return h;
}
