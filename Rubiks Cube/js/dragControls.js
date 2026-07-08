// ============================================================
// dragControls.js — memutar lapisan langsung dengan menyeret mouse
// di atas kubus (bukan tombol). Menyeret area kosong tetap memutar
// sudut pandang kamera (OrbitControls) seperti biasa.
//
// Cara kerja singkat:
// 1. pointerdown  -> raycast ke cubie yang diklik, ambil normal wajah
//    dunia-nya, siapkan "bidang seret" (drag plane) sebidang wajah itu.
// 2. pointermove  -> proyeksikan mouse ke drag plane, begitu jarak
//    geser melewati ambang batas, tentukan sumbu putar lewat hasil
//    cross-product(normal wajah, arah seret) — ini otomatis benar
//    untuk sisi kubus manapun tanpa perlu tabel kasus per wajah.
//    Selama mouse ditahan, lapisan mengikuti gerakan mouse secara live.
// 3. pointerup    -> sudut dibulatkan ke kelipatan 90 derajat terdekat
//    dan dianimasikan singkat ke posisi itu (efek "snap").
// ============================================================
import { App } from './app.js';
import { SPACING, DRAG_THRESHOLD, DRAG_SENSITIVITY, SNAP_DURATION } from './constants.js';
import { AXIS_VEC, selectLayerCubies, attachToPivot, animatePivotAbsolute, finalizeMove } from './rotation.js';
import { startDragTexture, stopDragTexture } from './audio.js';

const raycaster = new THREE.Raycaster();
const AXES = ['x','y','z'];

let pending = null;      // gesture yang sedang berlangsung (belum tentu "menentukan" sumbu)
let onDragStartCb = null;

export function onFirstDragResolved(cb){ onDragStartCb = cb; }

function getNDC(ev, canvas){
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(
    ((ev.clientX - rect.left) / rect.width) * 2 - 1,
    -((ev.clientY - rect.top) / rect.height) * 2 + 1
  );
}

function handlePointerDown(ev){
  if(App.isAnimating || App.queue.length > 0) return; // jangan mulai drag baru saat masih animasi lain
  const canvas = App.renderer.domElement;
  const ndc = getNDC(ev, canvas);
  raycaster.setFromCamera(ndc, App.camera);
  const hits = raycaster.intersectObjects(App.cubeGroup.children);
  if(hits.length === 0) return; // kena area kosong -> biarkan OrbitControls yang menangani

  ev.preventDefault();
  ev.stopPropagation(); // cegah OrbitControls ikut memulai orbit untuk gesture yang sama

  const hit = hits[0];
  const mesh = hit.object;
  const normalWorld = hit.face.normal.clone().applyQuaternion(mesh.quaternion).normalize();
  normalWorld.set(Math.round(normalWorld.x), Math.round(normalWorld.y), Math.round(normalWorld.z));
  const faceAxis = AXES.find(a => normalWorld[a] !== 0);

  App.controls.enabled = false;

  pending = {
    mesh,
    faceAxis,
    faceNormal: normalWorld.clone(),
    startPoint: hit.point.clone(),
    plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normalWorld, hit.point),
    determined: false,
    liveAngle: 0,
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);
}

function handlePointerMove(ev){
  if(!pending) return;
  const canvas = App.renderer.domElement;
  const ndc = getNDC(ev, canvas);
  raycaster.setFromCamera(ndc, App.camera);

  const current = new THREE.Vector3();
  if(!raycaster.ray.intersectPlane(pending.plane, current)) return;
  const dragVec = current.clone().sub(pending.startPoint);

  if(!pending.determined){
    if(dragVec.length() < DRAG_THRESHOLD) return;

    const inPlaneAxes = AXES.filter(a => a !== pending.faceAxis);
    const [axisA, axisB] = inPlaneAxes;
    const compA = Math.abs(dragVec[axisA]);
    const compB = Math.abs(dragVec[axisB]);
    const dominantAxis = compA >= compB ? axisA : axisB;
    const rotationAxis = compA >= compB ? axisB : axisA;

    const cross = new THREE.Vector3().crossVectors(pending.faceNormal, dragVec);
    const rotSign = Math.sign(cross[rotationAxis]) || 1;

    const layerIndex = Math.round(pending.mesh.position[rotationAxis] / SPACING);
    const cubieList = selectLayerCubies(rotationAxis, layerIndex);
    attachToPivot(cubieList);

    pending.determined = true;
    pending.dominantAxis = dominantAxis;
    pending.rotationAxis = rotationAxis;
    pending.rotSign = rotSign;
    pending.layerIndex = layerIndex;
    pending.cubieList = cubieList;
    pending.axisVec = AXIS_VEC[rotationAxis];

    App.isDragging = true;
    if(onDragStartCb) onDragStartCb();
    startDragTexture();
  }

  const raw = dragVec[pending.dominantAxis];
  const angle = raw * pending.rotSign * DRAG_SENSITIVITY;
  pending.liveAngle = angle;
  App.pivot.quaternion.setFromAxisAngle(pending.axisVec, angle);
}

function handlePointerUp(){
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('pointercancel', handlePointerUp);

  App.controls.enabled = true;
  stopDragTexture();

  if(!pending){ return; }

  if(!pending.determined){
    pending = null;
    return; // gerakan terlalu kecil -> dianggap klik biasa, tidak melakukan apapun
  }

  const turns = Math.max(-2, Math.min(2, Math.round(pending.liveAngle / (Math.PI/2))));
  const fromAngle = pending.liveAngle;
  const toAngle = turns * (Math.PI/2);
  const cubieList = pending.cubieList;
  const axis = pending.rotationAxis;
  const layerIndex = pending.layerIndex;

  App.isAnimating = true;
  App.isDragging = false;
  animatePivotAbsolute(pending.axisVec, fromAngle, toAngle, SNAP_DURATION, () => {
    finalizeMove({ cubieList, turns, axis, layerIndex, record: true });
  });

  pending = null;
}

export function initDragControls(container){
  // capture:true supaya handler ini berjalan lebih dulu daripada listener
  // pointerdown milik OrbitControls (yang terpasang langsung di kanvas),
  // sehingga kita bisa memutuskan lebih awal apakah gesture ini milik
  // "putar lapisan" atau "putar kamera".
  container.addEventListener('pointerdown', handlePointerDown, { capture:true });
}
