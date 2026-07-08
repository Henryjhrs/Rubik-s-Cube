// ============================================================
// scrambleSolve.js — acak, selesaikan (via pembalikan riwayat),
// reset, dan deteksi status "terselesaikan" yang sesungguhnya
// (membaca warna stiker tiap sisi, bukan sekadar hitungan langkah).
// ============================================================
import { App } from './app.js';
import { SPACING } from './constants.js';
import { buildCube } from './cube.js';
import { queueRawMove, moveHistory, resetAll, FACE_DEF, decrementMoveCount } from './rotation.js';

const MOVE_POOL = ['U','D','L','R','F','B'];

let solvedChangeCallbacks = [];
export function onSolvedChange(cb){ solvedChangeCallbacks.push(cb); }
let lastSolved = true;

const LOCAL_FACE_NORMALS = [
  { v:new THREE.Vector3( 1,0,0), matIndex:0 },
  { v:new THREE.Vector3(-1,0,0), matIndex:1 },
  { v:new THREE.Vector3(0, 1,0), matIndex:2 },
  { v:new THREE.Vector3(0,-1,0), matIndex:3 },
  { v:new THREE.Vector3(0,0, 1), matIndex:4 },
  { v:new THREE.Vector3(0,0,-1), matIndex:5 },
];
function stickerColorFacing(mesh, worldDir){
  let best=null, bestDot=-2;
  for(const ln of LOCAL_FACE_NORMALS){
    const wd = ln.v.clone().applyQuaternion(mesh.quaternion);
    const dot = wd.dot(worldDir);
    if(dot>bestDot){ bestDot=dot; best=ln.matIndex; }
  }
  const mat = mesh.material[best];
  return (mat.userData && mat.userData.role) ? mat.userData.role : null;
}

const WORLD_FACES = [
  { axis:'x', val: 1, dir:new THREE.Vector3(1,0,0) },
  { axis:'x', val:-1, dir:new THREE.Vector3(-1,0,0) },
  { axis:'y', val: 1, dir:new THREE.Vector3(0,1,0) },
  { axis:'y', val:-1, dir:new THREE.Vector3(0,-1,0) },
  { axis:'z', val: 1, dir:new THREE.Vector3(0,0,1) },
  { axis:'z', val:-1, dir:new THREE.Vector3(0,0,-1) },
];

export function isSolved(){
  for(const wf of WORLD_FACES){
    const targetPos = wf.val * SPACING;
    const layerCubies = App.cubies.filter(c => Math.abs(c.mesh.position[wf.axis]-targetPos) < 0.4);
    if(layerCubies.length !== 9) return false;
    let refColor = null;
    for(const c of layerCubies){
      const col = stickerColorFacing(c.mesh, wf.dir);
      if(!col) return false;
      if(refColor===null) refColor = col;
      else if(col !== refColor) return false;
    }
  }
  return true;
}

export function refreshSolvedState(){
  if(App.queue.length>0 || App.isAnimating || App.isDragging) return;
  const solved = isSolved();
  if(solved !== lastSolved){
    lastSolved = solved;
    solvedChangeCallbacks.forEach(cb => cb(solved));
  }
}

export function scramble(count){
  let lastFace = null;
  for(let i=0;i<count;i++){
    let face;
    do { face = MOVE_POOL[Math.floor(Math.random()*MOVE_POOL.length)]; } while(face === lastFace);
    lastFace = face;
    const prime = Math.random() < 0.5;
    const def = FACE_DEF[face];
    const turns = def.sign * (prime ? -1 : 1);
    queueRawMove(def.axis, def.layer, turns);
  }
}

export function solve(){
  if(moveHistory.length === 0) return;
  const inverse = moveHistory.slice().reverse().map(m => ({ axis:m.axis, layerIndex:m.layerIndex, turns:-m.turns }));
  moveHistory.length = 0;
  inverse.forEach(m => queueRawMove(m.axis, m.layerIndex, m.turns, { record:false }));
}

export function resetCube(){
  buildCube();
  resetAll();
  lastSolved = true;
}

// ---------- Undo ----------
// Membatalkan gerakan TERAKHIR di riwayat dengan memutar baliknya, tanpa
// mencatatnya sebagai gerakan baru (supaya "gerakan" & "undo" tidak saling
// menambah riwayat tanpa henti).
export function undo(){
  if(App.queue.length>0 || App.isAnimating || App.isDragging) return false;
  if(moveHistory.length===0) return false;
  const last = moveHistory.pop();
  decrementMoveCount();
  queueRawMove(last.axis, last.layerIndex, -last.turns, { record:false });
  return true;
}

// ---------- Hint ----------
// Mengintip (tanpa menjalankan) satu gerakan berikutnya yang akan dilakukan
// oleh solve() — yaitu kebalikan dari gerakan TERAKHIR di riwayat. Berguna
// sebagai petunjuk satu-langkah tanpa langsung menyelesaikan seluruh kubus.
function moveLabel(axis, layerIndex, turns){
  const entry = Object.entries(FACE_DEF).find(([, def]) => def.axis===axis && def.layer===layerIndex);
  if(!entry) return `${axis.toUpperCase()}@${layerIndex}`;
  const [face, def] = entry;
  const normalized = (((turns/def.sign) % 4) + 4) % 4; // 0..3 langkah searah notasi baku
  if(normalized === 1) return face;
  if(normalized === 3) return face + "'";
  if(normalized === 2) return face + '2';
  return face;
}

export function peekHint(){
  if(moveHistory.length===0) return null;
  const last = moveHistory[moveHistory.length-1];
  const turns = -last.turns;
  return {
    axis: last.axis,
    layerIndex: last.layerIndex,
    turns,
    label: moveLabel(last.axis, last.layerIndex, turns),
  };
}

// Menjalankan LANGSUNG satu langkah penyelesaian (kebalikan dari gerakan
// terakhir di riwayat) — kubus benar-benar berputar satu langkah menuju
// selesai, bukan sekadar menyorot lapisan.
export function applyHint(){
  if(App.queue.length>0 || App.isAnimating || App.isDragging) return null;
  if(moveHistory.length===0) return null;
  const last = moveHistory.pop();
  decrementMoveCount();
  const turns = -last.turns;
  const label = moveLabel(last.axis, last.layerIndex, turns);
  queueRawMove(last.axis, last.layerIndex, turns, { record:false });
  return { label };
}
