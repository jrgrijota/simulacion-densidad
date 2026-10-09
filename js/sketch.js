'use strict';
// ============================================================
//  Simulación de Densidad — Física y Química 2º-3º ESO
// ============================================================

// ── Materiales ───────────────────────────────────────────────
// Vista microscópica (lupa). Sólidos y líquidos tienen siempre las partículas
// juntas, como en el modelo cinético. La densidad sale de dos cosas que la lupa
// enseña: cuánto pesa cada partícula (`u`, masa en unidades de masa atómica) y
// cuántas caben por cm³ (`d`, diámetro relativo al de la molécula de agua,
// d ∝ n^(-1/3) con el número real de partículas por cm³). Corcho y madera son
// porosos: `fill` es la fracción de pared (celulosa, ~1,5 g/cm³); el resto, aire.
//   lat: 'hex' red ordenada · 'liquid' juntas y en movimiento · 'amorph' juntas y
//        desordenadas · 'cells' pared con celdas de aire
const MATS = [
  { id:'corcho', name:'Corcho',        rho:0.18,  col:[215,188,148], cat:'solid',
    lat:'cells', cell:0.62, fill:0.12, d:0.7, u:162, micro:'Paredes de celulosa con celdas de aire' },
  { id:'madera', name:'Madera',        rho:0.60,  col:[168,118,72],  cat:'solid',
    lat:'cells', cell:0.34, fill:0.40, d:0.7, u:162, micro:'Fibras de celulosa con poros de aire' },
  { id:'hielo',  name:'Hielo',         rho:0.92,  col:[185,224,242], cat:'solid',
    lat:'hex', gap:1.16, d:1.03, u:18, micro:'Moléculas de agua (18 u) en una red abierta' },
  { id:'agua',   name:'Agua',          rho:1.00,  col:[ 55,130,215], cat:'liquid',
    lat:'liquid', d:1.0, gap:1.05, u:18, micro:'Moléculas de agua (18 u), juntas y en movimiento' },
  { id:'plast',  name:'Plástico PET',  rho:1.38,  col:[200,195,215], cat:'solid',
    lat:'amorph', d:1.9, u:192, micro:'Eslabones de PET (192 u), juntos y desordenados' },
  { id:'alum',   name:'Aluminio',      rho:2.70,  col:[188,194,208], cat:'solid',
    lat:'hex', d:0.83, u:27, micro:'Átomos de aluminio (27 u), muy juntos' },
  { id:'hierro', name:'Hierro',        rho:7.87,  col:[122,130,142], cat:'solid',
    lat:'hex', d:0.74, u:56, micro:'Átomos de hierro (56 u), muy juntos' },
  { id:'cobre',  name:'Cobre',         rho:8.96,  col:[200,118,65],  cat:'solid',
    lat:'hex', d:0.74, u:64, micro:'Átomos de cobre (64 u), muy juntos' },
  { id:'plomo',  name:'Plomo',         rho:11.34, col:[108,113,124], cat:'solid',
    lat:'hex', d:1.0, u:207, micro:'Átomos de plomo (207 u): muy pesados' },
  { id:'custom', name:'Personalizado', rho:null,  col:[155,145,210], cat:'custom',
    lat:'hex', d:1.0, u:null, micro:'Material inventado' },
];

const MAX_RHO  = 14.0;
const REF_VOL  = 200;    // cm³ de referencia para escalar cajas
const ATOM_R   = 2.5;    // radio fijo de partícula en caja macro (px) — NUNCA varía
const BOX_FILL = 0.058;  // fracción de relleno por unidad de densidad (calibrado: agua≈120 part.)
const MIC_AF   = 0.075;  // radio de una molécula de agua en la lupa = radio_lupa × MIC_AF

// ── Estado global ─────────────────────────────────────────────
let simMode   = 'single';
let cmpSub    = 'samevol';
let showMicro = true;

let singleMatIdx = 3;
let singleVol    = 200;
let customMass   = 200;
let customVol    = 200;

let matAIdx   = 1;
let matBIdx   = 6;
let sharedVal = 200;

// ── Partículas (solo lupa microscópica) ─────────────────────
let microSingle = [], microA = [], microB = [];
let needRebuild = true;

// ── Tema canvas ────────────────────────────────────────────
let TH;
const CANVAS_THEMES = {
  dark: {
    bg:      [12,  14,  20 ],
    panel:   [18,  22,  30 ],
    text:    [208, 216, 232],
    muted:   [88,  108, 134],
    accent:  [0,   200, 255],
    border:  [38,  48,  64 ],
    grid:    [20,  26,  38 ],
    water:   [55,  130, 215],
    warning: [240, 168, 50 ],
  },
  light: {
    bg:      [218, 224, 240],
    panel:   [240, 243, 252],
    text:    [26,  32,  52 ],
    muted:   [105, 120, 155],
    accent:  [0,   136, 204],
    border:  [178, 188, 214],
    grid:    [205, 214, 234],
    water:   [40,  100, 200],
    warning: [192, 128, 32 ],
  },
  contrast: {
    bg:      [0,   0,   0  ],
    panel:   [8,   8,   8  ],
    text:    [255, 255, 255],
    muted:   [200, 200, 200],
    accent:  [255, 255, 0  ],
    border:  [80,  80,  80 ],
    grid:    [20,  20,  20 ],
    water:   [100, 180, 255],
    warning: [255, 170, 0  ],
  }
};

// ── Colores objetos comparados ─────────────────────────────
const COL_A = [79,  142, 247];
const COL_B = [247, 130, 60 ];

// ============================================================
//  p5 lifecycle
// ============================================================
function setup() {
  let cnv = createCanvas(760, 520);
  cnv.parent('canvas-container');
  frameRate(40);
  colorMode(RGB, 255);
  populateSelects();
  setupDomListeners();
  syncFromDom();
}

function draw() {
  let t = document.documentElement.getAttribute('data-theme') || 'dark';
  TH = CANVAS_THEMES[t] || CANVAS_THEMES.dark;

  if (needRebuild) {
    buildAll();
    needRebuild = false;
  }

  background(...TH.bg);
  drawGrid();

  if (simMode === 'single') drawSingleMode();
  else                      drawCompareMode();
}

// ============================================================
//  Estado computado
// ============================================================
function getSingle() {
  let mat = MATS[singleMatIdx];
  if (mat.cat === 'custom') {
    let rho = customVol > 0 ? customMass / customVol : 0;
    return { mat, mass: customMass, vol: customVol, rho };
  }
  return { mat, mass: mat.rho * singleVol, vol: singleVol, rho: mat.rho };
}

function getObjA() { return computeObj(MATS[matAIdx]); }
function getObjB() { return computeObj(MATS[matBIdx]); }

