/* ============================================================
   MAIN QUEST — missions.js
   ------------------------------------------------------------
   Todo lo relacionado con misiones vive acá:
   - UNA misión principal por día (la regla de oro del PRD).
   - Misiones secundarias opcionales.
   - El "cambio de día": a la medianoche, el día anterior se
     archiva en el historial y arranca un día limpio.

   Este módulo solo conoce dos cosas del exterior:
   los datos (que recibe en initMisiones) y save() del store.
   No sabe nada de XP ni de mensajes: eso llega en los
   próximos pasos y se conectará desde afuera.
   ============================================================ */

import { save } from "./store.js";
import { hoyISO, escapar } from "./util.js";
import { sugerirMision } from "./engine.js";
import {
  ARBOLES_META, XP_PRINCIPAL, XP_SECUNDARIA,
  ganarXp, quitarXp, renderArboles, flotarXp
} from "./xp.js";
import { MONEDAS_PRINCIPAL, MONEDAS_SECUNDARIA, ganarMonedas, quitarMonedas, volarMonedas } from "./economy.js";

let data; // referencia a los datos de la app (los llena initMisiones)

/* El hanko solo debe animarse en el momento exacto en que
   completás la misión. Sin esta bandera se volvía a estampar
   en CADA render (al agregar una secundaria, por ejemplo),
   porque el elemento se recrea de cero cada vez. */
let recienCompletada = false;

/* Id de la secundaria recién completada: su check hace pop
   y su texto se tacha con animación, UNA vez. Evento, no
   estado — sin esto, todo se re-animaría en cada render. */
let secundariaAnimada = null;

/* ------------------------------------------------------------
   Misiones frecuentes (C-23): las que más repetiste entre
   tus principales cumplidas. Se COMPUTAN del historial, no
   se guardan: si dejás de usar una, desaparece sola, y la
   lista jamás crece más allá de 3.
   Exportada para poder testearla.
   ------------------------------------------------------------ */
export function misionesFrecuentes(datos) {
  const conteo = new Map(); // clave normalizada -> { titulo, arbol, veces, ultima }
  for (const dia of datos.misiones.historial) {
    const p = dia.principal;
    if (!p || !p.completada || !p.titulo) continue;
    const clave = p.titulo.trim().toLowerCase();
    const previo = conteo.get(clave) || { veces: 0 };
    conteo.set(clave, {
      titulo: p.titulo.trim(), // conserva la forma más reciente
      arbol: p.arbol || null,
      veces: previo.veces + 1,
      ultima: dia.fecha
    });
  }
  return [...conteo.values()]
    .filter((f) => f.veces >= 2)
    .sort((a, b) => b.veces - a.veces || b.ultima.localeCompare(a.ultima))
    .slice(0, 3);
}

/* ------------------------------------------------------------
   Cambio de día.
   Si la última misión guardada es de una fecha anterior,
   se archiva completa en el historial (para la timeline y
   las estadísticas futuras) y se crea el día de hoy vacío.
   ------------------------------------------------------------ */
function archivarSiCorresponde() {
  const hoy = hoyISO();
  const m = data.misiones;

  if (m.hoy && m.hoy.fecha !== hoy) {
    m.historial.push(m.hoy);
    m.hoy = null;
  }
  if (!m.hoy) {
    m.hoy = { fecha: hoy, principal: null, secundarias: [] };
    save(data);
  }
}

/* ------------------------------------------------------------
   Render de la misión principal.
   Tiene tres estados posibles:
   1. Sin definir  -> invita a elegir LA misión del día.
   2. Activa       -> la muestra grande, con botón de completar.
   3. Cumplida     -> sello "CUMPLIDA" + mensaje hacia adelante.
   ------------------------------------------------------------ */
