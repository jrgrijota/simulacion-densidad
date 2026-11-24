// ═══════════════════════════════════════════════════════════════════
//  DIBUJOS DE «DENSIDAD»
//
//  Traslado fiel del boceto aprobado (/capturas/escena-densidad/boceto.html,
//  v3): las mismas formas, los mismos degradados y la misma perspectiva
//  oblicua para todo (muestras, balanzas y cubeta). Se dibuja con el
//  contexto 2D del lienzo (Path2D con trazados SVG), así que cada objeto
//  usa las coordenadas del boceto tal cual.
//  · cubo()           la muestra: cubo a escala (lado ∝ raíz cúbica de V)
//  · balanzaDigital() objeto protagonista de «Un objeto» (local 400 × 340)
//  · balanzaBrazos()  objeto protagonista de «Comparar» (local 400 × 340)
//  · cubeta()         cubeta de vidrio con agua
//  · regla()          tira de papel con la regla de densidades
// ═══════════════════════════════════════════════════════════════════

// Proyección oblicua: por cada unidad de profundidad, 0,34 a la derecha y 0,26 arriba
const PDX = 0.34, PDY = -0.26;
const ESC = 62;                       // 1 dm (lado de un cubo de 1 L) son 62 unidades del lienzo
const lado = (V) => Math.cbrt(V) * ESC;

// Colores fijos de los objetos (lo de alrededor sigue al tema)
const CF = {
    ink: '#071a2b', cyan: '#00c8ff', cam: '#ffd84a', agua: '#3a9be0', vidrio: '#d8efff',
    flota: '#9fe7c4', hunde: '#ffb38a', neutro: '#d7e3ee', A: '#8cc8ff', B: '#ffb38a',
};

// Materiales (densidad en kg/L; «pers» es el objeto personalizado)
const MATS = {
    corcho: { n: 'Corcho', r: 0.18, c: '#d7bc94' },
    madera: { n: 'Madera', r: 0.60, c: '#b47a46' },
    hielo:  { n: 'Hielo', r: 0.92, c: '#d6ecff' },
    agua:   { n: 'Agua', r: 1.00, c: '#3a9be0' },
    pet:    { n: 'Plástico PET', corto: 'PET', r: 1.38, c: '#cbc6dc' },
    alum:   { n: 'Aluminio', r: 2.70, c: '#c7ced8' },
    hierro: { n: 'Hierro', r: 7.87, c: '#7d8692' },
    cobre:  { n: 'Cobre', r: 8.96, c: '#cf7a43' },
    plomo:  { n: 'Plomo', r: 11.34, c: '#6c7380' },
    pers:   { n: 'Personalizado', r: null, c: '#9b91d2' },
};
const ORDEN = ['corcho', 'madera', 'hielo', 'agua', 'pet', 'alum', 'hierro', 'cobre', 'plomo', 'pers'];

// Caras de cada material: [frente arriba, frente abajo], [arriba], [lado]; a = opacidad
const PAL = {
    corcho: { f: ['#dfc095', '#bf9561'], t: ['#efd6ae', '#d9b886'], s: ['#ad8352', '#8b653a'] },
    madera: { f: ['#cf955c', '#a66a38'], t: ['#e2b583', '#c99665'], s: ['#8f5c30', '#6f4420'] },
    hielo:  { f: ['#f2faff', '#b4d9f3'], t: ['#ffffff', '#dceffc'], s: ['#a6cfee', '#86b9e1'], a: 0.9 },
    pet:    { f: ['#eef4fa', '#c4d4e5'], t: ['#fafcfe', '#dde8f2'], s: ['#b6c7d9', '#9eb2c7'], a: 0.72 },
    alum:   { f: ['#dfe5ec', '#b3bdc9'], t: ['#f6f9fb', '#e1e7ed'], s: ['#a1adbb', '#86929f'] },
    hierro: { f: ['#8f97a1', '#5c636d'], t: ['#aab1ba', '#8c949e'], s: ['#5a616b', '#424851'] },
    cobre:  { f: ['#f3aa75', '#b9653a'], t: ['#ffc8a0', '#eb9e6c'], s: ['#a9572e', '#874322'] },
    plomo:  { f: ['#868d9a', '#606773'], t: ['#9da4af', '#838a96'], s: ['#59606b', '#454a54'] },
    pers:   { f: ['#b8aff0', '#8a7fd2'], t: ['#cfc8f7', '#b0a6ea'], s: ['#766bbf', '#5d53a5'] },
};