function computeObj(mat) {
  let rho = mat.rho || 1.0;
  if (cmpSub === 'samevol') {
    return { mat, rho, vol: sharedVal, mass: rho * sharedVal };
  }
  let vol = rho > 0 ? sharedVal / rho : sharedVal;
  return { mat, rho, vol, mass: sharedVal };
}

// ============================================================
//  Tamaño de caja proporcional al volumen
// ============================================================
function boxSize(vol) {
  // Escala logarítmica: el cambio visual es perceptible en todo el rango 1-2000 cm³
  // (la raíz cúbica se aplana demasiado pronto y deja zonas muertas en el slider)
  let sc = constrain(
    map(log(max(vol, 1)), 0, log(2000), 0.25, 1.55),
    0.25, 1.55
  );
  return { bw: 190 * sc, bh: 215 * sc };
}

// Tamaños relativos para modo comparar misma masa: mantiene proporción real entre objetos
function boxSizePair(volA, volB) {
  let maxVol = max(volA, volB);
  let baseW = 175, baseH = 200;
  let absScale = constrain(pow(maxVol / REF_VOL, 1/3), 0.60, 1.10);
  let scA = constrain(pow(volA / maxVol, 1/3), 0.15, 1.0) * absScale;
  let scB = constrain(pow(volB / maxVol, 1/3), 0.15, 1.0) * absScale;
  return {
    sA: { bw: baseW * scA, bh: baseH * scA },
    sB: { bw: baseW * scB, bh: baseH * scB }
  };
}

// ============================================================
//  Partículas (solo para lupa microscópica)
// ============================================================

// Partículas compactas (se tocan) en una red hexagonal que cubre la lupa.
// El aspecto depende del material (ver MATS): red ordenada, líquido, desordenado
// o pared con celdas de aire. El material personalizado no tiene composición
// conocida: si es menos denso que el agua se dibuja con huecos, y si es más
// denso, compacto y con partículas más pesadas (más oscuras).
function buildMicro(radius, mat, rho) {
  let pts = [];
  let lat  = mat.lat;
  let fill = mat.fill || 1;
  if (mat.cat === 'custom' && rho < 1) { lat = 'cells'; fill = max(0.03, rho); }
  let pr   = radius * MIC_AF * (mat.d || 1);
  let step = pr * 2 * (mat.gap || 1.02);
  let rowH = step * Math.sqrt(3) / 2;
  let gr   = radius * 1.15;
  let shade = 1;
  if (mat.cat === 'custom' && rho > 1) shade = constrain(1.15 - 0.06 * rho, 0.3, 1);
  let col = mat.col.map(c => round(c * shade));

  // Celdas de aire (corcho, madera): centros en otra red hexagonal. La pared son
  // las partículas casi equidistantes de las dos celdas más cercanas; su grosor
  // se ajusta para que quede la fracción de pared que toca.
  let cells = [];
  if (lat === 'cells') {
    let cs = radius * (mat.cell || 0.36) * 2;
    let ch = cs * Math.sqrt(3) / 2;
    let r = 0;
    for (let y = -gr - cs; y <= gr + cs; y += ch, r++) {
      for (let x = -gr - cs; x <= gr + cs; x += cs) cells.push({ x: x + (r % 2 ? cs / 2 : 0), y });
    }
  }
  let all = [];
  let row = 0;
  for (let y = -gr; y <= gr; y += rowH, row++) {
    for (let x = -gr + (row % 2 ? step / 2 : 0); x <= gr; x += step) {
      let jx = 0, jy = 0;
      if (lat === 'amorph' || lat === 'liquid') { jx = random(-0.18, 0.18) * step; jy = random(-0.18, 0.18) * step; }
      all.push({ x: x + jx, y: y + jy });
    }
  }
  if (lat === 'cells') {
    for (let p of all) {
      let d1 = Infinity, d2 = Infinity;
      for (let c of cells) {
        let d = dist(p.x, p.y, c.x, c.y);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      p.dc = d2 - d1;
    }
    let sorted = all.map(p => p.dc).sort((a, b) => a - b);
    let wall = sorted[floor(fill * (sorted.length - 1))];
    all = all.filter(p => p.dc <= wall);
  }
  for (let p of all) {
    let angle = random(TWO_PI);
    let speed = lat === 'liquid' ? random(0.6, 1.2) : 0;
    pts.push({
      x: p.x, y: p.y, ox: p.x, oy: p.y,
      r: pr, col,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      phase: random(TWO_PI)
    });
  }
  return pts;
}

// Anima partículas: el líquido se mueve sin separarse (las partículas se empujan
// entre sí y siguen tocándose); los sólidos solo vibran en su sitio.
function animateMicro(pts, radius, cat) {
  if (cat === 'liquid') {
    let lim = radius * 1.15;
    for (let p of pts) {
      p.vx += random(-0.25, 0.25);
      p.vy += random(-0.25, 0.25);
      let spd = sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
      if (spd > 1.4) { p.vx *= 1.4 / spd; p.vy *= 1.4 / spd; }
      p.x += p.vx;
      p.y += p.vy;
    }
    // Empujes entre vecinas: mantienen el líquido compacto sin solaparse
    for (let it = 0; it < 3; it++)
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        let a = pts[i], b = pts[j];
        let dx = b.x - a.x, dy = b.y - a.y, md = a.r + b.r;
        if (abs(dx) > md || abs(dy) > md) continue;
        let d = sqrt(dx * dx + dy * dy) || 0.01;
        if (d < md) {
          let o = (md - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
        }
      }
    }
    for (let p of pts) {
      let d = sqrt(p.x * p.x + p.y * p.y);
      if (d > lim) {
        let nx = p.x / d, ny = p.y / d;
        let dot = p.vx * nx + p.vy * ny;
        if (dot > 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; }
        p.x = nx * lim; p.y = ny * lim;
      }
    }
  } else {
    // Sólidos: vibración pequeña en torno a su posición (no se separan)
    let t = frameCount * 0.18;
    for (let p of pts) {
      let amp = p.r * 0.14;
      p.x = p.ox + sin(t * 3.1 + p.phase) * amp;
      p.y = p.oy + cos(t * 2.7 + p.phase * 1.3) * amp;
    }
  }
}

function buildAll() {
  let s = getSingle();
  let a = getObjA();
  let b = getObjB();

  randomSeed(singleMatIdx*777);
  microSingle = buildMicro(88, s.mat, s.rho);

  randomSeed(matAIdx*333);
  microA = buildMicro(44, a.mat, a.rho);

  randomSeed(matBIdx*555);
  microB = buildMicro(44, b.mat, b.rho);

  randomSeed();
}

// ============================================================
//  Dibujo: grid de fondo
// ============================================================
function drawGrid() {
  stroke(...TH.grid, 110);
  strokeWeight(0.5);
  for (let x = 0; x < width;  x += 40) line(x, 0, x, height);
  for (let y = 0; y < height; y += 40) line(0, y, width, y);
  noStroke();
}

