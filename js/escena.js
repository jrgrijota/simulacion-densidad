// ═══════════════════════════════════════════════════════════════════
//  ESCENA DE «DENSIDAD»
//
//  Una sola escena (retícula A de la guía de diseño v2):
//   · columna 1: el objeto (balanza de laboratorio con la muestra en
//     «Un objeto»; balanza de brazos con A y B en «Comparar») y, debajo,
//     los mandos HTML;
//   · columna 2: la cubeta de vidrio con agua, donde cae la misma muestra;
//   · columna 3: el panel de estado;
//   · abajo: la regla de densidades en papel.
//  Los dibujos están en js/dibujo.js, en las coordenadas del boceto
//  aprobado (/capturas/escena-densidad/boceto.html); los retos y el álbum
//  en js/retos.js.
// ═══════════════════════════════════════════════════════════════════

let CV_W = 1330, CV_H = 680;
let ESC_MOVIL = null;
let OBJ, MANDOS, TANQUE, PANEL, REGLA, TARJETAS, SOLTAR, ROTULO, LEYENDA, NOTA, SELLO_POS;

// Colores propios de la escena en cada tema
const TEMA_PROPIO = {
    pizarra:   { foco: 1, paperDim: '#3d5568', franjaF: '#bfeedd', franjaH: '#f6dcc2', tintaF: '#1d6b4f', tintaH: '#8a4a17', tintaAgua: '#1f6fae', flota: '#9fe7c4', hunde: '#ffb38a', neutro: '#d7e3ee', cam: '#ffd84a' },
    dia:       { foco: 0.35, paperDim: '#3d5568', franjaF: '#bfeedd', franjaH: '#f6dcc2', tintaF: '#1d6b4f', tintaH: '#8a4a17', tintaAgua: '#1f6fae', flota: '#9fe7c4', hunde: '#ffb38a', neutro: '#d7e3ee', cam: '#ffd84a' },
    marca:     { foco: 0, paperDim: '#475569', franjaF: '#ccefe0', franjaH: '#f8e0c8', tintaF: '#0f766e', tintaH: '#c2410c', tintaAgua: '#0369a1', flota: '#99e2c0', hunde: '#fdba8c', neutro: '#e2e8f0', cam: '#fde68a', ink: '#1e293b' },
    contraste: { foco: 0, paperDim: '#cccccc', franjaF: '#00402a', franjaH: '#4d2800', tintaF: '#00ff88', tintaH: '#ffaa00', tintaAgua: '#33aaff', flota: '#00ff88', hunde: '#ffaa00', neutro: '#ffffff', cam: '#ffff00', ink: '#000000' },
};

// ── Composición ──────────────────────────────────────────────────
function calcularEscena() {
    const movil = esMovil();
    const cambia = movil !== ESC_MOVIL;
    ESC_MOVIL = movil;
    const cmp = S.modo === 'comparar';
    if (!movil) {
        CV_W = 1330; CV_H = 680;
        TARJETAS = [{ x: 0, y: 0, w: 1330, h: 540 }];
        OBJ = { tx: 22, ty: 4, s: 1 };
        MANDOS = { x: 42, y: cmp ? 372 : 358, w: 360 };
        TANQUE = { x0: 506, y0: 122, w: 290, h: 296 };
        LEYENDA = { x: 662, y: 62 };
        ROTULO = { x: 662, y: 442, txt: '¿Flota o se hunde en agua?' };
        SOLTAR = { x: 562, y: 490, w: 200 };
        NOTA = { x: 662, y: 510 };
        PANEL = { x: 902, y: 30, w: 400, h: 480, compacto: false };
        SELLO_POS = { x: 1131, y: 456 };
        REGLA = { x: 0, y: 552, w: 1330, h: 128 };
    } else {
        CV_W = 370;
        OBJ = { tx: 4, ty: 8, s: 0.905 };
        MANDOS = { x: 18, y: cmp ? 352 : 338, w: 334 };
        PANEL = { x: 0, y: 516, w: 370, h: 460, compacto: true };
        TARJETAS = [{ x: 0, y: 0, w: 370, h: 500 }, { x: 0, y: 992, w: 370, h: 380 }];
        TANQUE = { x0: 16, y0: 1066, w: 222, h: 232 };
        LEYENDA = { x: 185, y: 1026 };
        ROTULO = { x: 128, y: 1320, w: 226, txt: '¿Flota o se hunde?' };
        SOLTAR = { x: 246, y: 1316, w: 114 };
        NOTA = { x: 185, y: 1337 };
        SELLO_POS = { x: 185, y: 940 };
        REGLA = { x: 0, y: 1388, w: 370, h: 150 };
        CV_H = 1544;
    }
    colocarMandos();
    return cambia;
}
function colocarMandos() {
    colocarSobreLienzo(document.querySelector('.mandos-densidad'), MANDOS, CV_W, CV_H);
    colocarSobreLienzo($('btn-soltar'), SOLTAR, CV_W, CV_H);
}
function ajustarEscena(cv) { encajarEscena(cv, CV_W, CV_H, ESC_MOVIL); }
function fitCanvas() {
    const cv = document.querySelector('#canvas-container canvas');
    if (!cv) return;
    ajustarEscena(cv);
    const d = densidadAdecuada(cv);
    if (Math.abs(d - pixelDensity()) > 0.01) { pixelDensity(d); ajustarEscena(cv); }
}
let topeDensidad = 2;
function densidadAdecuada(cv) {
    const visto = cv.getBoundingClientRect().width / CV_W * displayDensity();
    return constrain(Math.ceil(visto * 4) / 4, 1, topeDensidad);
}
let fpsMarca = { t: 0, f: 0 };
function vigilarRendimiento() {
    const ahora = performance.now();
    if (!fpsMarca.t) { fpsMarca = { t: ahora, f: frameCount }; return; }
    if (ahora - fpsMarca.t < 3000) return;
    if (ahora - fpsMarca.t > 4500) { fpsMarca = { t: ahora, f: frameCount }; return; }
    const fps = (frameCount - fpsMarca.f) * 1000 / (ahora - fpsMarca.t);
    fpsMarca = { t: ahora, f: frameCount };
    if (document.hidden || fps >= 40 || pixelDensity() <= 1) return;
    topeDensidad = Math.max(1, pixelDensity() - 0.25);
    fitCanvas();
}
function rehacerComposicion() {
    calcularEscena();
    resizeCanvas(CV_W, CV_H);
    fitCanvas();
}
function windowResized() {
    if (calcularEscena()) resizeCanvas(CV_W, CV_H);
    fitCanvas();
}

