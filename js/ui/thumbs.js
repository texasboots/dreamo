// Little pictures of each item for the catalog, drawn once and remembered.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let R, scene, cam; const cache = new Map();
export function thumb(def) {
  if (cache.has(def.id)) return cache.get(def.id);
  if (!R) {
    R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); R.setSize(160, 160, false);
    R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 0.9;
    scene = new THREE.Scene(); scene.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
    const sun = new THREE.DirectionalLight('#fff', 2.2); sun.position.set(3, 6, 4); scene.add(sun, new THREE.HemisphereLight('#fff', '#b0a090', 0.9));
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  }
  const g = def.make(def.color); scene.add(g);
  const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3()), rad = b.getSize(new THREE.Vector3()).length() / 2 * 0.92;
  cam.left = cam.bottom = -rad; cam.right = cam.top = rad; cam.updateProjectionMatrix();
  cam.position.copy(c).add(new THREE.Vector3(1, 0.8, 1.35).normalize().multiplyScalar(30)); cam.lookAt(c);
  R.render(scene, cam); scene.remove(g);
  const url = R.domElement.toDataURL(); cache.set(def.id, url); return url;
}
