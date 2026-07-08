// ============================================================
// confetti.js — sistem partikel sederhana untuk merayakan kubus
// yang berhasil diselesaikan (THREE.Points + gravitasi ringan).
// ============================================================
import { App } from './app.js';

let confettiPoints = null;
let confettiVelocities = null;
let confettiLife = 0;

export function spawnConfetti(){
  const COUNT = 260;
  const positions = new Float32Array(COUNT*3);
  const colors = new Float32Array(COUNT*3);
  confettiVelocities = new Float32Array(COUNT*3);
  const palette = [0xf4f2ea,0xe8b93a,0xc8483a,0xd97a35,0x4c9a6a,0x3b6fbf];

  for(let i=0;i<COUNT;i++){
    positions[i*3+0] = (Math.random()-0.5)*2.4;
    positions[i*3+1] = 1.6 + Math.random()*0.6;
    positions[i*3+2] = (Math.random()-0.5)*2.4;

    confettiVelocities[i*3+0] = (Math.random()-0.5)*3.2;
    confettiVelocities[i*3+1] = Math.random()*3.6 + 1.2;
    confettiVelocities[i*3+2] = (Math.random()-0.5)*3.2;

    const col = new THREE.Color(palette[Math.floor(Math.random()*palette.length)]);
    colors[i*3+0]=col.r; colors[i*3+1]=col.g; colors[i*3+2]=col.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  const mat = new THREE.PointsMaterial({ size:0.09, vertexColors:true, transparent:true, opacity:1 });

  if(confettiPoints) App.scene.remove(confettiPoints);
  confettiPoints = new THREE.Points(geo, mat);
  App.scene.add(confettiPoints);
  confettiLife = 2.2;
}

export function updateConfetti(dt){
  if(!confettiPoints) return;
  confettiLife -= dt;
  const pos = confettiPoints.geometry.attributes.position;
  const g = -4.2;
  for(let i=0;i<pos.count;i++){
    confettiVelocities[i*3+1] += g*dt;
    pos.array[i*3+0] += confettiVelocities[i*3+0]*dt;
    pos.array[i*3+1] += confettiVelocities[i*3+1]*dt;
    pos.array[i*3+2] += confettiVelocities[i*3+2]*dt;
  }
  pos.needsUpdate = true;
  confettiPoints.material.opacity = Math.max(0, confettiLife/2.2);
  if(confettiLife<=0){
    App.scene.remove(confettiPoints);
    confettiPoints.geometry.dispose();
    confettiPoints.material.dispose();
    confettiPoints = null;
  }
}