// ============================================================
//  Dibujo: contenedor 2D (vista de corte transversal)
// ============================================================
function drawBox2D(cx, cy, bw, bh, mat, alpha) {
  let col = mat.col;
  alpha = alpha !== undefined ? alpha : 255;
  let x = cx - bw/2, y = cy - bh/2;
  let r = 4;

  // Sombra
  noStroke();
  fill(0, 0, 0, 38);
  rect(x + 5, y + 8, bw, bh, r);

  // Bloque base
  fill(...col, alpha);
  rect(x, y, bw, bh, r);

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, bw, bh);
  drawingContext.clip();

  // Textura del material
  drawMaterialTexture(mat, x, y, bw, bh);

  // Gradiente de iluminación encima de la textura
  let topG = drawingContext.createLinearGradient(x, y, x, y + bh);
  topG.addColorStop(0,    'rgba(255,255,255,0.22)');
  topG.addColorStop(0.22, 'rgba(255,255,255,0.06)');
  topG.addColorStop(1,    'rgba(0,0,0,0.22)');
  drawingContext.fillStyle = topG;
  drawingContext.fillRect(x, y, bw, bh);

  let leftG = drawingContext.createLinearGradient(x, y, x + 18, y);
  leftG.addColorStop(0, 'rgba(255,255,255,0.20)');
  leftG.addColorStop(1, 'rgba(255,255,255,0.00)');
  drawingContext.fillStyle = leftG;
  drawingContext.fillRect(x, y, bw, bh);

  drawingContext.restore();

  // Borde
  noFill();
  stroke(max(0, col[0]-50), max(0, col[1]-50), max(0, col[2]-50), 210);
  strokeWeight(1.5);
  rect(x, y, bw, bh, r);

  stroke(255, 255, 255, 32);
  strokeWeight(1);
  rect(x + 1.5, y + 1.5, bw - 3, bh - 3, r);

  noStroke();
}

function drawMaterialTexture(mat, x, y, bw, bh) {
  let rng = seededRand(mat.id.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 7), 0));
  let R  = rng;
  let Rn = (a, b) => a + R() * (b - a);
  let c  = mat.col;

  drawingContext.save();
  drawingContext.setLineDash([]);

  if (mat.id === 'madera') {
    // Veta de madera: líneas bezier horizontales irregulares
    for (let i = 0; i < 14; i++) {
      let gy = y + Rn(2, bh - 2);
      let dark = R() > 0.45;
      let a  = Rn(0.13, 0.35);
      drawingContext.strokeStyle = dark
        ? `rgba(${Math.max(0,c[0]-55)},${Math.max(0,c[1]-45)},${Math.max(0,c[2]-30)},${a})`
        : `rgba(${Math.min(255,c[0]+40)},${Math.min(255,c[1]+32)},${Math.min(255,c[2]+12)},${a})`;
      drawingContext.lineWidth = Rn(0.8, 2.8);
      drawingContext.beginPath();
      drawingContext.moveTo(x, gy + Rn(-3, 3));
      let mx = x + bw * 0.5;
      drawingContext.quadraticCurveTo(mx, gy + Rn(-9, 9), x + bw, gy + Rn(-5, 5));
      drawingContext.stroke();
    }

  } else if (mat.id === 'corcho') {
    // Células de corcho: óvalos irregulares superpuestos
    for (let i = 0; i < 70; i++) {
      let cx2 = x + Rn(0, bw), cy2 = y + Rn(0, bh);
      let rx2 = Rn(2, 6), ry2 = Rn(1.5, 4.5);
      let rot  = Rn(-0.8, 0.8);
      let a    = Rn(0.15, 0.42);
      let dark = R() > 0.5;
      drawingContext.strokeStyle = dark
        ? `rgba(${Math.max(0,c[0]-65)},${Math.max(0,c[1]-55)},${Math.max(0,c[2]-40)},${a})`
        : `rgba(${Math.min(255,c[0]+30)},${Math.min(255,c[1]+22)},${Math.min(255,c[2]+10)},${a * 0.6})`;
      drawingContext.lineWidth = Rn(0.5, 1.2);
      drawingContext.beginPath();
      drawingContext.ellipse(cx2, cy2, rx2, ry2, rot, 0, Math.PI * 2);
      drawingContext.stroke();
    }

  } else if (mat.id === 'hielo') {
    // Cristales de hielo: fracturas ramificadas
    for (let i = 0; i < 10; i++) {
      let sx = x + Rn(bw*0.1, bw*0.9);
      let sy = y + Rn(bh*0.1, bh*0.9);
      let ang = Rn(0, Math.PI);
      let len = Rn(18, bw * 0.38);
      let a   = Rn(0.10, 0.28);
      drawingContext.strokeStyle = `rgba(255,255,255,${a})`;
      drawingContext.lineWidth   = Rn(0.5, 1.5);
      drawingContext.beginPath();
      drawingContext.moveTo(sx, sy);
      let ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
      drawingContext.lineTo(ex, ey);
      drawingContext.stroke();
      // 2-3 ramas
      let branches = R() > 0.4 ? 2 : 1;
      for (let b = 0; b < branches; b++) {
        let t    = Rn(0.3, 0.7);
        let bx2  = sx + Math.cos(ang) * len * t;
        let by2  = sy + Math.sin(ang) * len * t;
        let bang = ang + (R() > 0.5 ? 1 : -1) * Rn(0.5, 1.2);
        let blen = len * Rn(0.25, 0.55);
        drawingContext.strokeStyle = `rgba(255,255,255,${a * 0.7})`;
        drawingContext.lineWidth   = Rn(0.4, 1.0);
        drawingContext.beginPath();
        drawingContext.moveTo(bx2, by2);
        drawingContext.lineTo(bx2 + Math.cos(bang)*blen, by2 + Math.sin(bang)*blen);
        drawingContext.stroke();
      }
    }
    // Brillo general de hielo
    let iceG = drawingContext.createRadialGradient(x + bw*0.3, y + bh*0.25, 0, x + bw*0.5, y + bh*0.5, bw*0.7);
    iceG.addColorStop(0, 'rgba(255,255,255,0.14)');
    iceG.addColorStop(1, 'rgba(255,255,255,0.00)');
    drawingContext.fillStyle = iceG;
    drawingContext.fillRect(x, y, bw, bh);

  } else if (mat.id === 'agua') {
    // Ondas de agua semitransparentes
    for (let i = 0; i < 9; i++) {
      let wy = y + (i + 1) * (bh / 10);
      let a  = Rn(0.06, 0.16);
      drawingContext.strokeStyle = `rgba(255,255,255,${a})`;
      drawingContext.lineWidth   = Rn(0.8, 2.2);
      drawingContext.beginPath();
      drawingContext.moveTo(x, wy);
      let freq = Rn(0.08, 0.18);
      let amp  = Rn(1.5, 4.5);
      let phase2 = Rn(0, Math.PI * 2);
      for (let wx = x; wx <= x + bw; wx += 5) {
        drawingContext.lineTo(wx, wy + Math.sin((wx - x) * freq + phase2) * amp);
      }
      drawingContext.stroke();
    }
    // Transparencia: destello interior
    let wG = drawingContext.createLinearGradient(x, y, x + bw * 0.6, y + bh * 0.5);
    wG.addColorStop(0, 'rgba(255,255,255,0.12)');
    wG.addColorStop(1, 'rgba(255,255,255,0.00)');
    drawingContext.fillStyle = wG;
    drawingContext.fillRect(x, y, bw, bh);

  } else if (mat.id === 'alum') {
    // Aluminio: rayas verticales del cepillado
    for (let i = 0; i < 40; i++) {
      let lx = x + Rn(0, bw);
      let a  = Rn(0.06, 0.24);
      let bright = R() > 0.5;
      drawingContext.strokeStyle = bright
        ? `rgba(255,255,255,${a})`
        : `rgba(0,0,0,${a * 0.6})`;
      drawingContext.lineWidth = Rn(0.4, 2.2);
      drawingContext.beginPath();
      drawingContext.moveTo(lx, y);
      drawingContext.lineTo(lx + Rn(-4, 4), y + bh);
      drawingContext.stroke();
    }

  } else if (mat.id === 'hierro') {
    // Hierro: grano metálico rugoso
    for (let i = 0; i < 30; i++) {
      let gx = x + Rn(0, bw), gy = y + Rn(0, bh);
      let gw = Rn(3, 14), gh = Rn(2, 8);
      let a  = Rn(0.08, 0.28);
      let bright = R() > 0.55;
      drawingContext.fillStyle = bright
        ? `rgba(255,255,255,${a})`
        : `rgba(0,0,0,${a})`;
      drawingContext.fillRect(gx, gy, gw, gh);
    }

  } else if (mat.id === 'cobre') {
    // Cobre: bandas de reflejo diagonal cálido
    for (let i = 0; i < 7; i++) {
      let sx = x + Rn(0, bw);
      let a  = Rn(0.09, 0.22);
      drawingContext.strokeStyle = `rgba(255,210,160,${a})`;
      drawingContext.lineWidth   = Rn(4, bw * 0.12);
      drawingContext.beginPath();
      drawingContext.moveTo(sx, y);
      drawingContext.lineTo(sx - bh * Rn(0.3, 0.7), y + bh);
      drawingContext.stroke();
    }

  } else if (mat.id === 'plomo') {
    // Plomo: manchas oscuras y grises, aspecto mate
    for (let i = 0; i < 35; i++) {
      let gx = x + Rn(0, bw), gy = y + Rn(0, bh);
      let gr2 = Rn(4, 16);
      let a   = Rn(0.10, 0.32);
      let bright = R() > 0.65;
      drawingContext.fillStyle = bright
        ? `rgba(200,210,220,${a})`
        : `rgba(0,0,0,${a})`;
      drawingContext.beginPath();
      drawingContext.ellipse(gx, gy, gr2, gr2 * Rn(0.4, 0.9), Rn(0, Math.PI), 0, Math.PI * 2);
      drawingContext.fill();
    }

  } else if (mat.id === 'plast') {
    // Plástico PET: franjas de brillo diagonal plástico
    let pw1 = bw * 0.14;
    drawingContext.strokeStyle = 'rgba(255,255,255,0.20)';
    drawingContext.lineWidth   = pw1;
    drawingContext.beginPath();
    drawingContext.moveTo(x + bw * 0.18, y);
    drawingContext.lineTo(x, y + bh * 0.45);
    drawingContext.stroke();
    drawingContext.strokeStyle = 'rgba(255,255,255,0.09)';
    drawingContext.lineWidth   = pw1 * 0.6;
    drawingContext.beginPath();
    drawingContext.moveTo(x + bw * 0.52, y);
    drawingContext.lineTo(x + bw * 0.22, y + bh * 0.72);
    drawingContext.stroke();

  } else {
    // Custom: líneas diagonales suaves
    for (let i = 0; i < 8; i++) {
      let lx = x + Rn(0, bw);
      drawingContext.strokeStyle = `rgba(255,255,255,${Rn(0.04, 0.12)})`;
      drawingContext.lineWidth   = Rn(1, 4);
      drawingContext.beginPath();
      drawingContext.moveTo(lx, y);
      drawingContext.lineTo(lx - bh * 0.4, y + bh);
      drawingContext.stroke();
    }
  }

  drawingContext.restore();
}