// Degradados del boceto, en unidades de la caja de cada forma (como en SVG):
// ['l', [x1, y1, x2, y2], paradas] o ['r', [cx, cy, r], paradas]
const GR = {
    foco:       ['r', [0.5, 0.5, 0.5], [[0, 'rgba(45,119,173,.55)'], [1, 'rgba(45,119,173,0)']]],
    cuerpoBal:  ['l', [0, 0, 0, 1], [[0, '#58768f'], [0.55, '#3a5469'], [1, '#2a3e50']]],
    columna:    ['l', [0, 0, 1, 0], [[0, '#6f879c'], [0.4, '#b9c8d5'], [1, '#55697c']]],
    brazo:      ['l', [0, 0, 0, 1], [[0, '#dbe5ee'], [1, '#8197ab']]],
    cubFondo:   ['l', [0, 0, 0, 1], [[0, 'rgba(42,106,156,.45)'], [1, 'rgba(18,58,92,.55)']]],
    aguaFondo:  ['l', [0, 0, 0, 1], [[0, '#46b3ec'], [1, '#16609f']]],
    superficie: ['l', [0, 1, 0, 0], [[0, 'rgba(143,211,247,.75)'], [1, 'rgba(212,241,255,.9)']]],
    aguaFrente: ['l', [0, 0, 0, 1], [[0, 'rgba(92,192,242,.32)'], [0.5, 'rgba(43,138,208,.42)'], [1, 'rgba(19,86,143,.62)']]],
    aguaLado:   ['l', [0, 0, 0, 1], [[0, '#2e8fd2'], [1, '#11497c']]],
    tapaBal:    ['l', [0, 1, 1, 0], [[0, '#7896b0'], [1, '#5b7891']]],
    ladoBal:    ['l', [0, 0, 0, 1], [[0, '#2f4a60'], [1, '#1f3142']]],
    platoTapa:  ['l', [0, 1, 1, 0], [[0, '#c3d0dc'], [0.45, '#f4f8fb'], [1, '#a9bacb']]],
    cantoPlato: ['l', [0, 0, 1, 0], [[0, '#8fa3b5'], [0.5, '#dbe5ee'], [1, '#8fa3b5']]],
    oclusion:   ['l', [0, 0, 0, 1], [[0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.22)']]],
    nucleoHielo: ['r', [0.45, 0.5, 0.5], [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]],
    aguaCaja:   ['l', [0, 0, 0, 1], [[0, '#63b9f0'], [1, '#2273b8']]],
};
for (const k in PAL) {
    const p = PAL[k];
    GR[k + '-f'] = ['l', [0, 0, 0.35, 1], [[0, p.f[0]], [1, p.f[1]]]];
    GR[k + '-t'] = ['l', [0, 1, 1, 0], [[0, p.t[0]], [1, p.t[1]]]];
    GR[k + '-s'] = ['l', [0, 0, 0, 1], [[0, p.s[0]], [1, p.s[1]]]];
}
// Aluminio cepillado y cobre con reflejo: bandas verticales
GR['alum-f'] = ['l', [0, 0, 1, 0], [[0, '#cfd7e0'], [0.22, '#f3f6f9'], [0.48, '#b9c3ce'], [0.76, '#e4e9ef'], [1, '#aeb8c4']]];
GR['cobre-f'] = ['l', [0, 0, 1, 0.6], [[0, '#e48d55'], [0.3, '#ffc49a'], [0.55, '#d27a45'], [1, '#a9572e']]];

// ── Primitivas ───────────────────────────────────────────────────
let CTX_FUERA = null;                       // contexto de un lienzo auxiliar (caché de cubos)
const cx2 = () => CTX_FUERA || drawingContext;
const tinta = () => THEME.ink || CF.ink;
const fuenteDib = () => (THEME.fun ? 'Fredoka, ' : '') + FUENTE_TEXTO;

// Semilla fija: las texturas salen siempre iguales
let semilla = 11;
const rnd = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };

// Trazados SVG de un rectángulo redondeado, una elipse y un polígono
function R(x, y, w, h, r = 0) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
           `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}
function E(cx, cy, rx, ry) { return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`; }
function P(...q) { return 'M' + q.map(p => p.join(' ')).join(' L') + ' Z'; }

function pintar(p, f, bb) {
    const ctx = cx2();
    if (typeof f === 'string' && f.startsWith('g:')) {
        const g = GR[f.slice(2)], [bx, by, bw, bh] = bb;
        if (g[0] === 'l') {
            const [x1, y1, x2, y2] = g[1];
            const gr = ctx.createLinearGradient(bx + x1 * bw, by + y1 * bh, bx + x2 * bw, by + y2 * bh);
            g[2].forEach(([o, c]) => gr.addColorStop(o, c));
            ctx.fillStyle = gr; ctx.fill(p);
        } else {
            const [cx, cy, r] = g[1];
            ctx.save(); ctx.clip(p); ctx.translate(bx, by); ctx.scale(bw || 1, bh || 1);
            const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g[2].forEach(([o, c]) => gr.addColorStop(o, c));
            ctx.fillStyle = gr; ctx.fillRect(0, 0, 1, 1); ctx.restore();
        }
    } else { ctx.fillStyle = f; ctx.fill(p); }
}
// Forma: d (trazado SVG) con o = { f, fo, s, sw, so, op, bb, lj, lc, dash }
function forma(d, o) {
    const ctx = cx2(), p = typeof d === 'string' ? new Path2D(d) : d;
    const a0 = ctx.globalAlpha, op = o.op == null ? 1 : o.op;
    if (o.f) { ctx.globalAlpha = a0 * op * (o.fo == null ? 1 : o.fo); pintar(p, o.f, o.bb); }
    if (o.s) {
        ctx.globalAlpha = a0 * op * (o.so == null ? 1 : o.so);
        ctx.strokeStyle = o.s; ctx.lineWidth = o.sw || 1;
        ctx.lineJoin = o.lj || 'miter'; ctx.lineCap = o.lc || 'butt';
        if (o.dash) ctx.setLineDash(o.dash);
        ctx.stroke(p);
        if (o.dash) ctx.setLineDash([]);
    }
    ctx.globalAlpha = a0;
}
const linea = (d, col, sw, op, lc) => forma(d, { s: col, sw, op, lc });
function recortar(d, fn) { const ctx = cx2(); ctx.save(); ctx.clip(new Path2D(d)); fn(); ctx.restore(); }

// Texto con la línea base abajo (como en SVG). o = { fs, w, c, a, sys, op }
function fuenteDe(o) { return `${o.w || 500} ${o.fs || 16}px ${o.sys ? FUENTE_TEXTO : fuenteDib()}`; }
function T(x, y, s, o = {}) {
    const ctx = cx2(), a0 = ctx.globalAlpha;
    ctx.font = fuenteDe(o);
    ctx.textAlign = { start: 'left', middle: 'center', end: 'right' }[o.a || 'start'];
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = o.c || THEME.text;
    if (o.op != null) ctx.globalAlpha = a0 * o.op;
    ctx.fillText(s, x, y);
    ctx.globalAlpha = a0;
}
function anchoT(s, o = {}) { const ctx = cx2(); ctx.font = fuenteDe(o); return ctx.measureText(s).width; }
// Píldora con texto centrado
function pildora(x, y, w, h, fill, stroke, sw = 2.5) { forma(R(x, y, w, h, h / 2), { f: fill, s: stroke, sw }); }
function chispaD(x, y, r, col = CF.cam) {
    let p = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.42 : r; p += `${i ? 'L' : 'M'}${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`; }
    forma(p + 'Z', { f: col, s: tinta(), sw: 1.8 });
}
function focoD(cx, cy, rx, ry) {
    if (!THEME.foco) return;
    forma(E(cx, cy, rx, ry), { f: 'g:foco', bb: [cx - rx, cy - ry, 2 * rx, 2 * ry], op: THEME.foco });
}
const sombraE = (cx, cy, w) => forma(E(cx, cy, w / 2, Math.max(3, w * 0.09)), { f: '#04111c', op: 0.38 });
function sombraPlano(x, yb, w, D, op = 0.38) {
    const dx = D * PDX, dy = D * PDY;
    forma(`M${x} ${yb} L${x + dx} ${yb + dy} H${x + w + dx} L${x + w} ${yb} Z`, { f: '#04111c', op });
}
// Caja en la proyección oblicua (profundidad D): frente, tapa y lado
function caja(x, yb, w, h, D, ff, ft, fs, sw = 3.5, rx = 6) {
    const dx = D * PDX, dy = D * PDY, y = yb - h, ink = tinta();
    forma(`M${x + w} ${y} L${x + w + dx} ${y + dy} V${yb + dy} L${x + w} ${yb} Z`, { f: fs, s: ink, sw, lj: 'round', bb: [x + w, y + dy, dx, h] });
    forma(`M${x} ${y} L${x + dx} ${y + dy} H${x + w + dx} L${x + w} ${y} Z`, { f: ft, s: ink, sw, lj: 'round', bb: [x, y + dy, w + dx, -dy] });
    forma(R(x, y, w, h, rx), { f: ff, s: ink, sw, bb: [x, y, w, h] });
}

