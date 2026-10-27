'use strict';
// ============================================================
//  Simulación de Densidad — Física y Química 2º-3º ESO
// ============================================================

// ── Materiales ───────────────────────────────────────────────
// Solo escala macroscópica: cada material es un bloque con su color y textura.
// La comparación entre materiales se hace con una balanza de brazos.
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

const MAX_RHO  = 14.0;
const REF_VOL  = 200;    // cm³ de referencia para escalar cajas

// ── Estado global ─────────────────────────────────────────────
let simMode   = 'single';
let cmpSub    = 'samevol';

let singleMatIdx = 3;
let singleVol    = 200;
let customMass   = 200;
let customVol    = 200;

let matAIdx   = 1;
let matBIdx   = 6;
let sharedVal = 200;

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
//  Dibujo: display densidad (panel derecho modo single)
// ============================================================
function drawDensityDisplay(rho, matCol, cx, cy) {
  let str = rho < 0.01 ? rho.toExponential(2) : i18n.num(rho, 2);
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
  text(i18n.t('DENSIDAD  (ρ)'), cx, cy-ph/2+9);

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
  let ms = mass >= 1000 ? i18n.num(mass/1000, 2)+' kg' : i18n.num(mass, 1)+' g';
  let vs = vol.toFixed(0)+' cm³';
  let rs = i18n.num(rho, 3)+' g/cm³';
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
  text(i18n.t('agua\n1,0'), wx, y+h+3);

  // Los que flotan quedan apretados en el primer tramo (0–1): se rotula dentro
  // de la barra a qué lado del agua está cada grupo.
  fill(255, 255, 255, 40);
  rect(x, y, wx - x, h);
  fill(255);
  textSize(9);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(i18n.t('flotan'), (x + wx) / 2, y + h / 2);
  textAlign(LEFT, CENTER);
  text(i18n.t('se hunden en agua →'), wx + 8, y + h / 2);
  textStyle(NORMAL);

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
    text(i18n.num(m.rho, 2), px, y-12);
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
  textSize(10);
  textAlign(CENTER, CENTER);
  text(i18n.t('tamaño no proporcional a V'), 0, 0);
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
function drawSingleMode() {
  let s = getSingle();
  let { bw, bh } = boxSize(s.vol);
  let bx = width * 0.275, by = height * 0.465;

  // ── Objeto ──
  drawBox2D(bx, by, bw, bh, s.mat);

  // Corchete lateral
  drawBracket(bx, by, bw, bh);

  // Anotaciones
  let ms = s.mass >= 1000 ? i18n.num(s.mass/1000, 2)+' kg' : i18n.num(s.mass, 1)+' g';
  drawAnnotationPill('m = ' + ms, bx, by + bh/2 + 22);
  drawAnnotationPill('V = ' + s.vol.toFixed(0)+' cm³', bx, by - bh/2 - 22);

  // Nombre del material
  fill(...s.mat.col);
  textSize(13);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text(i18n.t(s.mat.name).toUpperCase(), bx, by + bh/2 + 40);
  textStyle(NORMAL);

  // ── Panel derecho ──
  let rx = width * 0.655 + 20;

  // Título zona derecha
  fill(...TH.muted);
  textSize(9.5);
  textAlign(CENTER, TOP);
  text(i18n.t('ANÁLISIS DEL MATERIAL'), rx, 14);

  // Densidad grande
  drawDensityDisplay(s.rho, s.mat.col, rx, 108);

  // Masa de cada cm³ (la densidad, vista como masa de un cubito de 1 cm³)
  drawUnitCube(s.mat, s.rho, rx, 252);

  // Fórmula
  drawFormulaCanvas(s.mass, s.vol, s.rho, rx, 372);

  textAlign(LEFT, BASELINE);

  // Barra densidad
  drawDensityBar(28, height-28, width-56, 13, [{ rho: s.rho, col: s.mat.col }]);
}

// Cubito de 1 cm³ del material con su masa: la densidad leída como
// «cuántos gramos tiene cada cm³».
function drawUnitCube(mat, rho, cx, cy) {
  let pw = 208, ph = 96;
  fill(...TH.panel, 245);
  stroke(...TH.border);
  strokeWeight(1);
  rect(cx - pw/2, cy - ph/2, pw, ph, 10);
  noStroke();

  // Cubo en perspectiva caballera
  let s = 40, dx = 14, dy = -11;
  let x = cx - pw/2 + 22, y = cy - s/2 + 4;
  let c = mat.col;
  fill(min(255, c[0] + 28), min(255, c[1] + 28), min(255, c[2] + 28));
  quad(x, y, x + dx, y + dy, x + s + dx, y + dy, x + s, y);
  fill(max(0, c[0] - 40), max(0, c[1] - 40), max(0, c[2] - 40));
  quad(x + s, y, x + s + dx, y + dy, x + s + dx, y + s + dy, x + s, y + s);
  fill(...c);
  rect(x, y, s, s);
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, s, s);
  drawingContext.clip();
  drawMaterialTexture(mat, x, y, s, s);
  drawingContext.restore();

  fill(...TH.muted);
  textSize(9.5);
  textAlign(CENTER, TOP);
  text('1 cm³', x + s/2 + dx/2, y + s + 6);

  // Texto: masa de ese cm³
  let tx = cx + 34;
  textAlign(CENTER, TOP);
  textSize(10);
  text(i18n.t('MASA DE 1 cm³'), tx, cy - ph/2 + 16);
  fill(...TH.text);
  textSize(24);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(fmtGrams(rho), tx, cy + 6);
  textStyle(NORMAL);
  textAlign(LEFT, BASELINE);
}

