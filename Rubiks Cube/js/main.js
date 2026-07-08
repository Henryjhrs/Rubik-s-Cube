// ============================================================
// main.js — titik masuk aplikasi: menyusun semua modul dan
// menjalankan render loop.
// ============================================================
import { App, initScene } from './app.js';
import { buildCube } from './cube.js';
import { stepAnimation, onTurn } from './rotation.js';
import { initDragControls } from './dragControls.js';
import { refreshSolvedState } from './scrambleSolve.js';
import { onSettled } from './rotation.js';
import { updateConfetti } from './confetti.js';
import { playTurnClick } from './audio.js';
import { initUI } from './ui.js';

const boot = document.getElementById('boot-hint');
if(typeof THREE === 'undefined'){
  boot.textContent = 'Gagal memuat Three.js — periksa koneksi internet.';
} else {
  boot.remove();
}

const container = document.getElementById('scene-container');
initScene(container);
buildCube();
initDragControls(container);
initUI();

// setiap kali sebuah gerakan (dari tombol, keyboard, atau drag mouse) selesai
// dianimasikan, periksa ulang apakah kubus sudah dalam keadaan terselesaikan.
onSettled(refreshSolvedState);

// setiap kali SATU putaran lapisan benar-benar terjadi (dari sumber manapun),
// mainkan suara "clack" yang sesuai.
onTurn(playTurnClick);

let lastTime = performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dtMs = Math.min(now - lastTime, 50);
  lastTime = now;

  stepAnimation(dtMs);
  updateConfetti(dtMs/1000);
  App.controls.update();
  App.renderer.render(App.scene, App.camera);
}
requestAnimationFrame(animate);
