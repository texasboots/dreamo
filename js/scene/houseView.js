// Turns the house data into 3D. Only rebuilds the parts that changed.
import * as THREE from 'three';
import { mat } from './materials.js';
import { openingMesh } from './openings.js';
import { findRooms, inRoom, pointInPoly } from '../geometry/rooms.js';
import { computeJoins, wallGeometry, wallOpenings, placeWall, flatPoly, slabGeo } from '../geometry/walls.js';
import { buildRoof, offsetPoly } from '../geometry/roof.js';
import { buildItem, footprint, DEFS } from '../catalog/items.js';
import { WALL_H, SLAB, FLOOR_H, DEF_FLOOR, floorBase, levels, floorAt } from '../model.js';

const LOW_H = 1.0;
const clear = g => { for (const c of [...g.children]) { g.remove(c); c.traverse?.(o => { if (o.userData.own) o.geometry?.dispose(); }); } };
const own = m => { m.userData.own = true; return m; };

export const roomFloor = (fl, room) => { let m = DEF_FLOOR; for (const p of fl.floorPaint || []) if (inRoom(room, p.x, p.z)) m = p.m; return m; };
export const stairsOn = fl => (fl ? fl.items.filter(i => DEFS[i.type]?.stairs) : []);

export class HouseView {
  constructor(scene) { this.root = new THREE.Group(); scene.add(this.root); this.floors = []; this.roof = new THREE.Group(); this.root.add(this.roof); this.rooms = []; this.roofNote = false; }

  // The basement's 3D lives at this.floors[-1] and this.rooms[-1] (array keys can be -1), so level numbers work everywhere.
  sync(house, st) {
    const drop = i => { const f = this.floors[i]; clear(f.struct); this.root.remove(f.g); };
    const add = i => {
      const f = { g: new THREE.Group(), struct: new THREE.Group(), walls: new THREE.Group(), floorsG: new THREE.Group(), ceil: new THREE.Group(), lid: new THREE.Group(), items: new THREE.Group(), map: new Map(), sig: '' };
      f.struct.add(f.walls, f.floorsG, f.ceil, f.lid); f.g.add(f.struct, f.items); f.g.position.y = floorBase(i); this.root.add(f.g); return f;
    };
    while (this.floors.length > house.floors.length) { drop(this.floors.length - 1); this.floors.pop(); }
    while (this.floors.length < house.floors.length) this.floors.push(add(this.floors.length));
    if (house.basement && !this.floors[-1]) this.floors[-1] = add(-1);
    if (!house.basement && this.floors[-1]) { drop(-1); delete this.floors[-1]; delete this.rooms[-1]; }
    const top = house.floors.length - 1, whole = st.showAll || st.walk;
    levels(house).forEach(([i, fl]) => {
      const f = this.floors[i], low = !!st.low && !whole && i === st.floor;
      const sig = JSON.stringify([fl.walls, fl.floorPaint, stairsOn(fl), stairsOn(floorAt(house, i - 1)), low, i === top]);
      if (sig !== f.sig) { f.sig = sig; this.buildStructure(house, i, low); }
      this.syncItems(fl, f);
      f.g.visible = whole || i <= st.floor;
      f.lid.visible = whole || i < st.floor;
      f.ceil.visible = !!st.walk;
    });
    this.rooms.length = house.floors.length;
    const rsig = JSON.stringify([house.roof, this.rooms[top]?.outlines, top]);
    if (rsig !== this.roofSig) {
      this.roofSig = rsig; clear(this.roof); this.roofNote = false;
      if (house.roof.style !== 'none' && this.rooms[top]?.outlines.length) {
        const r = buildRoof(this.rooms[top].outlines, house.roof, mat(house.roof.mat), mat('paint:#f3efe6'));
        r.group.traverse(o => { if (o.isMesh) own(o); }); this.roof.add(r.group); this.roofNote = r.fellBack;
      }
      this.roof.position.y = floorBase(top) + WALL_H;
    }
    this.roof.visible = whole;
  }

