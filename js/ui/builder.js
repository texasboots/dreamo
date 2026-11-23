// All the buttons and panels around the 3D view.
import { h, fill, $ } from './dom.js';
import { thumb } from './thumbs.js';
import { STEPS } from '../app.js';
import { OPENINGS } from '../model.js';
import { ITEMS, CATS, DEFS } from '../catalog/items.js';
import { search, COLORS } from '../catalog/words.js';
import { placeInfo, placeKey } from '../places.js';
import { ENVS } from '../model.js';
import { WALL_PAINTS, FLOOR_PAINTS, ROOF_PAINTS, ITEM_COLORS } from '../scene/materials.js';

const btn = (label, onclick, o = {}) => h('button', { class: 'btn ' + (o.class || '') + (o.on ? ' on' : ''), onclick, title: o.title, disabled: o.disabled }, o.icon && h('span', { class: 'ico' }, o.icon), label && h('span', {}, label));
const card = (title, ...kids) => h('section', { class: 'card' }, title && h('h3', {}, title), kids);
const OP_ICON = { door: '🚪', doorDouble: '🚪🚪', slider: '🪟', arch: '⛩️', garage: '🚗', window: '🪟', windowWide: '🪟', windowTall: '🪟', windowSquare: '🔲', windowPicture: '🖼️' };
const TIPS = {
  walls: { room: 'Drag on the grid to make a room. Rooms can touch and overlap to make any shape.', wall: 'Drag on the grid to draw one wall. Join walls into a loop and a floor appears.', move: 'Drag a corner to stretch or reshape your house.', erase: 'Click a wall to remove it.' },
  doors: 'Pick a door or window, then click a wall to put it in.',
  paint: 'Pick a colour, then click a wall or a floor.',
  furniture: 'Type anything in the search box, or pick something. Then click where it goes. Drag things to move them. Press R to turn.',
  garden: 'Type any place to move your house there. Fill the garden. Trees, fences and flowers keep placing until you press Esc.',
  roof: 'Choose a roof shape and colour. Sloped roofs fit houses shaped like a rectangle.',
};

function swatches(list, cur, pick, cls = '') {
  return h('div', { class: 'swatches ' + cls }, list.map(p => h('button', { class: 'sw' + (p.id === cur ? ' on' : ''), style: 'background:' + p.css, title: p.name, onclick: () => pick(p) })));
}

function leftPanel(app) {
  const s = app.step, items = app.tools.furniture;
  if (s === 'walls') return card('Wall tools',
    [['room', '⬛', 'Room'], ['wall', '✏️', 'Wall'], ['move', '✋', 'Move corner'], ['erase', '🧽', 'Erase']].map(([m, i, l]) => btn(l, () => { app.wallMode = m; app.tools.walls.leave(); app.ui(); }, { icon: i, on: app.wallMode === m, class: 'tool' })));
  if (s === 'doors') return card('Doors & windows', btn('Add', () => { app.openingErase = false; app.ui(); }, { icon: '➕', on: !app.openingErase, class: 'tool' }), btn('Erase', () => { app.openingErase = true; app.tools.doors.leave(); app.ui(); }, { icon: '🧽', on: app.openingErase, class: 'tool' }));
  if (s === 'paint') return card('Paint', btn('Whole room', () => { app.paintFill = true; app.ui(); }, { icon: '🏠', on: app.paintFill, class: 'tool' }), btn('One wall', () => { app.paintFill = false; app.ui(); }, { icon: '🧱', on: !app.paintFill, class: 'tool' }));
  if (s === 'roof') return null;
  const it = items.selected();
  if (app.placing) return card('Placing: ' + DEFS[app.placing].name, btn('Turn', () => items.turn(), { icon: '↻', class: 'tool' }), btn('Done', () => { items.setPlacing(null); app.ui(); }, { icon: '✅', class: 'tool' }));
  if (!it) return null;
  const def = DEFS[it.type];
  return card(def.name,
    btn('Turn', () => items.turn(), { icon: '↻', class: 'tool' }), btn('Turn a bit', () => items.turn(Math.PI / 12), { icon: '⤾', class: 'tool' }),
    btn('Copy', () => items.copy(), { icon: '📄', class: 'tool' }), btn('Delete', () => items.remove(), { icon: '🗑️', class: 'tool danger' }),
    def.color && h('div', {}, h('h4', {}, 'Colour'), swatches(ITEM_COLORS.map(c => ({ id: c, css: c, name: c })), it.color || def.color, p => items.color(p.id), 'small')));
}

