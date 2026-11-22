// Put doors and windows into walls.
import * as THREE from 'three';
import { OPENINGS, WALL_T, uid, floorBase } from '../model.js';
import { tagOf } from '../scene/houseView.js';
import { wallLen } from '../geometry/walls.js';

export class OpeningTool {
  constructor(app) {
    this.app = app;
    this.ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#3aa0ff', transparent: true, opacity: 0.55, depthWrite: false }));
    this.ghost.visible = false; app.stage.overlay.add(this.ghost);
  }
  leave() { this.ghost.visible = false; this.spot = null; }
  find(e) {
    const hit = this.app.pick(e, [this.app.view.floors[this.app.floor].walls]).find(h => tagOf(h.object));
    if (!hit) return null;
    const tag = tagOf(hit.object); if (this.app.openingErase) return { tag };
    const w = tag.wall, L = wallLen(w), d = OPENINGS[this.app.openingKind], ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
    if (L < d.w + 0.4) return { w, short: true };
    let t = (hit.point.x - w.a[0]) * ux + (hit.point.z - w.a[1]) * uz;
    t = Math.max(d.w / 2 + 0.2, Math.min(L - d.w / 2 - 0.2, Math.round(t * 4) / 4));
    const clash = (w.openings || []).some(o => Math.abs(o.t - t) < (OPENINGS[o.kind].w + d.w) / 2 + 0.1);
    return { w, t, d, ux, uz, clash };
  }
  move(e) {
    const s = this.spot = this.find(e), g = this.ghost;
    g.visible = !!(s && s.d);
    if (!g.visible) return;
    g.material.color.set(s.clash ? '#ff5a4a' : '#3aa0ff');
    g.scale.set(s.d.w, s.d.h, WALL_T + 0.12);
    g.position.set(s.w.a[0] + s.ux * s.t, floorBase(this.app.floor) + s.d.sill + s.d.h / 2, s.w.a[1] + s.uz * s.t);
    g.rotation.y = Math.atan2(-s.uz, s.ux);
  }
  up(e, { click }) {
    if (!click) return;
    const s = this.find(e); if (!s) return;
    if (this.app.openingErase) {
      if (s.tag.kind !== 'opening') return this.app.say('Click right on a door or window to take it out.');
      s.tag.wall.openings = s.tag.wall.openings.filter(o => o !== s.tag.opening); return this.app.commit();
    }
    if (s.short) return this.app.say('That wall is too short for this one. Try a smaller door or window.');
    if (s.clash) return this.app.say('There is already something there. Pick a free spot on the wall.');
    (s.w.openings ||= []).push({ id: uid(), kind: this.app.openingKind, t: s.t });
    this.app.commit(); this.move(e);
  }
}