function renderPrincipal() {
  const cont = document.getElementById("mision-principal");
  const p = data.misiones.hoy.principal;

  if (!p) {
    const chips = Object.entries(ARBOLES_META).map(([id, m]) => `
      <button class="chip" data-action="elegir-arbol" data-arbol="${id}">
        ${m.emoji} ${m.nombre}
      </button>`).join("");

    const sug = sugerirMision();
    const frecuentes = misionesFrecuentes(data)
      .filter((f) => f.titulo.toLowerCase() !== sug.titulo.toLowerCase());

    const chipsFrec = frecuentes.map((f, i) => `
      <button class="chip chip--frecuente" id="frec-${i}">↺ ${escapar(f.titulo)}</button>`).join("");

    cont.innerHTML = `
      <div class="panel panel--main">
        <div class="panel__label">Misión principal</div>
        <h2>¿Cuál es LA misión de hoy?</h2>
        <div class="sugerencia">
          <span class="sugerencia__texto">💡 ${escapar(sug.titulo)}</span>
          <button class="btn-usar" id="btn-usar-sugerencia">Usar</button>
        </div>
        ${chipsFrec ? `<div class="frecuentes">${chipsFrec}</div>` : ""}
        <div class="chips" id="chips-arbol">${chips}</div>
        <div class="agregar">
          <input type="text" id="input-principal" class="campo"
                 placeholder="O escribí la tuya" maxlength="80"
                 enterkeyhint="done">
          <button class="btn-mini" data-action="fijar-principal" aria-label="Fijar misión principal">→</button>
        </div>
      </div>`;

    /* onclick directo, la regla de la casa. La sugerencia y
       las frecuentes PRECARGAN: el tap final sigue siendo tuyo. */
    const prellenar = (titulo, arbol) => {
      const input = document.getElementById("input-principal");
      if (input) input.value = titulo;
      arbolSeleccionado = arbol || null;
      document.querySelectorAll("#chips-arbol .chip").forEach((c) => {
        c.classList.toggle("activa", c.dataset.arbol === arbolSeleccionado);
      });
    };
    const btnSug = document.getElementById("btn-usar-sugerencia");
    if (btnSug) btnSug.onclick = () => prellenar(sug.titulo, sug.arbol);
    frecuentes.forEach((f, i) => {
      const btn = document.getElementById(`frec-${i}`);
      if (btn) btn.onclick = () => prellenar(f.titulo, f.arbol);
    });
    return;
  }

  const arbolMeta = ARBOLES_META[p.arbol];
  const tagArbol = arbolMeta
    ? `<span class="tag-arbol">${arbolMeta.emoji} ${arbolMeta.nombre} · +${XP_PRINCIPAL} XP</span>`
    : "";

  if (!p.completada) {
    cont.innerHTML = `
      <div class="panel panel--main">
        <div class="panel__label">Misión principal</div>
        <h2 class="mp-titulo">${escapar(p.titulo)}</h2>
        ${tagArbol}
        <button class="btn btn--completar" data-action="completar-principal">
          Completar misión
        </button>
      </div>`;
    return;
  }

  cont.innerHTML = `
    <div class="panel panel--main panel--cumplida">
      <div class="panel__label">Misión principal</div>
      <h2 class="mp-titulo mp-titulo--hecha">${escapar(p.titulo)}</h2>
      <div class="hanko-fila">
        <div class="hanko${recienCompletada ? " hanko--anim" : ""}">完</div>
        <span class="hanko-texto">Cumplida</span>
      </div>
      ${tagArbol}
      <p class="mp-cierre">Un paso más. Mañana hay otra misión esperando.</p>
      <button class="deshacer" data-action="deshacer-principal">deshacer</button>
    </div>`;

  recienCompletada = false; // se consume: el próximo render ya no anima
}

/* ------------------------------------------------------------
   Pétalos de sakura: estallan alrededor del hanko cuando se
   estampa. Puro adorno del momento más importante del día —
   el único lugar de la app donde hay decoración por gusto.
   Se autodestruyen: no dejan basura en la página.
   ------------------------------------------------------------ */
