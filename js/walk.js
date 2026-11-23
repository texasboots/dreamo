// Walk around inside your house: W A S D or arrow keys to move, mouse to look.
import * as THREE from 'three';
import { FLOOR_H, WALL_T, OPENINGS, PLOT, floorAt } from './model.js';
import { wallLen, wallOpenings } from './geometry/walls.js';
import { roomAt, pointInPoly } from './geometry/rooms.js';
import { stairsOn } from './scene/houseView.js';
import { DEFS } from './catalog/items.js';

const EYE = 1.55, R = 0.28;

export class Walk {
  constructor(app) {
    this.app = app; this.keys = new Set(); this.pos = new THREE.Vector3(); this.yaw = 0; this.pitch = 0; this.on = false;
    addEventListener('keydown', e => { if (this.on) { this.keys.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); } });
    addEventListener('keyup', e => this.keys.delete(e.code));
    const c = app.canvas;
    c.addEventListener('mousemove', e => { if (!this.on) return; if (document.pointerLockElement === c || e.buttons) { this.yaw -= e.movementX * 0.0026; this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - e.movementY * 0.0026)); } });
    c.addEventListener('click', () => { if (this.on && document.pointerLockElement !== c) c.requestPointerLock?.()?.catch?.(() => {}); });
  }
  start() {
    const st = this.app.stage, t = st.controls.target;
    this.saved = { p: st.camera.position.clone(), t: t.clone() };
    this.pos.set(t.x, this.app.floor * FLOOR_H, t.z);
    const d = t.clone().sub(st.camera.position); this.yaw = Math.atan2(-d.x, -d.z); this.pitch = 0;
    // Begin in the middle of the biggest room, looking down its long side.
    const rooms = this.app.view.rooms[this.app.floor]?.rooms || [], room = rooms.reduce((m, r) => (!m || r.area > m.area ? r : m), null);
    if (room) {
      const xs = room.poly.map(p => p[0]), zs = room.poly.map(p => p[1]), segs = this.blockers(this.app.floor);
      let best = -1;
      for (let x = Math.min(...xs) + 0.25; x < Math.max(...xs); x += 0.5) for (let z = Math.min(...zs) + 0.25; z < Math.max(...zs); z += 0.5) {
        if (!pointInPoly(x, z, room.poly)) continue;
        let m = 1e9;
        for (const [a, b] of segs) { const ex = b[0] - a[0], ez = b[1] - a[1], u = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez))); m = Math.min(m, Math.hypot(x - a[0] - ex * u, z - a[1] - ez * u)); }
        if (m > best) { best = m; this.pos.x = x; this.pos.z = z; }
      }
      if (best >= 0) { let far = 0; for (const [px, pz] of room.poly) { const q = Math.hypot(px - this.pos.x, pz - this.pos.z); if (q > far) { far = q; this.yaw = Math.atan2(-(px - this.pos.x), -(pz - this.pos.z)); } } }
    }
    this.on = true; this.keys.clear(); st.controls.enabled = false; st.camera.fov = 68; st.camera.updateProjectionMatrix();
    try { this.app.canvas.requestPointerLock?.()?.catch?.(() => {}); } catch {}
  }
  stop() {
    const st = this.app.stage; this.on = false; if (document.pointerLockElement) document.exitPointerLock();
    st.camera.fov = 50; st.camera.updateProjectionMatrix(); st.camera.position.copy(this.saved.p); st.controls.target.copy(this.saved.t); st.controls.enabled = true; st.lampRef = null;
  }
  level() { return Math.max(this.app.house.basement ? -1 : 0, Math.min(this.app.house.floors.length - 1, Math.floor((this.pos.y + 0.6) / FLOOR_H))); }
  groundY(x, z, lv) {
    const h = this.app.house;
    for (const l of [lv, lv - 1]) for (const s of stairsOn(floorAt(h, l))) {
      const dx = x - s.x, dz = z - s.z, c = Math.cos(s.rot || 0), sn = Math.sin(s.rot || 0), lx = dx * c - dz * sn, lz = dx * sn + dz * c;
      if (Math.abs(lx) <= 0.62 && Math.abs(lz) <= 1.9) return (l + Math.max(0, Math.min(1, (1.8 - lz) / 3.6))) * FLOOR_H;
    }
    if (lv > 0) {
      const onRoom = roomAt(this.app.view.rooms[lv]?.rooms || [], x, z) >= 0, onLid = (this.app.view.rooms[lv - 1]?.outlines || []).some(o => pointInPoly(x, z, o));
      if (!onRoom && !onLid) return this.groundY(x, z, lv - 1);
    }
    return lv * FLOOR_H;
  }
  blockers(lv) {
    const fl = floorAt(this.app.house, lv), segs = [];
    for (const w of fl.walls) {
      const L = wallLen(w); if (L < 0.01) continue;
      const at = t => [w.a[0] + (w.b[0] - w.a[0]) * t / L, w.a[1] + (w.b[1] - w.a[1]) * t / L];
      let x = 0;
      for (const o of wallOpenings(w, L)) { if (OPENINGS[o.o.kind].sill > 0) continue; if (o.x0 > x) segs.push([at(x), at(o.x0)]); x = o.x1; }
      if (L > x) segs.push([at(x), at(L)]);
    }
    return segs;
  }
  update(dt) {
    if (!this.on) return;
    const k = this.keys, has = (...c) => c.some(x => k.has(x));
    if (has('ArrowLeft')) this.yaw += dt * 1.9; if (has('ArrowRight')) this.yaw -= dt * 1.9;
    const f = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0), s = (has('KeyD') ? 1 : 0) - (has('KeyA') ? 1 : 0);
    const sp = (has('ShiftLeft', 'ShiftRight') ? 6 : 3.2) * dt, sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    let x = this.pos.x + (-sy * f + cy * s) * sp, z = this.pos.z + (-cy * f - sy * s) * sp;
    const lv = this.level(), fl = floorAt(this.app.house, lv);
    for (let pass = 0; pass < 2; pass++) {
      for (const [a, b] of this.blockers(lv)) {
        const ex = b[0] - a[0], ez = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez)));
        const px = a[0] + ex * t, pz = a[1] + ez * t, d = Math.hypot(x - px, z - pz), min = R + WALL_T / 2;
        if (d < min && d > 1e-6) { x = px + (x - px) / d * min; z = pz + (z - pz) / d * min; }
      }
      for (const it of fl.items) {
        const def = DEFS[it.type]; if (!def || def.flat || def.h < 0.35) continue;
        const dx = x - it.x, dz = z - it.z, c = Math.cos(it.rot || 0), sn = Math.sin(it.rot || 0);
        let lx = dx * c - dz * sn, lz = dx * sn + dz * c;
        const hx = def.w / 2 - 0.05, hz = def.d / 2 - 0.05, qx = Math.max(-hx, Math.min(hx, lx)), qz = Math.max(-hz, Math.min(hz, lz));
        let ox = lx - qx, oz = lz - qz, d = Math.hypot(ox, oz);
        if (d >= R) continue;
        if (d < 1e-6) { if (hx - Math.abs(lx) < hz - Math.abs(lz)) { ox = Math.sign(lx) || 1; oz = 0; d = 1; lx = ox * hx; } else { ox = 0; oz = Math.sign(lz) || 1; d = 1; lz = oz * hz; } x = it.x + (lx + ox * R) * c + (lz + oz * R) * sn; z = it.z - (lx + ox * R) * sn + (lz + oz * R) * c; continue; }
        const nx = qx + ox / d * R, nz = qz + oz / d * R; x = it.x + nx * c + nz * sn; z = it.z - nx * sn + nz * c;
      }
    }
    const lim = PLOT / 2 + 30; x = Math.max(-lim, Math.min(lim, x)); z = Math.max(-lim, Math.min(lim, z));
    const gy = this.groundY(x, z, lv);
    this.pos.x = x; this.pos.z = z;
    this.pos.y = gy < this.pos.y - 0.6 ? Math.max(gy, this.pos.y - 9 * dt) : this.pos.y + (gy - this.pos.y) * Math.min(1, dt * 14);
    const cam = this.app.stage.camera;
    cam.position.set(x, this.pos.y + EYE, z); cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    this.app.stage.lampRef = cam.position;
  }
}