// ═════════ LA MUESTRA: cubo a escala ═════════
function caras(x, yb, s) {
    const dx = s * PDX, dy = s * PDY, y = yb - s;
    return {
        dx, dy, y,
        top: `M${x} ${y} L${x + dx} ${y + dy} L${x + s + dx} ${y + dy} L${x + s} ${y} Z`,
        side: `M${x + s} ${y} L${x + s + dx} ${y + dy} L${x + s + dx} ${yb + dy} L${x + s} ${yb} Z`,
    };
}
// Los cubos se pintan una vez en un lienzo auxiliar y luego se copian
// (el corcho lleva cientos de poros): clave = material, lado, resolución y tinta.
const CACHE_CUBOS = new Map();
function cubo(k, x, yb, s) {
    if (!(s > 2)) return;
    const pd = pixelDensity();
    const pad = 6, dx = s * PDX, dy = s * PDY;
    const W = s + dx + 2 * pad, H = s - dy + 2 * pad;
    const clave = k + '|' + s.toFixed(1) + '|' + pd + '|' + tinta();
    let c = CACHE_CUBOS.get(clave);
    if (!c) {
        c = document.createElement('canvas');
        c.width = Math.ceil(W * pd); c.height = Math.ceil(H * pd);
        const g = c.getContext('2d'); g.scale(pd, pd);
        const antes = CTX_FUERA; CTX_FUERA = g;
        try { cuboDirecto(k, pad, pad + s - dy, s); } finally { CTX_FUERA = antes; }
        CACHE_CUBOS.set(clave, c);
        if (CACHE_CUBOS.size > 90) CACHE_CUBOS.delete(CACHE_CUBOS.keys().next().value);
    }
    cx2().drawImage(c, x - pad, yb - s + dy - pad, W, H);
}
// (x, yb) = esquina inferior izquierda de la cara frontal; s = lado
function cuboDirecto(k, x, yb, s) {
    if (k === 'agua') return cajaAgua(x, yb, s);
    const F = caras(x, yb, s), y = F.y, ink = tinta(), a = PAL[k].a || 1;
    const sw = Math.max(2, Math.min(3.4, s / 24)), rr = Math.min(5, s * 0.05);
    semilla = Math.round(s * 13) + k.length * 31 || 1;
    forma(F.side, { f: `g:${k}-s`, fo: a, s: ink, sw, lj: 'round', bb: [x + s, y + F.dy, F.dx, s - F.dy] });
    forma(F.top, { f: `g:${k}-t`, fo: a, s: ink, sw, lj: 'round', bb: [x, y + F.dy, s + F.dx, -F.dy] });
    forma(R(x, y, s, s, rr), { f: `g:${k}-f`, fo: a, bb: [x, y, s, s] });
    const tonos = ['#8d6538', '#f3dfbe', '#6e4b25', '#a97c48'];
    let tapa = null;
    recortar(R(x, y, s, s, rr), () => {
        if (k === 'corcho') {
            const n = Math.round(s * s / 26);
            for (let i = 0; i < n; i++) {
                const px = x + rnd() * s, py = y + rnd() * s, r = 0.5 + rnd() * 1.5;
                forma(E(px, py, r, r * 0.7), { f: tonos[i % 4], op: 0.35 + rnd() * 0.4 });
            }
            tapa = () => {
                for (let i = 0; i < n / 3; i++) {
                    const px = x + rnd() * (s + F.dx), py = y + F.dy + rnd() * (-F.dy), r = 0.5 + rnd() * 1.1;
                    forma(E(px, py, r, r), { f: tonos[i % 4], op: 0.45 });
                }
            };
        }
        if (k === 'madera') {
            for (let i = 0; i < 9; i++) {
                const py = y + s * (i + 0.5) / 9 + (rnd() - 0.5) * 4, amp = s * (0.02 + rnd() * 0.03);
                forma(`M${x - 2} ${py} C${x + s * 0.3} ${py - amp} ${x + s * 0.6} ${py + amp * 1.6} ${x + s + 2} ${py - amp * 0.5}`,
                      { s: '#6f4120', sw: 1 + rnd() * 1.2, op: 0.28 + rnd() * 0.3 });
            }
            const kx = x + s * 0.64, ky = y + s * 0.4;
            forma(E(kx, ky, s * 0.07, s * 0.04), { f: '#7c4a22', op: 0.55 });
            forma(E(kx, ky, s * 0.12, s * 0.07), { s: '#6f4120', sw: 1.2, op: 0.45 });
            // anillos de la testa en la cara de arriba
            tapa = () => {
                const cx = x + s * 0.15, cy = y + F.dy * 0.2;
                for (let i = 1; i < 9; i++) forma(E(cx, cy, s * 0.13 * i, -F.dy * 0.32 * i), { s: '#a46f3f', sw: 1.2, op: 0.55 });
            };
        }
        if (k === 'hielo') {
            forma(E(x + s * 0.5, y + s * 0.52, s * 0.36, s * 0.32), { f: 'g:nucleoHielo', bb: [x + s * 0.14, y + s * 0.2, s * 0.72, s * 0.64] });
            forma(`M${x + s * 0.18} ${y + s * 0.78} L${x + s * 0.4} ${y + s * 0.6} L${x + s * 0.47} ${y + s * 0.68} L${x + s * 0.66} ${y + s * 0.5}`, { s: '#fff', sw: 1.4, op: 0.85 });
            forma(`M${x + s * 0.4} ${y + s * 0.6} L${x + s * 0.36} ${y + s * 0.44}`, { s: '#fff', sw: 1, op: 0.7 });
            forma(R(x + 1, y + 1, s - 2, s - 2, 4), { s: '#fff', sw: Math.max(2, s * 0.04), op: 0.55 });
        }
        if (k === 'pet') {
            linea(`M${x + s * 0.15} ${y + s} L${x + s * 0.55} ${y}`, '#fff', s * 0.09, 0.45);
            linea(`M${x + s * 0.42} ${y + s} L${x + s * 0.72} ${y}`, '#fff', s * 0.04, 0.35);
        }
        if (k === 'alum') for (let py = y + 2; py < y + s; py += 2.6) linea(`M${x} ${py} H${x + s}`, '#fff', 0.7, 0.08 + rnd() * 0.14);
        if (k === 'hierro') {
            for (let i = 0; i < 14; i++) {
                const cx = x + rnd() * s, cy = y + rnd() * s, rx = s * (0.03 + rnd() * 0.05), ry = s * (0.02 + rnd() * 0.03);
                forma(E(cx, cy, rx, ry), { f: '#3e444c', op: 0.3 });
            }
            forma(`M${x} ${y + s * 0.3} L${x + s} ${y + s * 0.12} L${x + s} ${y + s * 0.2} L${x} ${y + s * 0.42}Z`, { f: '#c9d6e6', op: 0.14 });
        }
        if (k === 'cobre') for (let i = 0; i < 5; i++) {
            const cx = x + rnd() * s, cy = y + s * 0.5 + rnd() * s * 0.5, rx = s * (0.05 + rnd() * 0.06);
            forma(E(cx, cy, rx, s * 0.03), { f: '#7d3d1b', op: 0.22 });
        }
        if (k === 'plomo') for (let i = 0; i < 7; i++) {
            const px = x + rnd() * s * 0.85, py = y + rnd() * s * 0.9;
            linea(`M${px} ${py} l${s * (0.06 + rnd() * 0.1)} ${s * 0.02}`, '#c1c7d0', 1, 0.45);
        }
        forma(R(x, y, s, s), { f: 'g:oclusion', bb: [x, y, s, s] });
    });
    if (tapa) recortar(F.top, tapa);
    forma(R(x, y, s, s, rr), { s: ink, sw: sw + 0.6 });
    // aristas con luz y brillo
    linea(`M${x + 3} ${y + 1.8} H${x + s - 3}`, '#fff', 1.6, 0.6, 'round');
    linea(`M${x + s + F.dx * 0.15} ${y + F.dy * 0.15} L${x + s + F.dx * 0.85} ${y + F.dy * 0.85}`, '#fff', 1.4, 0.45, 'round');
    if (s > 22) {
        const claro = k === 'hielo' || k === 'pet';
        forma(R(x + s * 0.09, y + s * 0.12, Math.max(3, s * 0.07), s * 0.5, Math.max(1.5, s * 0.035)), { f: '#fff', op: claro ? 0.6 : 0.3 });
        forma(E(x + s * 0.125, y + s * 0.7, Math.max(1.5, s * 0.035), Math.max(1.5, s * 0.035)), { f: '#fff', op: claro ? 0.5 : 0.22 });
    }
}
// Agua en una caja de vidrio fino (tarada en la balanza): nunca se mete en la cubeta
function cajaAgua(x, yb, s) {
    const F = caras(x, yb, s), y = F.y, ink = tinta(), sw = Math.max(2, Math.min(3, s / 26)), n = y + s * 0.1;
    forma(F.side, { f: '#2a7fc4', fo: 0.55 });
    forma(`M${x} ${n} L${x + F.dx} ${n + F.dy} L${x + s + F.dx} ${n + F.dy} L${x + s} ${n} Z`, { f: '#8fd0f7', op: 0.85 });
    forma(R(x, n, s, yb - n), { f: 'g:aguaCaja', bb: [x, n, s, yb - n], op: 0.9 });
    forma(`M${x + s * 0.1} ${n + F.dy * 0.5} q${s * 0.2} ${-s * 0.03} ${s * 0.4} 0`, { s: '#e8f6ff', sw: 1.5, op: 0.8 });
    forma(F.top, { f: '#d8efff', fo: 0.08, s: ink, sw, lj: 'round' });
    forma(F.side, { s: ink, sw, lj: 'round' });
    forma(R(x, y, s, s, 3), { s: ink, sw: sw + 1.2 });
    forma(R(x, y, s, s, 3), { s: CF.vidrio, sw: Math.max(1, sw * 0.45), op: 0.9 });
    forma(F.top, { s: CF.vidrio, sw: Math.max(1, sw * 0.4), op: 0.7 });
    if (s > 22) forma(R(x + s * 0.09, y + s * 0.12, Math.max(3, s * 0.07), s * 0.6, s * 0.035), { f: '#fff', op: 0.4 });
}