// ── Estado ───────────────────────────────────────────────────────
// Arranca con 1 L de madera: flota con algo más de la mitad bajo el agua
const S = {
    modo: 'objeto', mat: 'madera', V: 1, mPers: 1.5, VPers: 1,
    cmp: 'masa', A: 'corcho', B: 'plomo', valor: 1,
};
const fmt = (x, d) => i18n.num(x, d);
// Volumen para leer: 1 decimal sin «,0» (0,1 L … 10 L); por debajo de 0,1, dos decimales
const fmtV = (V) => V < 0.095 ? fmt(V, 2) : fmt(V, 1).replace(/[.,]0$/, '');
const DE = {
    corcho: 'de corcho', madera: 'de madera', hielo: 'de hielo', agua: 'de agua', pet: 'de plástico PET',
    alum: 'de aluminio', hierro: 'de hierro', cobre: 'de cobre', plomo: 'de plomo', pers: 'de tu objeto',
};
const nombre = (k) => i18n.t(MATS[k].n);
// Densidad de la muestra de «Un objeto» (la del personalizado se redondea a 1,00 si lo parece)
function muestraObjeto() {
    if (S.mat === 'pers') {
        let r = S.mPers / S.VPers;
        if (Math.abs(r - 1) < 0.005) r = 1;
        return { k: 'pers', V: S.VPers, m: S.mPers, r };
    }
    const r = MATS[S.mat].r;
    return { k: S.mat, V: S.V, m: r * S.V, r };
}
function muestrasComparar() {
    const rA = MATS[S.A].r, rB = MATS[S.B].r;
    if (S.cmp === 'masa') return { A: { k: S.A, r: rA, m: S.valor, V: S.valor / rA }, B: { k: S.B, r: rB, m: S.valor, V: S.valor / rB } };
    return { A: { k: S.A, r: rA, V: S.valor, m: S.valor * rA }, B: { k: S.B, r: rB, V: S.valor, m: S.valor * rB } };
}
const resultado = (r) => r < 1 ? 'flota' : r > 1 ? 'hunde' : 'neutro';

// ── La caída en la cubeta (física de verdad) ─────────────────────
// Cada muestra: yb (base de la cara frontal), v (hacia abajo), f (parte sumergida).
// Empuje del agua: a = g · (1 − f / ρ), más el rozamiento con el agua.
const G_PX = 1600;
let CAIDA = [], ONDAS = [], BURBUJAS = [];
let tSoltar = -1e9, selloInfo = null, ultimoRes = {};
let brazo = { giro: 0, w: 0, quietoDesde: null, dado: false, tCambio: -1e9 };

