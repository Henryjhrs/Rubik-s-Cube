// ============================================================
// cube.js — pembuatan 27 cubie & tekstur stiker (texture mapping)
// ============================================================
import { App } from './app.js';
import { SPACING, CUBIE_SIZE, THEMES } from './constants.js';

const plasticMat = new THREE.MeshStandardMaterial({ color:0x0d0d0f, roughness:0.75, metalness:0.05 });

function shadeColor(hex, percent){
  const f = parseInt(hex.slice(1),16);
  const t = percent<0?0:255, p = Math.abs(percent)/100;
  const R = f>>16, G=(f>>8)&0xff, B=f&0xff;
  const nr = Math.round((t-R)*p)+R, ng = Math.round((t-G)*p)+G, nb = Math.round((t-B)*p)+B;
  return '#' + (0x1000000 + nr*0x10000 + ng*0x100 + nb).toString(16).slice(1);
}

function makeStickerCanvasTexture(hexColor){
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0d0d0f';
  ctx.fillRect(0,0,256,256);

  const r = 34, pad = 18;
  ctx.beginPath();
  ctx.moveTo(pad+r, pad);
  ctx.arcTo(256-pad,pad,256-pad,256-pad,r);
  ctx.arcTo(256-pad,256-pad,pad,256-pad,r);
  ctx.arcTo(pad,256-pad,pad,pad,r);
  ctx.arcTo(pad,pad,256-pad,pad,r);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0,0,0,256);
  grad.addColorStop(0, shadeColor(hexColor, 18));
  grad.addColorStop(0.55, hexColor);
  grad.addColorStop(1, shadeColor(hexColor, -12));
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(90,70,70,34,-0.4,0,Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  return tex;
}

export function buildCube(){
  App.cubies.forEach(c => App.cubeGroup.remove(c.mesh));
  App.cubies = [];

  const palette = THEMES[App.currentTheme];
  const geo = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);

  for(let x=-1;x<=1;x++){
    for(let y=-1;y<=1;y++){
      for(let z=-1;z<=1;z++){
        const roleAtIndex = [
          x=== 1 ? 'R' : null,
          x===-1 ? 'L' : null,
          y=== 1 ? 'U' : null,
          y===-1 ? 'D' : null,
          z=== 1 ? 'F' : null,
          z===-1 ? 'B' : null,
        ];
        const materials = roleAtIndex.map(role => {
          if(!role) return plasticMat.clone();
          const tex = makeStickerCanvasTexture(palette[role]);
          const m = new THREE.MeshStandardMaterial({ map:tex, roughness:0.35, metalness:0.04 });
          m.userData.role = role;
          return m;
        });
        const mesh = new THREE.Mesh(geo, materials);
        mesh.position.set(x*SPACING, y*SPACING, z*SPACING);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        App.cubeGroup.add(mesh);
        App.cubies.push({ mesh });
      }
    }
  }
}

export function rebuildTextures(themeName){
  App.currentTheme = themeName;
  const palette = THEMES[App.currentTheme];
  App.cubies.forEach(c => {
    c.mesh.material.forEach(m => {
      if(m.userData && m.userData.role){
        m.map.dispose();
        m.map = makeStickerCanvasTexture(palette[m.userData.role]);
        m.needsUpdate = true;
      }
    });
  });
}
