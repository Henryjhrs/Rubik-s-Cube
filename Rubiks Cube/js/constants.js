// ============================================================
// constants.js — nilai tetap yang dipakai lintas modul
// ============================================================

export const SPACING = 1.03;      // jarak antar pusat cubie
export const CUBIE_SIZE = 0.96;   // ukuran kubus tiap cubie (menyisakan celah kecil)

// Ambang batas (dalam satuan dunia) sebelum drag dianggap "sengaja" menentukan
// lapisan & sumbu putar. Di bawah ini dianggap klik biasa (tidak melakukan apa-apa).
export const DRAG_THRESHOLD = 0.16;

// Berapa radian putaran per satuan dunia pergeseran mouse saat drag langsung
// di atas kubus. Angka lebih besar = lapisan terasa lebih "cepat" mengikuti mouse.
export const DRAG_SENSITIVITY = 1.7;

// Durasi (ms) animasi "snap" ke kelipatan 90 derajat terdekat setelah mouse dilepas.
export const SNAP_DURATION = 190;

export const THEMES = {
  classic: { U:'#f4f2ea', D:'#e8b93a', L:'#d97a35', R:'#c8483a', F:'#4c9a6a', B:'#3b6fbf' },
  pastel:  { U:'#f7f4ee', D:'#f1d98c', L:'#f0b988', R:'#e79a94', F:'#9bcbab', B:'#93b3e0' },
  neon:    { U:'#f2f2f2', D:'#f4e409', L:'#ff7a00', R:'#ff1744', F:'#00e676', B:'#2979ff' },
};
