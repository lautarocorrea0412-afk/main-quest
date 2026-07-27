/* ============================================================
   MAIN QUEST — vida.js
   ------------------------------------------------------------
   El registro de tu vida real de edición: cada trabajo que
   cobrás, cada cliente, cada hora de Premiere. El campo
   ingresos_edicion existía vacío desde la Fase 0; esto lo
   llena de sentido.

   Por qué importa: dos de los objetivos grandes de Lautaro
   son vivir de la edición (~USD 3000/mes) y volver a Japón.
   Registrar el trabajo real convierte esos objetivos en algo
   que la app puede ver, celebrar y proyectar — y de paso
   alimenta el motor (mensajes) y Tu leyenda.

   Cada registro: { fecha, monto_usd, cliente, horas }.
   monto y horas son opcionales por separado (podés anotar
   solo horas de práctica, o solo un cobro).
   ============================================================ */

import { save } from "./store.js";
import { hoyISO, escapar } from "./util.js";
import { abrirHoja } from "./ui.js";

let data;

/* ------------------------------------------------------------
   Resumen del trabajo de edición. Exportado para testear.
   ------------------------------------------------------------ */
export function resumenVida(datos) {
  const regs = datos.contexto.ingresos_edicion || [];
  const totalUSD = regs.reduce((a, r) => a + (r.monto_usd || 0), 0);
  const totalHoras = regs.reduce((a, r) => a + (r.horas || 0), 0);
  const clientes = new Set(regs.filter((r) => r.cliente).map((r) => r.cliente.trim().toLowerCase()));

  // Ingreso del mes en curso (para el pulso hacia los 3000/mes).
  const ahora = new Date();
  const claveMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
  const delMes = regs
    .filter((r) => (r.fecha || "").slice(0, 7) === claveMes)
    .reduce((a, r) => a + (r.monto_usd || 0), 0);

  return {
    totalUSD,
    totalHoras,
    clientes: clientes.size,
    trabajos: regs.length,
    delMes
  };
}

/* Registrar un trabajo. monto y horas pueden ser 0/ausentes,
   pero al menos uno de los dos debe tener valor. Exportado. */
export function registrarTrabajo(datos, { monto, horas, cliente }) {
  const m = Math.max(0, Math.round(Number(monto) || 0));
  const h = Math.max(0, Number(horas) || 0);
  const c = (cliente || "").trim().slice(0, 40);
  if (m === 0 && h === 0) return false; // algo tiene que haber

  if (!Array.isArray(datos.contexto.ingresos_edicion)) datos.contexto.ingresos_edicion = [];
  datos.contexto.ingresos_edicion.push({ fecha: hoyISO(), monto_usd: m, cliente: c, horas: h });

  // A la timeline: tu trabajo es parte de tu historia.
  const partes = [];
  if (m > 0) partes.push(`USD ${m}`);
  if (h > 0) partes.push(`${h} h`);
  datos.timeline.push({
    fecha: hoyISO(),
    tipo: "edicion",
    titulo: `Trabajo de edición${c ? ` para ${c}` : ""} · ${partes.join(" · ")}`
  });

  save(datos);
  return true;
}

/* ------------------------------------------------------------
   Render del panel (pestaña VOS).
   ------------------------------------------------------------ */
export function renderVida() {
  const cont = document.getElementById("vida-panel");
  if (!cont || !data) return;

  const r = resumenVida(data);
  const META_MES = 3000; // el objetivo de vivir de la edición
  const pctMes = Math.min(100, Math.round((r.delMes / META_MES) * 100));

  cont.innerHTML = `
    <div class="vida-resumen">
      <div class="vida-dato">
        <span class="vida-dato__num">USD ${r.totalUSD.toLocaleString("es-AR")}</span>
        <span class="vida-dato__lbl">ganados editando</span>
      </div>
      <div class="vida-mini">
        <span><b>${r.trabajos}</b> trabajos</span>
        <span><b>${r.clientes}</b> clientes</span>
        <span><b>${r.totalHoras}</b> h de Premiere</span>
      </div>
    </div>

    <div class="vida-mes">
      <div class="vida-mes__cab">
        <span>Este mes</span>
        <span class="vida-mes__cifra">USD ${r.delMes.toLocaleString("es-AR")} / ${META_MES.toLocaleString("es-AR")}</span>
      </div>
      <div class="barra barra--vida"><div class="barra__fill" style="width:${pctMes}%"></div></div>
    </div>

    <button class="btn" id="vida-registrar">Registrar un trabajo</button>
    ${r.trabajos > 0 ? `<button class="btn btn--ghost" id="vida-ver">Ver todos (${r.trabajos})</button>` : ""}`;

  const btnReg = document.getElementById("vida-registrar");
  if (btnReg) btnReg.onclick = abrirFormulario;

  const btnVer = document.getElementById("vida-ver");
  if (btnVer) btnVer.onclick = abrirHistorial;
}

/* Formulario de carga, en una hoja (no alarga la página). */
function abrirFormulario() {
  const html = `
    <div class="vida-form">
      <label class="config-label" for="vida-monto">Cuánto cobraste (USD)</label>
      <input type="number" id="vida-monto" class="campo" inputmode="numeric" placeholder="Opcional">

      <label class="config-label" for="vida-horas">Horas de edición</label>
      <input type="number" id="vida-horas" class="campo" inputmode="decimal" placeholder="Opcional" step="0.5">

      <label class="config-label" for="vida-cliente">Cliente</label>
      <input type="text" id="vida-cliente" class="campo" maxlength="40" placeholder="Opcional">

      <button class="btn" id="vida-guardar">Guardar</button>
      <p class="config-ayuda">Podés anotar solo horas (práctica) o solo un cobro. Al menos uno.</p>
    </div>`;

  const cerrar = abrirHoja("Registrar trabajo", html, (cuerpo) => {
    const g = cuerpo.querySelector("#vida-guardar");
    if (g) g.onclick = () => {
      const ok = registrarTrabajo(data, {
        monto: cuerpo.querySelector("#vida-monto").value,
        horas: cuerpo.querySelector("#vida-horas").value,
        cliente: cuerpo.querySelector("#vida-cliente").value
      });
      if (ok) {
        cerrarActual();
        renderVida();
        document.dispatchEvent(new CustomEvent("contexto-cambiado"));
      } else {
        cuerpo.querySelector(".config-ayuda").textContent = "Poné al menos un monto o unas horas.";
      }
    };
  });
  cerrarActual = cerrar;
}
let cerrarActual = null;

/* Historial completo de trabajos, en una hoja. */
function abrirHistorial() {
  const regs = (data.contexto.ingresos_edicion || []).slice().reverse();
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const filas = regs.map((r) => {
    const [y, m, d] = r.fecha.split("-").map(Number);
    const partes = [];
    if (r.monto_usd) partes.push(`<b class="japon-mas">USD ${r.monto_usd.toLocaleString("es-AR")}</b>`);
    if (r.horas) partes.push(`${r.horas} h`);
    return `
      <div class="vida-fila">
        <div class="vida-fila__top">${partes.join(" · ")}</div>
        <div class="vida-fila__sub">${d}/${MESES[m - 1]}/${y}${r.cliente ? ` · ${escapar(r.cliente)}` : ""}</div>
      </div>`;
  }).join("");
  abrirHoja("Tu trabajo de edición", `<div class="vida-historial">${filas}</div>`);
}

/* ===================== API ===================== */

export function setDatosVida(appData) {
  data = appData;
  renderVida();
}

export function initVida(appData) {
  data = appData;
  renderVida();
}
