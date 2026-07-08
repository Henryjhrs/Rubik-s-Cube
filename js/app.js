// ============================================================
// app.js — state bersama & inisialisasi scene/camera/renderer/lighting
// Modul lain mengimpor { App } ini dan membaca/menulis propertinya,
// sehingga tidak perlu variabel global yang tersebar di banyak file.
// ============================================================

export const App = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  cubeGroup: null,
  pivot: null,
  cubies: [],          // { mesh } — posisi logis dibaca langsung dari mesh.position
  currentTheme: 'classic',
  animDuration: 280,   // ms, dipakai untuk gerakan lewat tombol/keyboard
  isAnimating: false,
  isDragging: false,
  queue: [],
  animState: null,
};

export function initScene(container){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x141317);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(5.4, 4.6, 6.4);

  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.style.touchAction = 'none'; // cegah gesture scroll bawaan browser saat drag di kanvas
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 4.5;
  controls.maxDistance = 12;
  controls.enablePan = false;
  controls.target.set(0,0,0);
  controls.autoRotate = false;
  controls.autoRotateSpeed = 1.6;

  // Menggeser kubus sedikit ke kiri secara visual (tanpa mengubah sudut
  // pandang/rotasi kamera) memakai offset frustum kamera — supaya kubus
  // tidak terlalu berdempetan dengan panel GUI di sisi kanan. Hanya
  // diterapkan di layar lebar; di layar sempit panel GUI pindah ke bawah
  // (lihat media query di style.css) sehingga offset tidak diperlukan.
  function updateCameraOffset(){
    const w = window.innerWidth, h = window.innerHeight;
    if(w > 760){
      camera.setViewOffset(w, h, w * 0.09, 0, w, h);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  }
  updateCameraOffset();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateCameraOffset();
  });

  // ---------- lighting ----------
  const hemi = new THREE.HemisphereLight(0xdfe6ff, 0x14121a, 0.55);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.15);
  keyLight.position.set(6, 9, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048,2048);
  keyLight.shadow.camera.left = -8;
  keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.0015;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x88a5ff, 0.35);
  fillLight.position.set(-6, 3, -5);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffffff, 0.25, 20);
  rimLight.position.set(0, -6, 0);
  scene.add(rimLight);

  // ---------- floor + turntable ring (menangkap bayangan lembut) ----------
  const floorGeo = new THREE.CircleGeometry(9, 64);
  const floorMat = new THREE.ShadowMaterial({ opacity:0.28 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2;
  floor.position.y = -2.05;
  floor.receiveShadow = true;
  scene.add(floor);

  const ringGeo = new THREE.RingGeometry(3.6, 3.63, 96);
  const ringMat = new THREE.MeshBasicMaterial({ color:0x34333c, side:THREE.DoubleSide, transparent:true, opacity:0.5 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = -2.04;
  scene.add(ring);

  const cubeGroup = new THREE.Group();
  scene.add(cubeGroup);

  const pivot = new THREE.Group();
  scene.add(pivot);

  App.scene = scene;
  App.camera = camera;
  App.renderer = renderer;
  App.controls = controls;
  App.cubeGroup = cubeGroup;
  App.pivot = pivot;
  App.floor = floor;
  App.ring = ring;

  return App;
}