function rightPanel(app) {
  const s = app.step;
  if (s === 'walls') return card('How to build', h('ol', { class: 'steps-help' }, ['Drag on the grid to draw a room.', 'Add more rooms. They can share walls.', 'Use the steps at the top to add doors, paint and furniture.', 'Press Walk Inside to explore!'].map(t => h('li', {}, t))),
    h('p', { class: 'small' }, 'Turn the view: drag with the mouse. Slide the view: right-drag. Zoom: scroll.'));
  if (s === 'doors') return card('Pick one', h('div', { class: 'grid2' }, Object.entries(OPENINGS).map(([k, d]) => h('button', { class: 'tile' + (!app.openingErase && app.openingKind === k ? ' on' : ''), onclick: () => { app.openingKind = k; app.openingErase = false; app.ui(); } }, h('span', { class: 'big' }, OP_ICON[k]), h('span', {}, d.name)))));
  if (s === 'paint') {
    const pick = on => p => { app.paint = { id: p.id, on }; app.ui(); }, cur = app.paint.id, n = WALL_PAINTS.findIndex(p => !p.id.startsWith('paint:'));
    return [card('Wall colours', swatches(WALL_PAINTS.slice(0, n), app.paint.on === 'wall' && cur, pick('wall'))), card('Wall styles', swatches(WALL_PAINTS.slice(n), app.paint.on === 'wall' && cur, pick('wall'), 'wide')), card('Floors', swatches(FLOOR_PAINTS, app.paint.on === 'floor' && cur, pick('floor'), 'wide'))];
  }
  if (s === 'roof') {
    const r = app.house.roof, set = o => { Object.assign(r, o); app.commit(); };
    return [card('Roof shape', h('div', { class: 'grid2' }, [['flat', '▬', 'Flat'], ['gable', '⌂', 'Pointed'], ['hip', '◭', 'Sloped all round'], ['none', '✖', 'No roof']].map(([k, i, l]) => h('button', { class: 'tile' + (r.style === k ? ' on' : ''), onclick: () => set({ style: k }) }, h('span', { class: 'big' }, i), h('span', {}, l)))),
      app.view.roofNote && h('p', { class: 'note' }, 'This house has a special shape, so it gets a flat roof. Sloped roofs fit rectangle houses.')),
      card('Roof colour', swatches(ROOF_PAINTS, r.mat, p => set({ mat: p.id }), 'wide'))];
  }
  const cats = CATS[s], cur = app.cat[s], q = app.find[s] || '';
  const place = s === 'garden' && placeCard(app);
  let timer;
  const box = h('input', { class: 'find', id: 'find', type: 'search', placeholder: s === 'garden' ? '🔍 Type anything for outside…' : '🔍 Type any furniture…', value: q, 'aria-label': 'Search for things',
    oninput: e => { app.find[s] = e.target.value; clearTimeout(timer); timer = setTimeout(() => { fill($('found'), results(app, s)); }, 120); },
    onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); app.find[s] = e.target.value; fill($('found'), results(app, s)); $('found').querySelector('.tile')?.click(); } } });
  return [place, h('section', { class: 'card catalog' }, box, h('div', { id: 'found' }, results(app, s)))];
}

const IDEAS = ['candy land', 'the moon', 'jungle', 'desert', 'tropical island', 'volcano', 'fairy forest', 'underwater', 'christmas', 'halloween'];
function placeCard(app) {
  const cur = app.house.env, info = placeInfo(cur), go = v => { app.setPlace(v); };
  const input = h('input', { class: 'find', placeholder: 'Type any place…', maxLength: 60, 'aria-label': 'Where is your house?', onkeydown: e => { if (e.key === 'Enter') go(e.target.value); } });
  return card('🌍 Where is your house?',
    h('p', { class: 'small' }, 'Now: ' + info.emoji + ' ' + info.name),
    h('div', { class: 'place-box' }, input, btn('Go', () => go(input.value), { class: 'pill' })),
    h('div', { class: 'chips' }, [...Object.entries(ENVS).map(([k, e]) => [k, e.emoji + ' ' + e.name]), ...IDEAS.map(t => [t, placeInfo(t).emoji + ' ' + t])].map(([k, l]) => h('button', { class: 'chip' + (placeKey(cur) === k ? ' on' : ''), onclick: () => go(k) }, l))));
}

const tile = (app, type, label, pic, color, extra = '') => h('button', { class: 'tile item' + extra + (app.placing === type && (app.tools.furniture.placeColor || null) === (color || null) ? ' on' : ''), title: label,
  onclick: () => { const on = app.placing === type && (app.tools.furniture.placeColor || null) === (color || null); app.tools.furniture.setPlacing(on ? null : type, color); app.ui(); } },
  h('img', { src: pic, alt: '' }), h('span', {}, label));

function results(app, s) {
  const q = (app.find[s] || '').trim();
  if (!q) {
    const cats = CATS[s], cur = app.cat[s];
    return [h('div', { class: 'tabs' }, cats.map(([k, l]) => h('button', { class: 'tab' + (k === cur ? ' on' : ''), onclick: () => { app.cat[s] = k; app.ui(); } }, l))),
      h('div', { class: 'grid2' }, ITEMS.filter(d => d.cat === cur).map(d => tile(app, d.id, d.name, thumb(d))))];
  }
  const { parsed, results: found } = search(q, ITEMS), color = parsed.color && parsed.color !== 'rainbow' ? parsed.color : null;
  const cw = parsed.raw.split(' ').find(w => COLORS[w]);
  const shown = found.slice(0, 24).map(({ def }) => {
    const c = color && def.color ? color : null;
    return tile(app, def.id, c ? cw[0].toUpperCase() + cw.slice(1) + ' ' + def.name.toLowerCase() : def.name, c ? thumb({ id: def.id + '|' + c, make: () => def.make(c) }) : thumb(def), c);
  });
  const good = found.some(r => r.full);
  const made = parsed.words.length ? DEFS['made:' + parsed.raw] : null;
  const make = made && h('div', { class: 'makeup' }, h('p', { class: 'small' }, good ? 'Not quite right? DREAMO can invent one:' : 'DREAMO doesn\'t have that yet, so it made one up for you!'),
    h('div', { class: 'grid2' }, tile(app, made.id, '✨ ' + made.name, thumb(made), null, ' made')));
  return good ? [h('div', { class: 'grid2' }, shown), make] : [make, shown.length ? h('p', { class: 'small' }, 'Or maybe one of these:') : null, h('div', { class: 'grid2' }, shown)];
}