// ═════════ BALANZA DE LABORATORIO (coordenadas locales 400 × 340) ═════════
// d = { k, V, m }: material, volumen (L) y masa (kg) de la muestra
function balanzaDigital(d) {
    const { k, V, m } = d, s = lado(V), dx = s * PDX, ink = tinta();
    focoD(200, 196, 200, 160);
    sombraPlano(40, 334, 286, 150, 0.35);
    forma(R(64, 318, 34, 12, 4), { f: '#16212b', s: ink, sw: 2.5 });
    forma(R(258, 318, 34, 12, 4), { f: '#16212b', s: ink, sw: 2.5 });
    caja(50, 322, 256, 66, 150, 'g:cuerpoBal', 'g:tapaBal', 'g:ladoBal', 4, 10);
    linea('M56 262 H300', '#9fb9cc', 2.5, 0.5, 'round');
    // nivel de burbuja en la tapa, al fondo a la derecha
    forma(E(318, 228, 10, 5), { f: '#bfeedd', s: ink, sw: 1.8 });
    forma(E(319, 228, 2.4, 2.4), { f: '#fff' });
    // panel frontal: teclas y pantalla (la lectura de la masa vive aquí)
    forma(R(64, 268, 228, 44, 11), { f: '#22364a', s: ink, sw: 2.5 });
    [[73, 'ON', 11], [245, 'TARA', 10.5]].forEach(([bx, t, fs]) => {
        forma(R(bx, 278, 38, 24, 7), { f: '#3c566d', s: ink, sw: 2 });
        forma(R(bx + 2, 279, 34, 5, 2.5), { f: '#fff', op: 0.18 });
        T(bx + 19, 295, i18n.t(t), { fs, w: 700, a: 'middle', c: '#d8e6f1', sys: true });
    });
    forma(R(118, 272, 120, 36, 8), { f: '#0e2238', s: '#9fb9cc', sw: 2 });
    T(210, 300, fmt(m, 2), { fs: m >= 99.995 ? 23 : 28, w: 600, a: 'end', c: '#eef7ff' });
    T(214, 300, 'kg', { fs: 14, w: 600, c: '#b5d3ec' });
    forma(E(128, 281, 3, 3), { f: '#34e3a8' });
    if (k === 'agua') T(124, 304, '→0←', { fs: 9, w: 700, c: '#34e3a8', sys: true });
    // columna corta y plato cuadrado de acero, centrados en la tapa
    caja(168, 248, 22, 10, 22, 'g:columna', '#9fb3c4', '#55697c', 2.5, 2);
    sombraPlano(78, 246, 214, 120, 0.3);
    caja(74, 240, 212, 9, 124, 'g:cantoPlato', 'g:platoTapa', '#6f8397', 3.5, 3);
    // muestra centrada en el plato, con su sombra
    const pcx = 74 + 106 + 124 * PDX / 2, pcy = 231 + 124 * PDY / 2;
    const x = pcx - s / 2 - dx / 2, yb = pcy - s * PDY / 2;
    sombraPlano(x + 3, yb + 1, s + 2, s * 0.95, 0.32);
    cubo(k, x, yb, s);
    // cota: lado y volumen, fuera del objeto
    const cx = x - 16, y0 = yb - s;
    linea(`M${cx} ${y0} V${yb} M${cx - 6} ${y0} H${cx + 6} M${cx - 6} ${yb} H${cx + 6}`, THEME.textDim, 2);
    T(cx - 10, yb - s / 2 - 22, i18n.t('lado {l} cm', { l: fmt(Math.cbrt(V) * 10, 1) }), { fs: 13, a: 'end', c: THEME.textDim, sys: true });
    T(cx - 10, yb - s / 2 + 4, `V = ${fmtV(V)} L`, { fs: 21, w: 600, a: 'end', c: THEME.title || THEME.text });
    T(200, 22, i18n.t('balanza de laboratorio · mide la masa'), { fs: 14, a: 'middle', c: THEME.textDim, sys: true });
}

