// ═══════════════════════════════════════════════════════════════════
//  RETOS Y ÁLBUM «¿FLOTA O SE HUNDE?» (opcionales)
//
//  Ocultos por defecto: el botón «★ Retos» los despliega (o ?retos=1 en la
//  dirección). Lo conseguido se guarda en este navegador con localStorage
//  (sin cookies y sin enviar nada a ningún sitio). «Borrar lo conseguido»
//  lo vacía. La escena avisa con retosSello(), retosObjeto() y
//  retosComparar() cuando una muestra se queda quieta en la cubeta.
// ═══════════════════════════════════════════════════════════════════

const RETOS_CLAVE = 'simulaciencia-densidad-retos';

const RETOS = [
    { id: 'flotan', n: 3, txt: 'Encuentra tres materiales que floten en agua' },
    { id: 'hierro', n: 3, txt: 'Prueba el hierro con tres tamaños: ¿cambia su densidad?' },
    { id: 'neutro', n: 1, txt: 'Fabrica un objeto propio que ni flote ni se hunda' },
    { id: 'equilibrio', n: 1, txt: 'Equilibra la balanza con corcho en un plato y plomo en el otro' },
    { id: 'grande', n: 1, txt: 'Haz que el objeto grande flote y el pequeño se hunda' },
];
const ALBUM = ['corcho', 'madera', 'hielo', 'agua', 'pet', 'alum', 'hierro', 'cobre', 'plomo'];

const ALMACEN = crearAlmacen(RETOS_CLAVE, () => ({ sellos: {}, flotan: [], hierro: [], hechos: {} }));   // js/escena-comun.js
let retosDatos = ALMACEN.leer();
['flotan', 'hierro'].forEach(k => { if (!Array.isArray(retosDatos[k])) retosDatos[k] = []; });
if (!retosDatos.sellos) retosDatos.sellos = {};
if (!retosDatos.hechos) retosDatos.hechos = {};
let selloNuevo = null;

function progreso(r) {
    if (r.id === 'flotan') return Math.min(1, retosDatos.flotan.length / 3);
    if (r.id === 'hierro') return Math.min(1, retosDatos.hierro.length / 3);
    return retosDatos.hechos[r.id] ? 1 : 0;
}
function guardarRetos() { ALMACEN.guardar(retosDatos); pintarRetos(); }
function retosSello(k) {
    if (!ALBUM.includes(k) || retosDatos.sellos[k]) return;
    retosDatos.sellos[k] = true; selloNuevo = k;
    guardarRetos();
}
function retosObjeto(d) {
    let cambio = false;
    if (d.k !== 'pers' && d.res === 'flota' && !retosDatos.flotan.includes(d.k)) { retosDatos.flotan.push(d.k); cambio = true; }
    if (d.k === 'hierro') {
        const v = Math.round(d.V * 10) / 10;
        if (!retosDatos.hierro.includes(v)) { retosDatos.hierro.push(v); cambio = true; }
    }
    if (d.k === 'pers' && d.res === 'neutro' && !retosDatos.hechos.neutro) { retosDatos.hechos.neutro = true; cambio = true; }
    if (cambio) guardarRetos();
}
function retosComparar(d) {
    let cambio = false;
    const par = [d.A.k, d.B.k].sort().join('-');
    if (d.cmp === 'masa' && d.equilibrada && par === 'corcho-plomo' && !retosDatos.hechos.equilibrio) { retosDatos.hechos.equilibrio = true; cambio = true; }
    [[d.A, d.resA], [d.B, d.resB]].forEach(([mu, res]) => {
        if (res === 'flota' && mu.k !== 'pers' && !retosDatos.flotan.includes(mu.k)) { retosDatos.flotan.push(mu.k); cambio = true; }
    });
    if (d.resA && d.resB && d.A.V !== d.B.V) {
        const [g, p] = d.A.V > d.B.V ? [d.resA, d.resB] : [d.resB, d.resA];
        if (g === 'flota' && p === 'hunde' && !retosDatos.hechos.grande) { retosDatos.hechos.grande = true; cambio = true; }
    }
    if (cambio) guardarRetos();
}

