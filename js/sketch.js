'use strict';
// ============================================================
//  Simulación de Densidad — Física y Química 2º-3º ESO
// ============================================================

// ── Materiales ───────────────────────────────────────────────
const MATS = [
  { id:'corcho', name:'Corcho',        rho:0.18,  col:[215,188,148], cat:'solid'  },
  { id:'madera', name:'Madera',        rho:0.60,  col:[168,118,72],  cat:'solid'  },
  { id:'hielo',  name:'Hielo',         rho:0.92,  col:[185,224,242], cat:'solid'  },
  { id:'agua',   name:'Agua',          rho:1.00,  col:[ 55,130,215], cat:'liquid' },
  { id:'plast',  name:'Plástico PET',  rho:1.38,  col:[200,195,215], cat:'solid'  },
  { id:'alum',   name:'Aluminio',      rho:2.70,  col:[188,194,208], cat:'solid'  },
  { id:'hierro', name:'Hierro',        rho:7.87,  col:[122,130,142], cat:'solid'  },
  { id:'cobre',  name:'Cobre',         rho:8.96,  col:[200,118,65],  cat:'solid'  },
  { id:'plomo',  name:'Plomo',         rho:11.34, col:[108,113,124], cat:'solid'  },
  { id:'custom', name:'Personalizado', rho:null,  col:[155,145,210], cat:'custom' },
];

const MAX_RHO = 14.0;
const REF_VOL = 200;   // cm³ de referencia para escalar cajas

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

// ── Partículas ─────────────────────────────────────────────
let ptsSingle = [], ptsA = [], ptsB = [];
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
  let sc = constrain(pow(vol / REF_VOL, 1/3), 0.35, 1.55);
  return { bw: 190 * sc, bh: 215 * sc };
}

// ============================================================
//  Partículas
// ============================================================
function nPts(rho) {
  if (!rho || rho <= 0) return 2;
  return max(2, min(180, round(pow(rho / MAX_RHO, 0.55) * 180)));
}

function buildGrid(cx, cy, bw, bh, n, col) {
  let pts = [];
  let pad = 8;
  let aw = bw - pad*2, ah = bh - pad*2;
  let cols = max(1, round(sqrt(n * (aw / ah))));
  let rows = max(1, ceil(n / cols));
  let xs = aw / cols, ys = ah / rows;
  let pr = constrain(min(xs, ys) * 0.36, 2.5, 6.5);
  for (let i = 0; i < n; i++) {
    let c = i % cols, r = floor(i / cols);
    let bxp = cx - bw/2 + pad + xs*c + xs/2;
    let byp = cy - bh/2 + pad + ys*r + ys/2;
    pts.push({
      x: bxp + random(-pr*0.3, pr*0.3),
      y: byp + random(-pr*0.3, pr*0.3),
      bx: bxp, by: byp,
      vx: random(-0.3, 0.3), vy: random(-0.3, 0.3),
      r: pr, col
    });
  }
  return pts;
}

function buildMicro(radius, rho, col) {
  let pts = [];
  let n = max(3, min(35, round(pow(rho / MAX_RHO, 0.55) * 35)));
  let gr = radius * 0.86;
  let cols = max(1, round(sqrt(n)));
  let rows = max(1, ceil(n / cols));
  let xs = (gr*2)/cols, ys = (gr*2)/rows;
  let pr = constrain(min(xs, ys)*0.40, 4, 14);
  for (let i = 0; i < n; i++) {
    let c = i % cols, r = floor(i / cols);
    let px = -gr + xs*c + xs/2 + random(-xs*0.14, xs*0.14);
    let py = -gr + ys*r + ys/2 + random(-ys*0.14, ys*0.14);
    if (sqrt(px*px + py*py) < radius - pr) {
      pts.push({ x: px, y: py, r: pr, col });
    }
  }
  return pts;
}

function buildAll() {
  let s  = getSingle();
  let a  = getObjA();
  let b  = getObjB();
  let sA = cmpSub === 'samevol' ? boxSize(sharedVal) : boxSize(a.vol);
  let sB = cmpSub === 'samevol' ? boxSize(sharedVal) : boxSize(b.vol);

  let scx = width*0.275, scy = height*0.465;
  let acx = width*0.255, acy = height*0.480;
  let bcx = width*0.745, bcy = height*0.480;
  let { bw: sw, bh: sh } = boxSize(s.vol);

  randomSeed(singleMatIdx*1000 + round(s.vol));
  ptsSingle = buildGrid(scx, scy, sw, sh, nPts(s.rho), s.mat.col);

  randomSeed(matAIdx*1000 + round(a.vol));
  ptsA = buildGrid(acx, acy, sA.bw, sA.bh, nPts(a.rho), a.mat.col);

  randomSeed(matBIdx*2000 + round(b.vol));
  ptsB = buildGrid(bcx, bcy, sB.bw, sB.bh, nPts(b.rho), b.mat.col);

  randomSeed(singleMatIdx*777);
  microSingle = buildMicro(90, s.rho, s.mat.col);

  randomSeed(matAIdx*333);
  microA = buildMicro(50, a.rho, a.mat.col);

  randomSeed(matBIdx*555);
  microB = buildMicro(50, b.rho, b.mat.col);

  randomSeed();
}

