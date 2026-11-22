// The My Houses page and the "new house" chooser.
import { h, fill, $ } from './dom.js';
import { store } from '../store.js';
import { ENVS, STARTERS, newHouse, uid } from '../model.js';

const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : new Date(t).toLocaleDateString(); };

export function renderHome(open) {
  const list = store.list();
  fill($('houses'),
    h('button', { class: 'house new', onclick: () => chooser(open) }, h('span', { class: 'plus' }, '＋'), h('b', {}, 'New house')),
    list.map(r => h('div', { class: 'house' },
      h('button', { class: 'pic', style: r.thumb ? `background-image:url(${r.thumb})` : 'background:' + (ENVS[r.env]?.css || '#cde'), onclick: () => { const d = store.load(r.id); if (d) open(d); }, 'aria-label': 'Open ' + r.name }),
      h('div', { class: 'meta' }, h('b', {}, r.name), h('small', {}, (ENVS[r.env]?.emoji || '') + ' ' + (ENVS[r.env]?.name || '') + ' · ' + ago(r.updated))),
      h('div', { class: 'acts' },
        h('button', { title: 'Rename', onclick: () => { const n = prompt('Name this house', r.name); if (n?.trim()) { const d = store.load(r.id); d.name = n.trim().slice(0, 40); store.save(d); renderHome(open); } } }, '✏️'),
        h('button', { title: 'Save to a file', onclick: () => download([r.id], r.name) }, '💾'),
        h('button', { title: 'Make a copy', onclick: () => { store.copy(r.id, uid()); renderHome(open); } }, '📄'),
        h('button', { title: 'Delete', onclick: () => { if (confirm(`Delete "${r.name}"? This cannot be undone.`)) { store.remove(r.id); renderHome(open); } } }, '🗑️')))));
  $('empty').hidden = list.length > 0;
  $('backupAll').hidden = !list.length;
  $('backupAll').onclick = () => download(list.map(r => r.id), 'DREAMO houses');
  $('openFile').onclick = () => openFiles(open);
}

// Save houses to a file in Downloads, so they are safe even if this browser forgets them.
function download(ids, name) {
  const day = new Date().toISOString().slice(0, 10);
  const a = h('a', { href: URL.createObjectURL(new Blob([store.toFile(ids)], { type: 'application/json' })), download: `${name.replace(/[^\w .-]+/g, '').trim() || 'house'} ${day}.dreamo.json` });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// Bring houses back from a saved file.
function openFiles(open) {
  const input = h('input', { type: 'file', accept: '.json,application/json', multiple: true });
  input.onchange = async () => {
    let n = 0;
    for (const f of input.files) n += store.fromFile(await f.text(), uid);
    renderHome(open);
    alert(n ? `Added ${n} house${n > 1 ? 's' : ''} to My Houses.` : 'That file has no DREAMO houses in it.');
  };
  input.click();
}

function chooser(open) {
  const m = $('modal'), pick = { env: 'forest', start: 'blank' }, n = store.list().length + 1;
  const name = h('input', { class: 'name', value: 'My Dream House ' + n, maxLength: 40, 'aria-label': 'House name' });
  const close = () => { m.hidden = true; };
  const draw = () => fill(m, h('div', { class: 'sheet' },
    h('button', { class: 'x', onclick: close, 'aria-label': 'Close' }, '✕'),
    h('h2', {}, 'Start a new house'),
    h('h3', {}, '1. Where will it be?'),
    h('div', { class: 'choices' }, Object.entries(ENVS).map(([k, e]) => h('button', { class: 'choice' + (pick.env === k ? ' on' : ''), onclick: () => { pick.env = k; draw(); } }, h('span', { class: 'scene', style: 'background:' + e.css }, e.emoji), h('b', {}, e.name)))),
    h('h3', {}, '2. How do you want to start?'),
    h('div', { class: 'choices' }, Object.entries(STARTERS).map(([k, s]) => h('button', { class: 'choice' + (pick.start === k ? ' on' : ''), onclick: () => { pick.start = k; draw(); } }, h('span', { class: 'scene plain' }, s.emoji), h('b', {}, s.name), h('small', {}, s.note)))),
    h('h3', {}, '3. Give it a name'), name,
    h('button', { class: 'btn go', onclick: () => { close(); open(newHouse(name.value.trim() || 'My Dream House', pick.env, pick.start), true); } }, 'Start building →')));
  draw(); m.hidden = false;
}