function estallarPetalos() {
  const fila = document.querySelector(".hanko-fila");
  if (!fila) return;

  for (let i = 0; i < 8; i++) {
    const p = document.createElement("div");
    p.className = "petalo";
    const angulo = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
    const dist = 34 + Math.random() * 22;
    p.style.setProperty("--dx", `${Math.cos(angulo) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(angulo) * dist}px`);
    p.style.animationDelay = `${Math.random() * 0.08}s`;
    fila.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }
}

/* ------------------------------------------------------------
   Render de las misiones secundarias.
   ------------------------------------------------------------ */
function renderSecundarias() {
  const lista = document.getElementById("lista-secundarias");
  const items = data.misiones.hoy.secundarias;

  if (items.length === 0) {
    lista.innerHTML = `<li class="secundarias-vacio">Sin secundarias por ahora. Está bien: lo importante es la principal.</li>`;
    return;
  }

  lista.innerHTML = items.map((s) => {
    const m = ARBOLES_META[s.arbol];
    const anim = s.id === secundariaAnimada ? " secundaria--anim" : "";
    return `
    <li class="secundaria ${s.completada ? "hecha" : ""}${anim}">
      <button class="secundaria__check" data-action="toggle-secundaria" data-id="${s.id}"
              aria-label="${s.completada ? "Desmarcar" : "Completar"} ${escapar(s.titulo)}"></button>
      <span class="secundaria__titulo">${escapar(s.titulo)}${m ? ` <span class="secundaria__arbol">${m.emoji}</span>` : ""}</span>
      <button class="secundaria__borrar" data-action="borrar-secundaria" data-id="${s.id}"
              aria-label="Borrar ${escapar(s.titulo)}">×</button>
    </li>`;
  }).join("");
}

function render() {
  renderPrincipal();
  renderSecundarias();
  secundariaAnimada = null; // la bandera se consume en un solo render
}

/* ------------------------------------------------------------
   Acciones. Un solo listener en toda la vista HOY
   ("delegación de eventos"): como los paneles se redibujan
   seguido, escuchar en el contenedor padre evita tener que
   reconectar botones después de cada render.
   ------------------------------------------------------------ */
/* Árbol elegido para la próxima misión principal.
   Vive en una variable (no en los datos) porque es un
   estado temporal de la pantalla, no algo a guardar. */
let arbolSeleccionado = null;

