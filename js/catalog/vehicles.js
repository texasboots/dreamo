// Vehicles: cars, race cars, tanks, planes, jets and helicopters. Front faces +z, sizes in metres.
import * as THREE from 'three';
import { box, cyl, sph, cone, rbox, turn, group } from './parts.js';
import { mat } from '../scene/materials.js';

const BLACK = 'color:#232528', STEEL = 'metal', GLASS = 'gloss:#1c2630', WHITE = 'color:#f7f5f0';
const col = c => 'color:' + c, gl = c => 'gloss:' + c;
const V = (id, name, w, d, h, c, make, words, extra = {}) => ({ id, name, cat: 'vehicles', w, d, h, color: c, make, words, ...extra });

// A rod lying front-to-back (along z) or side-to-side (along x), centred on x, y, z.
const rodZ = (r, L, m, x, y, z, rEnd = r, seg = 18) => turn(cyl(r, L, m, x, y - L / 2, z, rEnd, seg), Math.PI / 2);
const rodX = (r, L, m, x, y, z, seg = 18) => turn(cyl(r, L, m, x, y - L / 2, z, r, seg), 0, 0, Math.PI / 2);
const wheel = (x, y, z, r = 0.33, t = 0.24, rim = STEEL) => [rodX(r, t, BLACK, x, y, z, 20), rodX(r * 0.55, t + 0.02, rim, x, y, z, 12)];
const wheels4 = (x, zf, zb, r, t, rim) => [[x, zf], [-x, zf], [x, zb], [-x, zb]].map(([a, b]) => wheel(a, r, b, r, t, rim));
// A flat plate cut to any outline ([x, z] points), t thick, its bottom at height y. For wings.
const plate = (pts, t, m, y) => { const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }); const me = new THREE.Mesh(g, mat(m)); me.rotation.x = -Math.PI / 2; me.position.y = y; return me; };
// A standing fin cut to an outline ([z, y] points), t thick, at side position x. For tails.
const fin = (pts, t, m, x = 0) => { const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y))); const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }); g.translate(0, 0, -t / 2); const me = new THREE.Mesh(g, mat(m)); me.rotation.y = -Math.PI / 2; me.position.x = x; return me; };
const mirror = pts => pts.map(([x, z]) => [-x, z]).reverse();
const lights = (w, y, zf, zb, round = false) => [-1, 1].map(s => [box(0.32, 0.12, 0.04, 'bulb', s * w, y, zf), round ? rodZ(0.08, 0.04, 'screen:#ff2a2a', s * w, y + 0.06, zb) : box(0.32, 0.1, 0.04, 'screen:#c22d2d', s * w, y, zb)]);