// ============================================================
//  Dibujo: vista microscópica (lupa)
// ============================================================
function drawMicroLens(cx, cy, radius, microPts, caption) {
  let r = radius;

  // Marco exterior del objetivo (anillo metálico)
  noFill();
  stroke(...TH.border, 200);
  strokeWeight(r * 0.13 + 2);
  ellipse(cx, cy, r*2 + r*0.16, r*2 + r*0.16);

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(cx, cy, r, 0, Math.PI * 2);
  drawingContext.clip();

  // Fondo del campo visual (degradado radial, centro más claro)
  let bR = TH.bg[0], bG = TH.bg[1], bB = TH.bg[2];
  let bgGrad = drawingContext.createRadialGradient(cx - r*0.18, cy - r*0.18, 0, cx, cy, r);
  bgGrad.addColorStop(0, `rgba(${min(255,bR+12)},${min(255,bG+12)},${min(255,bB+14)},1)`);
  bgGrad.addColorStop(1, `rgba(${max(0,bR-8)},${max(0,bG-8)},${max(0,bB-8)},1)`);
  drawingContext.fillStyle = bgGrad;
  drawingContext.fillRect(cx - r, cy - r, r*2, r*2);

  // Partículas con aspecto esférico
  noStroke();
  for (let p of microPts) {
    let pr = p.r, px = cx+p.x, py = cy+p.y;
    fill(...p.col, 238);
    ellipse(px, py, pr*2, pr*2);
    fill(max(0,p.col[0]-55), max(0,p.col[1]-55), max(0,p.col[2]-55), 60);
    ellipse(px + pr*0.26, py + pr*0.28, pr*1.25, pr*1.25);
    fill(255, 255, 255, 72);
    ellipse(px - pr*0.30, py - pr*0.32, pr*0.72, pr*0.72);
    fill(255, 255, 255, 130);
    ellipse(px - pr*0.38, py - pr*0.38, pr*0.28, pr*0.28);
  }

  // Viñeta (borde oscuro interior → sensación de profundidad óptica)
  let vigGrad = drawingContext.createRadialGradient(cx, cy, r * 0.60, cx, cy, r);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0.00)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.32)');
  drawingContext.fillStyle = vigGrad;
  drawingContext.fillRect(cx - r, cy - r, r*2, r*2);

  drawingContext.restore();

  // Anillo interior del cristal
  noFill();
  stroke(...TH.accent, 185);
  strokeWeight(1.6);
  ellipse(cx, cy, r*2, r*2);

  // Reflejo principal de la lente
  stroke(255, 255, 255, 38);
  strokeWeight(max(1, r * 0.045));
  arc(cx - r*0.22, cy - r*0.27, r*0.82, r*0.46, -PI*0.76, -PI*0.04);

  // Segundo reflejo (destello pequeño)
  stroke(255, 255, 255, 20);
  strokeWeight(max(0.8, r * 0.025));
  arc(cx - r*0.08, cy - r*0.40, r*0.32, r*0.18, -PI*0.70, -PI*0.10);

  noStroke();

  if (caption) {
    fill(...TH.muted);
    textAlign(CENTER, TOP);
    textSize(10);
    text(caption, cx, cy + r + 8);
    textAlign(LEFT, BASELINE);
  }
}