function movePts(pts, cx, cy, bw, bh) {
  let pad = 6;
  for (let p of pts) {
    p.vx += random(-0.06, 0.06);
    p.vy += random(-0.06, 0.06);
    p.vx += (p.bx - p.x) * 0.018;
    p.vy += (p.by - p.y) * 0.018;
    p.vx = constrain(p.vx, -0.55, 0.55);
    p.vy = constrain(p.vy, -0.55, 0.55);
    p.x  = constrain(p.x + p.vx, cx - bw/2 + pad, cx + bw/2 - pad);
    p.y  = constrain(p.y + p.vy, cy - bh/2 + pad, cy + bh/2 - pad);
  }
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
//  Dibujo: caja 3D isométrica
// ============================================================
function drawBox3D(cx, cy, bw, bh, col, alpha) {
  alpha = alpha !== undefined ? alpha : 220;
  let dx = bw * 0.22, dy = -bh * 0.10;

  // Cara lateral derecha (más oscura)
  let rc = [col[0]*0.50, col[1]*0.50, col[2]*0.52];
  fill(rc[0], rc[1], rc[2], alpha);
  noStroke();
  beginShape();
  vertex(cx+bw/2,    cy-bh/2);
  vertex(cx+bw/2+dx, cy-bh/2+dy);
  vertex(cx+bw/2+dx, cy+bh/2+dy);
  vertex(cx+bw/2,    cy+bh/2);
  endShape(CLOSE);

  // Cara superior (más clara)
  let tc = [min(255,col[0]*1.4), min(255,col[1]*1.4), min(255,col[2]*1.4)];
  fill(tc[0], tc[1], tc[2], alpha);
  beginShape();
  vertex(cx-bw/2,    cy-bh/2);
  vertex(cx-bw/2+dx, cy-bh/2+dy);
  vertex(cx+bw/2+dx, cy-bh/2+dy);
  vertex(cx+bw/2,    cy-bh/2);
  endShape(CLOSE);

  // Cara frontal
  fill(...col, alpha);
  noStroke();
  rect(cx-bw/2, cy-bh/2, bw, bh, 3);

  // Borde frontal
  stroke(...TH.border);
  strokeWeight(1.3);
  noFill();
  rect(cx-bw/2, cy-bh/2, bw, bh, 3);
  noStroke();
}

// ============================================================
//  Dibujo: partículas dentro de caja (con clip)
// ============================================================
function drawPtsInBox(pts, cx, cy, bw, bh) {
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(cx-bw/2+2, cy-bh/2+2, bw-4, bh-4);
  drawingContext.clip();

  noStroke();
  for (let p of pts) {
    fill(...p.col, 228);
    ellipse(p.x, p.y, p.r*2, p.r*2);
    fill(255, 255, 255, 52);
    ellipse(p.x - p.r*0.30, p.y - p.r*0.30, p.r*0.52, p.r*0.52);
  }

  drawingContext.restore();
}

// ============================================================
//  Dibujo: vista microscópica (lupa)
// ============================================================
function drawMicroLens(cx, cy, radius, microPts, caption) {
  // Fondo
  fill(...TH.panel, 245);
  stroke(...TH.accent, 190);
  strokeWeight(2);
  ellipse(cx, cy, radius*2, radius*2);

  // Clip + partículas
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(cx, cy, radius-2, 0, Math.PI*2);
  drawingContext.clip();

  noStroke();
  for (let p of microPts) {
    fill(...p.col, 232);
    ellipse(cx+p.x, cy+p.y, p.r*2, p.r*2);
    fill(255, 255, 255, 58);
    ellipse(cx+p.x - p.r*0.28, cy+p.y - p.r*0.28, p.r*0.5, p.r*0.5);
  }

  drawingContext.restore();

  // Anillo y reflejo
  noFill();
  stroke(...TH.accent, 200);
  strokeWeight(2.2);
  ellipse(cx, cy, radius*2, radius*2);
  stroke(255, 255, 255, 22);
  strokeWeight(2);
  arc(cx - radius*0.25, cy - radius*0.32, radius*0.65, radius*0.36, -PI*0.72, -PI*0.08);
  noStroke();

  if (caption) {
    fill(...TH.muted);
    textAlign(CENTER, TOP);
    textSize(10);
    text(caption, cx, cy + radius + 6);
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
  setLineDash([3, 3]);
  line(wx, y-4, wx, y+h+4);
  setLineDash([]);
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

// ============================================================
//  MODO: Un objeto
// ============================================================
function drawSingleMode() {
  let s = getSingle();
  let { bw, bh } = boxSize(s.vol);
  let bx = width * 0.275, by = height * 0.465;

  movePts(ptsSingle, bx, by, bw, bh);

  // ── Objeto ──
  drawBox3D(bx, by, bw, bh, s.mat.col);
  drawPtsInBox(ptsSingle, bx, by, bw, bh);

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
    drawMicroLens(rx, mcy, 88, microSingle, 'Vista microscópica');

    // Línea conectora (desde caja a lupa)
    stroke(...TH.border, 90);
    strokeWeight(1);
    lineDash([4, 5]);
    line(bx + bw/2 + 4, by, rx - 88, mcy);
    lineDash([]);
    noStroke();

    // Etiqueta explicativa (debajo de la leyenda de la lupa)
    fill(...TH.muted);
    textSize(9.5);
    textAlign(CENTER, TOP);
    text('+ densidad  →  + partículas/cm³', rx, 402);
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
  let sA = cmpSub === 'samevol' ? boxSize(sharedVal) : boxSize(a.vol);
  let sB = cmpSub === 'samevol' ? boxSize(sharedVal) : boxSize(b.vol);

  let acx = width*0.255, acy = height*0.480;
  let bcx = width*0.745, bcy = height*0.480;

  movePts(ptsA, acx, acy, sA.bw, sA.bh);
  movePts(ptsB, bcx, bcy, sB.bw, sB.bh);

  // Banner superior
  drawBanner();

  // ── Cajas (primero el fondo) ──
  drawBox3D(acx, acy, sA.bw, sA.bh, a.mat.col);
  drawPtsInBox(ptsA, acx, acy, sA.bw, sA.bh);

  drawBox3D(bcx, bcy, sB.bw, sB.bh, b.mat.col);
  drawPtsInBox(ptsB, bcx, bcy, sB.bw, sB.bh);

  // ── Lupa encima de cada caja (sobre las partículas) ──
  if (showMicro) {
    drawMicroLens(acx, acy - sA.bh/2 + 52, 44, microA, '');
    drawMicroLens(bcx, bcy - sB.bh/2 + 52, 44, microB, '');
  }

  // ── Etiqueta letra A / B ──
  drawLetterBadge('A', acx - sA.bw/2 - 22, acy, COL_A);
  drawLetterBadge('B', bcx + sB.bw/2 + sB.bw*0.22 + 14, bcy, COL_B);

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
    ? 'MISMO VOLUMEN — Las cajas son iguales. ¿Cuál pesa más?'
    : 'MISMA MASA — El peso es igual. ¿Qué ocupa más espacio?';
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
  line(acx - bw/2 - 4, cy - bh/2, bcx + bw/2 + bw*0.22 + 4, cy - bh/2);
  line(acx - bw/2 - 4, cy + bh/2, bcx + bw/2 + bw*0.22 + 4, cy + bh/2);
  lineDash([]);
  noStroke();
  fill(...TH.accent, 140);
  textSize(9);
  textAlign(CENTER, BOTTOM);
  text('← mismo volumen →', width/2, cy - bh/2 - 5);
  textAlign(LEFT, BASELINE);
}

function drawSameMassBadge(mass) {
  let ms = mass >= 1000 ? (mass/1000).toFixed(2)+' kg' : mass.toFixed(1)+' g';
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
        ? m.name + '  (' + m.rho.toFixed(2) + ' g/cm³)'
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
  setText('rho-a',  a.rho.toFixed(2));
  setText('mass-a', fmtVal(a.mass));
  setText('vol-a',  fmtVal(a.vol));
  setText('rho-b',  b.rho.toFixed(2));
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
    el.innerHTML = 'Misma densidad: ' + rA.toFixed(2) + ' g/cm³.<br>Igual compactación de materia.';
  } else if (rA > rB) {
    el.className = 'compare-result a-denser';
    el.innerHTML = '<strong>A es más denso</strong> (' + rA.toFixed(2) + ' vs ' + rB.toFixed(2) + ' g/cm³).<br>'
      + 'A tiene más materia por cm³.';
  } else {
    el.className = 'compare-result b-denser';
    el.innerHTML = '<strong>B es más denso</strong> (' + rB.toFixed(2) + ' vs ' + rA.toFixed(2) + ' g/cm³).<br>'
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
  if (v >= 10000) return (v/1000).toFixed(1).replace('.', ',');
  if (v >= 1000)  return (v/1000).toFixed(2).replace('.', ',') + '·10³';
  if (v >= 100)   return v.toFixed(1).replace('.', ',');
  return v.toFixed(2).replace('.', ',');
}
