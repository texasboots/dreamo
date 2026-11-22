// Paint walls, floors and doors.
import { tagOf } from '../scene/houseView.js';
import { roomAt } from '../geometry/rooms.js';
import { wallLen } from '../geometry/walls.js';

export class PaintTool {
  constructor(app) { this.app = app; }
  leave() {}
  // Which space a wall side looks into: a room number, or -1 for outdoors.
  spaces(w, side, rooms) {
    const L = wallLen(w), ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L, s = side === 0 ? 1 : -1, out = new Set();
    for (const f of [0.2, 0.5, 0.8]) out.add(roomAt(rooms, w.a[0] + ux * L * f - uz * 0.35 * s, w.a[1] + uz * L * f + ux * 0.35 * s));
    return out;
  }
  up(e, { click }) {
    if (!click) return;
    const app = this.app, f = app.view.floors[app.floor], p = app.paint, fl = app.fl;
    const hits = app.pick(e, [f.walls, f.floorsG]).map(h => ({ h, t: tagOf(h.object) })).filter(x => x.t);
    if (!hits.length) return;
    if (p.on === 'floor') {
      const x = hits.find(x => x.t.kind === 'floor'); if (!x) return app.say('That is a floor colour. Click on a floor.');
      const room = app.view.rooms[app.floor].rooms[x.t.room];
      fl.floorPaint = (fl.floorPaint || []).filter(q => roomAt([room], q.x, q.z) < 0);
      fl.floorPaint.push({ x: x.h.point.x, z: x.h.point.z, m: p.id });
      return app.commit();
    }
    const x = hits.find(x => x.t.kind !== 'floor'); if (!x) return app.say('That is a wall colour. Click on a wall.');
    if (x.t.kind === 'opening') {
      if (!p.id.startsWith('paint:') || !['door', 'doorDouble', 'garage'].includes(x.t.opening.kind)) return app.say('Doors can be painted with the plain colours.');
      x.t.opening.color = p.id.slice(6); return app.commit();
    }
    const w = x.t.wall; let side = x.h.face.materialIndex;
    if (side > 1) side = x.h.object.worldToLocal(x.h.point.clone()).z > 0 ? 0 : 1;
    if (!app.paintFill) w.paint[side] = p.id;
    else {
      const rooms = app.view.rooms[app.floor].rooms, mine = this.spaces(w, side, rooms);
      for (const o of fl.walls) for (const s of [0, 1]) if ([...this.spaces(o, s, rooms)].some(k => mine.has(k))) o.paint[s] = p.id;
    }
    app.commit();
  }
}