// ============================================================
//  Dibujo: contador de partículas (leyenda micro)
// ============================================================
function drawParticleCount(cx, cy, n, rho) {
  fill(...TH.panel, 220);
  stroke(...TH.border);
  strokeWeight(1);
  let pw = 155, ph = 28;
  rect(cx - pw/2, cy - ph/2, pw, ph, 6);
  noStroke();
  fill(...TH.accent);
  textSize(11);
  textAlign(CENTER, CENTER);
  text('≈ ' + n + ' partículas por lupa', cx, cy);
  textAlign(LEFT, BASELINE);
}

// ============================================================
//  Dibujo: display densidad (panel derecho modo single)
// ============================================================
function drawDensityDisplay(rho, matCol, cx, cy) {
  let str = rho < 0.01 ? rho.toExponential(2) : rho.toFixed(2).replace('.', ',');
  let col  = densityRGBColor(rho);
  let pw = 208, ph = 78;

  fill(...TH.panel, 245);
  stroke(...TH.border);
  strokeWeight(1);
  rect(cx-pw/2, cy-ph/2, pw, ph, 10);
  noStroke();

  // Etiqueta
  fill(...TH.muted);
  textSize(10);
  textAlign(CENTER, TOP);
  text('DENSIDAD  (ρ)', cx, cy-ph/2+9);

  // Punto de color densidad
  fill(...col);
  noStroke();
  ellipse(cx + pw/2 - 12, cy - ph/2 + 12, 9, 9);

  // Valor grande
  fill(...matCol, 255);
  textSize(30);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(str, cx, cy+3);
  textStyle(NORMAL);

  // Unidad
  fill(...TH.muted);
  textSize(11);
  textAlign(CENTER, BOTTOM);
  text('g / cm³', cx, cy+ph/2-9);

  textAlign(LEFT, BASELINE);
}

// ============================================================
//  Dibujo: fórmula en canvas
// ============================================================
function drawFormulaCanvas(mass, vol, rho, cx, cy) {
  let pw = 212, ph = 58;
  fill(...TH.panel, 245);
  stroke(...TH.border);
  strokeWeight(1);
  rect(cx-pw/2, cy-ph/2, pw, ph, 8);
  noStroke();

  fill(...TH.muted);
  textSize(10);
  textAlign(CENTER, TOP);
  text('ρ  =  m  /  V', cx, cy-ph/2+8);

  fill(...TH.accent);
  textSize(11.5);
  textAlign(CENTER, CENTER);
  let ms = mass >= 1000 ? (mass/1000).toFixed(2).replace('.',',')+' kg' : mass.toFixed(1).replace('.',',')+' g';
  let vs = vol.toFixed(0)+' cm³';
  let rs = rho.toFixed(3).replace('.',',')+' g/cm³';
  text(ms + '  ÷  ' + vs, cx, cy+2);
  text('=  ' + rs, cx, cy+16);
  textAlign(LEFT, BASELINE);
}

// ============================================================
//  Dibujo: anotaciones masa y volumen
// ============================================================
function drawAnnotationPill(label, cx, cy) {
  let pw = 108, ph = 24;
  fill(...TH.panel, 225);
  stroke(...TH.border);
  strokeWeight(1);
  rect(cx-pw/2, cy-ph/2, pw, ph, 5);
  noStroke();
  fill(...TH.text);
  textSize(11);
  textAlign(CENTER, CENTER);
  text(label, cx, cy);
  textAlign(LEFT, BASELINE);
}

// ============================================================
//  Dibujo: barra escala de densidades (inferior)
// ============================================================
function drawDensityBar(x, y, w, h, markers) {
  // Gradiente
  noStroke();
  for (let i = 0; i < w; i++) {
    let col = densityBarColor(i / w);
    fill(...col, 200);
    rect(x+i, y, 1, h);
  }
  stroke(...TH.border);
  strokeWeight(1);
  noFill();
  rect(x, y, w, h, 2);
  noStroke();

  // Línea del agua
  let wx = x + (1.0 / MAX_RHO) * w;
  stroke(...TH.water, 160);
  strokeWeight(1);
  lineDash([3, 3]);
  line(wx, y-4, wx, y+h+4);
  lineDash([]);
  noStroke();
  fill(...TH.water, 200);
  textSize(8.5);
  textAlign(CENTER, TOP);
  text('agua\n1,0', wx, y+h+3);

  // Escala
  fill(...TH.muted);
  textSize(9);
  textAlign(LEFT, TOP);
  text('0', x, y+h+3);
  textAlign(RIGHT, TOP);
  text('14 g/cm³', x+w, y+h+3);

  // Marcadores
  for (let m of markers) {
    let px = x + constrain(m.rho / MAX_RHO, 0, 1) * w;
    fill(...m.col);
    noStroke();
    triangle(px, y-3, px-5, y-11, px+5, y-11);
    fill(...TH.text);
    textSize(9.5);
    textAlign(CENTER, BOTTOM);
    text(m.rho.toFixed(2).replace('.',','), px, y-12);
  }
  textAlign(LEFT, BASELINE);
}

// ============================================================
//  Dibujo: indicador de ampliación (círculo en bloque + líneas a lupa)
// ============================================================
function drawZoomIndicator(scx, scy, lcx, lcy, lr) {
  let sr = 14;

  // Vector perpendicular al eje bloque→lupa
  let dx = lcx - scx, dy = lcy - scy;
  let dist = sqrt(dx * dx + dy * dy);
  if (dist < 1) return;
  let px = -dy / dist, py = dx / dist;

  // ── Líneas divergentes primero (quedan debajo del círculo) ──
  stroke(...TH.accent, 170);
  strokeWeight(1.3);
  lineDash([6, 5]);
  line(scx + px * sr, scy + py * sr, lcx + px * lr, lcy + py * lr);
  line(scx - px * sr, scy - py * sr, lcx - px * lr, lcy - py * lr);
  lineDash([]);
  noStroke();

  // ── Pequeño círculo sobre el bloque ──
  // Sombra oscura para contraste sobre cualquier color de material
  noFill();
  stroke(0, 0, 0, 110);
  strokeWeight(4);
  ellipse(scx, scy, sr * 2, sr * 2);
  // Relleno muy tenue
  fill(255, 255, 255, 30);
  stroke(255, 255, 255, 225);
  strokeWeight(1.8);
  ellipse(scx, scy, sr * 2, sr * 2);
  // Punto central
  noStroke();
  fill(255, 255, 255, 210);
  ellipse(scx, scy, 4, 4);
}