// Las muestras muy grandes se reducen en la cubeta: caben a lo ancho y esperan por encima del agua
function escalaTanque(V) {
    const s = lado(V), { DY, base } = geomCubeta(TANQUE);
    const alto = (base + DY * 0.35 - 8) - (TARJETAS[TARJETAS.length - 1].y + 74);
    return Math.min(1, TANQUE.w * 0.5 / s, alto / (s * (1 - PDY)));
}
// Altura a la que espera la muestra antes de soltarla (sin tocar el agua)
function yEspera(s) {
    const { DY, base } = geomCubeta(TANQUE), top = TARJETAS[TARJETAS.length - 1].y + 74;
    return Math.min(Math.max(TANQUE.y0 - 14, top + s * (1 - PDY)), base + DY * 0.35 - 8);
}
let esperando = true;
function eComparar(c) { return Math.min(1, 78 / Math.max(lado(c.A.V), lado(c.B.V))); }
// Lado y posición en la cubeta de cada muestra
function geometriaMuestras() {
    const { DX } = geomCubeta(TANQUE);
    if (S.modo === 'objeto') {
        const m = muestraObjeto();
        const s = lado(m.V) * escalaTanque(m.V);
        return [{ s, x: TANQUE.x0 + TANQUE.w / 2 - 0.67 * s + DX * 0.35 }];
    }
    const c = muestrasComparar(), e = eComparar(c);
    return [c.A, c.B].map((mu, i) => {
        const s = lado(mu.V) * e;
        return { s, x: TANQUE.x0 + TANQUE.w * (i ? 0.75 : 0.3) - 0.67 * s + DX * 0.35 };
    });
}
// Coloca las muestras sobre la cubeta, quietas, hasta que se pulse «Soltar»
function soltar() {
    esperando = true;
    tSoltar = millis();
    ONDAS = []; BURBUJAS = [];
    selloInfo = null; ultimoRes = {};
    brazo.dado = false; brazo.quietoDesde = null; brazo.tCambio = millis();
    const lista = S.modo === 'objeto' ? [muestraObjeto()] : (() => { const c = muestrasComparar(); return [Object.assign({ l: 'A' }, c.A), Object.assign({ l: 'B' }, c.B)]; })();
    const geo = geometriaMuestras();
    CAIDA = lista.map((mu, i) => {
        const s = geo[i].s, top = TARJETAS[TARJETAS.length - 1].y + 74;
        return { k: mu.k, r: mu.r, V: mu.V, l: mu.l, yb: yEspera(s), v: 0, f: 0, quieto: null, dentro: false, res: null, fuera: mu.k === 'agua' };
    });
    $('btn-soltar').hidden = S.modo === 'objeto' && S.mat === 'agua';
    rotularBoton();
}
// Deja caer las muestras (si ya habían caído, vuelven arriba y caen otra vez)
// Con la muestra arriba, la suelta; si ya cayó, la sube otra vez y espera al siguiente clic
function dejarCaer() {
    if (!esperando) { soltar(); return; }
    esperando = false;
    tSoltar = millis();
    rotularBoton();
}
function rotularBoton() {
    const b = $('btn-soltar');
    b.querySelector('.ico-soltar').textContent = esperando ? '↓' : '↻';
    b.querySelector('.solo-ancho').textContent = i18n.t(esperando ? 'Soltar en el agua' : 'Soltar otra vez');
    b.classList.toggle('llamativo', esperando);
}
// Las muestras siguen siendo las mismas aunque cambie su tamaño o su masa
function actualizarMuestras() {
    const lista = S.modo === 'objeto' ? [muestraObjeto()] : (() => { const c = muestrasComparar(); return [c.A, c.B]; })();
    if (lista.length !== CAIDA.length || lista.some((mu, i) => mu.k !== CAIDA[i].k)) { soltar(); return; }
    lista.forEach((mu, i) => { CAIDA[i].r = mu.r; CAIDA[i].V = mu.V; CAIDA[i].quieto = null; });
}
function nivelAgua(geo) {
    const { base } = geomCubeta(TANQUE);
    let disp = 0;
    CAIDA.forEach((c, i) => { if (!c.fuera) disp += c.f * Math.pow(geo[i].s / ESC, 3); });
    return Math.max(TANQUE.y0 + 22, base - disp / 24 * TANQUE.h * 0.5);
}
let yAgua = null;
function pasoCaida(dt) {
    const geo = geometriaMuestras();
    const { DY, yF } = geomCubeta(TANQUE);
    const yA = nivelAgua(geo);
    yAgua = yA;
    const yl = yA + DY * 0.35, suelo = yF + DY * 0.35 - 2;
    CAIDA.forEach((c, i) => {
        if (c.fuera) return;
        const s = geo[i].s;
        if (esperando) { c.yb = yEspera(s); c.v = 0; c.f = 0; return; }
        const pasos = 4, h = dt / pasos;
        for (let p = 0; p < pasos; p++) {
            const f = constrain((c.yb - yl) / s, 0, 1);
            const roce = (f > 0 ? 3 : 0) * c.v + f * (5 + 6 * f * f) * c.v + f * 0.012 * c.v * Math.abs(c.v) * (62 / s);
            const a = G_PX * (1 - f / c.r) - roce;
            c.v += a * h; c.yb += c.v * h;
            if (c.yb > suelo) { c.yb = suelo; if (c.v > 0) c.v = c.v > 60 ? -c.v * 0.12 : 0; }
            c.f = f;
        }
        c.f = constrain((c.yb - yl) / s, 0, 1);
        // Ondas al entrar y burbujas mientras baja bajo el agua
        if (!c.dentro && c.f > 0) {
            c.dentro = true;
            if (c.v > 40 && !MOV_REDUCIDO) ONDAS.push({ i, edad: 0 });
        }
        if (!MOV_REDUCIDO && c.f >= 1 && c.v > 35 && Math.random() < dt * 14) {
            BURBUJAS.push({ x: geo[i].x + Math.random() * s + s * PDX * 0.3, y: c.yb - s - 2, r: 1.6 + Math.random() * 2.2, vy: -(70 + Math.random() * 50), fase: Math.random() * 6, op: 1 });
        }
        // ¿Ya está quieta?
        const tranquila = Math.abs(c.v) < 6 && millis() - tSoltar > 600;
        if (!tranquila) c.quieto = null;
        else if (c.quieto == null) c.quieto = millis();
        if (c.quieto != null && millis() - c.quieto > 350) muestraQuieta(c);
    });
    ONDAS.forEach(o => o.edad += dt);
    ONDAS = ONDAS.filter(o => o.edad < 1.4);
    BURBUJAS.forEach(b => { b.y += b.vy * dt; b.fase += dt * 7; b.x += Math.sin(b.fase) * 0.3; });
    BURBUJAS = BURBUJAS.filter(b => b.y > yl - 2);
}
// La muestra ya no se mueve: sello (una vez por caída, o si cambia lo que hace)
function muestraQuieta(c) {
    const res = resultado(c.r);
    if (c.res === res) return;
    const antes = ultimoRes[c.k + (c.l || '')];
    c.res = res; ultimoRes[c.k + (c.l || '')] = res;
    if (S.modo === 'objeto') {
        const ahora = antes && antes !== res;
        const tit = { flota: ahora ? '¡AHORA FLOTA!' : '¡FLOTA!', hunde: ahora ? '¡AHORA SE HUNDE!' : '¡SE HUNDE!', neutro: '¡NI FLOTA NI SE HUNDE!' }[res];
        const sub = { flota: '{r} kg/L: menos que el agua', hunde: '{r} kg/L: más que el agua', neutro: '{r} kg/L: igual que el agua' }[res];
        selloInfo = { t: i18n.t(tit), sub: i18n.t(sub, { r: fmt(c.r, 2) }), t0: millis(), k: c.k };
        if (c.k === 'pers') { /* el personalizado no va al álbum */ } else retosSello(c.k);
        retosObjeto({ k: c.k, V: S.V, res });
    } else {
        if (c.k !== 'agua') retosSello(c.k);
        revisarComparar();
    }
}