export const VEHICLES = [
  V('tank', 'Tank', 3.4, 7.2, 2.6, '#5f6b3a', c => group(
    rbox(2.4, 0.8, 6, col(c), 0, 0.5, 0, 0.15), rbox(2.7, 0.15, 6.2, col(c), 0, 1.15, 0, 0.05),
    [-1, 1].map(s => [rbox(0.7, 0.95, 6.4, BLACK, s * 1.35, 0.05, 0, 0.42), [-2.4, -1.2, 0, 1.2, 2.4].map(z => rodX(0.33, 0.72, 'metal:#4a4f45', s * 1.35, 0.5, z, 14))]),
    rbox(2, 0.75, 2.6, col(c), 0, 1.3, -0.4, 0.25), cyl(0.38, 0.18, col(c), 0.45, 2.05, -0.9, 0.34, 16), rodZ(0.11, 3.6, col(c), 0, 1.7, 2.6, 0.11, 12), rodZ(0.17, 0.5, col(c), 0, 1.7, 4.2, 0.17, 12),
    box(0.04, 0.9, 0.04, BLACK, -0.6, 2.05, -1.4), box(0.5, 0.3, 0.5, 'color:#4a5230', -0.7, 1.15, 2.4)), 'tank army tank war tank military armoured'),
  V('raceCar', 'Race car', 2, 4.7, 1.3, '#2f6fd6', c => group(
    rbox(1.9, 0.45, 4.6, gl(c), 0, 0.18, 0, 0.16), rbox(1.45, 0.45, 1.8, GLASS, 0, 0.58, -0.35, 0.16), rbox(1.4, 0.06, 1.3, gl(c), 0, 1.0, -0.4, 0.03),
    box(0.3, 0.012, 4.62, WHITE, -0.3, 0.63, 0), box(0.3, 0.012, 4.62, WHITE, 0.3, 0.63, 0),
    [-1, 1].map(s => [rodX(0.3, 0.02, WHITE, s * 0.96, 0.42, 0.4, 24), box(0.05, 0.5, 0.06, BLACK, s * 0.7, 0.63, -2.1)]), box(1.9, 0.07, 0.4, gl(c), 0, 1.12, -2.15),
    wheels4(0.9, 1.45, -1.45, 0.34, 0.26), lights(0.6, 0.45, 2.3, -2.3)), 'race car racecar racing car nascar rally car fast car', { light: [0, 0.6, 3.2] }),
  V('f1Car', 'F1 car', 2, 5.4, 1.1, '#d22b2b', c => group(
    rbox(0.36, 0.24, 2.4, gl(c), 0, 0.16, 1.4, 0.1), rbox(0.85, 0.45, 2.6, gl(c), 0, 0.14, -0.5, 0.18), rbox(1.5, 0.34, 1.5, gl(c), 0, 0.14, -0.5, 0.14),
    rbox(0.5, 0.35, 1.0, gl(c), 0, 0.55, -1.0, 0.15), sph(0.16, gl('#f6d77a'), 0, 0.72, 0.1), rbox(0.6, 0.04, 0.05, BLACK, 0, 0.85, 0.35, 0.02),
    box(1.95, 0.05, 0.5, gl(c), 0, 0.08, 2.4), [-1, 1].map(s => box(0.04, 0.25, 0.5, BLACK, s * 0.97, 0.08, 2.4)),
    box(1.2, 0.07, 0.4, gl(c), 0, 0.92, -2.35), box(1.2, 0.05, 0.3, gl(c), 0, 0.75, -2.35), [-1, 1].map(s => box(0.04, 0.45, 0.5, BLACK, s * 0.62, 0.55, -2.35)),
    box(0.06, 0.012, 2.0, WHITE, 0, 0.4, 1.4), [[0.85, 1.65, 0.33, 0.34], [-0.85, 1.65, 0.33, 0.34], [0.85, -1.75, 0.36, 0.42], [-0.85, -1.75, 0.36, 0.42]].map(([x, z, r, t]) => wheel(x, r, z, r, t, BLACK))), 'f1 f1 car formula 1 formula one race car grand prix racing car'),
  V('sportsCar', 'Red sports car', 2, 4.5, 1.15, '#d0201a', c => group(
    rbox(1.95, 0.5, 4.5, gl(c), 0, 0.17, 0, 0.22), rbox(1.85, 0.12, 1.5, gl(c), 0, 0.6, 1.3, 0.06), rbox(1.5, 0.42, 1.7, GLASS, 0, 0.6, -0.35, 0.22), rbox(1.4, 0.06, 1.1, gl(c), 0, 1.0, -0.45, 0.03),
    [-1, 1].map(s => [box(0.04, 0.2, 0.6, BLACK, s * 0.97, 0.35, -0.9), box(0.12, 0.1, 0.25, gl(c), s * 0.95, 0.75, 0.55)]), box(1.6, 0.05, 0.25, gl(c), 0, 0.72, -2.2), box(0.9, 0.12, 0.04, BLACK, 0, 0.25, 2.25),
    wheels4(0.9, 1.4, -1.45, 0.34, 0.26, 'metal:#d9a441'), lights(0.6, 0.48, 2.24, -2.26, true)), 'red sports car ferrari supercar sports car lamborghini fast car fancy car', { light: [0, 0.6, 3.2] }),
  V('fighterJet', 'Fighter jet', 7.4, 12, 3.6, '#8d949c', c => group(
    rodZ(0.75, 8.5, gl(c), 0, 1.6, -0.6, 0.75, 20), turn(cone(0.75, 2.6, gl(c), 0, 1.6 - 1.3, 4.95, 20), Math.PI / 2), rbox(1.3, 0.9, 2.2, gl('#2a5a8a'), 0, 1.9, 2.4, 0.45),
    plate([[0.6, 2.2], [3.7, -2.6], [3.7, -3.4], [0.6, -3.4]], 0.08, gl(c), 1.45), plate(mirror([[0.6, 2.2], [3.7, -2.6], [3.7, -3.4], [0.6, -3.4]]), 0.08, gl(c), 1.45),
    plate([[0.5, -3.6], [2.2, -4.9], [2.2, -5.5], [0.5, -5.5]], 0.07, gl(c), 1.6), plate(mirror([[0.5, -3.6], [2.2, -4.9], [2.2, -5.5], [0.5, -5.5]]), 0.07, gl(c), 1.6),
    fin([[-3.3, 2.1], [-4.4, 3.6], [-5.0, 3.6], [-5.3, 2.1]], 0.08, gl(c), 0.45), fin([[-3.3, 2.1], [-4.4, 3.6], [-5.0, 3.6], [-5.3, 2.1]], 0.08, gl(c), -0.45),
    [-1, 1].map(s => [rodZ(0.42, 0.5, BLACK, s * 0.4, 1.4, -5.0, 0.42, 16), rodZ(0.3, 0.52, 'screen:#ff7a2a', s * 0.4, 1.4, -5.0, 0.3, 16), rodZ(0.09, 2.2, WHITE, s * 3.2, 1.35, -1.8, 0.09, 8)]),
    [[0, 3.2], [0.9, -1.4], [-0.9, -1.4]].map(([x, z]) => [box(0.08, 0.85, 0.08, STEEL, x, 0.3, z), wheel(x, 0.22, z, 0.22, 0.14)])), 'fighter jet jet jets fighter plane air force f16 f-16 f35 military plane fast plane'),
  V('airplane', 'Airplane', 10, 8, 3, '#f7f5f0', c => group(
    rodZ(0.65, 6, gl(c), 0, 1.5, 0, 0.65, 20), turn(cone(0.65, 1.0, gl(c), 0, 1.0, 3.5, 20), Math.PI / 2), turn(cone(0.65, 1.8, gl(c), 0, 0.6, -3.9, 20), -Math.PI / 2),
    box(1.0, 0.1, 0.4, GLASS, 0, 1.9, 2.1), [-1, 1].map(s => [-1.4, -0.4, 0.6, 1.6].map(z => box(0.02, 0.28, 0.4, GLASS, s * 0.64, 1.6, z))),
    rbox(10, 0.12, 1.4, gl('#e2574c'), 0, 1.9, 0.6, 0.05), rbox(3.4, 0.08, 0.9, gl('#e2574c'), 0, 1.6, -4.1, 0.04), fin([[-3.6, 1.6], [-4.4, 3.0], [-4.9, 3.0], [-4.9, 1.6]], 0.08, gl('#e2574c')),
    cyl(0.1, 0.2, BLACK, 0, 1.4, 4.0, 0.1, 8), turn(box(0.15, 2.0, 0.05, BLACK, 0, 0.5, 4.1), 0, 0, 0.3),
    [[0.9, 0.9], [-0.9, 0.9], [0, -3.3]].map(([x, z]) => [box(0.06, 0.8, 0.06, STEEL, x, 0.3, z), wheel(x, 0.25, z, 0.25, 0.16)])), 'airplane aeroplane plane propeller plane small plane biplane aircraft', { light: [0, 1.5, 4.5] }),
  V('jumboJet', 'Jumbo jet', 16, 19, 5.4, '#f7f5f0', c => group(
    rodZ(1.4, 14, gl(c), 0, 2.4, 0, 1.4, 24), turn(cone(1.4, 2.6, gl(c), 0, 2.4 - 1.3, 8.3, 24), Math.PI / 2), turn(cone(1.4, 3.2, gl(c), 0, 2.4 - 1.6 + 0.3, -8.6, 24), -Math.PI / 2),
    box(1.4, 0.3, 0.3, GLASS, 0, 3.0, 8.0), [-1, 1].map(s => Array.from({ length: 18 }, (_, i) => box(0.04, 0.3, 0.3, GLASS, s * 1.39, 2.7, -6 + i * 0.75))), box(2.82, 0.15, 14, gl('#3f6f8f'), 0, 2.0, 0),
    plate([[1.2, 2.5], [8, -2.8], [8, -3.6], [1.2, -0.4]], 0.15, gl(c), 1.7), plate(mirror([[1.2, 2.5], [8, -2.8], [8, -3.6], [1.2, -0.4]]), 0.15, gl(c), 1.7),
    plate([[0.6, -6.6], [3.4, -8.6], [3.4, -9.2], [0.6, -8.8]], 0.1, gl(c), 2.7), plate(mirror([[0.6, -6.6], [3.4, -8.6], [3.4, -9.2], [0.6, -8.8]]), 0.1, gl(c), 2.7),
    fin([[-6.6, 3.4], [-8.6, 5.4], [-9.4, 5.4], [-9.2, 3.4]], 0.15, gl('#3f6f8f')),
    [-1, 1].map(s => [3.2, 5.8].map(x => [rodZ(0.5, 2, gl(c), s * x, 1.15, 0.6 - (x - 3.2) * 0.4, 0.5, 16), rodZ(0.38, 0.05, BLACK, s * x, 1.15, 1.62 - (x - 3.2) * 0.4, 0.38, 16)])),
    [[1.2, -1], [-1.2, -1], [0, 6.5]].map(([x, z]) => [box(0.15, 1.1, 0.15, STEEL, x, 0.3, z), wheel(x, 0.35, z, 0.35, 0.3)])), 'jumbo jet jet airliner passenger plane big plane boeing airbus jumbo'),
  V('helicopter', 'Helicopter', 8.6, 10, 3.4, '#e2574c', c => group(
    rbox(1.9, 1.7, 3.2, gl(c), 0, 0.55, 0.6, 0.75), rbox(1.7, 1.1, 1.1, gl('#2a5a8a'), 0, 1.0, 1.9, 0.5), rodZ(0.2, 4.6, gl(c), 0, 1.75, -3.2, 0.12, 12),
    fin([[-5.0, 1.6], [-5.4, 2.8], [-5.8, 2.8], [-5.6, 1.6]], 0.08, gl(c)), rodX(0.1, 0.1, BLACK, 0.12, 2.3, -5.5), turn(box(0.04, 1.4, 0.12, BLACK, 0.18, 1.6, -5.5), 0.4),
    cyl(0.1, 0.5, BLACK, 0, 2.25, 0.6, 0.1, 10), cyl(0.25, 0.12, BLACK, 0, 2.72, 0.6, 0.25, 12), [0.3, 0.3 + Math.PI / 2].map(a => turn(box(8.4, 0.04, 0.3, BLACK, 0, 2.82, 0.6), 0, a)),
    [-1, 1].map(s => [rodZ(0.06, 3.4, STEEL, s * 0.85, 0.08, 0.6, 0.06, 8), box(0.06, 0.6, 0.06, STEEL, s * 0.85, 0.08, 1.4), box(0.06, 0.6, 0.06, STEEL, s * 0.85, 0.08, -0.3)])), 'helicopter chopper copter heli', { light: [0, 0.8, 2.6] }),
  V('monsterTruck', 'Monster truck', 3.2, 4.8, 3.2, '#3f8f3f', c => group(
    rbox(2.1, 0.8, 4.2, gl(c), 0, 1.5, 0, 0.15), rbox(1.9, 0.7, 1.8, gl(c), 0, 2.3, -0.4, 0.15), box(1.8, 0.45, 0.04, GLASS, 0, 2.42, 0.51), box(2.3, 0.3, 0.3, BLACK, 0, 1.35, 2.15),
    box(1.6, 0.5, 3.6, BLACK, 0, 0.8, 0), wheels4(1.2, 1.45, -1.45, 0.85, 0.7), lights(0.6, 1.95, 2.11, -2.11)), 'monster truck big truck pickup truck truck', { light: [0, 2, 3.2] }),
  V('fireTruck', 'Fire truck', 2.5, 7.4, 3.2, '#c22d2d', c => group(
    rbox(2.4, 1.7, 5.4, gl(c), 0, 0.55, -0.9, 0.08), rbox(2.4, 1.9, 1.8, gl(c), 0, 0.55, 2.7, 0.12), box(2.2, 0.7, 0.04, GLASS, 0, 1.6, 3.6), box(2.42, 0.12, 7.2, WHITE, 0, 1.3, 0),
    [-0.5, 0.5].map(x => box(0.08, 0.08, 6, STEEL, x, 2.5, -0.6)), Array.from({ length: 12 }, (_, i) => box(1.0, 0.05, 0.05, STEEL, 0, 2.5, -3.4 + i * 0.5)), [-0.3, 0.3].map(x => box(0.5, 0.15, 0.3, 'screen:' + (x < 0 ? '#ff2a2a' : '#2a6aff'), x, 2.45, 3.0)),
    [2.7, -0.6, -2.6].map(z => [wheel(1.1, 0.5, z, 0.5, 0.35), wheel(-1.1, 0.5, z, 0.5, 0.35)]), lights(0.8, 0.9, 3.61, -3.61)), 'fire truck fire engine firetruck firefighter', { light: [0, 1, 4.4] }),
  V('policeCar', 'Police car', 1.9, 4.5, 1.65, '#f7f5f0', c => group(
    rbox(1.85, 0.6, 4.4, gl(c), 0, 0.3, 0, 0.16), [-1, 1].map(s => box(0.02, 0.6, 2.2, gl('#232528'), s * 0.925, 0.3, 0)), rbox(1.6, 0.55, 2.2, GLASS, 0, 0.86, -0.2, 0.2), rbox(1.64, 0.12, 2.0, gl(c), 0, 1.33, -0.2, 0.05),
    box(0.5, 0.15, 0.3, 'screen:#ff2a2a', -0.3, 1.45, -0.2), box(0.5, 0.15, 0.3, 'screen:#2a6aff', 0.3, 1.45, -0.2), wheels4(0.86, 1.4, -1.4, 0.34, 0.24), lights(0.65, 0.62, 2.2, -2.2)), 'police car cop car police', { light: [0, 0.7, 3.2] }),
  V('schoolBus', 'School bus', 2.6, 9, 3.1, '#f6c02a', c => group(
    rbox(2.5, 2.3, 7.6, gl(c), 0, 0.5, -0.6, 0.15), rbox(2.4, 1.2, 1.6, gl(c), 0, 0.5, 3.9, 0.15), box(2.3, 0.8, 0.04, GLASS, 0, 1.8, 3.21),
    [-1, 1].map(s => [Array.from({ length: 7 }, (_, i) => box(0.04, 0.7, 0.85, GLASS, s * 1.25, 1.75, -3.8 + i * 1.0)), box(0.04, 0.08, 7.6, BLACK, s * 1.26, 1.3, -0.6)]),
    box(2.6, 0.3, 0.2, BLACK, 0, 0.45, 4.7), [3.6, -3].map(z => [wheel(1.15, 0.5, z, 0.5, 0.3), wheel(-1.15, 0.5, z, 0.5, 0.3)]), lights(0.8, 1.2, 4.71, -4.41)), 'school bus bus coach', { light: [0, 1.2, 5.5] }),
  V('goKart', 'Go-kart', 1.3, 1.9, 0.9, '#f6a25a', c => group(
    rbox(1.0, 0.18, 1.8, gl(c), 0, 0.12, 0, 0.06), rbox(0.6, 0.45, 0.12, fab('#232528'), 0, 0.3, -0.5, 0.05), cyl(0.012, 0.35, BLACK, 0, 0.3, 0.35, 0.012, 6), turn(cyl(0.14, 0.03, BLACK, 0, 0.62, 0.42, 0.14, 16), -0.9),
    wheels4(0.6, 0.65, -0.65, 0.16, 0.18), box(1.2, 0.12, 0.08, BLACK, 0, 0.1, 0.92)), 'go kart gokart kart buggy'),
];
function fab(c) { return 'fabric:' + c; }