function pintarRetos() {
    const lista = document.getElementById('lista-retos');
    if (!lista) return;
    const modo = document.getElementById('retos-modo');
    if (modo) modo.textContent = '· ' + i18n.t('Densidad');
    lista.innerHTML = '';
    RETOS.forEach(r => {
        const p = progreso(r), hecho = p >= 1;
        const txt = i18n.t(r.txt);
        const li = document.createElement('li');
        li.className = hecho ? 'hecho' : '';
        li.style.setProperty('--progreso', String(p));
        const estrellas = r.n > 1 ? '★'.repeat(Math.round(p * r.n)) + '☆'.repeat(r.n - Math.round(p * r.n)) : (hecho ? '★' : '☆');
        li.innerHTML = `<span class="anillo" aria-hidden="true"></span><span class="reto-txt"></span><span class="reto-estrella" aria-hidden="true">${estrellas}</span>`;
        li.querySelector('.reto-txt').textContent = txt;
        li.setAttribute('aria-label', txt + ' · ' + (hecho ? i18n.t('conseguido') : r.n > 1 ? `${Math.round(p * r.n)} / ${r.n}` : i18n.t('pendiente')));
        lista.appendChild(li);
    });
    // Álbum en miniatura: un sello por material, con ↑ (flota), ↓ (se hunde) o = (el agua)
    const mini = document.getElementById('album-mini');
    mini.innerHTML = '';
    let n = 0;
    ALBUM.forEach(k => {
        const ok = !!retosDatos.sellos[k];
        if (ok) n++;
        const el = document.createElement('span');
        el.className = 'sello' + (ok ? ' ganado' : '') + (k === selloNuevo ? ' nuevo' : '');
        el.style.setProperty('--col', MATS[k].c);
        el.textContent = ok ? flecha(k) : '?';
        el.title = i18n.t(MATS[k].n) + (ok ? ' · ' + i18n.t(dice(k)) : ' · ' + i18n.t('pendiente'));
        mini.appendChild(el);
    });
    document.getElementById('album-cuenta').textContent = `${n} / ${ALBUM.length}`;
    const nota = document.getElementById('nota-album');
    if (nota) nota.textContent = selloNuevo
        ? i18n.t('Sello nuevo: {m}, {d}. Cada material se gana al meterlo en la cubeta.', { m: i18n.t(MATS[selloNuevo].n), d: i18n.t(dice(selloNuevo)) })
        : i18n.t('Cada material se gana al meterlo en la cubeta.');
}
const flecha = (k) => MATS[k].r < 1 ? '↑' : MATS[k].r > 1 ? '↓' : '=';
const dice = (k) => MATS[k].r < 1 ? 'flota' : MATS[k].r > 1 ? 'se hunde' : 'la referencia';

function pintarAlbum() {
    const tabla = document.getElementById('album-tabla');
    let h = '<div class="mat-fila">';
    ALBUM.forEach(k => {
        const ok = !!retosDatos.sellos[k];
        h += `<div class="mat-celda"><span class="sello grande${ok ? ' ganado' : ''}" style="--col:${MATS[k].c}">${ok ? flecha(k) : '?'}</span>` +
             `<strong>${i18n.t(MATS[k].n)}</strong><small>${ok ? i18n.num(MATS[k].r, 2) + ' kg/L · ' + i18n.t(dice(k)) : i18n.t('pendiente')}</small></div>`;
    });
    tabla.innerHTML = h + '</div>';
}

document.addEventListener('DOMContentLoaded', () => iniciarPanelRetos({
    pintar: pintarRetos,
    pintarAlbum,
    alBorrar: () => { retosDatos = ALMACEN.vacio(); selloNuevo = null; pintarRetos(); },
}, ALMACEN));