// Balanza de brazos: muelle amortiguado hacia el giro que piden las masas
function giroObjetivo() {
    const c = muestrasComparar();
    const d = (c.B.m - c.A.m) / (c.A.m + c.B.m);
    if (Math.abs(d) < 1e-9) return 0;
    return Math.sign(d) * Math.min(0.2, 0.04 + Math.abs(d) * 0.3);   // siempre se ve hacia dónde se inclina
}
function pasoBrazo(dt) {
    const obj = giroObjetivo();
    if (MOV_REDUCIDO) { brazo.giro = obj; brazo.w = 0; }
    else {
        const h = dt / 4;
        for (let p = 0; p < 4; p++) { brazo.w += (-40 * (brazo.giro - obj) - 6 * brazo.w) * h; brazo.giro += brazo.w * h; }
    }
    const quieto = Math.abs(brazo.w) < 0.02 && Math.abs(brazo.giro - obj) < 0.006 && millis() - brazo.tCambio > 800;
    if (!quieto) brazo.quietoDesde = null;
    else if (brazo.quietoDesde == null) brazo.quietoDesde = millis();
    if (!brazo.dado && brazo.quietoDesde != null && millis() - brazo.quietoDesde > 250) {
        brazo.dado = true;
        const c = muestrasComparar(), igual = Math.abs(c.A.m - c.B.m) < 1e-9;
        if (igual) selloInfo = { t: i18n.t('¡EQUILIBRADA!'), sub: i18n.t('{m} kg {a} = {m} kg {b}', { m: fmtM(c.A.m), a: i18n.t(DE[c.A.k]), b: i18n.t(DE[c.B.k]) }), t0: millis() };
        else {
            const P = c.B.m > c.A.m ? 'B' : 'A';
            selloInfo = { t: i18n.t('¡SE INCLINA HACIA {p}!', { p: P }), sub: i18n.t('mismo volumen, más masa en {p}', { p: P }), t0: millis() };
        }
        revisarComparar();
    }
}
const fmtM = (m) => m >= 10 ? fmt(m, 1).replace(/[.,]0$/, '') : fmt(m, 2).replace(/[.,]00$/, '');
function revisarComparar() {
    const c = muestrasComparar();
    const res = (i) => CAIDA[i] && (CAIDA[i].fuera ? 'agua' : CAIDA[i].res);
    retosComparar({ A: c.A, B: c.B, cmp: S.cmp, equilibrada: brazo.dado && Math.abs(c.A.m - c.B.m) < 1e-9, resA: res(0), resB: res(1) });
}

// ── Panel de estado ──────────────────────────────────────────────
let rotuloTag = '', rotuloDesde = -1e9, mensajeCache = { clave: '' };
function parte(r) {
    if (r < 0.3) return 'una parte pequeña del bloque';
    if (r < 0.5) return 'menos de la mitad del bloque';
    if (r < 0.75) return 'algo más de la mitad del bloque';
    return 'casi todo el bloque';
}
function mensaje() {
    if (S.modo === 'comparar') {
        const c = muestrasComparar(), mismo = S.A === S.B;
        if (S.cmp === 'masa') {
            const g = c.A.V > c.B.V ? 'A' : 'B', n = Math.max(c.A.V, c.B.V) / Math.min(c.A.V, c.B.V);
            return {
                tag: i18n.t('MISMA MASA'), col: THEME.cam,
                txt: mismo
                    ? i18n.t('{m} kg {a} en cada plato: la balanza queda equilibrada y las dos muestras ocupan lo mismo.', { m: fmtM(S.valor), a: i18n.t(DE[S.A]) })
                    : i18n.t('{m} kg {a} y {m} kg {b}: la balanza queda equilibrada. La muestra {g} ocupa <strong>{n} veces más</strong> porque cada litro tiene menos masa.',
                        { m: fmtM(S.valor), a: i18n.t(DE[S.A]), b: i18n.t(DE[S.B]), g, n: veces(n) }),
            };
        }
        const p = c.A.m > c.B.m ? 'A' : 'B', n = Math.max(c.A.m, c.B.m) / Math.min(c.A.m, c.B.m);
        return {
            tag: i18n.t('MISMO VOLUMEN'), col: THEME.cam,
            txt: mismo
                ? i18n.t('{v} L {a} en cada plato: misma masa, la balanza queda equilibrada.', { v: fmtV(S.valor), a: i18n.t(DE[S.A]) })
                : i18n.t('{v} L {a} y {v} L {b}: la balanza se inclina hacia {p}, que tiene <strong>{n} veces más masa</strong> porque cada litro tiene más masa.',
                    { v: fmtV(S.valor), a: i18n.t(DE[S.A]), b: i18n.t(DE[S.B]), p, n: veces(n) }),
        };
    }
    const m = muestraObjeto(), de = i18n.t(DE[m.k]), r = fmt(m.r, 2);
    if (m.k === 'agua') return { tag: i18n.t('LA REFERENCIA'), col: THEME.neutro, txt: i18n.t('Un litro de agua tiene <strong>1 kg</strong> de masa. Es la referencia: lo que tenga más masa en cada litro se hunde en ella y lo que tenga menos, flota.') };
    if (m.r < 1) return { tag: i18n.t('FLOTA'), col: THEME.flota, txt: i18n.t('Cada litro {de} tiene <strong>{r} kg</strong>, menos que un litro de agua (1 kg). Flota con {parte} bajo el agua.', { de, r, parte: i18n.t(parte(m.r)) }) };
    if (m.r > 1) return { tag: i18n.t('SE HUNDE'), col: THEME.hunde, txt: i18n.t('Cada litro {de} tiene <strong>{r} kg</strong>, más que un litro de agua (1 kg). Por eso se hunde, sea grande o pequeño el trozo.', { de, r }) };
    return { tag: i18n.t('NI FLOTA NI SE HUNDE'), col: THEME.neutro, txt: i18n.t('Cada litro de tu objeto tiene <strong>1,00 kg</strong>, lo mismo que un litro de agua. Ni flota ni se hunde: se queda quieto dentro del agua.') };
}
const veces = (n) => n >= 9.95 ? fmt(Math.round(n), 0) : fmt(n, 1).replace(/[.,]0$/, '');