  buildStructure(house, i, low) {
    const fl = floorAt(house, i), f = this.floors[i], top = house.floors.length - 1;
    clear(f.walls); clear(f.floorsG); clear(f.ceil); clear(f.lid);
    const joins = computeJoins(fl.walls), H = low ? LOW_H : WALL_H, trim = mat(low ? 'cut' : 'paint:#f7f5f0');
    for (const w of fl.walls) {
      const j = joins.get(w.id); if (!j) continue;
      const geo = wallGeometry(w, j, H, low); if (!geo) continue;
      const m = own(new THREE.Mesh(geo, [mat(w.paint[0]), mat(w.paint[1]), trim]));
      m.castShadow = m.receiveShadow = true;
      const g = new THREE.Group(); placeWall(g, w); g.add(m); m.userData.tag = { kind: 'wall', wall: w, floor: i };
      if (!low) for (const o of wallOpenings(w, j.L)) { const om = openingMesh(o.o); om.userData.tag = { kind: 'opening', wall: w, opening: o.o, floor: i }; g.add(om); }
      f.walls.add(g);
    }
    const found = this.rooms[i] = findRooms(fl.walls);
    const holesFor = (room, stairs) => stairs.map(s => footprint(s, -0.02)).filter(c => c.every(p => inRoom(room, p[0], p[1])));
    const below = stairsOn(floorAt(house, i - 1)), here = stairsOn(fl);
    found.rooms.forEach((room, ri) => {
      const holes = [...room.holes, ...holesFor(room, below)];
      const m = own(new THREE.Mesh(flatPoly(room.poly, i ? 0.012 : 0.03, true, holes), mat(roomFloor(fl, room))));
      m.receiveShadow = true; m.userData.tag = { kind: 'floor', room: ri, floor: i }; f.floorsG.add(m);
      if (i > 0) { const s = own(new THREE.Mesh(slabGeo(room.poly, -SLAB + 0.004, SLAB - 0.008, holes), mat('paint:#f7f5f0'))); s.castShadow = s.receiveShadow = true; f.floorsG.add(s); }
      const c = own(new THREE.Mesh(flatPoly(room.poly, WALL_H - 0.004, false, [...room.holes, ...holesFor(room, here)]), mat('paint:#fbfaf7'))); f.ceil.add(c);
    });
    if (i < top) for (const o of found.outlines) {       // the lid: ceiling of this floor and floor of the next
      const holes = here.map(s => footprint(s, -0.02)).filter(c => c.every(p => pointInPoly(p[0], p[1], o)));
      const m = own(new THREE.Mesh(slabGeo(offsetPoly(o, 0.12), WALL_H, SLAB, holes), mat('concrete'))); m.castShadow = m.receiveShadow = true; f.lid.add(m);
    }
  }

  syncItems(fl, f) {
    const live = new Set();
    for (const it of fl.items) {
      live.add(it.id);
      const sig = it.type + '|' + (it.color || '');
      let e = f.map.get(it.id);
      if (!e || e.sig !== sig) { if (e) f.items.remove(e.g); const g = buildItem(it); if (!g) continue; e = { g, sig }; f.map.set(it.id, e); f.items.add(g); }
      e.g.userData.tag = { kind: 'item', item: it };
      e.g.position.set(it.x, 0, it.z); e.g.rotation.y = it.rot || 0;
    }
    for (const [id, e] of f.map) if (!live.has(id)) { f.items.remove(e.g); f.map.delete(id); }
  }

  digOutlines() { return (this.rooms[-1]?.outlines || []).map(o => offsetPoly(o, 0.12)); }
  itemGroup(floor, id) { return this.floors[floor]?.map.get(id)?.g; }
  // Where the lamps are, so the stage can light them at night.
  lampSpots(house, upTo) {
    const out = [];
    levels(house).forEach(([i, fl]) => { if (i > upTo) return; for (const it of fl.items) { const d = DEFS[it.type]; if (!d?.light) continue; const c = Math.cos(it.rot || 0), s = Math.sin(it.rot || 0), [lx, ly, lz] = d.light; out.push({ p: new THREE.Vector3(it.x + lx * c + lz * s, floorBase(i) + ly, it.z - lx * s + lz * c), color: d.lightColor }); } });
    return out;
  }
}
export const tagOf = o => { while (o) { if (o.userData?.tag) return o.userData.tag; o = o.parent; } return null; };
export { FLOOR_H };