function fmtGrams(m) {
  if (m >= 1000) return i18n.num(m / 1000, 2) + ' kg';
  if (m < 0.01)  return i18n.num(m, 4) + ' g';
  return i18n.num(m, m < 10 ? 2 : 1) + ' g';
}

// ============================================================
//  MODO: Comparar (balanza de brazos)
// ============================================================
// Balanza de dos platillos con los platillos encima del brazo (tipo Roberval):
// los platillos quedan siempre horizontales y el brazo se inclina hacia el lado
// con más masa. El recipiente del líquido se considera tarado (sin masa).
const BAL = { cx: 380, py: 382, arm: 215, maxAng: 0.19, post: 30 };
let beamAng = 0;   // ángulo actual del brazo (rad); > 0: baja el platillo B

// Ángulo de equilibrio: crece con la diferencia relativa de masas y se satura
// (como el fiel de una balanza real, que llega al tope con diferencias grandes).
function balanceTarget(mA, mB) {
  let rel = (mB - mA) / ((mA + mB) / 2);
  if (abs(rel) < 0.005) return 0;
  return BAL.maxAng * Math.tanh(rel * 6);
}

// Tamaño de los bloques sobre los platillos (más pequeños que en «Un objeto»)
function compareSizes(a, b) {
  if (cmpSub === 'samevol') {
    let sv = boxSize(sharedVal);
    let k = 0.5;
    let sz = { bw: sv.bw * k, bh: sv.bh * k };
    return { sA: sz, sB: sz };
  }
  let pair = boxSizePair(a.vol, b.vol);
  let k = 0.72;
  return {
    sA: { bw: pair.sA.bw * k, bh: pair.sA.bh * k },
    sB: { bw: pair.sB.bw * k, bh: pair.sB.bh * k }
  };
}

