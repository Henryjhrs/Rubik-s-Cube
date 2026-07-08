// ============================================================
// audio.js — efek suara disintesis langsung lewat Web Audio API,
// tidak ada berkas audio eksternal sama sekali. Dibuat lazy (baru
// membuat AudioContext saat benar-benar dibutuhkan) dan otomatis
// di-"resume" pada interaksi pertama pengguna, sesuai kebijakan
// autoplay browser modern.
// ============================================================

let ctx = null;
let masterGain = null;
let noiseBuffer = null;
let muted = false;
let soundTheme = 'classic';

export function setSoundTheme(theme){ soundTheme = theme; }
export function getSoundTheme(){ return soundTheme; }

function getCtx(){
  if(ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.85;
  masterGain.connect(ctx.destination);

  const length = Math.floor(ctx.sampleRate * 0.3);
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for(let i=0;i<length;i++) data[i] = Math.random()*2 - 1;

  const tryResume = () => { if(ctx.state === 'suspended') ctx.resume(); };
  window.addEventListener('pointerdown', tryResume, { once:true });
  window.addEventListener('keydown', tryResume, { once:true });

  return ctx;
}

export function setMuted(value){
  muted = value;
  if(masterGain) masterGain.gain.value = muted ? 0 : 0.85;
}
export function isMuted(){ return muted; }

// ---------- "clack" pendek untuk satu putaran lapisan, bercabang per tema ----------
function playClickOnce(pitchMul, volume){
  const c = getCtx();
  const t0 = c.currentTime;

  if(soundTheme === 'wood'){
    // "tok" kayu: noise ber-lowpass + nada rendah segitiga, decay agak panjang
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = (750 + Math.random()*150) * pitchMul;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0, t0);
    noiseGain.gain.linearRampToValueAtTime(0.7*volume, t0+0.004);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0+0.09);
    src.connect(lp); lp.connect(noiseGain); noiseGain.connect(masterGain);
    src.start(t0); src.stop(t0+0.1);

    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = (130 + Math.random()*20) * pitchMul;
    const oscGain = c.createGain();
    oscGain.gain.setValueAtTime(0.55*volume, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0+0.1);
    osc.connect(oscGain); oscGain.connect(masterGain);
    osc.start(t0); osc.stop(t0+0.11);
    return;
  }

  if(soundTheme === 'metal'){
    // dentingan logam: bandpass sempit ber-resonansi tinggi, decay lebih panjang & berdering
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = (3400 + Math.random()*800) * pitchMul;
    bp.Q.value = 7;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0, t0);
    noiseGain.gain.linearRampToValueAtTime(0.55*volume, t0+0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0+0.16);
    src.connect(bp); bp.connect(noiseGain); noiseGain.connect(masterGain);
    src.start(t0); src.stop(t0+0.17);

    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = (2100 + Math.random()*300) * pitchMul;
    const oscGain = c.createGain();
    oscGain.gain.setValueAtTime(0.28*volume, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0+0.2);
    osc.connect(oscGain); oscGain.connect(masterGain);
    osc.start(t0); osc.stop(t0+0.21);
    return;
  }

  if(soundTheme === 'digital'){
    // bip elektronik: gelombang kotak pendek dengan pitch turun cepat
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime((980 + Math.random()*80) * pitchMul, t0);
    osc.frequency.exponentialRampToValueAtTime((520) * pitchMul, t0+0.045);
    const g = c.createGain();
    g.gain.setValueAtTime(0.22*volume, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0+0.055);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0+0.06);
    return;
  }

  if(soundTheme === 'soft'){
    // pop lembut: nada sinus tunggal, serangan halus, tanpa noise
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = (360 + Math.random()*30) * pitchMul;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.35*volume, t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0+0.09);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0+0.1);
    return;
  }

  // ---------- classic (bawaan): lapisan noise ber-filter bandpass "plastik" ----------
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = (2200 + Math.random()*600) * pitchMul;
  bp.Q.value = 1.2;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(0, t0);
  noiseGain.gain.linearRampToValueAtTime(0.9*volume, t0+0.002);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t0+0.05);
  src.connect(bp); bp.connect(noiseGain); noiseGain.connect(masterGain);
  src.start(t0); src.stop(t0+0.06);

  // nada rendah pendek -> memberi "bobot"/isi pada klik
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = (180 + Math.random()*40) * pitchMul;
  const oscGain = c.createGain();
  oscGain.gain.setValueAtTime(0.5*volume, t0);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t0+0.045);
  osc.connect(oscGain); oscGain.connect(masterGain);
  osc.start(t0); osc.stop(t0+0.05);
}

// dipanggil setiap kali SATU putaran lapisan benar-benar terjadi
// (dari drag mouse, keyboard, tombol, scramble, solve, ataupun undo).
export function playTurnClick(turns=1){
  if(muted) return;
  playClickOnce(1, 1);
  if(Math.abs(turns) >= 2){
    setTimeout(() => { if(!muted) playClickOnce(1.05, 0.85); }, 55);
  }
}

export function playUIClick(){
  if(muted) return;
  playClickOnce(1.6, 0.32);
}

// ---------- tekstur gesekan halus selama drag berlangsung ----------
let dragSrc = null, dragGain = null;

export function startDragTexture(){
  if(muted) return;
  stopDragTexture();
  const c = getCtx();
  dragSrc = c.createBufferSource();
  dragSrc.buffer = noiseBuffer;
  dragSrc.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  dragGain = c.createGain();
  dragGain.gain.setValueAtTime(0, c.currentTime);
  dragGain.gain.linearRampToValueAtTime(0.10, c.currentTime+0.05);
  dragSrc.connect(lp); lp.connect(dragGain); dragGain.connect(masterGain);
  dragSrc.start();
}

export function stopDragTexture(){
  if(!dragSrc) return;
  const c = getCtx();
  const src = dragSrc, g = dragGain;
  dragSrc = null; dragGain = null;
  g.gain.cancelScheduledValues(c.currentTime);
  g.gain.setValueAtTime(g.gain.value, c.currentTime);
  g.gain.linearRampToValueAtTime(0, c.currentTime+0.08);
  src.stop(c.currentTime+0.1);
}

// ---------- chime perayaan saat kubus terselesaikan ----------
export function playSolveChime(){
  if(muted) return;
  const c = getCtx();
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const t0 = c.currentTime + i*0.11;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.35, t0+0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0+0.55);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0+0.6);
  });
}
