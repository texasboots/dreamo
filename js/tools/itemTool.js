// Place furniture and garden things, then move, turn, colour, copy or delete them.
import { DEFS, buildItem } from '../catalog/items.js';
import { tagOf } from '../scene/houseView.js';
import { uid, PLOT, floorBase } from '../model.js';

const snap = v => Math.max(-PLOT / 2, Math.min(PLOT / 2, Math.round(v * 4) / 4));

export class ItemTool {
  constructor(app) { this.app = app; this.rot = 0; }
  leave() { this.setPlacing(null); this.app.sel = null; }
  setPlacing(type) {
    if (this.ghost) { this.app.stage.overlay.remove(this.ghost); this.ghost = null; }
    this.app.placing = type;
    if (type) { this.app.sel = null; this.ghost = buildItem({ type }); this.ghost.visible = false; this.ghost.rotation.y = this.rot; this.app.stage.overlay.add(this.ghost); }
  }
  hit(e) { return this.app.pick(e, [this.app.view.floors[this.app.floor].items]).map(h => tagOf(h.object)).find(t => t)?.item; }
  down(e) {
    if (this.app.placing) return false;
    const it = this.hit(e), gp = this.app.groundPoint(e);
    if (!it || !gp) return false;
    this.app.sel = it.id; this.drag = { it, dx: it.x - gp.x, dz: it.z - gp.z, moved: false }; this.app.ui(); this.app.refresh();
    return true;
  }
  move(e, captured) {
    const gp = this.app.groundPoint(e); if (!gp) return;
    if (this.ghost) { this.ghost.visible = true; this.ghost.position.set(snap(gp.x), floorBase(this.app.floor), snap(gp.z)); }
    if (captured && this.drag) { const d = this.drag, x = snap(gp.x + d.dx), z = snap(gp.z + d.dz); if (x !== d.it.x || z !== d.it.z) { d.it.x = x; d.it.z = z; d.moved = true; this.app.refresh(); } }
  }
  up(e, { click }) {
    const app = this.app;
    if (this.drag) { const m = this.drag.moved; this.drag = null; if (m) app.commit(); return; }
    if (!click) return;
    if (app.placing) {
      const gp = app.groundPoint(e); if (!gp) return;
      const def = DEFS[app.placing], it = { id: uid(), type: app.placing, x: snap(gp.x), z: snap(gp.z), rot: this.rot };
      app.fl.items.push(it);
      if (!def.multi && !e.shiftKey) { this.setPlacing(null); app.sel = it.id; }
      return app.commit();
    }
    if (app.sel) { app.sel = null; app.ui(); app.refresh(); }
  }
  selected() { return this.app.fl.items.find(i => i.id === this.app.sel); }
  turn(by = Math.PI / 2) {
    const it = this.selected();
    if (it) { it.rot = ((it.rot || 0) + by) % (Math.PI * 2); this.app.commit(); }
    else if (this.ghost) { this.rot = (this.rot + by) % (Math.PI * 2); this.ghost.rotation.y = this.rot; }
  }
  remove() { const it = this.selected(); if (!it) return; this.app.fl.items = this.app.fl.items.filter(i => i !== it); this.app.sel = null; this.app.commit(); }
  copy() { const it = this.selected(); if (!it) return; const c = { ...it, id: uid(), x: snap(it.x + 1), z: snap(it.z + 1) }; this.app.fl.items.push(c); this.app.sel = c.id; this.app.commit(); }
  color(c) { const it = this.selected(); if (it) { it.color = c; this.app.commit(); } }
}