function drawPanelEstado(m) {
    const { x, y, w, h, compacto } = PANEL, pad = 24, px = x + pad;
    tarjeta({ x, y, w, h }, THEME.pillBg || THEME.panelBg, 20);
    if (m.tag !== rotuloTag) { rotuloTag = m.tag; rotuloDesde = millis(); }
    fuenteJuego();
    etiquetaRotulo(m.tag, m.col, px, y + 20, compacto ? 15 : 16.5, rotuloDesde);
    const fsMsg = compacto ? 17 : 19, lead = fsMsg + 7;
    textSize(fsMsg);
    const clave = m.txt + '|' + fsMsg + '|' + w + '|' + textFont();
    if (clave !== mensajeCache.clave) {
        let lineas = partirRico(trozosRicos(m.txt), w - 2 * pad), fs = fsMsg;
        if (lineas.length > 4) { fs = fsMsg - 2; textSize(fs); lineas = partirRico(trozosRicos(m.txt), w - 2 * pad); }
        if (lineas.length > 4) { fs = fsMsg - 3.5; textSize(fs); lineas = partirRico(trozosRicos(m.txt), w - 2 * pad); }
        mensajeCache = { clave, lineas, fs };
    }
    textSize(mensajeCache.fs); noStroke(); fill(THEME.text);
    textoRico(mensajeCache.lineas.slice(0, 5), px, y + 70, mensajeCache.fs + 7);
    let dy = y + 88 + 3 * lead + 22;
    const raya = (yy) => linea(`M${px} ${yy} H${x + w - pad}`, THEME.border, 1.5);
    raya(dy);
    const dim = THEME.textDim, tit = THEME.title || THEME.text;
    if (S.modo === 'comparar') {
        const c = muestrasComparar();
        T(px, dy + 26, i18n.t('Lo que miden los aparatos'), { fs: 14, c: dim, sys: true });
        const cxs = [px, px + (compacto ? 92 : 120), px + (compacto ? 172 : 210), x + w - pad], fsT = compacto ? 15 : 17;
        ['', 'Masa', 'Volumen', 'Densidad'].forEach((t, j) => T(cxs[j], dy + 54, t && i18n.t(t), { fs: 13, a: j === 3 ? 'end' : 'start', c: dim, sys: true }));
        [['A', c.A], ['B', c.B]].forEach(([l, mu], i) => {
            const yy = dy + 84 + i * 30;
            forma(E(px + 9, yy - 5, 9, 9), { f: l === 'A' ? CF.A : CF.B, s: tinta(), sw: 2 });
            T(px + 9, yy - 1, l, { fs: 11, w: 700, a: 'middle', c: CF.ink });
            const nom = MATS[mu.k].corto || MATS[mu.k].n;
            T(px + 24, yy, i18n.t(nom), { fs: compacto ? 14.5 : 15.5, sys: true, c: THEME.text });
            T(cxs[1], yy, fmt(mu.m, 2) + ' kg', { fs: fsT, w: 600, c: S.cmp === 'masa' ? THEME.cam : tit });
            T(cxs[2], yy, fmt(mu.V, 2) + ' L', { fs: fsT, w: 600, c: S.cmp === 'volumen' ? THEME.cam : tit });
            T(cxs[3], yy, fmt(mu.r, 2) + ' kg/L', { fs: fsT, w: 600, a: 'end', c: tit });
        });
        dy += 54 + 3 * 30;
        raya(dy);
        T(px, dy + 28, i18n.t(S.cmp === 'masa' ? 'Misma masa: el menos denso ocupa más.' : 'Mismo volumen: el más denso tiene más masa.'), { fs: compacto ? 14.5 : 15.5, sys: true, c: THEME.text });
        return;
    }
    const mu = muestraObjeto();
    T(px, dy + 26, i18n.t('La densidad de la muestra'), { fs: 14, c: dim, sys: true });
    T(px, dy + 58, `ρ = m / V = ${fmt(mu.m, 2)} kg / ${fmtV(mu.V)} L`, { fs: compacto ? 17 : 19, c: THEME.text });
    const big = compacto ? 34 : 40;
    T(px, dy + 102, '= ', { fs: 20, c: THEME.text });
    const w1 = anchoT('= ', { fs: 20 });
    const num = fmt(mu.r, 2);
    T(px + w1, dy + 102, num, { fs: big, w: 600, c: tit });
    T(px + w1 + anchoT(num, { fs: big, w: 600 }) + 6, dy + 102, 'kg/L', { fs: 20, c: THEME.text });
    dy += 122;
    raya(dy);
    // masa de 1 L: el propio material frente al agua
    cubo(mu.k, px, dy + 70, 38);
    T(px + 64, dy + 42, i18n.t('1 L {de}', { de: i18n.t(DE[mu.k]) }), { fs: 14.5, c: dim, sys: true });
    T(px + 64, dy + 66, fmt(mu.r, 2) + ' kg', { fs: 20, w: 600, c: tit });
    if (mu.k !== 'agua') {
        cubo('agua', px + 196, dy + 70, 38);
        T(px + 260, dy + 42, i18n.t('1 L de agua'), { fs: 14.5, c: dim, sys: true });
        T(px + 260, dy + 66, fmt(1, 2) + ' kg', { fs: 20, w: 600, c: tit });
    }
}

