// ============================================================
// ui.js — menyambungkan panel HTML (pengaturan, aksi, HUD) dengan
// logika di modul lain. Tidak ada tombol untuk memutar lapisan di
// sini — itu sekarang dilakukan langsung dengan menyeret kubus
// (lihat dragControls.js). Keyboard tetap tersedia sebagai alternatif.
// ============================================================
import { App } from './app.js';
import { rebuildTextures } from './cube.js';
import { queueMove, onMove } from './rotation.js';
import { scramble, solve, resetCube, onSolvedChange, undo, applyHint } from './scrambleSolve.js';
import { BG_PRESETS, applyBackground } from './backgrounds.js';
import { onFirstDragResolved } from './dragControls.js';
import { spawnConfetti } from './confetti.js';
import { playSolveChime, playUIClick, setMuted, setSoundTheme } from './audio.js';

export function initUI(){
  // ---------- HUD ----------
  const hudMoves = document.getElementById('hud-moves');
  const hudTimer = document.getElementById('hud-timer');
  onMove((count) => { hudMoves.textContent = count; });

  let timerStart = null, timerRunning = false, timerRAF = null;
  function startTimerIfNeeded(){
    if(timerRunning) return;
    timerRunning = true;
    timerStart = performance.now();
    tickTimer();
  }
  function tickTimer(){
    if(!timerRunning) return;
    const elapsed = (performance.now()-timerStart)/1000;
    const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
    const ss = String(Math.floor(elapsed%60)).padStart(2,'0');
    hudTimer.textContent = `${mm}:${ss}`;
    timerRAF = requestAnimationFrame(tickTimer);
  }
  function stopTimer(){
    timerRunning = false;
    if(timerRAF) cancelAnimationFrame(timerRAF);
  }
  function resetTimerDisplay(){
    stopTimer();
    hudTimer.textContent = '00:00';
  }

  onMove(() => startTimerIfNeeded());
  onFirstDragResolved(() => startTimerIfNeeded());

  // ---------- banner "terselesaikan" ----------
  const banner = document.getElementById('solved-banner');
  onSolvedChange((solved) => {
    if(solved){
      banner.classList.add('show');
      stopTimer();
      spawnConfetti();
      playSolveChime();
    } else {
      banner.classList.remove('show');
    }
  });

  // ---------- petunjuk drag pertama kali ----------
  const dragHintEl = document.getElementById('drag-hint');
  onFirstDragResolved(() => {
    dragHintEl.classList.add('hide');
  });

  // ---------- tombol aksi ----------
  document.getElementById('btn-scramble').onclick = () => {
    playUIClick();
    banner.classList.remove('show');
    const n = parseInt(document.getElementById('scramble-slider').value, 10);
    scramble(n);
  };
  document.getElementById('btn-solve').onclick = () => { playUIClick(); solve(); };

  // ---------- Undo & Hint ----------
  const hintText = document.getElementById('hint-text');
  let hintTextTimeout = null;

  function showHintText(html, duration){
    hintText.innerHTML = html;
    hintText.classList.add('show');
    clearTimeout(hintTextTimeout);
    hintTextTimeout = setTimeout(() => hintText.classList.remove('show'), duration);
  }

  document.getElementById('btn-undo').onclick = () => {
    playUIClick();
    const ok = undo();
    if(!ok) showHintText('Tidak ada gerakan untuk dibatalkan.', 2000);
  };

  document.getElementById('btn-hint').onclick = () => {
    playUIClick();
    const result = applyHint();
    if(!result){
      showHintText('Kubus sudah rapi — tidak ada petunjuk.', 2200);
      return;
    }
    showHintText(`Bergerak: <b>${result.label}</b>`, 1800);
  };

  document.getElementById('btn-reset-cube').onclick = () => {
    playUIClick();
    resetCube();
    banner.classList.remove('show');
    resetTimerDisplay();
  };
  document.getElementById('btn-reset-cam').onclick = () => {
    playUIClick();
    App.camera.position.set(5.4,4.6,6.4);
    App.controls.target.set(0,0,0);
  };

  // ---------- pengaturan ----------
  const speedSlider = document.getElementById('speed-slider');
  const speedVal = document.getElementById('speed-val');
  speedSlider.addEventListener('input', () => {
    App.animDuration = parseInt(speedSlider.value,10);
    speedVal.textContent = App.animDuration + ' ms';
  });

  const scrambleSlider = document.getElementById('scramble-slider');
  const scrambleVal = document.getElementById('scramble-val');
  scrambleSlider.addEventListener('input', () => {
    scrambleVal.textContent = scrambleSlider.value + ' gerakan';
  });

  document.getElementById('theme-select').addEventListener('change', (e) => {
    rebuildTextures(e.target.value);
  });

  document.getElementById('toggle-autorotate').addEventListener('change', (e) => {
    App.controls.autoRotate = e.target.checked;
  });

  const bgSelect = document.getElementById('bg-select');
  Object.entries(BG_PRESETS).forEach(([key, preset]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = preset.label;
    bgSelect.appendChild(opt);
  });
  bgSelect.value = 'dark';
  bgSelect.addEventListener('change', (e) => applyBackground(App, e.target.value));

  document.getElementById('sound-theme-select').addEventListener('change', (e) => {
    setSoundTheme(e.target.value);
    playUIClick();
  });

  document.getElementById('toggle-mute').addEventListener('change', (e) => {
    setMuted(e.target.checked);
  });

  // ---------- keyboard (alternatif selain drag mouse) ----------
  const KEY_TO_FACE = { u:'U', d:'D', l:'L', r:'R', f:'F', b:'B', m:'M', e:'E', s:'S' };
  window.addEventListener('keydown', (ev) => {
    if((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z'){
      ev.preventDefault();
      document.getElementById('btn-undo').click();
      return;
    }
    const key = ev.key.toLowerCase();
    if(key === 'h'){
      document.getElementById('btn-hint').click();
      return;
    }
    if(KEY_TO_FACE[key]){
      queueMove(KEY_TO_FACE[key], ev.shiftKey);
    }
  });
}
