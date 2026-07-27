/* ============================================================
   MAIN QUEST — japon.js
   ------------------------------------------------------------
   El objetivo más grande de Lautaro: volver a Japón en febrero
   2027, ~USD 10.000. El panel existía desde la Fase 0 pero
   mostraba siempre 0: nunca hubo forma de cargar lo ahorrado.
   Esto lo arregla.

   Cada aporte se guarda con su fecha, así la app puede:
   - mostrar cuánto llevás y cuánto falta,
   - proyectar si vas a llegar al ritmo actual,
   - y que todo eso alimente al motor y a la ceremonia.

   Cero culpa, también acá: si vas atrasado, el mensaje no
   reprocha, propone. "Faltan X por mes" nunca "vas mal".
   ============================================================ */

import { save } from "./store.js";
import { hoyISO, escapar, diasHasta } from "./util.js";

let data;

/* Meses que faltan hasta la fecha ideal (fin del mes objetivo) */
function mesesHastaMeta() {
  const [y, m] = data.contexto.objetivo_japon.fecha_ideal.split("-").map(Number);
  const meta = new Date(y, m, 0); // último día del mes objetivo
  const hoy = new Date();
  const meses = (meta.getFullYear() - hoy.getFullYear()) * 12 + (meta.getMonth() - hoy.getMonth());
  return Math.max(0, meses);
}

/* ------------------------------------------------------------
   El estado del ahorro. Exportado para testearse.
   Devuelve todo lo que el panel necesita, ya calculado.
   ------------------------------------------------------------ */
export function estadoJapon(datos) {
  const j = datos.contexto.objetivo_japon;
  if (!Array.isArray(j.aportes)) j.aportes = []; // datos migrados de una versión vieja
  const ahorrado = j.ahorrado_usd || 0;
  const meta = j.meta_usd || 10000;
  const falta = Math.max(0, meta - ahorrado);
  const pct = Math.min(100, Math.round((ahorrado / meta) * 100));
  const meses = mesesHastaMetaDe(datos);
  // Cuánto por mes hace falta de acá en más para llegar.
  const porMes = meses > 0 ? Math.ceil(falta / meses) : falta;
  return { ahorrado, meta, falta, pct, meses, porMes, cumplido: ahorrado >= meta };
}

/* Versión pura de mesesHastaMeta (recibe datos), para testear */
function mesesHastaMetaDe(datos) {
  const [y, m] = datos.contexto.objetivo_japon.fecha_ideal.split("-").map(Number);
  const meta = new Date(y, m, 0);
  const hoy = new Date();
  const meses = (meta.getFullYear() - hoy.getFullYear()) * 12 + (meta.getMonth() - hoy.getMonth());
  return Math.max(0, meses);
}

/* ------------------------------------------------------------
   Registrar un aporte (positivo suma, negativo corrige).
   Exportado y testeable.
   ------------------------------------------------------------ */
export function registrarAporte(datos, monto) {
  const n = Math.round(Number(monto));
  if (!Number.isFinite(n) || n === 0) return false;

  const j = datos.contexto.objetivo_japon;
  if (!Array.isArray(j.aportes)) j.aportes = [];

  const nuevo = Math.max(0, (j.ahorrado_usd || 0) + n);
  const realDelta = nuevo - (j.ahorrado_usd || 0); // por si topeó en 0
  j.ahorrado_usd = nuevo;
  j.aportes.push({ fecha: hoyISO(), monto: realDelta });

  // A la timeline: los hitos de ahorro son parte de tu historia.
  datos.timeline.push({
    fecha: hoyISO(),
    tipo: "japon",
    titulo: realDelta > 0
      ? `Ahorraste USD ${realDelta} para Japón`
      : `Ajuste de ahorro (USD ${realDelta})`
  });

  save(datos);
  return true;
}

/* ------------------------------------------------------------
   Render del panel (pestaña VOS).
   ------------------------------------------------------------ */
export function renderJapon() {
  const cont = document.getElementById("japon-panel");
  if (!cont || !data) return;

  const e = estadoJapon(data);

  const proyeccion = e.cumplido
    ? `<div class="japon-proy japon-proy--ok">¡Llegaste a la meta! Nos vemos en Japón 🇯🇵</div>`
    : e.meses <= 0
      ? `<div class="japon-proy">Falta USD ${e.falta.toLocaleString("es-AR")} para la meta.</div>`
      : `<div class="japon-proy">Al ritmo de <strong>USD ${e.porMes.toLocaleString("es-AR")} por mes</strong> llegás a febrero 2027.</div>`;

  cont.innerHTML = `
    <div class="japon-cifra">
      <span class="japon-ahorrado">USD ${e.ahorrado.toLocaleString("es-AR")}</span>
      <span class="japon-meta">de ${e.meta.toLocaleString("es-AR")}</span>
    </div>
    <div class="barra barra--japon"><div class="barra__fill" style="width:${e.pct}%"></div></div>
    <div class="japon-pct">${e.pct}%</div>
    ${proyeccion}
    <div class="agregar">
      <input type="number" id="japon-monto" class="campo" inputmode="numeric"
             placeholder="Sumar un ahorro (USD)" enterkeyhint="done">
      <button class="btn-mini" id="japon-sumar" aria-label="Sumar ahorro">+</button>
    </div>
    ${aportesRecientesHTML()}`;

  // onclick directo, la regla de la casa.
  const btn = document.getElementById("japon-sumar");
  const input = document.getElementById("japon-monto");
  const sumar = () => {
    if (registrarAporte(data, input.value)) {
      input.value = "";
      renderJapon();
      // El ahorro puede tocar la historia y algún logro.
      document.dispatchEvent(new CustomEvent("contexto-cambiado"));
    }
  };
  if (btn) btn.onclick = sumar;
  if (input) input.onkeydown = (ev) => { if (ev.key === "Enter") sumar(); };
}

function aportesRecientesHTML() {
  const aportes = data.contexto.objetivo_japon.aportes || [];
  if (aportes.length === 0) return "";
  const ultimos = aportes.slice(-3).reverse();
  const filas = ultimos.map((a) =>
    `<div class="japon-aporte">
      <span>${a.fecha}</span>
      <span class="${a.monto >= 0 ? "japon-mas" : "japon-menos"}">${a.monto >= 0 ? "+" : ""}USD ${a.monto.toLocaleString("es-AR")}</span>
    </div>`
  ).join("");
  return `<div class="japon-historial">${filas}</div>`;
}

/* ===================== API ===================== */

export function setDatosJapon(appData) {
  data = appData;
  renderJapon();
}

export function initJapon(appData) {
  data = appData;
  renderJapon();
}
