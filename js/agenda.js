/* ============================================================
   MAIN QUEST — agenda.js
   ------------------------------------------------------------
   Agenda hacia adelante: anotás "tal día tengo tal cosa" y el
   día que toca, la app te lo pone ADELANTE apenas abrís. No es
   un calendario que repite tu historia (eso ya lo hace el mapa
   de constancia); es una forma de no olvidarte de lo que viene.

   Honestidad de siempre: una PWA en iOS NO puede mandarte una
   notificación a una hora ni con la app cerrada. Esto no te
   avisa solo: te lo muestra cuando entrás. Por eso el aviso es
   imposible de no ver — vive arriba de todo en HOY.

   Cada evento: { id, fecha, titulo, avisado_en }
   - fecha: "YYYY-MM-DD" (día del evento)
   - avisado_en: la fecha en que ya mostraste el aviso, para no
     repetirlo el mismo día (pero sí volver a mostrarlo si el
     evento es hoy y todavía no lo viste hoy).
   ============================================================ */

import { save } from "./store.js";
import { hoyISO, escapar, diasHasta } from "./util.js";
import { abrirHoja } from "./ui.js";

let data;

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic"];

function agendaArr() {
  if (!Array.isArray(data.contexto.agenda)) data.contexto.agenda = [];
  return data.contexto.agenda;
}

/* ------------------------------------------------------------
   Los eventos de HOY que todavía no avisaste hoy. Exportado
   para testear. Recibe la fecha de hoy como ISO.
   ------------------------------------------------------------ */
export function eventosDeHoy(datos, hoy = hoyISO()) {
  const arr = datos.contexto.agenda || [];
  return arr.filter((e) => e.fecha === hoy && e.avisado_en !== hoy);
}

/* Próximos eventos (de hoy en adelante), ordenados. */
export function proximosEventos(datos, hoy = hoyISO()) {
  return (datos.contexto.agenda || [])
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ------------------------------------------------------------
   CRUD
   ------------------------------------------------------------ */
export function agregarEvento(datos, { fecha, titulo }) {
  const t = (titulo || "").trim();
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) return false;
  if (!Array.isArray(datos.contexto.agenda)) datos.contexto.agenda = [];
  datos.contexto.agenda.push({
    id: "e" + Date.now() + Math.floor(Math.random() * 1000),
    fecha, titulo: t, avisado_en: null
  });
  save(datos);
  return true;
}

export function borrarEvento(datos, id) {
  datos.contexto.agenda = (datos.contexto.agenda || []).filter((e) => e.id !== id);
  save(datos);
}

/* Marca como avisados los eventos de hoy (para no repetir el
   aviso el mismo día). Devuelve true si marcó alguno. */
export function marcarAvisados(datos, hoy = hoyISO()) {
  let marco = false;
  for (const e of datos.contexto.agenda || []) {
    if (e.fecha === hoy && e.avisado_en !== hoy) { e.avisado_en = hoy; marco = true; }
  }
  if (marco) save(datos);
  return marco;
}

/* ============================================================
   EL AVISO EN HOY: aparece arriba de todo si hay algo para hoy.
   Lo llama app.js al entrar y al volver a la app.
   ============================================================ */
export function renderAvisoAgenda() {
  const cont = document.getElementById("aviso-agenda");
  if (!cont || !data) return;

  const hoy = eventosDeHoy(data);
  if (hoy.length === 0) { cont.innerHTML = ""; cont.hidden = true; return; }

  cont.hidden = false;
  cont.innerHTML = `
    <div class="agenda-aviso">
      <div class="agenda-aviso__cabecera">
        <span class="agenda-aviso__tag">Hoy en tu agenda</span>
        <button type="button" class="agenda-aviso__ok" id="agenda-aviso-ok">Entendido</button>
      </div>
      <ul class="agenda-aviso__lista">
        ${hoy.map((e) => `<li>${escapar(e.titulo)}</li>`).join("")}
      </ul>
    </div>`;

  const ok = document.getElementById("agenda-aviso-ok");
  if (ok) ok.onclick = () => {
    marcarAvisados(data);   // no repetir hoy
    renderAvisoAgenda();    // se oculta
  };
}

/* ============================================================
   LA VISTA DE AGENDA (en VOS): próximos eventos + alta.
   ============================================================ */
export function renderAgenda() {
  const cont = document.getElementById("agenda-panel");
  if (!cont || !data) return;

  const prox = proximosEventos(data);

  const lista = prox.length === 0
    ? `<p class="agenda-vacia">Sin nada agendado. Anotá lo que viene —un parcial, una entrega, un cumple— y te lo recuerdo el día que toque, apenas abras la app.</p>`
    : prox.map((e) => {
        const dias = diasHasta(e.fecha);
        const cuando = dias === 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`;
        const [y, m, d] = e.fecha.split("-").map(Number);
        return `
          <div class="agenda-item">
            <div class="agenda-item__fecha">
              <span class="agenda-item__dia">${d}</span>
              <span class="agenda-item__mes">${MES_CORTO[m - 1]}</span>
            </div>
            <div class="agenda-item__info">
              <span class="agenda-item__titulo">${escapar(e.titulo)}</span>
              <span class="agenda-item__cuando">${cuando}</span>
            </div>
            <button type="button" class="agenda-item__borrar" data-borrar="${e.id}" aria-label="Borrar">✕</button>
          </div>`;
      }).join("");

  cont.innerHTML = `
    ${lista}
    <button type="button" class="btn btn--ghost" id="agenda-nuevo">+ Agendar algo</button>`;

  const nuevo = document.getElementById("agenda-nuevo");
  if (nuevo) nuevo.onclick = abrirAltaEvento;

  for (const b of cont.querySelectorAll("[data-borrar]")) {
    b.onclick = () => { borrarEvento(data, b.dataset.borrar); renderAgenda(); };
  }
}

/* Alta de un evento, dentro de una hoja deslizable. */
function abrirAltaEvento() {
  const hoy = hoyISO();
  const html = `
      <div class="config-item">
        <label class="config-label" for="ev-titulo">¿Qué es?</label>
        <input type="text" id="ev-titulo" class="campo" maxlength="60"
               placeholder="Ej: Parcial de Anatomía" enterkeyhint="done">
      </div>
      <div class="config-item">
        <label class="config-label" for="ev-fecha">¿Qué día?</label>
        <input type="date" id="ev-fecha" class="campo" value="${hoy}" min="${hoy}">
      </div>
      <button type="button" class="btn" id="ev-guardar">Agendar</button>`;

  abrirHoja("Agendar algo", html, (cuerpo) => {
    cuerpo.querySelector("#ev-guardar").onclick = () => {
      const titulo = cuerpo.querySelector("#ev-titulo").value;
      const fecha = cuerpo.querySelector("#ev-fecha").value;
      if (agregarEvento(data, { fecha, titulo })) {
        renderAgenda();
        renderAvisoAgenda(); // por si agendó algo para hoy
        document.querySelector(".hoja-fondo .hoja__cerrar")?.click();
      }
    };
  });
}

/* ===================== API ===================== */

export function setDatosAgenda(appData) {
  data = appData;
  renderAgenda();
  renderAvisoAgenda();
}

export function initAgenda(appData) {
  data = appData;
  renderAgenda();
  renderAvisoAgenda();
}
