// Place furniture and garden things, then move, turn, colour, copy or delete them.
// Dishes of food (onTop) sit on whatever flat top is under the mouse: a table, a counter, a desk... or the floor.
import * as THREE from 'three';
import { DEFS, buildItem, footprint } from '../catalog/items.js';
import { tagOf } from '../scene/houseView.js';
import { pointInPoly } from '../geometry/rooms.js';
import { uid, PLOT, floorBase } from '../model.js';

const clampP = v => Math.max(-PLOT / 2, Math.min(PLOT / 2, v));
const snap = v => clampP(Math.round(v * 4) / 4), fine = v => clampP(Math.round(v * 50) / 50);
const up = new THREE.Vector3();

export class ItemTool {
  constructor(app) { this.app = app; this.rot = 0; }
  leave() { this.setPlacing(null); this.app.sel = null; }
  setPlacing(type, color = null) {
    if (this.ghost) { this.app.stage.overlay.remove(this.ghost); this.ghost = null; }
    this.app.placing = type; this.placeColor = type ? color : null;
    if (type) { this.app.sel = null; this.ghost = buildItem({ type, color }); this.ghost.visible = false; this.ghost.rotation.y = this.rot; this.app.stage.overlay.add(this.ghost); }
  }
  hit(e) { return this.app.pick(e, [this.app.view.floors[this.app.floor].items]).map(h => tagOf(h.object)).find(t => t)?.item; }
  // Where a thing would go. A dish looks for the first flat top under the mouse; everything else goes on the floor.
  spot(e, type, skip) {
    const gp = this.app.groundPoint(e); if (!gp) return null;
    const base = floorBase(this.app.floor), at = (x, z, y) => ({ x: fine(x), z: fine(z), y: Math.max(0, Math.round((y - base) * 1000) / 1000) });
    if (DEFS[type]?.onTop) {
      let side = null;
      for (const h of this.app.pick(e, [this.app.view.floors[this.app.floor].items])) {
        const t = tagOf(h.object); if (!t?.item || t.item === skip || !h.face) continue;
        if (up.copy(h.face.normal).transformDirection(h.object.matrixWorld).y > 0.7) return at(h.point.x, h.point.z, h.point.y);
        side = { it: t.item, p: h.point }; break;
      }
      if (side) {      // clicked the front of a counter: put the dish on its top, a little way in from the edge
        const b = new THREE.Box3().setFromObject(this.app.view.itemGroup(this.app.floor, side.it.id)), c = b.getCenter(new THREE.Vector3());
        const dx = c.x - side.p.x, dz = c.z - side.p.z, L = Math.hypot(dx, dz) || 1, k = Math.min(L, 0.15) / L;
        return at(side.p.x + dx * k, side.p.z + dz * k, b.max.y);
      }
    }
    return DEFS[type]?.onTop ? { x: fine(gp.x), z: fine(gp.z), y: 0 } : { x: snap(gp.x), z: snap(gp.z), y: 0 };
  }
  // Dishes sitting on top of a table move, turn and fall with it.
  riders(it) {
    if (DEFS[it.type]?.onTop) return [];
    const f = footprint(it, 0.02);
    return this.app.fl.items.filter(o => o !== it && o.y > 0 && DEFS[o.type]?.onTop && pointInPoly(o.x, o.z, f));
  }
  down(e) {
    if (this.app.placing) return false;
    const it = this.hit(e), gp = this.app.groundPoint(e);
    if (!it || !gp) return false;
    this.app.sel = it.id; this.drag = { it, dx: it.x - gp.x, dz: it.z - gp.z, moved: false, riders: this.riders(it) }; this.app.ui(); this.app.refresh();
    return true;
  }
  move(e, captured) {
    if (this.ghost) { const p = this.spot(e, this.app.placing); this.ghost.visible = !!p; if (p) this.ghost.position.set(p.x, floorBase(this.app.floor) + p.y, p.z); }
    if (captured && this.drag) {
      const d = this.drag, it = d.it; let x, z, y = it.y;
      if (DEFS[it.type]?.onTop) { const p = this.spot(e, it.type, it); if (!p) return; ({ x, z, y } = p); }
      else { const gp = this.app.groundPoint(e); if (!gp) return; x = snap(gp.x + d.dx); z = snap(gp.z + d.dz); }
      if (x !== it.x || z !== it.z || y !== it.y) {
        for (const r of d.riders) { r.x += x - it.x; r.z += z - it.z; }
        it.x = x; it.z = z; if (y) it.y = y; else delete it.y; d.moved = true; this.app.refresh();
      }
    }
  }
  up(e, { click }) {
    const app = this.app;
    if (this.drag) { const m = this.drag.moved; this.drag = null; if (m) app.commit(); return; }
    if (!click) return;
    if (app.placing) {
      const p = this.spot(e, app.placing); if (!p) return;
      const def = DEFS[app.placing], it = { id: uid(), type: app.placing, x: p.x, z: p.z, rot: this.rot };
      if (p.y) it.y = p.y;
      if (this.placeColor) it.color = this.placeColor;
      app.fl.items.push(it);
      if (!def.multi && !e.shiftKey) { this.setPlacing(null); app.sel = it.id; }
      return app.commit();
    }
    if (app.sel) { app.sel = null; app.ui(); app.refresh(); }
  }
  selected() { return this.app.fl.items.find(i => i.id === this.app.sel); }
  turn(by = Math.PI / 2) {
    const it = this.selected();
    if (it) {
      for (const r of this.riders(it)) { const dx = r.x - it.x, dz = r.z - it.z, c = Math.cos(by), s = Math.sin(by); r.x = fine(it.x + dx * c + dz * s); r.z = fine(it.z - dx * s + dz * c); r.rot = ((r.rot || 0) + by) % (Math.PI * 2); }
      it.rot = ((it.rot || 0) + by) % (Math.PI * 2); this.app.commit();
    }
    else if (this.ghost) { this.rot = (this.rot + by) % (Math.PI * 2); this.ghost.rotation.y = this.rot; }
  }
  remove() { const it = this.selected(); if (!it) return; for (const r of this.riders(it)) delete r.y; this.app.fl.items = this.app.fl.items.filter(i => i !== it); this.app.sel = null; this.app.commit(); }
  copy() { const it = this.selected(); if (!it) return; const k = DEFS[it.type]?.onTop ? 0.3 : 1, c = { ...it, id: uid(), x: fine(it.x + k), z: fine(it.z + (DEFS[it.type]?.onTop ? 0 : 1)) }; this.app.fl.items.push(c); this.app.sel = c.id; this.app.commit(); }
  color(c) { const it = this.selected(); if (it) { it.color = c; this.app.commit(); } }
}
