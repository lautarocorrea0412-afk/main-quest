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
import { ganarMonedas } from "./economy.js";
import { contextoActual } from "./engine.js";

let data;

/* ===================== PREMIOS ===================== */
const CHICO = 50;
const MEDIO = 150;
const GRANDE = 400;

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

/* ============================================================
   LOS LOGROS
   ------------------------------------------------------------
   Para agregar uno nuevo: sumar una entrada acá. Nada más.
   ============================================================ */
export const LOGROS = [

  /* ---------- Automáticos: el camino ---------- */
  { id: "primera",     icono: "⚔️", nombre: "El primer paso",
    desc: "Cumplir tu primera misión principal",
    premio: CHICO, cond: () => principalesCumplidas() >= 1 },

  { id: "racha3",      icono: "🔥", nombre: "Tres seguidos",
    desc: "Racha de 3 días",
    premio: CHICO, cond: () => racha() >= 3 },

  { id: "racha7",      icono: "🔥", nombre: "Semana completa",
    desc: "Racha de 7 días",
    premio: MEDIO, cond: () => racha() >= 7 },

  { id: "racha30",     icono: "🔥", nombre: "Un mes sin fallar",
    desc: "Racha de 30 días",
    premio: GRANDE, cond: () => racha() >= 30 },

  { id: "mis50",       icono: "📜", nombre: "Cincuenta misiones",
    desc: "50 misiones principales cumplidas",
    premio: MEDIO, cond: () => principalesCumplidas() >= 50 },

  { id: "mis365",      icono: "🏆", nombre: "Un año de misiones",
    desc: "365 misiones principales cumplidas",
    premio: GRANDE, cond: () => principalesCumplidas() >= 365 },

  { id: "nivel5",      icono: "⭐", nombre: "Especialista",
    desc: "Llegar a nivel 5 en algún árbol",
    premio: MEDIO, cond: () => nivelMaximo() >= 5 },

  { id: "nivel10",     icono: "🌟", nombre: "Maestría",
    desc: "Llegar a nivel 10 en algún árbol",
    premio: GRANDE, cond: () => nivelMaximo() >= 10 },

  { id: "equilibrio",  icono: "⚖️", nombre: "Equilibrio",
    desc: "Todos los árboles en nivel 2 o más",
    premio: GRANDE,
    cond: () => Object.values(data.arboles).every((a) => a.nivel >= 2) },

  { id: "diario7",     icono: "📓", nombre: "Siete noches",
    desc: "Cerrar el día 7 veces",
    premio: CHICO, cond: () => data.diario.length >= 7 },

  { id: "decorador",   icono: "🛋️", nombre: "Tomando forma",
    desc: "Desbloquear 5 cosas para tu cuarto",
    premio: MEDIO, cond: () => data.economia.inventario.length >= 5 },

  { id: "hogar",       icono: "🏠", nombre: "Tu hogar",
    desc: "Desbloquear todo el cuarto",
    premio: GRANDE, cond: () => data.economia.inventario.length >= 14 },

  { id: "anio",        icono: "🎂", nombre: "Un año juntos",
    desc: "365 días desde que empezaste",
    premio: GRANDE, cond: () => diasDesdeElInicio() >= 365 },

  /* ---------- Manuales: la vida real ---------- */
  { id: "materia",     icono: "🎓", nombre: "Materia aprobada",
    desc: "Aprobar una materia de Kinesiología",
    premio: GRANDE, manual: true },

  { id: "cliente",     icono: "🤝", nombre: "Primer cliente",
    desc: "Conseguir tu primer cliente de edición",
    premio: GRANDE, manual: true },

  { id: "dolares",     icono: "💵", nombre: "Primer ingreso en dólares",
    desc: "Cobrar tu primer trabajo en USD",
    premio: GRANDE, manual: true },

  { id: "horas100",    icono: "🎬", nombre: "100 horas en Premiere",
    desc: "Cien horas de edición acumuladas",
    premio: GRANDE, manual: true },

  { id: "stream",      icono: "🎥", nombre: "Primer stream",
    desc: "Hacer tu primera transmisión",
    premio: MEDIO, manual: true },

  { id: "japon",       icono: "⛩️", nombre: "De vuelta en Japón",
    desc: "Volver a pisar Japón",
    premio: GRANDE, manual: true }
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

/* ------------------------------------------------------------
   Celebración: un cartel que baja desde arriba.
   Si se desbloquean varios de una, se encolan.
   ------------------------------------------------------------ */
const cola = [];
let mostrando = false;

function mostrarCelebracion(logro) {
  cola.push(logro);
  if (!mostrando) siguienteCelebracion();
}

function siguienteCelebracion() {
  const logro = cola.shift();
  if (!logro) { mostrando = false; return; }
  mostrando = true;

  const el = document.createElement("div");
  el.className = "celebracion";
  el.innerHTML = `
    <span class="celebracion__icono">${logro.icono}</span>
    <span class="celebracion__texto">
      <strong>${escapar(logro.nombre)}</strong>
      <em>+${logro.premio} 🪙</em>
    </span>`;
  document.body.appendChild(el);

  setTimeout(() => {
    el.classList.add("saliendo");
    setTimeout(() => { el.remove(); siguienteCelebracion(); }, 400);
  }, 2600);
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
        </div>`;
    }
    return `
      <div class="logro">
        <span class="logro__icono logro__icono--gris">${l.icono}</span>
        <span class="logro__info">
          <strong>${escapar(l.nombre)}</strong>
          <span class="logro__desc">${escapar(l.desc)}</span>
        </span>
        ${l.manual
          ? `<button class="btn-marcar" data-action="marcar-logro" data-id="${l.id}">Lo hice</button>`
          : `<span class="logro__premio">${l.premio} 🪙</span>`}
      </div>`;
  }).join("");
}

function accion(e) {
  const btn = e.target.closest('[data-action="marcar-logro"]');
  if (!btn) return;

  const logro = LOGROS.find((l) => l.id === btn.dataset.id);
  if (!logro) return;

  // Un logro de vida real no se deshace: vale confirmarlo.
  if (!confirm(`¿Confirmás "${logro.nombre}"? Queda registrado con la fecha de hoy.`)) return;

  desbloquear(logro);
  renderLogros();
}

/* ===================== API ===================== */

export function setDatosLogros(appData) {
  data = appData;
  renderLogros();
}

export function initLogros(appData) {
  data = appData;
  document.getElementById("view-progreso").addEventListener("click", accion);

  // Al abrir: verificación retroactiva SIN celebrar, para no
  // tirarte diez carteles juntos la primera vez.
  verificarLogros({ celebrar: false });
  renderLogros();

  // De acá en más, cada cambio de contexto sí celebra.
  document.addEventListener("contexto-cambiado", () => verificarLogros());
}