// ═════════ BALANZA DE BRAZOS (Comparar), A y B a escala ═════════
// d = { kA, kB, VA, VB, e, giro }: e = escala común de las muestras; giro en radianes
function balanzaBrazos(d) {
    const { kA, kB, VA, VB, e, giro } = d, ink = tinta();
    const sA = lado(VA) * e, sB = lado(VB) * e;
    focoD(200, 196, 200, 160);
    T(200, 22, i18n.t('balanza de brazos · compara masas'), { fs: 14, a: 'middle', c: THEME.textDim, sys: true });
    sombraPlano(60, 334, 260, 110, 0.35);
    forma(R(76, 318, 32, 12, 4), { f: '#16212b', s: ink, sw: 2.5 });
    forma(R(270, 318, 32, 12, 4), { f: '#16212b', s: ink, sw: 2.5 });
    caja(66, 322, 248, 34, 110, 'g:cuerpoBal', 'g:tapaBal', 'g:ladoBal', 4, 10);
    linea('M72 296 H308', '#9fb9cc', 2.5, 0.5, 'round');
    const cx = 190 + 110 * PDX / 2, cyT = 288 + 110 * PDY / 2;   // centro de la tapa
    caja(cx - 10, cyT, 20, cyT - 212, 20, 'g:columna', '#c9d6e0', '#55697c', 3, 3);
    // escala y fiel
    forma(`M${cx - 32} 150 A40 40 0 0 1 ${cx + 32} 150`, { s: '#8fa9be', sw: 3 });
    [-2, -1, 0, 1, 2].forEach(i => {
        const a = -Math.PI / 2 + i * 0.2;
        linea(`M${cx + Math.cos(a) * 40} ${184 + Math.sin(a) * 40} L${cx + Math.cos(a) * 48} ${184 + Math.sin(a) * 48}`, i ? '#8fa9be' : CF.cam, i ? 2 : 3.5, 1, 'round');
    });
    const ctx = cx2();
    ctx.save(); ctx.translate(cx, 208); ctx.rotate(giro); ctx.translate(-cx, -208);
    linea(`M${cx} 204 L${cx} 142`, CF.cam, 3.5, 1, 'round');
    forma(`M${cx} 136 l-5 10 h10 Z`, { f: CF.cam, s: ink, sw: 1.5 });
    ctx.restore();
    // brazo (barra en la misma perspectiva) con cuchilla
    ctx.save(); ctx.translate(cx, 218); ctx.rotate(giro); ctx.translate(-cx, -218);
    caja(cx - 160, 212, 320, 12, 12, 'g:brazo', '#e6eef5', '#7f93a6', 3, 4);
    ctx.restore();
    forma(`M${cx - 10} 224 L${cx} 206 L${cx + 10} 224 Z`, { f: '#5f7891', s: ink, sw: 2.5 });
    forma(E(cx, 208, 6.5, 6.5), { f: '#dbe5ee', s: ink, sw: 2.5 });
    // platillos: bandejas cuadradas de acero con su vástago (cuelgan rectos aunque el brazo gire)
    [[-108, kA, sA, 'A', CF.A], [108, kB, sB, 'B', CF.B]].forEach(([off, k, s, l, col]) => {
        const px = cx + off * Math.cos(giro), oy = off * Math.sin(giro);
        ctx.save(); ctx.translate(0, oy);
        caja(px - 5, 202, 10, 26, 10, 'g:columna', '#c9d6e0', '#55697c', 2.5, 2);
        const pw = 118, pd = 86, ppx = px - pw / 2 - pd * PDX / 2;
        caja(ppx, 184, pw, 8, pd, 'g:cantoPlato', 'g:platoTapa', '#6f8397', 3, 3);
        const tcx = ppx + pw / 2 + pd * PDX / 2, tcy = 176 + pd * PDY / 2, dx = s * PDX;
        const x = tcx - s / 2 - dx / 2, yb = tcy - s * PDY / 2;
        sombraPlano(x + 3, yb + 1, s + 2, s * 0.95, 0.32);
        cubo(k, x, yb, s);
        const by = yb - s + s * PDY - 22;
        forma(E(x + (s + dx) / 2, by, 13, 13), { f: col, s: ink, sw: 2.5 });
        T(x + (s + dx) / 2, by + 5, l, { fs: 14, w: 700, a: 'middle', c: CF.ink });
        ctx.restore();
    });
}