function accion(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const hoy = data.misiones.hoy;

  switch (btn.dataset.action) {

    /* Elegir árbol NO redibuja el panel: si lo hiciera,
       borraría lo que ya escribiste en el campo de texto.
       Actualizamos las clases de los chips a mano y listo. */
    case "elegir-arbol": {
      const id = btn.dataset.arbol;
      arbolSeleccionado = (arbolSeleccionado === id) ? null : id;
      document.querySelectorAll("#chips-arbol .chip").forEach((c) => {
        c.classList.toggle("activa", c.dataset.arbol === arbolSeleccionado);
      });
      return; // sin save ni render
    }

    case "fijar-principal": {
      const input = document.getElementById("input-principal");
      const titulo = input.value.trim();
      if (!titulo) return;
      hoy.principal = {
        titulo,
        arbol: arbolSeleccionado,
        completada: false,
        completada_en: null
      };
      arbolSeleccionado = null;
      break;
    }

    case "completar-principal": {
      recienCompletada = true;
      hoy.principal.completada = true;
      hoy.principal.completada_en = new Date().toISOString();
      ganarMonedas(MONEDAS_PRINCIPAL);
      volarMonedas(btn);
      const res = ganarXp(data, hoy.principal.arbol, XP_PRINCIPAL);
      // Un solo texto flotante con todo lo ganado:
      // monedas siempre; XP y nivel solo si la misión tiene árbol.
      let texto = `+${MONEDAS_PRINCIPAL} 🪙`;
      if (res) {
        const nombre = ARBOLES_META[res.arbolId].nombre;
        texto = (res.subioNivel ? `¡${nombre} NV ${res.nivel}! · ` : `+${XP_PRINCIPAL} ${nombre} · `) + texto;
        renderArboles(data);
      }
      flotarXp(texto, btn);
      save(data);
      render();
      estallarPetalos(); // después del render: el hanko ya existe en pantalla
      document.dispatchEvent(new CustomEvent("contexto-cambiado"));
      return;
    }

    case "deshacer-principal": {
      hoy.principal.completada = false;
      hoy.principal.completada_en = null;
      quitarMonedas(MONEDAS_PRINCIPAL);
      quitarXp(data, hoy.principal.arbol, XP_PRINCIPAL);
      renderArboles(data);
      break;
    }

    case "agregar-secundaria": {
      const input = document.getElementById("input-secundaria");
      const titulo = input.value.trim();
      if (!titulo) return;
      const selArbol = document.getElementById("select-arbol-secundaria");
      hoy.secundarias.push({
        id: crypto.randomUUID(),
        titulo,
        arbol: selArbol.value || null,
        completada: false
      });
      input.value = "";
      selArbol.value = "";
      break;
    }

    case "toggle-secundaria": {
      const s = hoy.secundarias.find((x) => x.id === btn.dataset.id);
      if (!s) return;
      s.completada = !s.completada;
      if (s.completada) {
        secundariaAnimada = s.id;
        ganarMonedas(MONEDAS_SECUNDARIA);
        volarMonedas(btn);
        const res = ganarXp(data, s.arbol, XP_SECUNDARIA);
        let texto = `+${MONEDAS_SECUNDARIA} 🪙`;
        if (res) {
          const nombre = ARBOLES_META[res.arbolId].nombre;
          texto = (res.subioNivel ? `¡${nombre} NV ${res.nivel}! · ` : `+${XP_SECUNDARIA} ${nombre} · `) + texto;
          renderArboles(data);
        }
        flotarXp(texto, btn);
      } else {
        quitarMonedas(MONEDAS_SECUNDARIA);
        quitarXp(data, s.arbol, XP_SECUNDARIA);
        renderArboles(data);
      }
      break;
    }

    case "borrar-secundaria": {
      const s = hoy.secundarias.find((x) => x.id === btn.dataset.id);
      // Si borrás una secundaria ya completada, su XP se
      // devuelve: borrar no debe ser una forma de "cobrar
      // dos veces" creando y borrando misiones.
      if (s && s.completada) {
        quitarMonedas(MONEDAS_SECUNDARIA);
        quitarXp(data, s.arbol, XP_SECUNDARIA);
        renderArboles(data);
      }
      hoy.secundarias = hoy.secundarias.filter((x) => x.id !== btn.dataset.id);
      break;
    }

    default:
      return;
  }

  save(data);
  render();
  document.dispatchEvent(new CustomEvent("contexto-cambiado"));
}

/* ------------------------------------------------------------
   Enter en los campos de texto = confirmar.
   ------------------------------------------------------------ */
function enterEnCampos(e) {
  if (e.key !== "Enter") return;
  if (e.target.id === "input-principal") {
    document.querySelector('[data-action="fijar-principal"]').click();
  }
  if (e.target.id === "input-secundaria") {
    document.querySelector('[data-action="agregar-secundaria"]').click();
  }
}

/* ------------------------------------------------------------
   Cuando se importa un backup, app.js reemplaza el objeto de
   datos entero. Esta función actualiza la referencia interna
   del módulo y redibuja, sin volver a conectar los listeners
   (eso duplicaría las acciones de cada botón).
   ------------------------------------------------------------ */
export function setDatos(appData) {
  data = appData;
  archivarSiCorresponde();
  render();
}

/* ------------------------------------------------------------
   Punto de entrada del módulo (lo llama app.js).
   ------------------------------------------------------------ */
export function initMisiones(appData) {
  data = appData;
  archivarSiCorresponde();

  const vista = document.getElementById("view-hoy");
  vista.addEventListener("click", accion);
  vista.addEventListener("keydown", enterEnCampos);

  // Si la app quedó abierta de fondo y volvés al otro día
  // (muy común en un iPhone), detectamos el cambio de fecha
  // al volver y arrancamos el día nuevo.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      archivarSiCorresponde();
      render();
    }
  });

  render();
}
