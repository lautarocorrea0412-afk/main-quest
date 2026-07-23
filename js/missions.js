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
import {
  ARBOLES_META, XP_PRINCIPAL, XP_SECUNDARIA,
  ganarXp, quitarXp, renderArboles, flotarXp
} from "./xp.js";

let data; // referencia a los datos de la app (los llena initMisiones)

/* ------------------------------------------------------------
   Fecha local en formato YYYY-MM-DD.
   OJO: no usamos toISOString() porque devuelve la fecha en
   UTC. A la noche en Argentina (UTC-3), UTC ya es "mañana"
   y el día se archivaría 3 horas antes de tiempo.
   ------------------------------------------------------------ */
function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/* ------------------------------------------------------------
   Seguridad básica: el texto que escribe el usuario se
   inserta en HTML. Escapamos los caracteres especiales para
   que un título como <b>hola</b> se muestre tal cual y no
   se interprete como código.
   ------------------------------------------------------------ */
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
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

    cont.innerHTML = `
      <div class="panel panel--main">
        <div class="panel__label">Misión principal</div>
        <h2>¿Cuál es LA misión de hoy?</h2>
        <p>Una sola. La que más te acerque a quien querés ser.</p>
        <div class="chips" id="chips-arbol">${chips}</div>
        <div class="agregar">
          <input type="text" id="input-principal" class="campo"
                 placeholder="Ej: Estudiar Anatomía 2 horas" maxlength="80"
                 enterkeyhint="done">
          <button class="btn-mini" data-action="fijar-principal" aria-label="Fijar misión principal">→</button>
        </div>
      </div>`;
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
      <div class="stamp">✦ Cumplida</div>
      ${tagArbol}
      <p class="mp-cierre">Un paso más. Mañana hay otra misión esperando.</p>
      <button class="deshacer" data-action="deshacer-principal">deshacer</button>
    </div>`;
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
    return `
    <li class="secundaria ${s.completada ? "hecha" : ""}">
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
      hoy.principal.completada = true;
      hoy.principal.completada_en = new Date().toISOString();
      const res = ganarXp(data, hoy.principal.arbol, XP_PRINCIPAL);
      if (res) {
        const nombre = ARBOLES_META[res.arbolId].nombre;
        flotarXp(
          res.subioNivel ? `+${XP_PRINCIPAL} · ¡${nombre} NV ${res.nivel}!`
                         : `+${XP_PRINCIPAL} ${nombre}`,
          btn
        );
        renderArboles(data);
      }
      break;
    }

    case "deshacer-principal": {
      hoy.principal.completada = false;
      hoy.principal.completada_en = null;
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
        const res = ganarXp(data, s.arbol, XP_SECUNDARIA);
        if (res) {
          const nombre = ARBOLES_META[res.arbolId].nombre;
          flotarXp(
            res.subioNivel ? `+${XP_SECUNDARIA} · ¡${nombre} NV ${res.nivel}!`
                           : `+${XP_SECUNDARIA} ${nombre}`,
            btn
          );
          renderArboles(data);
        }
      } else {
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