// ============================================================
//  Dibujo: corchetes dimensión (single mode)
// ============================================================
function drawBracket(cx, cy, bw, bh) {
  stroke(...TH.border, 160);
  strokeWeight(1);
  let rx = cx + bw/2 + 16;
  line(rx, cy-bh/2, rx, cy+bh/2);
  line(rx-4, cy-bh/2, rx+4, cy-bh/2);
  line(rx-4, cy+bh/2, rx+4, cy+bh/2);

  fill(...TH.muted);
  noStroke();
  push();
  translate(rx+13, cy);
  rotate(-HALF_PI);
  textSize(9);
  textAlign(CENTER, CENTER);
  text('altura ∝ ∛V', 0, 0);
  pop();
}

// ============================================================
//  Colores por densidad
// ============================================================
function densityRGBColor(rho) {
  let t = constrain(rho / MAX_RHO, 0, 1);
  if (t < 0.5) {
    let u = t*2;
    return [lerp(30,240,u), lerp(195,190,u), lerp(255,60,u)];
  }
  let u = (t-0.5)*2;
  return [lerp(240,195,u), lerp(190,45,u), lerp(60,45,u)];
}

function densityBarColor(t) {
  if (t < 0.12) { let u=t/0.12;      return [lerp(30,  50, u), lerp(180,210,u), lerp(255,255,u)]; }
  if (t < 0.30) { let u=(t-0.12)/0.18; return [lerp(50, 80, u), lerp(210,230,u), lerp(255,110,u)]; }
  if (t < 0.52) { let u=(t-0.30)/0.22; return [lerp(80,210,u), lerp(230,215,u), lerp(110,40, u)]; }
  if (t < 0.74) { let u=(t-0.52)/0.22; return [lerp(210,240,u),lerp(215,90, u), lerp(40, 25, u)]; }
  let u=(t-0.74)/0.26;                  return [lerp(240,185,u),lerp(90, 35, u), lerp(25, 25, u)];
}

function lineDash(arr) { drawingContext.setLineDash(arr); }

