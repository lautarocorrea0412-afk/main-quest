/* ============================================================
   MAIN QUEST — achievements.js
   ------------------------------------------------------------
   Los logros (sección 12 del PRD). Dos tipos:

   AUTOMÁTICOS: la app los detecta sola mirando tus datos
   (rachas, niveles, misiones acumuladas, cuarto completo).

   MANUALES: los marcás vos, porque la app no tiene forma de
   saberlos — tu primer cliente, tu primer ingreso en dólares,
   aprobar una materia, volver a Japón. Estos son los que de
   verdad importan: los otros miden la app, estos miden tu vida.

   Se verifican RETROACTIVAMENTE: al abrir, se revisa todo el
   historial. Si agregamos un logro nuevo dentro de dos años y
   ya lo cumpliste, se desbloquea igual.
   ============================================================ */

import { save } from "./store.js";
import { hoyISO, diasHasta, escapar } from "./util.js";
import { ganarMonedas, quitarMonedas } from "./economy.js";
import { contextoActual } from "./engine.js";
import { mostrarCartel } from "./ui.js";

let data;

/* ===================== PREMIOS =====================
   Curva por dificultad real, no tres escalones planos.
   El techo es De vuelta en Japón (1500): el logro más
   grande de la app es el objetivo más grande de la vida. */

/* ------------------------------------------------------------
   Helpers de conteo (miran tus datos reales).
   ------------------------------------------------------------ */
function principalesCumplidas() {
  let n = 0;
  for (const dia of data.misiones.historial) {
    if (dia.principal && dia.principal.completada) n += 1;
  }
  const hoy = data.misiones.hoy;
  if (hoy && hoy.principal && hoy.principal.completada) n += 1;
  return n;
}

function nivelMaximo() {
  return Math.max(...Object.values(data.arboles).map((a) => a.nivel));
}

function diasDesdeElInicio() {
  if (!data.perfil.creado_en) return 0;
  const inicio = data.perfil.creado_en.slice(0, 10);
  return Math.abs(diasHasta(inicio));
}

function racha() {
  try { return contextoActual().racha; } catch { return 0; }
}

/* Nivel de avance hacia un logro contable: { actual, meta } */

/* ============================================================
   LOS LOGROS
   ------------------------------------------------------------
   Para agregar uno nuevo: sumar una entrada acá. Nada más.
   ============================================================ */
