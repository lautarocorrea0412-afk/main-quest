/* ============================================================
   MAIN QUEST — rituales.js
   ------------------------------------------------------------
   Rituales: las cosas que hacés porque son parte de quién sos,
   no de una lista de tareas. La app los conoce y te los OFRECE
   el día que tocan — pero nunca los reclama.

   La regla que los salva de romper la filosofía "cero culpa":
   un ritual SUGIERE, jamás acusa. Si el martes no hiciste
   japonés, el miércoles no hay ningún ❌ ni "te lo perdiste":
   el martes que viene simplemente vuelve a ofrecerse. El
   ritual llena el campo vacío de la misión, no un casillero
   de obligación.

   Cada ritual: { id, titulo, arbol, dias:[0-6], activo }
   donde dias usa 0=domingo .. 6=sábado (getDay()).
   ============================================================ */

import { save } from "./store.js";
import { escapar } from "./util.js";

let data;

const NOMBRE_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/* Rituales sugeridos según el cronograma real de Lautaro.
   Facultad ma/ju/vie con la tarde tomada (sale 11:30, vuelve
   19:30; jueves 21:00), así que esos días los rituales viven
   temprano o de noche. Lun/mié/sáb son los de margen. Domingo
   es fútbol y descanso: sin rituales cargados.
   Son PROPUESTAS: puede borrarlos o cambiarlos cuando quiera. */
export const RITUALES_SUGERIDOS = [
  { titulo: "Gimnasio", arbol: "fitness", dias: [1, 3, 6] },      // lun, mié, sáb (libres)
  { titulo: "Japonés — 20 min", arbol: "japones", dias: [1, 4] }, // lun y jue
  { titulo: "Editar — 1 hora", arbol: "edicion", dias: [3, 6] },  // mié y sáb
  { titulo: "Leer un rato", arbol: null, dias: [0, 2, 5] }        // días de facultad + domingo, algo liviano
];

/* ------------------------------------------------------------
   Los rituales que aplican HOY (por día de la semana).
   Exportado para testearse. Recibe la fecha para poder fijar
   un día en los tests.
   ------------------------------------------------------------ */
export function ritualesDeHoy(datos, ahora = new Date()) {
  const hoy = ahora.getDay();
  return (datos.rituales || []).filter((r) => r.activo !== false && r.dias.includes(hoy));
}

/* ¿La misión principal de hoy ya salió de un ritual? Para no
   volver a ofrecer el que ya usaste. */
function ritualYaUsadoHoy(datos) {
  const p = datos.misiones.hoy && datos.misiones.hoy.principal;
  if (!p) return null;
  const rs = ritualesDeHoy(datos);
  const match = rs.find((r) => r.titulo.toLowerCase() === (p.titulo || "").toLowerCase());
  return match ? match.id : null;
}

/* ------------------------------------------------------------
   CRUD de rituales
   ------------------------------------------------------------ */
export function agregarRitual(datos, { titulo, arbol, dias }) {
  const t = (titulo || "").trim();
  if (!t || !Array.isArray(dias) || dias.length === 0) return false;
  if (!Array.isArray(datos.rituales)) datos.rituales = [];
  datos.rituales.push({
    id: "r" + Date.now() + Math.floor(Math.random() * 1000),
    titulo: t,
    arbol: arbol || null,
    dias: dias.slice().sort(),
    activo: true
  });
  save(datos);
  return true;
}

export function borrarRitual(datos, id) {
  datos.rituales = (datos.rituales || []).filter((r) => r.id !== id);
  save(datos);
}

/* Sembrar los rituales sugeridos (una vez, si no hay ninguno). */
export function sembrarSugeridos(datos) {
  if (!Array.isArray(datos.rituales)) datos.rituales = [];
  if (datos.rituales.length > 0) return false;
  for (const s of RITUALES_SUGERIDOS) {
    datos.rituales.push({
      id: "r" + Date.now() + Math.floor(Math.random() * 100000),
      titulo: s.titulo, arbol: s.arbol, dias: s.dias.slice(), activo: true
    });
  }
  save(datos);
  return true;
}

/* ------------------------------------------------------------
   La sugerencia de HOY para el campo de misión: el primer
   ritual del día que todavía no usaste. La consume missions.js.
   ------------------------------------------------------------ */
export function ritualSugeridoHoy(datos, ahora = new Date()) {
  const usado = ritualYaUsadoHoy(datos);
  const hoy = ritualesDeHoy(datos, ahora).filter((r) => r.id !== usado);
  return hoy.length ? { titulo: hoy[0].titulo, arbol: hoy[0].arbol } : null;
}

