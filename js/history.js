/* ============================================================
   MAIN QUEST — history.js
   ------------------------------------------------------------
   "Tu historia": la función del PRD de mirar hacia atrás
   dentro de cinco años y decir "así fue como construí mi vida".

   Une TRES fuentes que hasta ahora vivían separadas:
   - misiones.historial → qué te propusiste cada día
   - diario             → cómo estuviste ese día
   - timeline           → qué pasó (compras, logros)

   La timeline se venía llenando sola desde la Fase 2 sin que
   nadie la viera nunca. Acá se ve.

   Se lee como una historia, no como una tabla: separadores
   por mes, el día en palabras, y ningún día vacío que te
   recuerde lo que no hiciste.
   ============================================================ */

import { escapar } from "./util.js";

let data;
let mostrando = 7;      // días visibles (estado de pantalla, no se guarda)
const PASO = 7;

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
               "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const ICONO_EVENTO = { compra: "🪙", logro: "🏆" };

/* Un YYYY-MM-DD se parte a mano: new Date("2026-07-23") lo
   interpreta como UTC y en Argentina devolvería el día
   anterior. Es la misma trampa que evita hoyISO(). */
function partes(fechaISO) {
  const [y, m, d] = fechaISO.split("-").map(Number);
  return { fecha: new Date(y, m - 1, d), anio: y, mes: m - 1, dia: d };
}

/* ------------------------------------------------------------
   Arma la lista de días con todo lo que pasó en cada uno.
   Exportada para testearse sin DOM.
   ------------------------------------------------------------ */
export function armarHistoria(datos) {
  const porFecha = new Map();

  const asegurar = (fecha) => {
    if (!porFecha.has(fecha)) {
      porFecha.set(fecha, { fecha, principal: null, secundarias: 0, energia: null, eventos: [] });
    }
    return porFecha.get(fecha);
  };

  for (const dia of datos.misiones.historial) {
    const e = asegurar(dia.fecha);
    e.principal = dia.principal || null;
    e.secundarias = (dia.secundarias || []).filter((s) => s.completada).length;
  }

  for (const entrada of datos.diario) {
    if (entrada.fecha) asegurar(entrada.fecha).energia = entrada.energia || null;
  }

  for (const ev of datos.timeline) {
    if (ev.fecha) asegurar(ev.fecha).eventos.push(ev);
  }

  // Del más reciente al más viejo: la historia se lee
  // empezando por lo último que te pasó.
  return [...porFecha.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/* ------------------------------------------------------------
   Render
   ------------------------------------------------------------ */
function tarjetaDia(d) {
  const p = partes(d.fecha);
  const cabecera = `${DIAS[p.fecha.getDay()]} ${p.dia}`;

  let cuerpo;
  if (d.principal && d.principal.completada) {
    cuerpo = `<div class="hist__mision hist__mision--hecha">
        <span class="hist__sello">完</span>
        <span>${escapar(d.principal.titulo)}</span>
      </div>`;
  } else if (d.principal) {
    // Sin sello y sin reproche: solo lo que te habías propuesto.
    cuerpo = `<div class="hist__mision">
        <span class="hist__sello hist__sello--vacio">·</span>
        <span>${escapar(d.principal.titulo)}</span>
      </div>`;
  } else {
    cuerpo = `<div class="hist__mision hist__mision--libre">Día libre</div>`;
  }

  const detalles = [];
  if (d.secundarias > 0) detalles.push(`+${d.secundarias} secundaria${d.secundarias > 1 ? "s" : ""}`);
  if (d.energia) detalles.push(`energía ${d.energia}/5`);

  const eventos = d.eventos.map((ev) =>
    `<div class="hist__evento">${ICONO_EVENTO[ev.tipo] || "✦"} ${escapar(ev.titulo)}</div>`
  ).join("");

  return `
    <article class="hist__dia">
      <div class="hist__fecha">${cabecera}</div>
      <div class="hist__cuerpo">
        ${cuerpo}
        ${detalles.length ? `<div class="hist__detalles">${detalles.join(" · ")}</div>` : ""}
        ${eventos}
      </div>
    </article>`;
}

export function renderHistoria() {
  const cont = document.getElementById("historia");
  if (!cont || !data) return;

  const dias = armarHistoria(data);

  const contador = document.getElementById("historia-contador");
  if (contador) {
    contador.textContent = dias.length === 0 ? "" : `${dias.length} día${dias.length > 1 ? "s" : ""}`;
  }

  if (dias.length === 0) {
    cont.innerHTML = `<p class="secundarias-vacio">Tu historia arranca hoy. Mañana vas a poder mirar para atrás y ver este día.</p>`;
    return;
  }

  const visibles = dias.slice(0, mostrando);
  let html = "";
  let mesActual = null;

  for (const d of visibles) {
    const p = partes(d.fecha);
    const clave = `${p.anio}-${p.mes}`;
    if (clave !== mesActual) {
      mesActual = clave;
      html += `<div class="hist__mes">${MESES[p.mes]} ${p.anio}</div>`;
    }
    html += tarjetaDia(d);
  }

  if (dias.length > mostrando) {
    const faltan = Math.min(PASO, dias.length - mostrando);
    html += `<button class="btn btn--ghost" id="btn-ver-mas">Ver ${faltan} día${faltan > 1 ? "s" : ""} más</button>`;
  }

  cont.innerHTML = html;

  // onclick directo, la regla de la casa.
  const btn = document.getElementById("btn-ver-mas");
  if (btn) btn.onclick = () => { mostrando += PASO; renderHistoria(); };
}

/* ===================== API ===================== */

export function setDatosHistoria(appData) {
  data = appData;
  mostrando = PASO;
  renderHistoria();
}

export function initHistoria(appData) {
  data = appData;
  document.addEventListener("contexto-cambiado", renderHistoria);
  renderHistoria();
}