// ── Escena ───────────────────────────────────────────────────────
function drawEscena() {
    TARJETAS.forEach(t => tarjeta(t));
    const cmp = S.modo === 'comparar';
    // Objeto protagonista
    push(); translate(OBJ.tx, OBJ.ty); scale(OBJ.s);
    let eCmp = 1;
    if (cmp) {
        const c = muestrasComparar(); eCmp = eComparar(c);
        balanzaBrazos({ kA: c.A.k, kB: c.B.k, VA: c.A.V, VB: c.B.V, e: eCmp, giro: brazo.giro });
    } else balanzaDigital(muestraObjeto());
    pop();
    // Cubeta con la misma muestra
    const geo = geometriaMuestras();
    const ctx = drawingContext, a0 = ctx.globalAlpha;
    const aparece = MOV_REDUCIDO ? 1 : constrain((millis() - tSoltar) / 250, 0, 1);
    const muestras = CAIDA.map((c, i) => c.fuera ? null : { k: c.k, s: geo[i].s, x: geo[i].x, yb: c.yb, l: c.l }).filter(Boolean);
    const ondas = ONDAS.map(o => { const g = geo[o.i]; return g && { edad: o.edad, cx: g.x + 0.67 * g.s, dx: g.s * PDX, w: g.s + g.s * PDX }; }).filter(Boolean);
    const yA = yAgua != null ? yAgua : nivelAgua(geo);
    ctx.globalAlpha = a0;
    cubetaConAparicion(muestras, ondas, yA, aparece);
    const soloAgua = !cmp && S.mat === 'agua', hayAgua = CAIDA.some(c => c.fuera);
    const leyenda = cmp ? (hayAgua ? 'el agua no se mete en la cubeta: es la referencia' : 'las mismas muestras A y B · cubeta con agua (1 kg/L)')
        : (soloAgua ? 'cubeta con agua (1 kg/L)' : 'la misma muestra · cubeta con agua (1 kg/L)');
    T(LEYENDA.x, LEYENDA.y, i18n.t(leyenda), { fs: ESC_MOVIL ? 13 : 14, a: 'middle', c: THEME.textDim, sys: true });
    if (!soloAgua) {
        const rt = i18n.t(ROTULO.txt), rw = ROTULO.w || anchoT(rt, { fs: 16, w: 600 }) + 40, fs = ESC_MOVIL ? 15 : 16;
        pildora(ROTULO.x - rw / 2, ROTULO.y, rw, ESC_MOVIL ? 32 : 34, THEME.pillBg || THEME.panelBg, THEME.border, 2);
        T(ROTULO.x, ROTULO.y + (ESC_MOVIL ? 21.5 : 23), rt, { fs, w: 600, a: 'middle', c: THEME.title || THEME.text });
    } else if (ESC_MOVIL) {
        T(NOTA.x, NOTA.y - 10, i18n.t('El agua es la referencia:'), { fs: 13.5, a: 'middle', c: THEME.textDim, sys: true });
        T(NOTA.x, NOTA.y + 8, i18n.t('no se mete en la cubeta.'), { fs: 13.5, a: 'middle', c: THEME.textDim, sys: true });
    } else T(NOTA.x, NOTA.y, i18n.t('El agua es la referencia: no se mete en la cubeta.'), { fs: 14, a: 'middle', c: THEME.textDim, sys: true });
    // Panel de estado y regla
    const m = mensaje();
    anunciar(m);
    drawPanelEstado(m);
    const brillo = selloInfo && millis() - selloInfo.t0 < 6000 ? selloInfo.k : null;
    let act;
    if (cmp) {
        const c = muestrasComparar();
        act = [{ k: c.A.k, r: c.A.r, col: CF.A, lab: 'A ' + fmt(c.A.r, 2) }, { k: c.B.k, r: c.B.r, col: CF.B, lab: 'B ' + fmt(c.B.r, 2) }];
    } else { const mu = muestraObjeto(); act = [{ k: mu.k, r: mu.r, col: CF.cyan, lab: fmt(mu.r, 2) }]; }
    regla(REGLA, ESC_MOVIL, act, brillo);
    // Sello del momento clave
    if (selloInfo && millis() - selloInfo.t0 < 6000) {
        const ctx2 = drawingContext, a = ctx2.globalAlpha, edad = millis() - selloInfo.t0;
        ctx2.globalAlpha = a * constrain((6000 - edad) / 500, 0, 1);
        sello(selloInfo.t, selloInfo.sub, SELLO_POS.x, SELLO_POS.y, selloInfo.t0, ESC_MOVIL);
        ctx2.globalAlpha = a;
    }
}
// Cubeta: las muestras aparecen en un cuarto de segundo al soltarlas
function cubetaConAparicion(muestras, ondas, yA, aparece) {
    const ctx = drawingContext;
    if (aparece < 1) {
        // Se pinta la cubeta sin muestras y luego con ellas, mezcladas por transparencia
        cubeta(TANQUE, { yA, muestras: [], ondas, burbujas: BURBUJAS, t: millis() / 1000, marcas: false });
        ctx.save(); ctx.globalAlpha *= aparece;
        cubeta(TANQUE, { yA, muestras, ondas, burbujas: BURBUJAS, t: millis() / 1000, marcas: true, espera: esperando, marcasIzq: !ESC_MOVIL });
        ctx.restore();
    } else cubeta(TANQUE, { yA, muestras, ondas, burbujas: BURBUJAS, t: millis() / 1000, marcas: true, espera: esperando, marcasIzq: !ESC_MOVIL });
}