// RNG determinista sin afectar el estado de p5 random()
function seededRand(seed) {
  let s = seed | 0;
  return function() {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

// ============================================================
//  MODO: Un objeto
// ============================================================
// Qué se ve en la lupa, en una línea
function microCaption(mat, rho) {
  if (mat.cat !== 'custom') return mat.micro;
  return rho < 1 ? 'Material inventado: con huecos de aire'
                 : 'Material inventado: partículas más pesadas cuanto más denso';
}

function drawSingleMode() {
  let s = getSingle();
  let { bw, bh } = boxSize(s.vol);
  let bx = width * 0.275, by = height * 0.465;

  // ── Objeto ──
  drawBox2D(bx, by, bw, bh, s.mat);

  // Corchete lateral
  drawBracket(bx, by, bw, bh);

  // Anotaciones
  let ms = s.mass >= 1000 ? (s.mass/1000).toFixed(2).replace('.',',')+' kg' : s.mass.toFixed(1).replace('.',',')+' g';
  drawAnnotationPill('m = ' + ms, bx, by + bh/2 + 22);
  drawAnnotationPill('V = ' + s.vol.toFixed(0)+' cm³', bx, by - bh/2 - 22);

  // Nombre del material
  fill(...s.mat.col);
  textSize(13);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text(s.mat.name.toUpperCase(), bx, by + bh/2 + 40);
  textStyle(NORMAL);

  // ── Panel derecho ──
  let rx = width * 0.655 + 20;

  // Título zona derecha
  fill(...TH.muted);
  textSize(9.5);
  textAlign(CENTER, TOP);
  text('ANÁLISIS DEL MATERIAL', rx, 14);

  // Densidad grande
  drawDensityDisplay(s.rho, s.mat.col, rx, 108);

  // Vista microscópica
  if (showMicro) {
    let mcy = 290;

    // Indicador de ampliación: círculo en esquina inferior-derecha del bloque
    let izx = bx + bw/2 - 22, izy = by + bh/2 - 22;
    drawZoomIndicator(izx, izy, rx, mcy, 88);

    animateMicro(microSingle, 88, s.mat.cat);
    drawMicroLens(rx, mcy, 88, microSingle, microCaption(s.mat, s.rho));

    // Etiqueta explicativa (debajo de la leyenda de la lupa)
    fill(...TH.muted);
    textSize(9.5);
    textAlign(CENTER, TOP);
    text('Más densidad: partículas más pesadas o más juntas', rx, 402);
  }

  // Fórmula
  drawFormulaCanvas(s.mass, s.vol, s.rho, rx, showMicro ? 448 : 340);

  textAlign(LEFT, BASELINE);

  // Barra densidad
  drawDensityBar(28, height-28, width-56, 13, [{ rho: s.rho, col: s.mat.col }]);
}

// ============================================================
//  MODO: Comparar
// ============================================================
function drawCompareMode() {
  let a  = getObjA();
  let b  = getObjB();
  let sA, sB;
  if (cmpSub === 'samevol') {
    let sv = boxSize(sharedVal);
    sA = sv; sB = sv;
  } else {
    let pair = boxSizePair(a.vol, b.vol);
    sA = pair.sA; sB = pair.sB;
  }

  let acx = width*0.255, acy = height*0.480;
  let bcx = width*0.745, bcy = height*0.480;

  // Banner superior
  drawBanner();

  // ── Cajas ──
  drawBox2D(acx, acy, sA.bw, sA.bh, a.mat);
  drawBox2D(bcx, bcy, sB.bw, sB.bh, b.mat);

  // ── Lupa encima de cada caja ──
  if (showMicro) {
    animateMicro(microA, 44, a.mat.cat);
    animateMicro(microB, 44, b.mat.cat);
    drawMicroLens(acx, acy - sA.bh/2 + 52, 44, microA, '');
    drawMicroLens(bcx, bcy - sB.bh/2 + 52, 44, microB, '');
  }

  // ── Etiqueta letra A / B ──
  drawLetterBadge('A', acx - sA.bw/2 - 22, acy, COL_A);
  drawLetterBadge('B', bcx + sB.bw/2 + 22, bcy, COL_B);

  // ── Info bajo cada caja ──
  drawObjInfo(a, acx, acy + sA.bh/2, COL_A);
  drawObjInfo(b, bcx, bcy + sB.bh/2, COL_B);

  // ── Indicador visual mismo volumen / misma masa ──
  if (cmpSub === 'samevol') {
    drawSameVolLines(acx, bcx, acy, sA.bw, sA.bh);
  } else {
    drawSameMassBadge(a.mass);
  }

  // ── VS ──
  drawVS(width/2, (acy + bcy)/2);

  // Barra densidades
  drawDensityBar(28, height-28, width-56, 13, [
    { rho: a.rho, col: COL_A },
    { rho: b.rho, col: COL_B }
  ]);
}

function drawBanner() {
  let txt = cmpSub === 'samevol'
    ? 'MISMO VOLUMEN — ¿Cuál pesa más? Mira en la lupa cómo son sus partículas'
    : 'MISMA MASA — ¿Por qué una ocupa más volumen que la otra?';
  let pw = 490, ph = 28;
  fill(...TH.panel, 235);
  stroke(...TH.border);
  strokeWeight(1);
  rect(width/2 - pw/2, 10, pw, ph, 6);
  noStroke();
  fill(...TH.accent);
  textSize(10.5);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(txt, width/2, 24);
  textStyle(NORMAL);
  textAlign(LEFT, BASELINE);
}

function drawLetterBadge(letter, cx, cy, col) {
  fill(...col, 200);
  textSize(22);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(letter, cx, cy);
  textStyle(NORMAL);
  textAlign(LEFT, BASELINE);
}

function drawObjInfo(obj, cx, bottomY, col) {
  // Nombre y densidad
  fill(...col);
  textSize(12.5);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text(obj.mat.name, cx, bottomY + 14);
  textStyle(NORMAL);

  fill(...TH.muted);
  textSize(10);
  text('ρ = ' + obj.rho.toFixed(2).replace('.',',') + ' g/cm³', cx, bottomY + 30);

  // Masa y volumen
  let ms = obj.mass >= 1000 ? (obj.mass/1000).toFixed(2).replace('.',',')+' kg' : obj.mass.toFixed(1).replace('.',',')+' g';
  let vs = obj.vol.toFixed(0)+' cm³';
  text('m = ' + ms + '   V = ' + vs, cx, bottomY + 44);

  textAlign(LEFT, BASELINE);
}

function drawSameVolLines(acx, bcx, cy, bw, bh) {
  stroke(...TH.accent, 70);
  strokeWeight(1);
  lineDash([6, 5]);
  line(acx - bw/2 - 4, cy - bh/2, bcx + bw/2 + 4, cy - bh/2);
  line(acx - bw/2 - 4, cy + bh/2, bcx + bw/2 + 4, cy + bh/2);
  lineDash([]);
  noStroke();
  fill(...TH.accent, 140);
  textSize(9);
  textAlign(CENTER, BOTTOM);
  text('← mismo volumen →', width/2, cy - bh/2 - 5);
  textAlign(LEFT, BASELINE);
}

function drawSameMassBadge(mass) {
  let ms = mass >= 1000 ? (mass/1000).toFixed(2).replace('.', ',')+' kg' : mass.toFixed(1).replace('.', ',')+' g';
  fill(...TH.warning, 210);
  textSize(10.5);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text('Misma masa: ' + ms, width/2, height/2 + 15);
  textStyle(NORMAL);
  textAlign(LEFT, BASELINE);
}

function drawVS(cx, cy) {
  fill(...TH.panel, 215);
  stroke(...TH.border);
  strokeWeight(1.2);
  ellipse(cx, cy, 50, 50);
  noStroke();
  fill(...TH.muted);
  textSize(12);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text('VS', cx, cy);
  textStyle(NORMAL);
  textAlign(LEFT, BASELINE);
}

// ============================================================
//  DOM: poblar selects y listeners
// ============================================================
function populateSelects() {
  let ids = ['sel-material', 'sel-mat-a', 'sel-mat-b'];
  for (let id of ids) {
    let el = document.getElementById(id);
    if (!el) continue;
    MATS.forEach((m, i) => {
      let opt = document.createElement('option');
      opt.value = i;
      opt.textContent = m.rho
        ? m.name + '  (' + m.rho.toFixed(2).replace('.', ',') + ' g/cm³)'
        : m.name;
      el.appendChild(opt);
    });
  }
  document.getElementById('sel-material').value = '3';
  document.getElementById('sel-mat-a').value    = '1';
  document.getElementById('sel-mat-b').value    = '6';
}

function setupDomListeners() {
  // ── Modo principal ──
  document.getElementById('mode-single').addEventListener('click', () => {
    simMode = 'single';
    setActive('mode-single', ['mode-single', 'mode-compare']);
    document.getElementById('panel-single').style.display  = '';
    document.getElementById('panel-compare').style.display = 'none';
  });
  document.getElementById('mode-compare').addEventListener('click', () => {
    simMode = 'compare';
    setActive('mode-compare', ['mode-single', 'mode-compare']);
    document.getElementById('panel-compare').style.display = '';
    document.getElementById('panel-single').style.display  = 'none';
  });

  // ── Sub-modo comparación ──
  document.getElementById('sub-samevol').addEventListener('click', () => {
    cmpSub = 'samevol';
    setActive('sub-samevol', ['sub-samevol', 'sub-samemass']);
    resetShared(200, 10, 1000);
    needRebuild = true;
    updatePanel();
  });
  document.getElementById('sub-samemass').addEventListener('click', () => {
    cmpSub = 'samemass';
    setActive('sub-samemass', ['sub-samevol', 'sub-samemass']);
    resetShared(200, 10, 1000);
    needRebuild = true;
    updatePanel();
  });

  // ── Single ──
  document.getElementById('sel-material').addEventListener('change', function() {
    singleMatIdx = parseInt(this.value);
    let custom = MATS[singleMatIdx].cat === 'custom';
    document.getElementById('preset-vol-row').style.display = custom ? 'none' : '';
    document.getElementById('custom-rows').style.display    = custom ? '' : 'none';
    needRebuild = true;
    updatePanel();
  });
  slider('sl-preset-vol', v => { singleVol = v; });
  slider('sl-mass',       v => { customMass = v; });
  slider('sl-vol',        v => { customVol = v; });

  document.getElementById('toggle-micro').addEventListener('change', function() {
    showMicro = this.checked;
  });

  // ── Compare ──
  document.getElementById('sel-mat-a').addEventListener('change', function() {
    matAIdx = parseInt(this.value);
    needRebuild = true;
    updatePanel();
  });
  document.getElementById('sel-mat-b').addEventListener('change', function() {
    matBIdx = parseInt(this.value);
    needRebuild = true;
    updatePanel();
  });
  slider('sl-shared', v => { sharedVal = v; });

  // ── Tema ──
  const themeBtn   = document.getElementById('theme-btn');
  const themePanel = document.getElementById('theme-panel');

  themeBtn.addEventListener('click', e => {
    e.stopPropagation();
    let open = themePanel.classList.toggle('is-open');
    themeBtn.classList.toggle('is-open', open);
    themePanel.setAttribute('aria-hidden', String(!open));
  });
  document.addEventListener('click', () => {
    themePanel.classList.remove('is-open');
    themeBtn.classList.remove('is-open');
    themePanel.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      let t = btn.dataset.theme;
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('sim-density-theme', t); } catch(_) {}
      document.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      themePanel.classList.remove('is-open');
      themeBtn.classList.remove('is-open');
      themePanel.setAttribute('aria-hidden', 'true');
    });
  });

  // Sync active theme button
  let curT = document.documentElement.getAttribute('data-theme') || 'dark';
  document.querySelectorAll('.theme-opt').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === curT);
  });
}

