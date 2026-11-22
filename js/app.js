// The builder: holds the open house, the current step and tool, and ties everything together.
import * as THREE from 'three';
import { Stage } from './scene/stage.js';
import { HouseView } from './scene/houseView.js';
import { store, History } from './store.js';
import { floorBase, newFloor, wall, WALL_H } from './model.js';
import { WallTool } from './tools/wallTool.js';
import { OpeningTool } from './tools/openingTool.js';
import { PaintTool } from './tools/paintTool.js';
import { ItemTool } from './tools/itemTool.js';
import { Walk } from './walk.js';
import { renderBuilder } from './ui/builder.js';

export const STEPS = [['walls', '🧱', 'Walls'], ['doors', '🚪', 'Doors & Windows'], ['paint', '🎨', 'Paint'], ['furniture', '🛋️', 'Furniture'], ['garden', '🌳', 'Garden'], ['roof', '🏠', 'Roof']];

export class Builder {
  constructor(canvas, onHome) {
    this.canvas = canvas; this.onHome = onHome;
    this.bindPointer();                         // before the camera controls, so tools get first go
    this.stage = new Stage(canvas); this.view = new HouseView(this.stage.scene);
    const items = new ItemTool(this);
    this.tools = { walls: new WallTool(this), doors: new OpeningTool(this), paint: new PaintTool(this), furniture: items, garden: items };
    this.walk = new Walk(this); this.ray = new THREE.Raycaster();
    Object.assign(this, { step: 'walls', floor: 0, low: true, showAll: false, wallMode: 'room', openingKind: 'door', openingErase: false,
      paint: { id: 'paint:#bfe3ee', on: 'wall' }, paintFill: true, placing: null, sel: null, cat: { furniture: 'living', garden: 'garden' }, walking: false });
    this.selBox = new THREE.BoxHelper(new THREE.Object3D(), '#ff6b5a'); this.selBox.visible = false; this.stage.scene.add(this.selBox);
    addEventListener('resize', () => this.stage.resize());
    addEventListener('keydown', e => this.key(e));
    document.addEventListener('pointerlockchange', () => { if (this.walking && !document.pointerLockElement && this.walk.locked) this.setWalk(false); this.walk.locked = !!document.pointerLockElement; });
    let last = performance.now();
    const loop = now => { requestAnimationFrame(loop); if (!this.house) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; this.frame(dt); };
    requestAnimationFrame(loop);
  }
  get fl() { return this.house.floors[this.floor]; }
  get lowNow() { return this.low && (this.step === 'furniture' || this.step === 'walls'); }
  get tool() { return this.walking ? null : this.tools[this.step]; }

  open(house) {
    this.house = house; this.history = new History(house);
    Object.assign(this, { step: 'walls', floor: 0, sel: null, showAll: false, walking: false, wallMode: 'room', openingErase: false });
    this.tools.furniture.setPlacing(null);
    this.stage.setEnv(house.env); this.stage.setTime(house.time ?? 13);
    this.stage.camera.position.set(17, 15, 24); this.stage.controls.target.set(0, 1, 0);
    this.stage.resize(); this.refresh(); this.ui();
    this.say(house.floors[0].walls.length ? 'Pick a step at the top to keep building.' : 'Drag on the grid to draw your first room.');
  }
  close() { if (!this.house) return; if (this.walking) this.setWalk(false); this.saveNow(); this.house = null; this.onHome(); }