// Carrusel de materiales: flechas a los lados cuando la fila no cabe entera
function iniciarCarrusel() {
    const caja = document.querySelector('.carrusel'), fila = caja.querySelector('.carril');
    const marcar = () => {
        const max = fila.scrollWidth - fila.clientWidth;
        caja.classList.toggle('hay-izq', fila.scrollLeft > 4);
        caja.classList.toggle('hay-der', fila.scrollLeft < max - 4);
    };
    caja.querySelector('.izq').addEventListener('click', () => fila.scrollBy({ left: -fila.clientWidth * 0.7 }));
    caja.querySelector('.der').addEventListener('click', () => fila.scrollBy({ left: fila.clientWidth * 0.7 }));
    fila.addEventListener('scroll', marcar, { passive: true });
    new ResizeObserver(marcar).observe(fila);
    marcar();
}
// El material elegido siempre a la vista dentro del carrusel
function verMaterialElegido() {
    const fila = document.querySelector('.carril.materiales'), b = fila && fila.querySelector('[aria-checked="true"]');
    if (!b || fila.scrollWidth <= fila.clientWidth) return;
    const x = b.offsetLeft - fila.offsetLeft, izq = fila.scrollLeft, der = izq + fila.clientWidth;
    if (x < izq + 40) fila.scrollTo({ left: x - 44 });
    else if (x + b.offsetWidth > der - 40) fila.scrollTo({ left: x + b.offsetWidth - fila.clientWidth + 44 });
}

// ── Mandos HTML ──────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
function pintarRelleno(sl) {
    const p = (sl.value - sl.min) / (sl.max - sl.min) * 100;
    sl.style.setProperty('--fill', p.toFixed(1) + '%');
}
function mostrarValores() {
    const pers = S.mat === 'pers', mu = muestraObjeto();
    document.body.classList.toggle('modo-objeto', S.modo === 'objeto');
    document.body.classList.toggle('modo-comparar', S.modo === 'comparar');
    document.body.classList.toggle('mat-pers', pers);
    const sV = $('sl-vol'), sM = $('sl-masa'), sC = $('sl-valor');
    if (pers) {
        sV.min = 10; sV.max = 2000; sV.value = Math.round(S.VPers * 100);
        sM.min = 10; sM.max = 2000; sM.value = Math.round(S.mPers * 100);
        $('min-vol').textContent = fmt(0.1, 1) + ' L'; $('max-vol').textContent = '20 L';
        $('min-masa').textContent = fmt(0.1, 1) + ' kg'; $('max-masa').textContent = '20 kg';
        $('val-masa').textContent = fmt(S.mPers, 2) + ' kg';
    } else {
        const r = MATS[S.mat].r;
        sV.min = 10; sV.max = 1000; sV.value = Math.round(S.V * 100);
        sM.min = 10; sM.max = 1000; sM.value = Math.round(S.V * 100);
        $('min-vol').textContent = fmt(0.1, 1) + ' L'; $('max-vol').textContent = '10 L';
        $('min-masa').textContent = fmt(r * 0.1, 2) + ' kg'; $('max-masa').textContent = fmt(r * 10, 1) + ' kg';
        $('val-masa').textContent = fmt(mu.m, 2) + ' kg';
    }
    $('val-vol').textContent = fmtV(mu.V) + ' L';
    sC.value = Math.round(S.valor * 10);
    $('val-valor').textContent = fmtV(S.valor) + (S.cmp === 'masa' ? ' kg' : ' L');
    $('lbl-valor').textContent = i18n.t(S.cmp === 'masa' ? 'Masa de cada uno' : 'Volumen de cada uno');
    $('min-valor').textContent = fmt(0.1, 1) + (S.cmp === 'masa' ? ' kg' : ' L');
    $('max-valor').textContent = '10' + (S.cmp === 'masa' ? ' kg' : ' L');
    $('nota-valor').textContent = i18n.t(S.cmp === 'masa' ? 'Los dos tienen exactamente la misma masa.' : 'Los dos ocupan exactamente el mismo volumen.');
    [sV, sM, sC].forEach(pintarRelleno);
    $('frase').innerHTML = frase();
    document.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.modo === S.modo)));
    document.querySelectorAll('[data-mat]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.mat === S.mat)));
    document.querySelectorAll('[data-cmp]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.cmp === S.cmp)));
    $('sel-a').value = S.A; $('sel-b').value = S.B;
    document.querySelector('.sel-mat.a .punto').style.background = MATS[S.A].c;
    document.querySelector('.sel-mat.b .punto').style.background = MATS[S.B].c;
}
function frase() {
    if (S.modo === 'comparar') return S.cmp === 'masa'
        ? `<strong>${i18n.t('Misma masa, distinto volumen.')}</strong> <em>${i18n.t('¿Por qué no ocupan lo mismo?')}</em>`
        : `<strong>${i18n.t('Mismo volumen, distinta masa.')}</strong> <em>${i18n.t('¿Hacia dónde se inclina la balanza?')}</em>`;
    return '';
}
function elegirModo(m) {
    if (m !== 'objeto' && m !== 'comparar') return;
    S.modo = m;
    rehacerComposicion();
    mostrarValores();
    soltar();
}
function elegirMaterial(k) {
    if (!MATS[k] || k === 'agua') return;
    S.mat = k;
    mostrarValores();
    verMaterialElegido();
    soltar();
    if (k === 'agua') { retosSello('agua'); selloInfo = null; }
}
function setupControles() {
    const sV = $('sl-vol'), sM = $('sl-masa'), sC = $('sl-valor');
    sV.addEventListener('input', () => {
        if (S.mat === 'pers') S.VPers = sV.value / 100; else S.V = sV.value / 100;
        mostrarValores(); actualizarMuestras();
    });
    sM.addEventListener('input', () => {
        if (S.mat === 'pers') S.mPers = sM.value / 100; else S.V = sM.value / 100;
        mostrarValores(); actualizarMuestras();
    });
    sC.addEventListener('input', () => { S.valor = sC.value / 10; mostrarValores(); actualizarMuestras(); brazo.tCambio = millis(); });
    document.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => elegirModo(b.dataset.modo)));
    document.querySelectorAll('[data-mat]').forEach(b => b.addEventListener('click', () => elegirMaterial(b.dataset.mat)));
    document.querySelectorAll('[data-cmp]').forEach(b => b.addEventListener('click', () => { S.cmp = b.dataset.cmp; mostrarValores(); soltar(); }));
    $('sel-a').addEventListener('change', (e) => { S.A = e.target.value; mostrarValores(); soltar(); });
    $('sel-b').addEventListener('change', (e) => { S.B = e.target.value; mostrarValores(); soltar(); });
    ['sel-a', 'sel-b'].forEach(id => $(id).addEventListener('change', (e) => { if (e.target.value === 'agua') retosSello('agua'); }));
    $('btn-soltar').addEventListener('click', dejarCaer);
    $('check-pantalla').addEventListener('change', (e) => {
        try {
            if (e.target.checked && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
            else if (!e.target.checked && document.fullscreenElement) document.exitFullscreen();
        } catch (err) { /* nada */ }
    });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) $('check-pantalla').checked = false; setTimeout(fitCanvas, 100); });
    // El tema elegido se recuerda en este navegador
    document.querySelectorAll('.theme-opt').forEach(b => b.addEventListener('click', () => { try { localStorage.setItem('sim-densidad-tema', b.dataset.theme); } catch (e) { /* nada */ } CACHE_CUBOS.clear(); }));
    const t = temaActual(), clave = { pizarra: 'dark', dia: 'light', marca: 'marca', contraste: 'contrast' }[t];
    document.querySelectorAll('.theme-opt').forEach(b => b.classList.toggle('active', b.dataset.theme === clave));
    // En los grupos de opciones, las flechas pasan a la opción vecina
    document.querySelectorAll('.carril[role="radiogroup"], .carril[role="tablist"]').forEach(grupo => {
        grupo.addEventListener('keydown', (e) => {
            const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
            if (!paso) return;
            e.preventDefault();
            const btns = [...grupo.querySelectorAll('button')];
            const sig = btns[(btns.indexOf(document.activeElement) + paso + btns.length) % btns.length];
            sig.focus(); sig.click();
        });
    });
    // Atajo: S (soltar otra vez). No actúa con el foco en un control.
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target.closest('button, input, select, textarea, summary, a')) return;
        if ((e.key === 's' || e.key === 'S') && !$('btn-soltar').hidden) dejarCaer();
    });
    iniciarCarrusel();
    iniciarPopover('btn-ayuda', 'panel-ayuda');
    window.addEventListener('load', fitCanvas);
    if (document.fonts) document.fonts.ready.then(() => { CACHE_CUBOS.clear(); mensajeCache.clave = ''; fitCanvas(); });
    new ResizeObserver(fitCanvas).observe(document.querySelector('.barra-sus'));
}