export const LOGROS = [

  /* ---------- Automáticos: el camino ---------- */
  { id: "primera",     icono: "⚔️", nombre: "El primer paso",
    desc: "Cumplir tu primera misión principal",
    premio: 40, cond: () => principalesCumplidas() >= 1,
    progreso: () => ({ actual: principalesCumplidas(), meta: 1 }) },

  { id: "racha3",      icono: "🔥", nombre: "Tres seguidos",
    desc: "Racha de 3 días",
    premio: 60, cond: () => racha() >= 3,
    progreso: () => ({ actual: racha(), meta: 3 }) },

  { id: "racha7",      icono: "🔥", nombre: "Semana completa",
    desc: "Racha de 7 días",
    premio: 150, cond: () => racha() >= 7,
    progreso: () => ({ actual: racha(), meta: 7 }) },

  { id: "racha30",     icono: "🔥", nombre: "Un mes sin fallar",
    desc: "Racha de 30 días",
    premio: 500, cond: () => racha() >= 30,
    progreso: () => ({ actual: racha(), meta: 30 }) },

  { id: "mis50",       icono: "📜", nombre: "Cincuenta misiones",
    desc: "50 misiones principales cumplidas",
    premio: 250, cond: () => principalesCumplidas() >= 50,
    progreso: () => ({ actual: principalesCumplidas(), meta: 50 }) },

  { id: "mis365",      icono: "🏆", nombre: "Un año de misiones",
    desc: "365 misiones principales cumplidas",
    premio: 1200, cond: () => principalesCumplidas() >= 365,
    progreso: () => ({ actual: principalesCumplidas(), meta: 365 }) },

  { id: "nivel5",      icono: "⭐", nombre: "Especialista",
    desc: "Llegar a nivel 5 en algún árbol",
    premio: 200, cond: () => nivelMaximo() >= 5,
    progreso: () => ({ actual: nivelMaximo(), meta: 5 }) },

  { id: "nivel10",     icono: "🌟", nombre: "Maestría",
    desc: "Llegar a nivel 10 en algún árbol",
    premio: 800, cond: () => nivelMaximo() >= 10,
    progreso: () => ({ actual: nivelMaximo(), meta: 10 }) },

  { id: "equilibrio",  icono: "⚖️", nombre: "Equilibrio",
    desc: "Todos los árboles en nivel 2 o más",
    premio: 600,
    cond: () => Object.values(data.arboles).every((a) => a.nivel >= 2),
    progreso: () => ({ actual: Object.values(data.arboles).filter((a) => a.nivel >= 2).length, meta: 6 }) },

  { id: "diario7",     icono: "📓", nombre: "Siete noches",
    desc: "Cerrar el día 7 veces",
    premio: 80, cond: () => data.diario.length >= 7,
    progreso: () => ({ actual: data.diario.length, meta: 7 }) },

  { id: "decorador",   icono: "🛋️", nombre: "Tomando forma",
    desc: "Desbloquear 5 cosas para tu cuarto",
    premio: 150, cond: () => data.economia.inventario.length >= 5,
    progreso: () => ({ actual: data.economia.inventario.length, meta: 5 }) },

  { id: "hogar",       icono: "🏠", nombre: "Tu hogar",
    desc: "Desbloquear todo el cuarto",
    premio: 700, cond: () => data.economia.inventario.length >= 14,
    progreso: () => ({ actual: data.economia.inventario.length, meta: 14 }) },

  { id: "anio",        icono: "🎂", nombre: "Un año juntos",
    desc: "365 días desde que empezaste",
    premio: 1000, cond: () => diasDesdeElInicio() >= 365,
    progreso: () => ({ actual: diasDesdeElInicio(), meta: 365 }) },

  /* ---------- Manuales: la vida real ---------- */
  { id: "materia",     icono: "🎓", nombre: "Materia aprobada",
    desc: "Aprobar una materia de Kinesiología",
    premio: 500, manual: true },

  { id: "cliente",     icono: "🤝", nombre: "Primer cliente",
    desc: "Conseguir tu primer cliente de edición",
    premio: 800, manual: true },

  { id: "dolares",     icono: "💵", nombre: "Primer ingreso en dólares",
    desc: "Cobrar tu primer trabajo en USD",
    premio: 800, manual: true },

  { id: "horas100",    icono: "🎬", nombre: "100 horas en Premiere",
    desc: "Cien horas de edición acumuladas",
    premio: 600, manual: true },

  { id: "stream",      icono: "🎥", nombre: "Primer stream",
    desc: "Hacer tu primera transmisión",
    premio: 300, manual: true },

  { id: "japon",       icono: "⛩️", nombre: "De vuelta en Japón",
    desc: "Volver a pisar Japón",
    premio: 1500, manual: true }
];

/* ------------------------------------------------------------
   ¿Ya lo tenés?
   ------------------------------------------------------------ */
function desbloqueado(id) {
  return data.logros.some((l) => l.id === id);
}

/* ------------------------------------------------------------
   Desbloquear: guarda, paga el premio y lo manda a la timeline.
   ------------------------------------------------------------ */
function desbloquear(logro, celebrar = true) {
  if (desbloqueado(logro.id)) return;

  data.logros.push({ id: logro.id, fecha_desbloqueo: hoyISO() });
  data.timeline.push({
    fecha: hoyISO(),
    tipo: "logro",
    titulo: `Logro: ${logro.nombre}`
  });
  save(data);
  ganarMonedas(logro.premio);

  if (celebrar) mostrarCelebracion(logro);
}

/* ------------------------------------------------------------
   Verificación retroactiva de los automáticos.
   Se corre al abrir la app y cada vez que cambia el contexto.
   ------------------------------------------------------------ */
export function verificarLogros({ celebrar = true } = {}) {
  if (!data) return;
  let hubo = false;

  for (const logro of LOGROS) {
    if (logro.manual || desbloqueado(logro.id)) continue;
    let cumple = false;
    try { cumple = logro.cond(); } catch { cumple = false; }
    if (cumple) {
      desbloquear(logro, celebrar);
      hubo = true;
    }
  }

  if (hubo) renderLogros();
}

/* La celebración vive en ui.js: es el mismo cartel que usan
   las subidas de nivel. */
function mostrarCelebracion(logro) {
  mostrarCartel(logro.icono, `Logro: ${logro.nombre}`, `+${logro.premio} 🪙`);
}

/* ------------------------------------------------------------
   Render en la pestaña Progreso.
   Los bloqueados se ven, con su condición a la vista.
   ------------------------------------------------------------ */