// ═════════ CUBETA DE VIDRIO CON AGUA ═════════
// c = { x0, y0, w, h }; est = { yA, base, muestras: [{ k, s, x, yb, l }], ondas, burbujas, t, marcas }
// Frente: x0..x0+w, y0..y0+h. El fondo se desplaza (DX, DY) en la misma proyección que los cubos.
function geomCubeta(c) {
    const DX = c.w * 0.12, DY = -c.w * 0.09;
    return { DX, DY, x1: c.x0 + c.w, yF: c.y0 + c.h, base: c.y0 + c.h - c.h * 0.6 };
}
function cubeta(c, est) {
    const { x0, y0, w, h } = c, { DX, DY, x1, yF, base } = geomCubeta(c), yA = est.yA, ink = tinta();
    focoD(x0 + w / 2, y0 + h * 0.5, w * 0.74, h * 0.64);
    // peana de la cubeta (marco metálico fino) y sombra
    sombraE(x0 + w / 2 + DX / 2, yF + 14, w + DX * 1.6);
    forma(P([x1 + 4, yF + 2], [x1 + DX + 4, yF + DY + 2], [x1 + DX + 4, yF + DY + 11], [x1 + 4, yF + 11]), { f: '#2a3e50', s: ink, sw: 2.5, lj: 'round' });
    forma(R(x0 - 4, yF + 1, w + 8, 11, 3), { f: 'g:cuerpoBal', bb: [x0 - 4, yF + 1, w + 8, 11], s: ink, sw: 2.5 });
    forma(R(x0, yF + 3, w, 2.5, 1.2), { f: '#9fb9cc', op: 0.55 });
    // interior en seco: pared del fondo, pared izquierda y suelo
    forma(R(x0 + DX, y0 + DY, w, h), { f: 'g:cubFondo', bb: [x0 + DX, y0 + DY, w, h] });
    forma(P([x0, y0], [x0 + DX, y0 + DY], [x0 + DX, yF + DY], [x0, yF]), { f: '#173d5e', op: 0.55 });
    // agua por detrás: fondo, lado izquierdo y suelo con cáusticas
    forma(R(x0 + DX, yA + DY, w, yF - yA), { f: 'g:aguaFondo', bb: [x0 + DX, yA + DY, w, yF - yA] });
    forma(P([x0, yA], [x0 + DX, yA + DY], [x0 + DX, yF + DY], [x0, yF]), { f: '#1c6aa8', op: 0.75 });
    const suelo = P([x0, yF], [x0 + DX, yF + DY], [x1 + DX, yF + DY], [x1, yF]);
    forma(suelo, { f: '#4aa7e4' });
    const t = MOV_REDUCIDO ? 0 : est.t || 0;
    recortar(suelo, () => {
        semilla = 7;
        for (let i = 0; i < 26; i++) {
            const cx = x0 + rnd() * (w + DX) + Math.sin(t * 0.7 + i) * 3, cy = yF + DY * rnd(), r = 6 + rnd() * 10;
            forma(`M${cx - r} ${cy} q${r * 0.5} ${-r * 0.35} ${r} 0 t${r} 0`, { s: '#d4f1ff', sw: 1 + rnd() * 1.2, op: 0.35 + rnd() * 0.35 });
        }
    });
    // superficie del agua (se ve desde un poco arriba)
    forma(P([x0, yA], [x0 + DX, yA + DY], [x1 + DX, yA + DY], [x1, yA]), { f: 'g:superficie', bb: [x0, yA + DY, w + DX, -DY] });
    semilla = 3;
    for (let i = 0; i < 7; i++) {
        const f = 0.15 + rnd() * 0.7, g = rnd();
        forma(`M${x0 + w * f + DX * g} ${yA + DY * g} q${w * 0.03} -2.5 ${w * 0.06} 0`, { s: '#fff', sw: 1.5, op: 0.45 + rnd() * 0.4 });
    }
    // aristas del fondo del vidrio, finas y claras: quedan detrás de las muestras
    forma(`M${x0 + DX} ${yF + DY} V${y0 + DY} H${x1 + DX}`, { s: '#a8e4ea', sw: 1.6, op: 0.45 });
    // muestras (a mitad de profundidad); lo que va «encima» se pinta tras el agua del frente
    const encima = [];
    const yl = yA + DY * 0.35;
    est.muestras.forEach(mu => {
        const { k, s, x, yb } = mu, dx = s * PDX;
        const enSuelo = yb >= yF + DY * 0.35 - 2.5;
        if (enSuelo) sombraE(x + s / 2 + dx * 0.3, yb, s + dx);
        cubo(k, x, yb, s);
        if (yb > yl && yb - s < yl) encima.push(() => {        // línea de flotación: menisco claro
            linea(`M${x - 3} ${yl} H${x + s + 3}`, '#effaff', 2.2, 0.95);
            linea(`M${x + s} ${yl} L${x + s + dx} ${yl - dx * 0.76}`, '#effaff', 1.8, 0.8);
        });
        if (mu.l) encima.push(() => {
            const flota = yb - s < yl;
            const bx = flota ? x + s + dx + 18 : x + s / 2, by = flota ? yb - s + s * PDY + 6 : yb - s + s * PDY - 22;
            forma(E(bx, by, 12, 12), { f: mu.l === 'A' ? CF.A : CF.B, s: ink, sw: 2.5 });
            T(bx, by + 5, mu.l, { fs: 13, w: 700, a: 'middle', c: CF.ink });
        });
    });
    // ondas al entrar en el agua (la mitad de delante de cada anillo)
    (est.ondas || []).forEach(o => encima.push(() => {
        const ctx = cx2(), a0 = ctx.globalAlpha;
        [[16, 6, 0.65], [34, 11, 0.4]].forEach(([a, b, op], j) => {
            const e = Math.min(1, o.edad / 1.4), crece = 0.4 + e * 1.1 - j * 0.15;
            if (crece <= 0) return;
            ctx.globalAlpha = a0 * op * (1 - e);
            ctx.beginPath(); ctx.ellipse(o.cx, yl - o.dx * 0.38, o.w / 2 + a * crece, o.dx * 0.4 + b * crece, 0, 0, Math.PI);
            ctx.strokeStyle = '#effaff'; ctx.lineWidth = 1.6; ctx.stroke();
        });
        ctx.globalAlpha = a0;
    }));
    // burbujas que suben mientras algo se hunde
    (est.burbujas || []).forEach(b => encima.push(() => {
        forma(E(b.x, b.y, b.r, b.r), { f: 'rgba(212,241,255,.25)', s: '#effaff', sw: 1.2, op: b.op });
    }));
    // agua del frente y del lado derecho (tiñe lo sumergido, más oscura al fondo)
    forma(P([x1, yA], [x1 + DX, yA + DY], [x1 + DX, yF + DY], [x1, yF]), { f: 'g:aguaLado', bb: [x1, yA + DY, DX, yF - yA - DY] });
    forma(R(x0, yA, w, yF - yA), { f: 'g:aguaFrente', bb: [x0, yA, w, yF - yA] });
    forma(`M${x0 + w * 0.18} ${yA + 6} L${x0 + w * 0.06} ${yF - 4} H${x0 + w * 0.13} L${x0 + w * 0.26} ${yA + 6} Z`, { f: '#fff', op: 0.05 });
    forma(`M${x0 + w * 0.62} ${yA + 6} L${x0 + w * 0.5} ${yF - 4} H${x0 + w * 0.54} L${x0 + w * 0.67} ${yA + 6} Z`, { f: '#fff', op: 0.04 });
    // menisco: línea clara donde el agua toca el vidrio, que sube un poco en las esquinas
    forma(`M${x0 + 3} ${yA - 3} Q${x0 + 8} ${yA} ${x0 + 18} ${yA} H${x1 - 18} Q${x1 - 8} ${yA} ${x1 - 3} ${yA - 3}`, { s: '#e6f7ff', sw: 2.4 });
    linea(`M${x1} ${yA - 2} L${x1 + DX} ${yA + DY - 2}`, '#e6f7ff', 1.8, 0.8);
    encima.forEach(f => f());
    // vidrio: aristas del fondo finas y claras, laterales y borde superior con grosor
    const vid = (d, wi) => {
        forma(d, { s: ink, sw: wi + 3, lj: 'round', lc: 'round' });
        forma(d, { s: '#bdeef2', sw: wi, lj: 'round', lc: 'round' });
    };
    vid(`M${x0} ${y0} L${x0 + DX} ${y0 + DY} H${x1 + DX} L${x1} ${y0}`, 2.5);
    vid(`M${x1 + DX} ${y0 + DY} V${yF + DY} L${x1} ${yF}`, 2.5);
    forma(R(x0, y0, w, h, 6), { s: ink, sw: 6 });
    forma(R(x0 + 2.5, y0 + 2.5, w - 5, h - 5, 4), { s: '#9fdde6', sw: 3.5, op: 0.75 });
    forma(R(x0 + 5, y0 + 5, w - 10, h - 10, 3), { s: '#ffffff', sw: 1, op: 0.35 });
    // canto superior del vidrio (grosor visto de frente)
    forma(R(x0 - 1, y0 - 3, w + 2, 6, 3), { f: '#d4f6f8', s: ink, sw: 2.5 });
    // reflejos en diagonal sobre el vidrio del frente
    recortar(R(x0, y0, w, h, 6), () => {
        forma(`M${x0 + w * 0.04} ${y0} L${x0 + w * 0.22} ${y0} L${x0 - w * 0.1} ${yF} L${x0 - w * 0.28} ${yF} Z`, { f: '#fff', op: 0.09 });
        forma(`M${x0 + w * 0.27} ${y0} L${x0 + w * 0.3} ${y0} L${x0 - w * 0.02} ${yF} L${x0 - w * 0.05} ${yF} Z`, { f: '#fff', op: 0.18 });
        forma(`M${x1 - w * 0.12} ${y0} L${x1 - w * 0.07} ${y0} L${x1 - w * 0.27} ${yF} L${x1 - w * 0.32} ${yF} Z`, { f: '#fff', op: 0.06 });
    });
    forma(R(x0 + 9, y0 + 14, 5, h * 0.4, 2.5), { f: '#fff', op: 0.45 });
    // Lo que asoma por encima del canto delantero está delante del vidrio del fondo y de los laterales
    est.muestras.forEach(mu => {
        if (mu.yb - mu.s * (1 - PDY) >= y0 - 3) return;
        recortar(`M${x0 - 60} ${y0 - 400} H${x1 + DX + 60} V${y0 - 3} H${x0 - 60} Z`, () => cubo(mu.k, mu.x, mu.yb, mu.s));
    });
    if (!est.muestras.length || !est.marcas) return;
    // Mientras espera: flecha discontinua hacia el agua
    if (est.espera) est.muestras.forEach(mu => {
        const cx = mu.x + mu.s / 2, y1 = mu.yb + 8, y2 = yA + DY * 0.35 - 6;
        if (y2 - y1 < 14) return;
        forma(`M${cx} ${y1} V${y2 - 6}`, { s: THEME.textDim, sw: 2, dash: [4, 4], lc: 'round' });
        forma(`M${cx - 5} ${y2 - 8} L${cx} ${y2} L${cx + 5} ${y2 - 8}`, { s: THEME.textDim, sw: 2, lc: 'round', lj: 'round' });
    });
    // Marcas del nivel, fuera del vidrio y sin números. La del nivel sin muestra no se
    // mueve nunca; la del nivel con la muestra aparece cuando el agua sube.
    // A la izquierda (junto al vidrio del frente) si hay sitio; si no, a la derecha (junto al fondo)
    const izq = est.marcasIzq, xm = izq ? x0 - 24 : x1 + DX + 10, yo = izq ? 0 : DY;
    const xt = izq ? xm - 4 : xm + 18, al = izq ? 'end' : 'start';
    forma(`M${xm} ${base + yo} h14`, { s: THEME.textDim, sw: 2, dash: [3, 3] });
    T(xt, base + yo + 13, i18n.t('sin muestra'), { fs: 12, a: al, c: THEME.textDim, sys: true });
    if (base - yA > 0.6) {
        linea(`M${xm} ${yA + yo} h14`, THEME.text, 2.2);
        T(xt, yA + yo - 4, i18n.t('con muestra'), { fs: 12, a: al, c: THEME.text, sys: true });
    }
}

