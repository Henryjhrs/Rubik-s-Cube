// ============================================================
// backgrounds.js — preset latar belakang scene. Selain warna polos,
// beberapa preset "realistis" digambar sebagai tekstur gradien lewat
// <canvas> (studio foto, langit senja, langit malam berbintang, kabut
// pagi) — tanpa memuat gambar/aset eksternal apa pun.
// ============================================================

function buildStudioTexture(){
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  // backdrop kertas studio foto: terang di tengah-atas, melembut ke tepi
  const grad = ctx.createRadialGradient(size*0.5, size*0.38, size*0.05, size*0.5, size*0.6, size*0.78);
  grad.addColorStop(0, '#eeece7');
  grad.addColorStop(0.55, '#cac7c1');
  grad.addColorStop(1, '#87847f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // sedikit vignette bawah supaya terasa ada "lantai" backdrop menyatu ke dinding
  const floorShade = ctx.createLinearGradient(0, size*0.62, 0, size);
  floorShade.addColorStop(0, 'rgba(0,0,0,0)');
  floorShade.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = floorShade;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function buildSunsetTexture(){
  const w = 1024, h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1c1440');
  sky.addColorStop(0.32, '#4d2a6b');
  sky.addColorStop(0.58, '#c9556b');
  sky.addColorStop(0.8, '#f0925a');
  sky.addColorStop(1, '#ffd9a0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // pijar matahari mendekati horizon
  const sunGlow = ctx.createRadialGradient(w*0.5, h*0.8, 0, w*0.5, h*0.8, h*0.32);
  sunGlow.addColorStop(0, 'rgba(255,232,190,0.85)');
  sunGlow.addColorStop(1, 'rgba(255,232,190,0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, h);
  return new THREE.CanvasTexture(canvas);
}

function buildNightSkyTexture(){
  const w = 1024, h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#02040c');
  sky.addColorStop(0.6, '#0a1330');
  sky.addColorStop(1, '#182a4d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // taburan bintang acak
  for(let i=0;i<260;i++){
    const x = Math.random()*w;
    const y = Math.random()*h*0.88;
    const r = Math.random()*1.3 + 0.2;
    const a = Math.random()*0.7 + 0.25;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
  }
  // pijar bulan lembut
  const moon = ctx.createRadialGradient(w*0.76, h*0.16, 0, w*0.76, h*0.16, h*0.2);
  moon.addColorStop(0, 'rgba(214,226,255,0.55)');
  moon.addColorStop(1, 'rgba(214,226,255,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(0, 0, w, h);
  return new THREE.CanvasTexture(canvas);
}

function buildMistTexture(){
  const w = 1024, h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#c9d6de');
  grad.addColorStop(0.5, '#e6eaed');
  grad.addColorStop(1, '#f6f4ef');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // pita kabut tipis melintang
  for(let i=0;i<5;i++){
    const y = h*(0.3 + i*0.12) + Math.random()*20;
    const band = ctx.createLinearGradient(0, y-40, 0, y+40);
    band.addColorStop(0, 'rgba(255,255,255,0)');
    band.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    band.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, y-40, w, 80);
  }
  return new THREE.CanvasTexture(canvas);
}

// tekstur canvas cukup dibangun sekali lalu dipakai ulang
const textureCache = {};
function getTexture(key, builder){
  if(!textureCache[key]) textureCache[key] = builder();
  return textureCache[key];
}

export const BG_PRESETS = {
  dark:     { label:'Gelap (klasik)',           type:'color',   color:0x141317, floor:0.28, ring:0x34333c },
  light:    { label:'Terang',                   type:'color',   color:0xe9e6dd, floor:0.15, ring:0xcfcabf },
  midnight: { label:'Biru Malam',               type:'color',   color:0x0d1a2e, floor:0.30, ring:0x28405f },
  purple:   { label:'Ungu',                     type:'color',   color:0x1f1330, floor:0.30, ring:0x4a3465 },
  forest:   { label:'Hijau Hutan',              type:'color',   color:0x0f1f16, floor:0.30, ring:0x2f5240 },
  maroon:   { label:'Merah Marun',              type:'color',   color:0x260f12, floor:0.30, ring:0x5c2a30 },
  slate:    { label:'Abu Batu',                 type:'color',   color:0x2a2d32, floor:0.24, ring:0x50545c },
  studio:   { label:'Studio Foto (realistis)',       type:'texture', build:buildStudioTexture,   floor:0.22, ring:0xb9b6b0 },
  sunset:   { label:'Langit Senja (realistis)',      type:'texture', build:buildSunsetTexture,   floor:0.32, ring:0x8a5a4a },
  night:    { label:'Langit Malam Berbintang (realistis)', type:'texture', build:buildNightSkyTexture, floor:0.32, ring:0x2c3f66 },
  mist:     { label:'Kabut Pagi (realistis)',        type:'texture', build:buildMistTexture,     floor:0.16, ring:0xc7cdd2 },
};

export function applyBackground(App, key){
  const preset = BG_PRESETS[key] || BG_PRESETS.dark;
  App.scene.background = preset.type === 'color'
    ? new THREE.Color(preset.color)
    : getTexture(key, preset.build);
  App.floor.material.opacity = preset.floor;
  if(App.ring) App.ring.material.color.setHex(preset.ring);
}