export function renderLogros() {
  const cont = document.getElementById("logros");
  if (!cont || !data) return;

  const contador = document.getElementById("logros-contador");
  if (contador) {
    contador.textContent = `${data.logros.length} de ${LOGROS.length}`;
  }

  cont.innerHTML = LOGROS.map((l) => {
    const yaEsta = data.logros.find((x) => x.id === l.id);
    if (yaEsta) {
      return `
        <div class="logro logro--hecho">
          <span class="logro__icono">${l.icono}</span>
          <span class="logro__info">
            <strong>${escapar(l.nombre)}</strong>
            <span class="logro__fecha">${yaEsta.fecha_desbloqueo}</span>
          </span>
          ${l.manual ? `<button class="deshacer deshacer--logro" data-deshacer="${l.id}">deshacer</button>` : ""}
        </div>`;
    }
    /* Bloqueado: si el logro es contable, muestra el camino
       recorrido. "3/7 días" motiva; "bloqueado" solo informa. */
    let progresoHTML = "";
    if (l.progreso) {
      try {
        const p = l.progreso();
        const actual = Math.min(p.actual, p.meta);
        const pct = Math.round((actual / p.meta) * 100);
        progresoHTML = `
          <span class="logro__prog">
            <span class="barra barra--mini"><span class="barra__fill" style="width:${pct}%"></span></span>
            <span class="logro__prog-num">${actual}/${p.meta}</span>
          </span>`;
      } catch { /* sin datos todavía: sin barra */ }
    }
    return `
      <div class="logro">
        <span class="logro__icono logro__icono--gris">${l.icono}</span>
        <span class="logro__info">
          <strong>${escapar(l.nombre)}</strong>
          <span class="logro__desc">${escapar(l.desc)}</span>
          ${progresoHTML}
        </span>
        ${l.manual
          ? `<button class="btn-marcar" data-marcar="${l.id}">Lo hice</button>`
          : `<span class="logro__premio">${l.premio} 🪙</span>`}
      </div>`;
  }).join("");

  /* onclick DIRECTO en cada botón, sin delegación: es la
     regla de la casa desde que Safari nos comió dos entregas. */
  for (const btn of cont.querySelectorAll("[data-marcar]")) {
    btn.onclick = () => {
      const logro = LOGROS.find((l) => l.id === btn.dataset.marcar);
      if (!logro) return;
      if (!confirm(`¿Confirmás "${logro.nombre}"? Queda registrado con la fecha de hoy y suma ${logro.premio} 🪙.`)) return;
      marcarLogroManual(logro.id);
    };
  }
  for (const btn of cont.querySelectorAll("[data-deshacer]")) {
    btn.onclick = () => {
      const logro = LOGROS.find((l) => l.id === btn.dataset.deshacer);
      if (!logro) return;
      if (!confirm(`¿Deshacer "${logro.nombre}"? Se devuelven las ${logro.premio} 🪙 y se borra de tu historia.`)) return;
      deshacerLogro(logro.id);
    };
  }
}

/* Marcar un logro manual. Exportada para poder testearla;
   la confirmación con el usuario vive en el handler de UI. */
export function marcarLogroManual(id) {
  const logro = LOGROS.find((l) => l.id === id && l.manual);
  if (!logro) return false;
  desbloquear(logro);
  renderLogros();
  return true;
}

/* Deshacer un logro manual: lo saca del registro, devuelve
   las monedas y borra su rastro de la timeline. Solo para
   manuales — los automáticos se recalcularían solos y
   volverían a aparecer, así que deshacerlos sería mentirse. */
export function deshacerLogro(id) {
  const logro = LOGROS.find((l) => l.id === id && l.manual);
  if (!logro || !desbloqueado(id)) return false;

  data.logros = data.logros.filter((l) => l.id !== id);
  const idx = data.timeline.findLastIndex(
    (t) => t.tipo === "logro" && t.titulo === `Logro: ${logro.nombre}`
  );
  if (idx >= 0) data.timeline.splice(idx, 1);

  save(data);
  quitarMonedas(logro.premio);
  renderLogros();
  return true;
}

/* ===================== API ===================== */

export function setDatosLogros(appData) {
  data = appData;
  renderLogros();
}

export function initLogros(appData) {
  data = appData;

  // Al abrir: verificación retroactiva SIN celebrar, para no
  // tirarte diez carteles juntos la primera vez.
  verificarLogros({ celebrar: false });
  renderLogros();

  // De acá en más, cada cambio de contexto sí celebra.
  document.addEventListener("contexto-cambiado", () => verificarLogros());
}
