// ============================================================
// rotation.js — inti transformasi 3D: memilih lapisan, memutar
// lewat pivot group, menganimasikan sudut, dan antrian gerakan.
// Dipakai bersama oleh keyboard/tombol aksi maupun drag mouse
// (js/dragControls.js) supaya logikanya satu sumber saja.
// ============================================================
import { App } from './app.js';
import { SPACING } from './constants.js';

export const AXIS_VEC = {
  x: new THREE.Vector3(1,0,0),
  y: new THREE.Vector3(0,1,0),
  z: new THREE.Vector3(0,0,1),
};

// Pemetaan notasi wajah (untuk keyboard) -> sumbu, lapisan, dan tanda arah.
export const FACE_DEF = {
  U:{ axis:'y', layer: 1, sign:-1 },
  D:{ axis:'y', layer:-1, sign: 1 },
  R:{ axis:'x', layer: 1, sign:-1 },
  L:{ axis:'x', layer:-1, sign: 1 },
  F:{ axis:'z', layer: 1, sign: 1 },
  B:{ axis:'z', layer:-1, sign:-1 },
  M:{ axis:'x', layer: 0, sign: 1 },
  E:{ axis:'y', layer: 0, sign: 1 },
  S:{ axis:'z', layer: 0, sign: 1 },
};

export const moveHistory = [];
let moveCount = 0;
let settledCallbacks = [];
let moveCallbacks = [];
let turnCallbacks = [];

export function onSettled(cb){ settledCallbacks.push(cb); }
export function onMove(cb){ moveCallbacks.push(cb); }
export function onTurn(cb){ turnCallbacks.push(cb); }
function fireSettled(){ settledCallbacks.forEach(cb => cb()); }
function fireMove(){ moveCallbacks.forEach(cb => cb(moveCount)); }
function fireTurn(turns){ turnCallbacks.forEach(cb => cb(turns)); }

export function getMoveCount(){ return moveCount; }

export function decrementMoveCount(){
  moveCount = Math.max(0, moveCount - 1);
  fireMove();
}

export function resetAll(){
  App.queue.length = 0;
  App.isAnimating = false;
  App.animState = null;
  moveHistory.length = 0;
  moveCount = 0;
  fireMove();
}

// ---------- pemilihan & pemindahan cubie ke pivot ----------
export function selectLayerCubies(axis, layerIndex){
  const targetPos = layerIndex * SPACING;
  return App.cubies.filter(c => Math.abs(c.mesh.position[axis] - targetPos) < 0.4);
}

export function attachToPivot(cubieList){
  App.pivot.rotation.set(0,0,0);
  App.pivot.position.set(0,0,0);
  cubieList.forEach(c => App.pivot.attach(c.mesh));
}

function snapMeshTransform(mesh){
  mesh.position.set(
    Math.round(mesh.position.x/SPACING)*SPACING,
    Math.round(mesh.position.y/SPACING)*SPACING,
    Math.round(mesh.position.z/SPACING)*SPACING
  );
  const m4 = new THREE.Matrix4().makeRotationFromQuaternion(mesh.quaternion);
  const e = m4.elements;
  for(let i=0;i<e.length;i++){
    if((i+1)%4===0) continue; // lewati baris/kolom homogen
    e[i] = Math.round(e[i]);
  }
  mesh.quaternion.setFromRotationMatrix(m4);
}

export function releasePivotToGroup(cubieList){
  cubieList.forEach(c => {
    App.cubeGroup.attach(c.mesh);
    snapMeshTransform(c.mesh);
  });
}

// ---------- animasi sudut pivot (dipakai queue & drag-release) ----------
export function animatePivotAbsolute(axisVec, fromAngle, toAngle, duration, onDone){
  App.animState = { axisVec, fromAngle, toAngle, elapsed:0, duration, onDone };
}

export function stepAnimation(dtMs){
  const st = App.animState;
  if(!st) return;
  st.elapsed += dtMs;
  const t = Math.min(st.elapsed/st.duration, 1);
  const eased = 1 - Math.pow(1-t, 3);
  const angle = st.fromAngle + (st.toAngle - st.fromAngle) * eased;
  App.pivot.quaternion.setFromAxisAngle(st.axisVec, angle);
  if(t >= 1){
    const done = st.onDone;
    App.animState = null;
    done();
  }
}

// ---------- titik akhir bersama: tombol/keyboard & drag mouse ----------
export function finalizeMove({ cubieList, turns, axis, layerIndex, record }){
  releasePivotToGroup(cubieList);
  App.isAnimating = false;
  if(turns !== 0){
    fireTurn(turns);
    if(record){
      moveHistory.push({ axis, layerIndex, turns });
      moveCount++;
      fireMove();
    }
  }
  fireSettled();
  processQueue();
}

// ---------- antrian gerakan terprogram (tombol aksi, keyboard, scramble, solve) ----------
export function queueRawMove(axis, layerIndex, turns, opts){
  opts = opts || {};
  if(turns === 0) return;
  App.queue.push({ axis, layerIndex, turns, record: opts.record !== false });
  processQueue();
}

export function queueMove(face, prime, opts){
  const def = FACE_DEF[face];
  if(!def) return;
  const turns = def.sign * (prime ? -1 : 1);
  queueRawMove(def.axis, def.layer, turns, opts);
}

export function processQueue(){
  if(App.isAnimating || App.isDragging || App.queue.length === 0) return;
  const mv = App.queue.shift();
  App.isAnimating = true;
  const cubieList = selectLayerCubies(mv.axis, mv.layerIndex);
  attachToPivot(cubieList);
  const targetAngle = mv.turns * (Math.PI/2);
  animatePivotAbsolute(AXIS_VEC[mv.axis], 0, targetAngle, App.animDuration, () => {
    finalizeMove({ cubieList, turns: mv.turns, axis: mv.axis, layerIndex: mv.layerIndex, record: mv.record });
  });
}
