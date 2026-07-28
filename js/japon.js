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
import { abrirHoja } from "./ui.js";
import { sonar } from "./sonido.js";

let data;

/* Meses que faltan hasta la fecha ideal (fin del mes objetivo) */
function mesesHastaMeta() {
  return mesesHastaMetaDe(data);
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
  // Cuánto por mes hace falta de acá en más para llegar. Con
  // menos de medio mes por delante, mostramos el total (dividir
  // por casi cero daría un número absurdo).
  const porMes = meses >= 0.5 ? Math.ceil(falta / meses) : falta;
  return { ahorrado, meta, falta, pct, meses, porMes, cumplido: ahorrado >= meta };
}

/* Versión pura de mesesHastaMeta (recibe datos), para testear.
   Cuenta por DÍAS reales y los divide en meses de 30.4, no por
   meses de calendario: así el "por mes" sube a medida que pasan
   los días sin aportar, aunque sea el mismo mes. La meta es el
   último día del mes objetivo. */
function mesesHastaMetaDe(datos) {
  const [y, m] = datos.contexto.objetivo_japon.fecha_ideal.split("-").map(Number);
  const meta = new Date(y, m, 0);       // último día del mes objetivo
  meta.setHours(23, 59, 59, 0);
  const hoy = new Date();
  const dias = Math.max(0, (meta.getTime() - hoy.getTime()) / 86400000);
  return dias / 30.4;                    // meses fraccionarios reales
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

  const antes = j.ahorrado_usd || 0;
  const nuevo = Math.max(0, antes + n);
  const realDelta = nuevo - antes; // por si topeó en 0
  j.ahorrado_usd = nuevo;
  j.aportes.push({ fecha: hoyISO(), monto: realDelta });

  /* ¿Se cruzó la meta JUSTO ahora, por primera vez? La bandera
     japon_cumplido vive en el objetivo y se marca una sola vez:
     la ceremonia de llegada no se puede repetir nunca. */
  const cruzoAhora = antes < j.meta_usd && nuevo >= j.meta_usd && !j.cumplido_en;
  if (cruzoAhora) {
    j.cumplido_en = hoyISO();
    datos.timeline.push({
      fecha: hoyISO(),
      tipo: "japon-meta",
      titulo: "Meta de Japón alcanzada · el próximo capítulo empieza lejos de casa"
    });
  }

  // A la timeline: los hitos de ahorro son parte de tu historia.
  datos.timeline.push({
    fecha: hoyISO(),
    tipo: "japon",
    titulo: realDelta > 0
      ? `Ahorraste USD ${realDelta} para Japón`
      : `Ajuste de ahorro (USD ${realDelta})`
  });

  save(datos);
  return cruzoAhora ? "meta" : true;
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
    const r = registrarAporte(data, input.value);
    if (r) {
      if (r !== "meta") sonar("aporte"); // la meta tiene su propia ceremonia
      input.value = "";
      renderJapon();
      document.dispatchEvent(new CustomEvent("contexto-cambiado"));
      // El gran momento: si este aporte llegó a los 10.000,
      // la ceremonia de llegada. Una sola vez en la vida de
      // la app.
      if (r === "meta") ceremoniaJapon();
    }
  };
  if (btn) btn.onclick = sumar;
  if (input) input.onkeydown = (ev) => { if (ev.key === "Enter") sumar(); };

  const toggle = document.getElementById("japon-toggle");
  if (toggle) toggle.onclick = abrirCaminoCompleto;
}

/* El historial como CAMINO de viaje: cada aporte es una parada
   en una ruta que sube hacia Japón, con el total acumulado en
   ese punto. En el panel se ven los últimos 3; el recorrido
   completo se abre en una HOJA deslizable (no expande la
   página, que era el problema). */