function drawCompareMode() {
  let a = getObjA();
  let b = getObjB();
  let { sA, sB } = compareSizes(a, b);

  // Banner superior
  drawBanner();

  // ── Datos de cada objeto (arriba, fijos) ──
  let ax = BAL.cx - BAL.arm, bxx = BAL.cx + BAL.arm;
  drawObjInfo(a, ax, 36, COL_A, 'A');
  drawObjInfo(b, bxx, 36, COL_B, 'B');

  // ── Brazo: se acerca suavemente al ángulo de equilibrio ──
  let target = balanceTarget(a.mass, b.mass);
  beamAng += (target - beamAng) * 0.08;
  if (abs(target - beamAng) < 0.0005) beamAng = target;

  drawBalance(a, b, sA, sB, beamAng);

  // Rótulo de lo que se mantiene igual
  if (cmpSub === 'samevol') {
    drawSharedBadge(i18n.t('Mismo volumen: {v}', { v: sharedVal + ' cm³' }), TH.accent);
  } else {
    drawSharedBadge(i18n.t('Misma masa: {m}', { m: fmtGrams(a.mass) }), TH.warning);
  }

  // Barra densidades
  drawDensityBar(28, height-28, width-56, 13, [
    { rho: a.rho, col: COL_A },
    { rho: b.rho, col: COL_B }
  ]);
}

function drawBalance(a, b, sA, sB, ang) {
  let cx = BAL.cx, py = BAL.py, L = BAL.arm;
  let ex = cos(ang) * L, ey = sin(ang) * L;
  let lx = cx - ex, ly = py - ey;    // extremo A (izquierda)
  let rx = cx + ex, ry = py + ey;    // extremo B (derecha)
  let metal = TH.muted;

  // Base y columna
  noStroke();
  fill(...metal);
  rect(cx - 70, 452, 140, 10, 4);
  quad(cx - 34, 452, cx + 34, 452, cx + 12, py + 6, cx - 12, py + 6);

  // Escala del fiel (arco con la marca de equilibrio)
  noFill();
  stroke(...TH.muted, 160);
  strokeWeight(1.2);
  arc(cx, py, 150, 150, -HALF_PI - 0.5, -HALF_PI + 0.5);
  stroke(...TH.accent, 220);
  strokeWeight(2);
  line(cx, py - 75, cx, py - 83);
  stroke(...TH.muted, 160);
  strokeWeight(1);
  for (let k of [-0.4, -0.2, 0.2, 0.4]) {
    line(cx + sin(k) * 75, py - cos(k) * 75, cx + sin(k) * 80, py - cos(k) * 80);
  }

  // Fiel (aguja solidaria con el brazo, apunta hacia arriba)
  stroke(...TH.accent);
  strokeWeight(2);
  line(cx, py, cx + sin(ang) * 70, py - cos(ang) * 70);

  // Brazo
  stroke(...metal);
  strokeWeight(7);
  strokeCap(ROUND);
  line(lx, ly, rx, ry);
  strokeCap(SQUARE);

  // Pivote
  noStroke();
  fill(...TH.accent);
  ellipse(cx, py, 12, 12);
  fill(...TH.bg);
  ellipse(cx, py, 4, 4);

  // Platillos (siempre horizontales) sobre una varilla vertical
  drawPan(lx, ly, sA, a.mat, COL_A);
  drawPan(rx, ry, sB, b.mat, COL_B);
}

function drawPan(x, y, sz, mat, col) {
  let metal = TH.muted;
  let top = y - BAL.post;
  let pw = max(120, sz.bw + 26);

  stroke(...metal);
  strokeWeight(4);
  line(x, y, x, top);
  noStroke();
  fill(...metal);
  rect(x - pw/2, top - 6, pw, 6, 3);
  fill(...col, 230);
  rect(x - pw/2, top - 6, 5, 6, 2);

  // Objeto apoyado en el platillo
  let by = top - 6 - sz.bh / 2;
  if (mat.cat === 'liquid') drawLiquidInGlass(x, by, sz.bw, sz.bh, mat);
  else                      drawBox2D(x, by, sz.bw, sz.bh, mat);
}

// Líquido dentro de un vaso de paredes finas (abierto por arriba)
function drawLiquidInGlass(cx, cy, bw, bh, mat) {
  drawBox2D(cx, cy, bw, bh, mat);
  let x = cx - bw/2 - 3, y = cy - bh/2 - 10, w = bw + 6, h = bh + 13;
  noFill();
  stroke(225, 235, 245, 170);
  strokeWeight(2);
  line(x, y, x, y + h);
  line(x + w, y, x + w, y + h);
  line(x, y + h, x + w, y + h);
  noStroke();
}