// ═════════ TIRA INFERIOR: regla de densidades en papel ═════════
// act = [{ k, r, col, lab }] punteros; brillo = material recién comprobado (anillo y chispa)
function regla(g, m, act, brillo) {
    const { x, y, w, h } = g, ink = tinta(), pi = THEME.paperInk, gris = THEME.paperDim;
    forma(R(x + 4, y + 5, w, h, 16), { f: ink, op: THEME.fun ? 0.55 : 0 });
    forma(R(x + 1, y + 1, w - 2, h - 2, 16), { f: THEME.paper, s: THEME.paperLine, sw: THEME.fun ? 3 : 1.5 });
    const gx0 = x + (m ? 26 : 210), gx1 = x + w - (m ? 26 : 44), ly = y + (m ? 92 : 58), max = 12;
    const X = (r) => gx0 + (gx1 - gx0) * Math.min(r, max) / max;
    if (!m) {
        T(x + 22, y + 36, i18n.t('Densidad'), { fs: 19, w: 700, c: pi });
        T(x + 22, y + 56, i18n.t('en kg/L (= g/cm³)'), { fs: 13, c: gris, sys: true });
        forma(R(x + 22, y + 72, 14, 12, 3), { f: THEME.franjaF, s: THEME.tintaF, sw: 1.2 });
        T(x + 42, y + 83, i18n.t('flotan en agua'), { fs: 13, w: 600, c: THEME.tintaF, sys: true });
        forma(R(x + 22, y + 94, 14, 12, 3), { f: THEME.franjaH, s: THEME.tintaH, sw: 1.2 });
        T(x + 42, y + 105, i18n.t('se hunden en agua'), { fs: 13, w: 600, c: THEME.tintaH, sys: true });
    } else T(x + 16, y + 26, i18n.t('Densidad (kg/L)'), { fs: 16, w: 700, c: pi });
    // franjas suaves con esquinas redondeadas
    forma(R(gx0, ly - 18, X(1) - gx0, 18, 5), { f: THEME.franjaF });
    forma(R(X(1), ly - 18, gx1 - X(1), 18, 5), { f: THEME.franjaH });
    if (m) {
        T(gx0, ly + 52, i18n.t('← flotan'), { fs: 13, w: 600, c: THEME.tintaF, sys: true });
        T(gx1, ly + 52, i18n.t('se hunden en agua →'), { fs: 13, w: 600, a: 'end', c: THEME.tintaH, sys: true });
    }
    for (let i = 0; i <= max; i++) {
        const xx = X(i);
        linea(`M${xx} ${ly} v${i % 2 ? 5 : 9}`, pi, 1.5);
        if (i % 2 === 0) T(xx, ly + 21, fmt(i, 0), { fs: 12.5, w: 600, a: 'middle', c: pi, sys: true });
    }
    linea(`M${gx0} ${ly} H${gx1}`, pi, 2.5, 1, 'round');
    linea(`M${X(1)} ${ly - 26} V${ly + 8}`, CF.agua, 3.5, 1, 'round');
    // cada material: su cubito sobre la regla y su nombre debajo
    const ks = act.map(a => a.k);
    ORDEN.slice(0, 9).forEach(k => {
        if (k === 'agua') return;
        const xx = X(MATS[k].r), on = ks.includes(k), c = on ? 13 : 10;
        cubo(k, xx - c * 0.67, ly - (on ? 3 : 2), c);
        const fila = { madera: 1, pet: 1 }[k] || 0;
        if (!m) T(xx, ly + 37 + fila * 15, i18n.t(MATS[k].corto || MATS[k].n), { fs: 12.5, w: on ? 700 : 400, a: 'middle', c: on ? pi : gris, sys: true });
    });
    if (!m) T(X(1), ly + 67, i18n.t('agua'), { fs: 12.5, w: 700, a: 'middle', c: THEME.tintaAgua, sys: true });
    // punteros de las muestras
    // dos punteros juntos: las etiquetas se apartan a los lados y las puntas siguen en su sitio
    const xs = act.map(a => X(a.r)), ws = act.map(a => anchoT(a.lab, { fs: 14, w: 700 }) + 18);
    const junto = act.length === 2 && Math.abs(xs[0] - xs[1]) < (ws[0] + ws[1]) / 2 + 4;
    act.forEach((a, i) => {
        const xx = xs[i], lw = ws[i], py = ly - (m ? 56 : 52);
        if (a.k === 'pers') cubo('pers', xx - 13 * 0.67, ly - 3, 13);
        let xl = xx;
        if (junto) {
            const mid = (xs[0] + xs[1]) / 2, izq = xs[i] < xs[1 - i] || (xs[0] === xs[1] && i === 0);
            xl = izq ? Math.min(xx, mid - lw / 2 - 2) : Math.max(xx, mid + lw / 2 + 2);
        }
        pildora(xl - lw / 2, py, lw, 26, a.col, ink, 2);
        T(xl, py + 18, a.lab, { fs: 14, w: 700, a: 'middle', c: CF.ink });
        forma(`M${xx - 6} ${py + 26} L${xx} ${py + 34} L${xx + 6} ${py + 26} Z`, { f: a.col, s: ink, sw: 1.8, lj: 'round' });
        if (brillo && brillo === a.k) {
            forma(E(xx, ly - 8, 14, 14), { s: CF.cam, sw: 3 });
            chispaD(xx + 20, ly - 20, 6);
        }
    });
}
