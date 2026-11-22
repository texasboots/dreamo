// Draw walls, draw whole rooms, move corners, and erase.
import * as THREE from 'three';
import { wall, GRID, PLOT, WALL_H, WALL_T, floorBase } from '../model.js';
import { tagOf } from '../scene/houseView.js';

const same = (p, q) => Math.abs(p[0] - q[0]) < 1e-3 && Math.abs(p[1] - q[1]) < 1e-3;

export class WallTool {
  constructor(app) {
    this.app = app;
    const m = new THREE.MeshBasicMaterial({ color: '#3aa0ff', transparent: true, opacity: 0.5, depthWrite: false });
    this.ghosts = Array.from({ length: 4 }, () => { const g = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m); g.visible = false; app.stage.overlay.add(g); return g; });
    this.cursor = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.22, 24), new THREE.MeshBasicMaterial({ color: '#ff6b5a', depthTest: false, transparent: true }));
    this.cursor.rotation.x = -Math.PI / 2; this.cursor.renderOrder = 10; this.cursor.visible = false; app.stage.overlay.add(this.cursor);
  }
  get mode() { return this.app.wallMode; }
  snap(p) { const s = v => Math.max(-PLOT / 2, Math.min(PLOT / 2, Math.round(v / GRID) * GRID)); return [s(p.x), s(p.z)]; }
  leave() { this.cursor.visible = false; this.hide(); this.start = this.drag = null; }
  hide() { this.ghosts.forEach(g => (g.visible = false)); this.app.measure(null); }
  corner(gp) {
    let best = null, bd = 0.7;
    for (const w of this.app.fl.walls) for (const end of ['a', 'b']) { const d = Math.hypot(w[end][0] - gp.x, w[end][1] - gp.z); if (d < bd) { bd = d; best = w[end]; } }
    return best && [...best];
  }
  setCursor(p) { this.cursor.visible = !!p; if (p) this.cursor.position.set(p[0], floorBase(this.app.floor) + 0.07, p[1]); }

  down(e) {
    const gp = this.app.groundPoint(e); if (!gp) return false;
    if (this.mode === 'wall' || this.mode === 'room') { this.start = this.end = this.snap(gp); return true; }
    if (this.mode === 'move') {
      const c = this.corner(gp); if (!c) return false;
      this.drag = []; for (const w of this.app.fl.walls) for (const end of ['a', 'b']) if (same(w[end], c)) this.drag.push({ w, end });
      return true;
    }
    return false;
  }
  move(e, captured) {
    const gp = this.app.groundPoint(e); if (!gp) return this.setCursor(null);
    const p = this.snap(gp);
    if (captured && this.start) { this.end = p; this.preview(e); this.setCursor(p); }
    else if (captured && this.drag) { for (const d of this.drag) d.w[d.end] = [...p]; this.setCursor(p); this.app.refresh(); }
    else if (this.mode === 'move') this.setCursor(this.corner(gp));
    else this.setCursor(this.mode === 'erase' ? null : p);
  }
  segs() {
    const a = this.start, b = this.end;
    if (this.mode === 'wall') return [[a, b]];
    const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), z0 = Math.min(a[1], b[1]), z1 = Math.max(a[1], b[1]);
    return [[[x0, z1], [x1, z1]], [[x1, z1], [x1, z0]], [[x1, z0], [x0, z0]], [[x0, z0], [x0, z1]]];
  }
  preview(e) {
    const y = floorBase(this.app.floor), segs = this.segs();
    this.ghosts.forEach((g, i) => {
      const s = segs[i], L = s ? Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1]) : 0;
      g.visible = L > 0.01; if (!g.visible) return;
      const H = this.app.lowNow ? 1 : WALL_H; g.scale.set(L, H, WALL_T); g.position.set((s[0][0] + s[1][0]) / 2, y + H / 2, (s[0][1] + s[1][1]) / 2);
      g.rotation.y = Math.atan2(-(s[1][1] - s[0][1]), s[1][0] - s[0][0]);
    });
    const a = this.start, b = this.end, fmt = v => (Math.round(v * 10) / 10) + ' m';
    this.app.measure(this.mode === 'wall' ? fmt(Math.hypot(b[0] - a[0], b[1] - a[1])) : fmt(Math.abs(b[0] - a[0])) + ' × ' + fmt(Math.abs(b[1] - a[1])), e);
  }
  up(e, { click }) {
    const fl = this.app.fl;
    if (this.start) {
      const segs = this.segs().filter(s => Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1]) >= GRID - 1e-6);
      const ok = this.mode === 'wall' ? segs.length === 1 : segs.length === 4;
      this.start = null; this.hide();
      if (!ok) return;
      for (const [a, b] of segs) if (!fl.walls.some(w => (same(w.a, a) && same(w.b, b)) || (same(w.a, b) && same(w.b, a)))) fl.walls.push(wall(a[0], a[1], b[0], b[1]));
      this.app.commit();
    } else if (this.drag) {
      this.drag = null;
      fl.walls = fl.walls.filter(w => !same(w.a, w.b));
      this.app.commit();
    } else if (click && this.mode === 'erase') {
      const t = this.app.pick(e, [this.app.view.floors[this.app.floor].walls]).map(h => tagOf(h.object)).find(t => t);
      if (t) { fl.walls = fl.walls.filter(w => w !== t.wall); this.app.commit(); }
    }
  }
}