function drawBanner() {
  let txt = cmpSub === 'samevol'
    ? i18n.t('MISMO VOLUMEN — ¿Hacia qué lado se inclina la balanza?')
    : i18n.t('MISMA MASA — La balanza está equilibrada. ¿Por qué no ocupan lo mismo?');
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

function drawObjInfo(obj, cx, topY, col, letter) {
  // Letra, nombre y densidad
  fill(...col);
  textSize(12.5);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text(letter + ' · ' + i18n.t(obj.mat.name), cx, topY + 14);
  textStyle(NORMAL);

  fill(...TH.muted);
  textSize(10);
  text('ρ = ' + i18n.num(obj.rho, 2) + ' g/cm³', cx, topY + 30);

  // Masa y volumen
  let vs = obj.vol.toFixed(0)+' cm³';
  text('m = ' + fmtGrams(obj.mass) + '   V = ' + vs, cx, topY + 44);

  textAlign(LEFT, BASELINE);
}

function drawSharedBadge(label, col) {
  fill(...col, 220);
  textSize(10.5);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text(label, width/2, 64);
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
      // «Personalizado» solo tiene deslizadores en «Un objeto»
      if (id !== 'sel-material' && m.cat === 'custom') return;
      let opt = document.createElement('option');
      opt.value = i;
      opt.textContent = m.rho
        ? i18n.t(m.name) + '  (' + i18n.num(m.rho, 2) + ' g/cm³)'
        : i18n.t(m.name);
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
    updatePanel();
  });
  document.getElementById('sub-samemass').addEventListener('click', () => {
    cmpSub = 'samemass';
    setActive('sub-samemass', ['sub-samevol', 'sub-samemass']);
    resetShared(200, 10, 1000);
    updatePanel();
  });

  // ── Single ──
  document.getElementById('sel-material').addEventListener('change', function() {
    singleMatIdx = parseInt(this.value);
    let custom = MATS[singleMatIdx].cat === 'custom';
    document.getElementById('preset-vol-row').style.display = custom ? 'none' : '';
    document.getElementById('custom-rows').style.display    = custom ? '' : 'none';
    updatePanel();
  });
  slider('sl-preset-vol', v => { singleVol = v; });
  // Masa de un material real: al moverla cambia el volumen, porque ρ no cambia.
  // El paso del deslizador es ρ, así que el volumen siempre sale entero.
  document.getElementById('sl-preset-mass').addEventListener('input', function() {
    let rho = MATS[singleMatIdx].rho || 1;
    singleVol = constrain(round(parseFloat(this.value) / rho), 10, 1000);
    document.getElementById('sl-preset-vol').value = singleVol;
    updatePanel();
  });
  slider('sl-mass',       v => { customMass = v; });
  slider('sl-vol',        v => { customVol = v; });

  // ── Compare ──
  document.getElementById('sel-mat-a').addEventListener('change', function() {
    matAIdx = parseInt(this.value);
    updatePanel();
  });
  document.getElementById('sel-mat-b').addEventListener('change', function() {
    matBIdx = parseInt(this.value);
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
  syncPresetMass();
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
  setText('read-rho',  i18n.num(s.rho, 2));

  // Fórmula
  let fms = fmtVal(s.mass)+' g / '+fmtVal(s.vol)+' cm³ = '+i18n.num(s.rho, 3)+' g/cm³';
  setText('formula-nums', fms);

  // Float badge
  updateFloatBadge(s.rho, s.mat.id === 'agua');

  // Compare shared
  if (cmpSub === 'samevol') {
    setText('shared-label', i18n.t('Volumen compartido'));
    setText('shared-val',   sharedVal + ' cm³');
    setText('shared-min',   '10 cm³');
    setText('shared-max',   '1000 cm³');
    setText('shared-hint',  i18n.t('Los dos objetos ocupan exactamente el mismo volumen.'));
  } else {
    setText('shared-label', i18n.t('Masa compartida'));
    setText('shared-val',   sharedVal + ' g');
    setText('shared-min',   '10 g');
    setText('shared-max',   '1000 g');
    setText('shared-hint',  i18n.t('Los dos objetos tienen exactamente la misma masa.'));
  }

  // Compare readouts
  setText('rho-a',  i18n.num(a.rho, 2));
  setText('mass-a', fmtVal(a.mass));
  setText('vol-a',  fmtVal(a.vol));
  setText('rho-b',  i18n.num(b.rho, 2));
  setText('mass-b', fmtVal(b.mass));
  setText('vol-b',  fmtVal(b.vol));

  updateCompareResult(a.rho, b.rho);
}

// Deslizador de masa de los materiales reales: rango ρ·10 … ρ·1000 g (el mismo
// que el de volumen) y valor m = ρ · V.
function syncPresetMass() {
  let el = document.getElementById('sl-preset-mass');
  if (!el) return;
  let rho = MATS[singleMatIdx].rho || 1;
  let lo = rho * 10, hi = rho * 1000, m = rho * singleVol;
  el.min = lo; el.max = hi; el.step = rho;
  el.value = m;
  setFill('sl-preset-mass', lo, hi, m);
  setText('val-preset-mass', fmtGrams(m));
  setText('preset-mass-min', fmtGrams(lo));
  setText('preset-mass-max', fmtGrams(hi));
}

function updateFloatBadge(rho, esAgua) {
  let el = document.getElementById('float-badge');
  if (!el) return;
  let r = i18n.num(rho, 2);
  if (esAgua) {
    // «El agua queda en equilibrio en agua» no dice nada: es la referencia
    el.className = 'float-badge equilibrio';
    el.innerHTML = i18n.t('ρ = {r} g/cm³: <strong>es la referencia</strong> para saber si algo flota', { r: r });
  } else if (rho < 0.995) {
    el.className = 'float-badge flota';
    el.innerHTML = i18n.t('ρ = {r} g/cm³ &lt; 1 → <strong>flota en agua</strong> ↑', { r: r });
  } else if (rho > 1.005) {
    el.className = 'float-badge hunde';
    el.innerHTML = i18n.t('ρ = {r} g/cm³ &gt; 1 → <strong>se hunde en agua</strong> ↓', { r: r });
  } else {
    el.className = 'float-badge equilibrio';
    el.innerHTML = i18n.t('ρ = {r} g/cm³ ≈ 1 → <strong>equilibrio en agua</strong> ⇌', { r: r });
  }
}

function updateCompareResult(rA, rB) {
  let el = document.getElementById('compare-result');
  if (!el) return;
  let diff = Math.abs(rA - rB);
  if (diff < 0.02) {
    el.className = 'compare-result same';
    el.innerHTML = i18n.t('Misma densidad: {r} g/cm³.<br>Cada cm³ de A y de B tiene la misma masa.', { r: i18n.num(rA, 2) });
  } else if (rA > rB) {
    el.className = 'compare-result a-denser';
    el.innerHTML = i18n.t('<strong>A es más denso</strong> ({a} vs {b} g/cm³).<br>Cada cm³ de A tiene más masa que uno de B.', { a: i18n.num(rA, 2), b: i18n.num(rB, 2) });
  } else {
    el.className = 'compare-result b-denser';
    el.innerHTML = i18n.t('<strong>B es más denso</strong> ({b} vs {a} g/cm³).<br>Cada cm³ de B tiene más masa que uno de A.', { a: i18n.num(rA, 2), b: i18n.num(rB, 2) });
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
  if (v >= 10000) return i18n.num(v/1000, 1) + '·10³';
  if (v >= 1000)  return i18n.num(v/1000, 2) + '·10³';
  if (v >= 100)   return i18n.num(v, 1);
  return i18n.num(v, 2);
}