// ── Helpers DOM ──────────────────────────────────────────────
function slider(id, cb) {
  let el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', function() {
    cb(parseInt(this.value));
    needRebuild = true;
    updatePanel();
  });
}

function setActive(activeId, allIds) {
  for (let id of allIds) {
    let el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === activeId);
  }
}

function resetShared(val, min, max) {
  let el = document.getElementById('sl-shared');
  if (!el) return;
  el.min = min;
  el.max = max;
  el.value = val;
  sharedVal = val;
}

// ── Sync inicial ─────────────────────────────────────────────
function syncFromDom() {
  singleMatIdx = parseInt(document.getElementById('sel-material').value || '3');
  singleVol    = parseInt(document.getElementById('sl-preset-vol').value || '200');
  customMass   = parseInt(document.getElementById('sl-mass').value || '200');
  customVol    = parseInt(document.getElementById('sl-vol').value || '200');
  showMicro    = document.getElementById('toggle-micro').checked;
  matAIdx      = parseInt(document.getElementById('sel-mat-a').value || '1');
  matBIdx      = parseInt(document.getElementById('sel-mat-b').value || '6');
  sharedVal    = parseInt(document.getElementById('sl-shared').value || '200');
  updatePanel();
}

// ── Actualizar panel lateral ──────────────────────────────
function updatePanel() {
  let s = getSingle();
  let a = getObjA();
  let b = getObjB();

  // Fills de sliders
  setFill('sl-preset-vol', 10, 1000, singleVol);
  setFill('sl-mass',       1,  2000, customMass);
  setFill('sl-vol',        1,  2000, customVol);
  setFill('sl-shared',     10, 1000, sharedVal);

  // Badges de valor
  setText('val-preset-vol', singleVol + ' cm³');
  setText('val-mass',       customMass + ' g');
  setText('val-vol',        customVol + ' cm³');

  // Readouts single
  setText('read-mass', fmtVal(s.mass));
  setText('read-vol',  fmtVal(s.vol));
  setText('read-rho',  s.rho.toFixed(2).replace('.', ','));

  // Fórmula
  let fms = fmtVal(s.mass)+' g / '+fmtVal(s.vol)+' cm³ = '+s.rho.toFixed(3).replace('.',',')+' g/cm³';
  setText('formula-nums', fms);

  // Float badge
  updateFloatBadge(s.rho);

  // Compare shared
  if (cmpSub === 'samevol') {
    setText('shared-label', 'Volumen compartido');
    setText('shared-val',   sharedVal + ' cm³');
    setText('shared-min',   '10 cm³');
    setText('shared-max',   '1000 cm³');
    setText('shared-hint',  'Los dos objetos ocupan exactamente el mismo volumen.');
  } else {
    setText('shared-label', 'Masa compartida');
    setText('shared-val',   sharedVal + ' g');
    setText('shared-min',   '10 g');
    setText('shared-max',   '1000 g');
    setText('shared-hint',  'Los dos objetos tienen exactamente la misma masa.');
  }

  // Compare readouts
  setText('rho-a',  a.rho.toFixed(2).replace('.', ','));
  setText('mass-a', fmtVal(a.mass));
  setText('vol-a',  fmtVal(a.vol));
  setText('rho-b',  b.rho.toFixed(2).replace('.', ','));
  setText('mass-b', fmtVal(b.mass));
  setText('vol-b',  fmtVal(b.vol));

  updateCompareResult(a.rho, b.rho);
}

function updateFloatBadge(rho) {
  let el = document.getElementById('float-badge');
  if (!el) return;
  let r = rho.toFixed(2).replace('.', ',');
  if (rho < 0.995) {
    el.className = 'float-badge flota';
    el.innerHTML = 'ρ = ' + r + ' g/cm³ &lt; 1 → <strong>flota en agua</strong> ↑';
  } else if (rho > 1.005) {
    el.className = 'float-badge hunde';
    el.innerHTML = 'ρ = ' + r + ' g/cm³ &gt; 1 → <strong>se hunde en agua</strong> ↓';
  } else {
    el.className = 'float-badge equilibrio';
    el.innerHTML = 'ρ = ' + r + ' g/cm³ ≈ 1 → <strong>equilibrio en agua</strong> ⇌';
  }
}

function updateCompareResult(rA, rB) {
  let el = document.getElementById('compare-result');
  if (!el) return;
  let diff = Math.abs(rA - rB);
  if (diff < 0.02) {
    el.className = 'compare-result same';
    el.innerHTML = 'Misma densidad: ' + rA.toFixed(2).replace('.', ',') + ' g/cm³.<br>Igual compactación de materia.';
  } else if (rA > rB) {
    el.className = 'compare-result a-denser';
    el.innerHTML = '<strong>A es más denso</strong> (' + rA.toFixed(2).replace('.', ',') + ' vs ' + rB.toFixed(2).replace('.', ',') + ' g/cm³).<br>'
      + 'A tiene más materia por cm³.';
  } else {
    el.className = 'compare-result b-denser';
    el.innerHTML = '<strong>B es más denso</strong> (' + rB.toFixed(2).replace('.', ',') + ' vs ' + rA.toFixed(2).replace('.', ',') + ' g/cm³).<br>'
      + 'B tiene más materia por cm³.';
  }
}

function setFill(id, min, max, val) {
  let el = document.getElementById(id);
  if (!el) return;
  let pct = ((val - min) / (max - min)) * 100;
  el.style.setProperty('--fill', pct.toFixed(1) + '%');
}

function setText(id, txt) {
  let el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function fmtVal(v) {
  if (v >= 10000) return (v/1000).toFixed(1).replace('.', ',') + '·10³';
  if (v >= 1000)  return (v/1000).toFixed(2).replace('.', ',') + '·10³';
  if (v >= 100)   return v.toFixed(1).replace('.', ',');
  return v.toFixed(2).replace('.', ',');
}