const ALIAS_MAT = { plastico: 'pet', 'plástico': 'pet', pet: 'pet', aluminio: 'alum', alum: 'alum', personalizado: 'pers', custom: 'pers', pers: 'pers', propio: 'pers' };
const matUrl = (v) => { const k = ALIAS_MAT[v] || v; return MATS[k] ? k : null; };
function setup() {
    calcularEscena();
    const cv = createCanvas(CV_W, CV_H);
    pixelDensity(1);
    cv.parent('canvas-container');
    cv.elt.setAttribute('role', 'img');
    cv.elt.setAttribute('aria-label', i18n.t('Simulación de la densidad: la balanza mide la masa de la muestra, la cubeta con agua muestra si flota o se hunde y la regla compara su densidad con la de otros materiales. Los mensajes de la simulación se leen en voz alta.'));
    frameRate(60);
    if (document.fonts) document.fonts.load('600 12px Fredoka');
    iniciarSelectorTema();
    setupControles();
    // Ajustes de la dirección (fichas del alumnado): ver js/parametros.js
    const num = (v) => { const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : null; };
    const q = new URLSearchParams(location.search);
    aplicarParametrosUrl({
        tema:     (v) => { const t = { simulaciencia: 'marca', marca: 'marca', claro: 'light', oscuro: 'dark', contraste: 'contrast' }[v];
                           const b = t && document.querySelector(`.theme-opt[data-theme="${t}"]`); if (b) b.click(); },
        modo:     (v) => { if (v === 'objeto' || v === 'comparar') S.modo = v; },
        material: (v) => { const k = matUrl(v); if (k && k !== 'agua') S.mat = k; },   // el agua solo está en Comparar
        comparar: (v) => { if (v === 'masa' || v === 'volumen') S.cmp = v; },
        a:        (v) => { const k = matUrl(v); if (k && k !== 'pers') S.A = k; },
        b:        (v) => { const k = matUrl(v); if (k && k !== 'pers') S.B = k; },
        valor:    (v) => { const x = num(v); if (x != null) S.valor = constrain(Math.round(x * 10) / 10, 0.1, 10); },
        retos:    (v) => { if (['1', 'si', 'sí', 'true'].includes(v)) abrirRetos(); },
    });
    // Volumen y masa dependen del material: se aplican después
    const V = num(q.get('volumen')), m = num(q.get('masa'));
    if (S.mat === 'pers') {
        if (V != null) S.VPers = constrain(Math.round(V * 100) / 100, 0.1, 20);
        if (m != null) S.mPers = constrain(Math.round(m * 100) / 100, 0.1, 20);
    } else if (V != null) S.V = constrain(Math.round(V * 10) / 10, 0.1, 10);
    else if (m != null) S.V = constrain(Math.round(m / MATS[S.mat].r * 10) / 10, 0.1, 10);
    calcularEscena(); resizeCanvas(CV_W, CV_H);
    mostrarValores();
    soltar();
    requestAnimationFrame(verMaterialElegido);
    if (S.modo === 'comparar' && (S.A === 'agua' || S.B === 'agua')) retosSello('agua');
    fitCanvas();
}
function draw() {
    vigilarRendimiento();
    actualizarTema(TEMA_PROPIO);
    clear();
    const dt = Math.min(deltaTime / 1000, 1 / 30);
    pasoCaida(dt);
    if (S.modo === 'comparar') pasoBrazo(dt);
    drawEscena();
}
