// Saving. Houses live in this browser's own storage, on this computer.
const INDEX = 'dreamo.houses', KEY = id => 'dreamo.house.' + id;
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export const store = {
  list() { return read(INDEX, []).sort((a, b) => b.updated - a.updated); },
  load(id) { return read(KEY(id), null); },
  save(house, thumb) {
    try {
      localStorage.setItem(KEY(house.id), JSON.stringify(house));
      const list = read(INDEX, []), old = list.find(h => h.id === house.id);
      const row = { id: house.id, name: house.name, env: house.env, updated: Date.now(), thumb: thumb || old?.thumb || '' };
      localStorage.setItem(INDEX, JSON.stringify([row, ...list.filter(h => h.id !== house.id)]));
      return true;
    } catch (e) { console.warn('DREAMO could not save', e); return false; }
  },
  remove(id) { localStorage.removeItem(KEY(id)); localStorage.setItem(INDEX, JSON.stringify(read(INDEX, []).filter(h => h.id !== id))); },
  // Backup files: a plain JSON file holding one or more houses and their pictures.
  toFile(ids) {
    const rows = read(INDEX, []);
    const houses = ids.map(id => ({ house: this.load(id), thumb: rows.find(r => r.id === id)?.thumb || '' })).filter(x => x.house);
    return JSON.stringify({ dreamo: 1, saved: new Date().toISOString(), houses });
  },
  // Adds the houses in a backup file. Returns how many were added.
  fromFile(text, newId) {
    let data; try { data = JSON.parse(text); } catch { return 0; }
    const list = Array.isArray(data?.houses) ? data.houses : data?.floors ? [{ house: data }] : [];
    let n = 0;
    for (const { house, thumb } of list) {
      if (!house || typeof house.name !== 'string' || !Array.isArray(house.floors) || !house.floors.length) continue;
      if (!house.id || this.load(house.id)) house.id = newId();
      if (this.save(house, typeof thumb === 'string' && thumb.startsWith('data:image/') ? thumb : '')) n++;
    }
    return n;
  },
  copy(id, newId) {
    const h = this.load(id), row = read(INDEX, []).find(r => r.id === id); if (!h) return;
    h.id = newId; h.name = h.name + ' copy'; this.save(h, row?.thumb);
  },
};

// Undo and redo: a list of snapshots of the house.
export class History {
  constructor(house) { this.stack = [JSON.stringify(house)]; this.i = 0; }
  push(house) { const s = JSON.stringify(house); if (s === this.stack[this.i]) return; this.stack.length = this.i + 1; this.stack.push(s); if (this.stack.length > 80) this.stack.shift(); this.i = this.stack.length - 1; }
  get canUndo() { return this.i > 0; }
  get canRedo() { return this.i < this.stack.length - 1; }
  undo() { return this.canUndo ? JSON.parse(this.stack[--this.i]) : null; }
  redo() { return this.canRedo ? JSON.parse(this.stack[++this.i]) : null; }
}