  // ---- pointer plumbing
  bindPointer() {
    const c = this.canvas;
    c.addEventListener('pointerdown', e => {
      if (this.walking || e.button !== 0 || !this.house) return;
      this.press = { x: e.clientX, y: e.clientY, moved: false, captured: false };
      if (this.tool?.down?.(e)) { this.press.captured = true; this.stage.controls.enabled = false; c.setPointerCapture(e.pointerId); }
    });
    c.addEventListener('pointermove', e => {
      if (this.walking || !this.house) return;
      if (this.press && Math.hypot(e.clientX - this.press.x, e.clientY - this.press.y) > 5) this.press.moved = true;
      this.tool?.move?.(e, !!this.press?.captured);
    });
    const end = e => {
      if (!this.press) return;
      const p = this.press; this.press = null; this.stage.controls.enabled = !this.walking;
      this.tool?.up?.(e, { captured: p.captured, click: !p.moved });
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    c.addEventListener('contextmenu', e => e.preventDefault());
  }
  aim(e) { const r = this.canvas.getBoundingClientRect(); this.ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.stage.camera); }
  groundPoint(e) { this.aim(e); const p = new THREE.Vector3(); return this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorBase(this.floor)), p) ? p : null; }
  pick(e, roots) { this.aim(e); return this.ray.intersectObjects(roots, true); }

  // ---- changing things
  refresh() {
    const s = this.step, build = !this.walking;
    this.view.sync(this.house, { floor: this.floor, showAll: this.showAll || s === 'roof', walk: this.walking, low: this.lowNow });
    this.stage.grid.visible = build && s !== 'roof' && s !== 'paint'; this.stage.grid.position.y = floorBase(this.floor) + 0.05;
    this.stage.overlay.visible = build;
    this.stage.setLampSpots(this.view.lampSpots(this.house, this.walking || this.showAll ? 99 : this.floor));
    const g = build && this.sel ? this.view.itemGroup(this.floor, this.sel) : null;
    this.selBox.visible = !!g; if (g) this.selBox.setFromObject(g);
  }
  commit() { this.history.push(this.house); this.refresh(); this.ui(); clearTimeout(this.saveT); this.saveT = setTimeout(() => this.saveNow(), 900); }
  saveNow() {
    clearTimeout(this.saveT); if (!this.house) return;
    let thumb;
    if (!this.walking) {                       // take the picture with the whole house showing
      this.view.floors.forEach(f => { f.g.visible = f.lid.visible = true; }); this.view.roof.visible = true;
      this.stage.grid.visible = this.stage.overlay.visible = this.selBox.visible = false;
      thumb = this.stage.snapshot(); this.refresh();
    }
    const ok = store.save(this.house, thumb); this.saved?.(ok);
  }
  restore(h) { if (!h) return; this.house = h; this.sel = null; this.floor = Math.min(this.floor, h.floors.length - 1); this.stage.setTime(h.time ?? 13); this.refresh(); this.ui(); clearTimeout(this.saveT); this.saveT = setTimeout(() => this.saveNow(), 900); }
  undo() { this.restore(this.history.undo()); }
  redo() { this.restore(this.history.redo()); }

  setStep(s) { this.tool?.leave?.(); this.step = s; if (s === 'garden') this.floor = 0; this.refresh(); this.ui(); }
  setFloor(i) { this.tool?.leave?.(); this.floor = i; this.refresh(); this.ui(); }
  addFloor() {
    const below = this.house.floors[this.house.floors.length - 1], f = newFloor();
    f.walls = below.walls.map(w => wall(w.a[0], w.a[1], w.b[0], w.b[1], [], w.paint));
    this.house.floors.push(f); this.floor = this.house.floors.length - 1; this.tool?.leave?.(); this.commit();
    this.say(below.items.some(i => i.type === 'stairs') ? 'New floor added, with the same walls as the one below.' : 'New floor added. Put Stairs on the floor below (Furniture → Lights & stairs) so you can walk up.');
  }
  removeFloor() { if (this.house.floors.length < 2) return; this.house.floors.pop(); this.floor = Math.min(this.floor, this.house.floors.length - 1); this.tool?.leave?.(); this.commit(); }
  setTime(h) { this.house.time = h; this.stage.setTime(h); clearTimeout(this.saveT); this.saveT = setTimeout(() => this.saveNow(), 900); }
  setWalk(on) {
    if (on === this.walking) return;
    this.tool?.leave?.(); this.walking = on;
    if (on) this.walk.start(); else this.walk.stop();
    this.refresh(); this.ui();
  }
  camera(what) {
    const c = this.stage.controls, cam = this.stage.camera, off = cam.position.clone().sub(c.target), s = new THREE.Spherical().setFromVector3(off);
    if (what === 'left') s.theta -= 0.4; if (what === 'right') s.theta += 0.4;
    if (what === 'in') s.radius = Math.max(4, s.radius * 0.8); if (what === 'out') s.radius = Math.min(100, s.radius * 1.25);
    if (what === 'top') { s.phi = 0.02; s.theta = 0; s.radius = Math.max(30, s.radius); }
    if (what === 'home') { c.target.set(0, floorBase(this.floor) + 1, 0); s.set(34, 1.05, 0.62); }
    cam.position.copy(new THREE.Vector3().setFromSpherical(s).add(c.target)); c.update();
  }

  key(e) {
    if (!this.house || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (this.walking) { if (e.key === 'Escape') this.setWalk(false); return; }
    const k = e.key.toLowerCase(), mod = e.metaKey || e.ctrlKey, items = this.tools.furniture;
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
    else if (mod && k === 'y') { e.preventDefault(); this.redo(); }
    else if (this.step === 'furniture' || this.step === 'garden') {
      if (k === 'r') items.turn(e.shiftKey ? Math.PI / 12 : Math.PI / 2);
      else if (k === 'delete' || k === 'backspace') { e.preventDefault(); items.remove(); }
      else if (k === 'escape') { items.setPlacing(null); this.sel = null; this.refresh(); this.ui(); }
    }
  }
  frame(dt) {
    if (this.walking) this.walk.update(dt); else this.stage.controls.update();
    this.stage.followSun(); if (this.walking) this.stage.placeLamps();
    this.stage.render();
  }

  // ---- little messages
  ui() { renderBuilder(this); }
  say(text) { const el = document.getElementById('hint'); el.textContent = text; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  measure(text, e) { const el = document.getElementById('measure'); el.hidden = !text; if (text) { el.textContent = text; el.style.left = e.clientX + 16 + 'px'; el.style.top = e.clientY - 34 + 'px'; } }
}
export { WALL_H };
