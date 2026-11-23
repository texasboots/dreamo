// The 3D stage: renderer, camera, sky, sun, shadows, day and night.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildEnvironment } from './environments.js';
import { glow } from './materials.js';
import { PLOT, GRID } from '../model.js';

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const MAX_LAMPS = 6;

export class Stage {
  constructor(canvas) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.62;
    this.scene = new THREE.Scene();
    this.scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 3000);
    this.camera.position.set(17, 15, 24);

    this.sky = new Sky(); this.sky.scale.setScalar(450000); this.scene.add(this.sky);
    const u = this.sky.material.uniforms; u.turbidity.value = 3; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.82;
    this.sun = new THREE.DirectionalLight('#fff', 3); this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; sc.left = sc.bottom = -34; sc.right = sc.top = 34; sc.near = 1; sc.far = 220;
    this.sun.shadow.mapSize.set(4096, 4096); this.sun.shadow.bias = -0.0003; this.sun.shadow.normalBias = 0.04;
    this.moon = new THREE.DirectionalLight('#9db4ff', 0); this.moon.position.set(-40, 70, -30);
    this.hemi = new THREE.HemisphereLight('#fff', '#888', 1);
    this.scene.add(this.sun, this.sun.target, this.moon, this.hemi);
    this.scene.fog = new THREE.Fog('#cfe3ee', 160, 1100);

    const sp = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) { const v = new THREE.Vector3().randomDirection(); v.y = Math.abs(v.y); v.multiplyScalar(1500); sp.set([v.x, v.y, v.z], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#fff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this.scene.add(this.stars);

    this.lamps = Array.from({ length: MAX_LAMPS }, () => { const l = new THREE.PointLight('#ffd9a0', 0, 11, 1.6); this.scene.add(l); return l; });
    this.lampSpots = [];

    // The building grid, shown while drawing walls.
    this.grid = new THREE.Group();
    const fine = new THREE.GridHelper(PLOT, PLOT / GRID, '#ffffff', '#ffffff'); fine.material.transparent = true; fine.material.opacity = 0.16; fine.material.depthWrite = false;
    const bold = new THREE.GridHelper(PLOT, PLOT / 2, '#ffffff', '#ffffff'); bold.material.transparent = true; bold.material.opacity = 0.34; bold.material.depthWrite = false; bold.position.y = 0.002;
    this.grid.add(fine, bold); this.scene.add(this.grid);
    this.overlay = new THREE.Group(); this.scene.add(this.overlay);
    // Under the ground: a dirt floor and the dirt sides of the hole dug for a basement.
    this.dirtMat = new THREE.MeshStandardMaterial({ color: '#6e5038', roughness: 1, side: THREE.FrontSide });
    this.pit = new THREE.Group(); this.scene.add(this.pit);

    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.12, maxPolarAngle: Math.PI / 2 - 0.03, minDistance: 3, maxDistance: 110, zoomSpeed: 1.2 });
    this.controls.target.set(0, 1, 0);
    this.hour = 13;
  }

  setEnv(env) {
    if (this.env === env) return;
    if (this.envGroup) this.scene.remove(this.envGroup);
    const e = buildEnvironment(env); this.env = env; this.envGroup = e.group;
    this.ground = e.group.children.find(c => c.userData.ground); this.ground.material = this.ground.material.clone(); this.digSig = null; this.setDig(this.dig || [], this.seeDown); this.look = e.look; this.grid.children.forEach(g => g.material.color.set(e.look.darkGrid ? '#3d4a66' : '#ffffff')); this.scene.add(e.group); this.setTime(this.hour);
  }

  // Dig holes in the ground where the basement is. While building the basement the ground turns see-through.
  setDig(outlines, seeDown = false) {
    this.dig = outlines; this.seeDown = seeDown; if (!this.ground) return;
    const sig = JSON.stringify(outlines);
    if (sig !== this.digSig) {
      this.digSig = sig; const old = this.ground.geometry, S = 1200;
      const sh = new THREE.Shape([[-S, -S], [S, -S], [S, S], [-S, S]].map(([x, y]) => new THREE.Vector2(x, y)));
      for (const o of outlines) sh.holes.push(new THREE.Path(o.map(([x, z]) => new THREE.Vector2(x, -z))));
      this.ground.geometry = outlines.length ? new THREE.ShapeGeometry(sh) : new THREE.PlaneGeometry(2400, 2400);
      if (!outlines.length) { const uv = this.ground.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2400, uv.getY(i) * 2400); }
      old.dispose();
      for (const c of [...this.pit.children]) { this.pit.remove(c); c.geometry.dispose(); }
      if (outlines.length) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), this.dirtMat); floor.rotation.x = -Math.PI / 2; floor.position.y = -3.4; this.pit.add(floor);
        const pos = [];
        for (const o0 of outlines) {                  // wind each outline so the dirt faces point into the hole
          const area = o0.reduce((s, p, i) => { const q = o0[(i + 1) % o0.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0), o = area > 0 ? [...o0].reverse() : o0;
          o.forEach((a, i) => { const b = o[(i + 1) % o.length]; pos.push(a[0], 0, a[1], b[0], 0, b[1], b[0], -3.4, b[1], a[0], 0, a[1], b[0], -3.4, b[1], a[0], -3.4, a[1]); });
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
        const sides = new THREE.Mesh(g, this.dirtMat); sides.receiveShadow = true; this.pit.add(sides);
      }
    }
    const m = this.ground.material; m.transparent = seeDown; m.opacity = seeDown ? 0.35 : 1; m.depthWrite = !seeDown; m.needsUpdate = true;
  }

  // hour runs from 6 (sunrise) to 24 (midnight).
  setTime(hour) {
    this.hour = hour;
    const elev = hour <= 18 ? Math.sin(Math.PI * (hour - 6) / 12) * 62 : -Math.sin(Math.PI * (hour - 18) / 12) * 50;
    const az = THREE.MathUtils.degToRad(-105 + 210 * Math.min(1, (hour - 6) / 12));
    const dir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), az);
    const day = smooth(-7, 9, elev), nightK = 1 - day, low = 1 - smooth(4, 32, elev);
    this.night = nightK;
    const u = this.sky.material.uniforms; u.sunPosition.value.copy(dir); u.rayleigh.value = 0.9 + 2.4 * low * day;
    this.sunDir = dir; this.followSun();
    this.sun.intensity = 3.4 * smooth(-1, 14, elev);
    this.sun.color.set('#ffb070').lerp(new THREE.Color('#fff3e0'), smooth(2, 28, elev));
    this.moon.intensity = 0.9 * nightK;
    const look = this.look || { sky: '#bcd8f0', bounce: '#777', fog: '#cfe3ee' };
    this.hemi.color.set('#5a6aa8').lerp(new THREE.Color(look.sky), day); this.hemi.groundColor.set('#2a2f45').lerp(new THREE.Color(look.bounce), day);
    this.hemi.intensity = 0.5 + 0.55 * day;
    this.scene.environmentIntensity = 0.1 + 0.5 * day;
    this.scene.fog.color.set('#0b1020').lerp(new THREE.Color(look.fog), day).lerp(new THREE.Color('#f0a878'), day * low * 0.55);
    this.stars.material.opacity = nightK;
    this.sky.visible = !look.space; this.scene.background = look.space ? new THREE.Color('#05060f') : null;
    if (look.space) { this.stars.material.opacity = 1; this.scene.fog.color.set('#05060f'); this.hemi.intensity = 0.45 + 0.4 * day; }
    if (look.underwater) { this.scene.fog.color.set(look.fog).multiplyScalar(0.35 + 0.65 * day); this.scene.fog.near = 30; this.scene.fog.far = 420; this.stars.material.opacity = 0; } else { this.scene.fog.near = 160; this.scene.fog.far = look.space ? 2600 : 1100; }
    for (const g of glow) g.m.emissiveIntensity = g.k * nightK;
    this.placeLamps();
  }

  followSun() { const f = this.lampRef || this.controls.target; this.sun.position.copy(this.sunDir).multiplyScalar(110).add(f); this.sun.target.position.copy(f); }
  setLampSpots(spots) { this.lampSpots = spots; this.placeLamps(); }
  placeLamps() {
    const on = smooth(0.25, 0.8, this.night || 0), ref = this.lampRef || this.controls.target;
    const near = [...this.lampSpots].sort((a, b) => a.p.distanceToSquared(ref) - b.p.distanceToSquared(ref));
    this.lamps.forEach((l, i) => { const s = near[i]; l.visible = !!s && on > 0; if (s) { l.position.copy(s.p); l.color.set(s.color || '#ffd9a0'); l.intensity = 26 * on; } });
  }

  resize() {
    const c = this.renderer.domElement, w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  render() { this.renderer.render(this.scene, this.camera); }

  // A small picture of what the camera sees, for the My Houses page.
  snapshot(w = 400, h = 260) {
    this.render();
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const s = this.renderer.domElement, k = Math.max(w / s.width, h / s.height), dw = s.width * k, dh = s.height * k;
    c.getContext('2d').drawImage(s, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return c.toDataURL('image/jpeg', 0.72);
  }
}