/* ------------------------------------------------------------
   Render del panel de rituales (en VOS). Lista + alta simple.
   ------------------------------------------------------------ */
export function renderRituales() {
  const cont = document.getElementById("rituales-panel");
  if (!cont || !data) return;

  const rituales = data.rituales || [];

  const lista = rituales.length === 0
    ? `<p class="rituales-vacio">Todavía no tenés rituales. Son las cosas que hacés siempre —gym, japonés, leer— y que la app te va a ofrecer el día que tocan, sin reclamártelas nunca.</p>
       <button type="button" class="btn btn--ghost" id="rituales-sembrar">Empezar con algunos sugeridos</button>`
    : rituales.map((r) => `
        <div class="ritual">
          <div class="ritual__info">
            <span class="ritual__titulo">${escapar(r.titulo)}</span>
            <span class="ritual__dias">${r.dias.map((d) => NOMBRE_DIA[d]).join(" · ")}</span>
          </div>
          <button type="button" class="ritual__borrar" data-borrar="${r.id}" aria-label="Borrar ritual">✕</button>
        </div>`).join("");

  cont.innerHTML = `
    ${lista}
    <button type="button" class="btn btn--ghost" id="rituales-nuevo">+ Nuevo ritual</button>`;

  // onclick directo, la regla de la casa.
  const sembrar = document.getElementById("rituales-sembrar");
  if (sembrar) sembrar.onclick = () => { sembrarSugeridos(data); renderRituales(); dispararCambio(); };

  const nuevo = document.getElementById("rituales-nuevo");
  if (nuevo) nuevo.onclick = () => abrirAltaRitual();

  for (const b of cont.querySelectorAll("[data-borrar]")) {
    b.onclick = () => { borrarRitual(data, b.dataset.borrar); renderRituales(); dispararCambio(); };
  }
}

/* Formulario de alta, dentro de una hoja deslizable. */
function abrirAltaRitual() {
  import("./ui.js").then(({ abrirHoja }) => {
    const arboles = [
      ["", "Ninguno"], ["fitness", "Fitness"], ["edicion", "Edición"],
      ["facultad", "Facultad"], ["japones", "Japonés"],
      ["finanzas", "Finanzas"], ["streaming", "Streaming"]
    ];
    const html = `
      <div class="config-item">
        <label class="config-label" for="ritual-titulo">¿Qué ritual?</label>
        <input type="text" id="ritual-titulo" class="campo" maxlength="40" placeholder="Ej: Gimnasio" enterkeyhint="done">
      </div>
      <div class="config-item">
        <label class="config-label" for="ritual-arbol">Árbol</label>
        <select id="ritual-arbol" class="campo campo--select">
          ${arboles.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}
        </select>
      </div>
      <div class="config-item">
        <span class="config-label">¿Qué días?</span>
        <div class="ritual-dias-sel">
          ${NOMBRE_DIA.map((n, i) => `<button type="button" class="ritual-dia-chip" data-dia="${i}">${n}</button>`).join("")}
        </div>
      </div>
      <button type="button" class="btn" id="ritual-guardar">Crear ritual</button>`;

    abrirHoja("Nuevo ritual", html, (cuerpo) => {
      const dias = new Set();
      for (const chip of cuerpo.querySelectorAll(".ritual-dia-chip")) {
        chip.onclick = () => {
          const d = parseInt(chip.dataset.dia, 10);
          if (dias.has(d)) { dias.delete(d); chip.classList.remove("activa"); }
          else { dias.add(d); chip.classList.add("activa"); }
        };
      }
      cuerpo.querySelector("#ritual-guardar").onclick = () => {
        const titulo = cuerpo.querySelector("#ritual-titulo").value;
        const arbol = cuerpo.querySelector("#ritual-arbol").value || null;
        if (agregarRitual(data, { titulo, arbol, dias: [...dias] })) {
          renderRituales();
          dispararCambio();
          // cerrar la hoja: tocar el fondo lo hace, pero mejor auto.
          document.querySelector(".hoja-fondo .hoja__cerrar")?.click();
        }
      };
    });
  });
}

function dispararCambio() {
  document.dispatchEvent(new CustomEvent("contexto-cambiado"));
}

/* ===================== API ===================== */

export function setDatosRituales(appData) {
  data = appData;
  renderRituales();
}

export function initRituales(appData) {
  data = appData;
  renderRituales();
}