function bottomBar(app) {
  const n = app.house.floors.length, hr = app.house.time ?? 13;
  return [
    h('div', { class: 'group' }, h('label', {}, 'Floor'),
      app.house.basement ? btn('Basement', () => app.setFloor(-1), { icon: '⛏️', on: app.floor === -1, class: 'pill', title: 'Go down to the basement' })
        : btn('Basement', () => app.digBasement(), { icon: '⛏️', class: 'pill', title: 'Dig a basement under your house' }),
      app.house.floors.map((_, i) => btn(i ? String(i + 1) : 'Ground', () => app.setFloor(i), { on: app.floor === i, class: 'pill' })),
      btn('', () => app.addFloor(), { icon: '＋', class: 'pill', title: 'Add a floor on top', disabled: n >= 4 }), n > 1 && btn('', () => { if (confirm('Remove the top floor and everything on it?')) app.removeFloor(); }, { icon: '－', class: 'pill', title: 'Remove the top floor' }),
      app.floor === -1 && btn('Fill in', () => { if (confirm('Fill in the basement and lose everything down there?')) app.fillBasement(); }, { icon: '🪣', class: 'pill', title: 'Fill the basement back in with dirt' })),
    h('div', { class: 'group' }, btn('Undo', () => app.undo(), { icon: '↶', disabled: !app.history.canUndo }), btn('Redo', () => app.redo(), { icon: '↷', disabled: !app.history.canRedo })),
    h('div', { class: 'group time' }, h('span', {}, '🌅'), h('input', { type: 'range', min: 6, max: 24, step: 0.25, value: hr, title: 'Time of day', oninput: e => app.setTime(+e.target.value) }), h('span', {}, '🌙')),
    h('div', { class: 'group' }, (app.step === 'furniture' || app.step === 'walls') && btn('Low walls', () => { app.low = !app.low; app.refresh(); app.ui(); }, { icon: '👀', on: app.low, title: 'Lower the walls so you can see inside' }), btn('Whole house', () => { app.showAll = !app.showAll; app.refresh(); app.ui(); }, { icon: '🏡', on: app.showAll || app.step === 'roof', title: 'Show every floor and the roof' })),
    h('div', { class: 'group' }, btn('', () => app.camera('left'), { icon: '⟲', title: 'Turn left' }), btn('', () => app.camera('right'), { icon: '⟳', title: 'Turn right' }), btn('', () => app.camera('in'), { icon: '＋', title: 'Zoom in' }), btn('', () => app.camera('out'), { icon: '－', title: 'Zoom out' }), btn('Top', () => app.camera('top'), { title: 'Look straight down' }), btn('', () => app.camera('home'), { icon: '🎯', title: 'Back to the start view' })),
    btn('Walk Inside', () => app.setWalk(true), { icon: '🚶', class: 'walk' }),
  ];
}

export function renderBuilder(app) {
  if (!app.house) return;
  document.body.classList.toggle('walking', app.walking);
  const right = $('right'), scroll = right.scrollTop;
  fill($('topbar'),
    h('button', { class: 'btn home', onclick: () => app.close() }, '🏘️ My Houses'),
    h('input', { class: 'name', value: app.house.name, maxLength: 40, 'aria-label': 'House name', onchange: e => { app.house.name = e.target.value.trim() || 'My Dream House'; app.commit(); } }),
    h('nav', { class: 'steps' }, STEPS.map(([k, i, l], n) => h('button', { class: 'step' + (app.step === k ? ' on' : ''), onclick: () => app.setStep(k) }, h('b', {}, n + 1), h('span', { class: 'ico' }, i), h('span', { class: 'lbl' }, l)))),
    h('span', { id: 'saved', class: 'saved' }, 'Saved ✓'));
  fill($('left'), leftPanel(app));
  fill(right, rightPanel(app)); right.scrollTop = scroll;
  fill($('bottombar'), bottomBar(app));
  const tip = TIPS[app.step]; $('tip').textContent = app.floor === -1 && app.step === 'walls' && app.wallMode !== 'erase' ? '⛏️ Drag on the grid to dig out a basement room. Then add Stairs (Furniture → Lights & stairs) to climb up.' : typeof tip === 'string' ? tip : tip[app.wallMode];
  app.canvas.style.cursor = app.step === 'walls' && app.wallMode !== 'erase' ? 'crosshair' : 'default';
}