function formatearFecha(iso) {
  const MESES = ["enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
}

/* Aportes con total acumulado, más reciente primero. */
function aportesConTotal() {
  const aportes = data.contexto.objetivo_japon.aportes || [];
  let acum = 0;
  const conTotal = aportes.map((a) => {
    acum += a.monto;
    return { ...a, total: acum };
  });
  return conTotal.reverse();
}

function paradaHTML(a, destacar) {
  return `
    <div class="camino-parada ${destacar ? "camino-parada--actual" : ""}">
      <span class="camino-nudo"></span>
      <div class="camino-info">
        <div class="camino-monto ${a.monto >= 0 ? "japon-mas" : "japon-menos"}">
          ${a.monto >= 0 ? "+" : ""}USD ${a.monto.toLocaleString("es-AR")}
        </div>
        <div class="camino-fecha">${formatearFecha(a.fecha)}</div>
        <div class="camino-total">Total: USD ${a.total.toLocaleString("es-AR")}</div>
      </div>
    </div>`;
}

function aportesRecientesHTML() {
  const orden = aportesConTotal();
  if (orden.length === 0) {
    return `<div class="japon-camino-vacio">Tu primer aporte abre el camino.</div>`;
  }
  const visibles = orden.slice(0, 3);
  const paradas = visibles.map((a, i) => paradaHTML(a, i === 0)).join("");

  const boton = orden.length > 3
    ? `<button type="button" class="camino-toggle" id="japon-toggle">
        Ver todo el camino (${orden.length}) →
      </button>`
    : "";

  return `
    <div class="camino-titulo">Tu camino a Japón</div>
    <div class="camino">${paradas}</div>
    ${boton}`;
}

/* La hoja con el recorrido COMPLETO, del primero al último. */
function abrirCaminoCompleto() {
  const orden = aportesConTotal();
  const paradas = orden.map((a, i) => paradaHTML(a, i === 0)).join("");
  abrirHoja("Tu camino a Japón", `<div class="camino camino--completo">${paradas}</div>`);
}

/* ------------------------------------------------------------
   Ceremonia de llegada a los USD 10.000. No es un cartel de
   logro más: es EL momento de toda Main Quest. Emocional, no
   ruidosa — la recompensa después de años de progreso.

   Secuencia (~6s, salteable con un toque tras el primer tramo):
   - El cuarto se tiñe de dorado cálido.
   - Cae sakura por toda la pantalla, lento.
   - Aparece "Japón desbloqueado" y, debajo, la frase larga.
   - Queda un botón para cerrar.
   Después vive para siempre en Tu historia.
   ------------------------------------------------------------ */
export function ceremoniaJapon() {
  if (typeof document === "undefined") return;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const ov = document.createElement("div");
  ov.className = "jceleb";
  ov.setAttribute("role", "presentation");

  // Muchos pétalos, pero generados una vez y livianos.
  let petalos = "";
  const n = reduce ? 0 : 26;
  for (let i = 0; i < n; i++) {
    const x = Math.round(Math.random() * 100);
    const dur = (Math.random() * 3 + 4).toFixed(1);
    const delay = (Math.random() * 3).toFixed(1);
    const size = Math.round(Math.random() * 6 + 8);
    petalos += `<span class="jceleb-petalo" style="left:${x}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s"></span>`;
  }

  ov.innerHTML = `
    <div class="jceleb-luz"></div>
    <div class="jceleb-sakura">${petalos}</div>
    <div class="jceleb-centro">
      <div class="jceleb-torii">⛩️</div>
      <div class="jceleb-titulo">Japón desbloqueado</div>
      <div class="jceleb-frase">Una misión cumplida.<br>El próximo capítulo empieza lejos de casa.</div>
      <button class="jceleb-cerrar" id="jceleb-cerrar" type="button">Seguir</button>
    </div>`;

  document.body.appendChild(ov);
  requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add("jceleb--on")));

  const cerrar = () => {
    ov.classList.add("jceleb--fin");
    const quitar = () => ov.remove();
    ov.addEventListener("transitionend", quitar, { once: true });
    setTimeout(quitar, 900);
  };

  const btn = ov.querySelector("#jceleb-cerrar");
  if (btn) btn.onclick = cerrar;
  // Se puede cerrar tocando, pero recién después del primer tramo
  // (para que nadie se la saltee sin querer en el primer frame).
  setTimeout(() => { ov.onclick = (e) => { if (e.target === ov) cerrar(); }; }, 1500);

  if (reduce) return; // sin animación: queda el cartel hasta que toca Seguir
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
