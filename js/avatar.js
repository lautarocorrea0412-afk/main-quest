/* ============================================================
   MAIN QUEST — avatar.js
   ------------------------------------------------------------
   SOLO LÓGICA. El dibujo vive en avatar-arte.js desde la
   Entrega 6 (D-29).

   Acá se decide: qué está desbloqueado, qué expresión te
   corresponde según tu contexto, cómo se arma el muñeco por
   capas, y cómo se dibuja el panel de personalización.
   ============================================================ */

import { save } from "./store.js";
import { ARBOLES_META } from "./xp.js";
import { contextoActual } from "./engine.js";
import { requisitoDe } from "./progression.js";
import {
  PELOS, REMERAS, PANTALONES, ACCESORIOS,
  NOMBRES_EXPRESION, dibujarCara, r, P
} from "./avatar-arte.js";

let data;

export function expresionAutomatica() {
  try {
    const ctx = contextoActual();
    if (ctx.principalCumplidaHoy) return "feliz";
    if (ctx.energiaBaja) return "cansado";
    if (ctx.parcialProximo) return "concentrado";
    if (ctx.racha >= 3) return "confiado";
  } catch {
    // Si el motor no está listo todavía, cara tranquila.
  }
  return "normal";
}

export function desbloqueada(id) {
  const req = requisitoDe(id);      // null = pieza libre
  if (!req) return true;
  return data.arboles[req.arbol].nivel >= req.nivel;
}

function textoRequisito(id) {
  const req = requisitoDe(id);
  if (!req) return "";
  const meta = ARBOLES_META[req.arbol];
  return `${meta.emoji} ${meta.nombre} NV ${req.nivel}`;
}

/* ------------------------------------------------------------
   Dibujo completo del avatar.
   Orden de capas: piernas → cuerpo → cabeza → pelo.
   ------------------------------------------------------------ */
export function dibujarAvatar(escala = 1, expr = null) {
  if (!data) return ""; // todavía no se inicializó
  const a = data.perfil.avatar;
  const gesto = expr || expresionAutomatica();
  const pelo = PELOS[a.pelo] || PELOS.largo;
  const remera = REMERAS[a.remera] || REMERAS.oversize;
  const pantalon = PANTALONES[a.pantalon] || PANTALONES.jogging;
  const accesorio = ACCESORIOS[a.accesorio] || ACCESORIOS.ninguno;

  /* Orden de capas: lo de atrás primero.
     melena trasera → piernas → zapatillas → torso → manos →
     cara → pelo delantero. El pelo va último para que caiga
     por delante de los hombros: eso es lo que da la silueta. */
  const piezas =
    pelo.atras() +
    pantalon.dibujo() +
    r(14, 76, 10, 4, P.negro) +         // zapatillas
    r(24, 76, 10, 4, P.negro) +
    r(14, 79, 10, 1, P.suela) +
    r(24, 79, 10, 1, P.suela) +
    remera.dibujo() +
    r(3, 52, 7, 7, P.piel) +            // manos
    r(38, 52, 7, 7, P.piel) +
    dibujarCara(gesto) +
    pelo.adelante() +
    accesorio.dibujo();

  return `<svg viewBox="0 0 48 80" width="${48 * escala}" shape-rendering="crispEdges" role="img" aria-label="Tu avatar, expresión ${gesto}">${piezas}</svg>`;
}

/* ------------------------------------------------------------
   Panel de personalización (pestaña VOS).
   ------------------------------------------------------------ */
function opcionesHTML(grupo, coleccion, actual, nuevas = []) {
  return Object.entries(coleccion).map(([id, item]) => {
    const libre = desbloqueada(id);
    const activa = actual === id;
    const nueva = nuevas.includes(id) ? " opcion--nueva" : "";
    return `
      <button class="opcion ${activa ? "activa" : ""} ${libre ? "" : "trabada"}${nueva}"
              data-action="elegir-look" data-grupo="${grupo}" data-id="${id}"
              ${libre ? "" : "disabled"}>
        <span class="opcion__nombre">${item.nombre}</span>
        ${libre ? "" : `<span class="opcion__req">${textoRequisito(id)}</span>`}
      </button>`;
  }).join("");
}

/* Qué piezas estaban desbloqueadas en el render anterior:
   la diferencia con el actual son los desbloqueos NUEVOS,
   que entran con destello. Evento, no estado. */
let desbloqueadasAntes = null;

/* Qué categorías del acordeón están desplegadas. Estado de
   pantalla (no se guarda): al re-renderizar tras elegir una
   prenda, las que estaban abiertas siguen abiertas. */
const abiertasCat = new Set();

export function renderAvatar() {
  const gesto = expresionAutomatica();
  const vista = document.getElementById("avatar-preview");
  if (vista) {
    vista.innerHTML = dibujarAvatar(2, gesto) +
      `<p class="avatar-gesto">${NOMBRES_EXPRESION[gesto]}</p>`;
  }

  const panel = document.getElementById("avatar-opciones");
  if (!panel) return;

  const a = data.perfil.avatar;

  const todas = [...Object.keys(REMERAS), ...Object.keys(PANTALONES), ...Object.keys(ACCESORIOS)];
  const ahora = new Set(todas.filter((id) => desbloqueada(id)));
  const nuevas = desbloqueadasAntes
    ? [...ahora].filter((id) => !desbloqueadasAntes.has(id))
    : [];
  desbloqueadasAntes = ahora;

  // Cada categoría es una fila de acordeón: se toca y despliega
  // SOLO su grilla, sin empujar toda la sección hacia abajo. El
  // avatar de arriba queda siempre a la vista mientras te probás.
  // Pueden quedar varias abiertas a la vez (decisión de Lautaro).
  panel.innerHTML = [
    categoriaHTML("pelo", "Peinado", PELOS, a.pelo, nuevas),
    categoriaHTML("remera", "Ropa", REMERAS, a.remera, nuevas),
    categoriaHTML("pantalon", "Pantalón", PANTALONES, a.pantalon, nuevas),
    categoriaHTML("accesorio", "Accesorio", ACCESORIOS, a.accesorio, nuevas)
  ].join("");

  // onclick directo en cada cabecera (la regla de la casa).
  for (const cab of panel.querySelectorAll("[data-cat]")) {
    cab.onclick = () => {
      const cat = cab.dataset.cat;
      abiertasCat.has(cat) ? abiertasCat.delete(cat) : abiertasCat.add(cat);
      renderAvatar();
    };
  }
}

/* Cuántas prendas de la categoría tenés desbloqueadas, y cuál
   está puesta ahora: eso resume la fila cuando está cerrada. */
function categoriaHTML(grupo, titulo, coleccion, actual, nuevas) {
  const abierta = abiertasCat.has(grupo);
  const ids = Object.keys(coleccion);
  const desbloq = ids.filter((id) => desbloqueada(id)).length;
  const nombreActual = (coleccion[actual] && coleccion[actual].nombre) || "—";
  // Un puntito si hay prendas nuevas sin ver en esta categoría.
  const hayNueva = ids.some((id) => nuevas.includes(id));

  return `
    <div class="cat ${abierta ? "cat--abierta" : ""}">
      <button type="button" class="cat__cab" data-cat="${grupo}">
        <span class="cat__titulo">${titulo}${hayNueva ? '<span class="cat__punto"></span>' : ""}</span>
        <span class="cat__resumen">${escaparTexto(nombreActual)} · ${desbloq}/${ids.length}</span>
        <span class="cat__flecha">${abierta ? "▾" : "▸"}</span>
      </button>
      ${abierta ? `<div class="opciones">${opcionesHTML(grupo, coleccion, actual, nuevas)}</div>` : ""}
    </div>`;
}

/* Escape mínimo para los nombres de prenda en el resumen. */
function escaparTexto(s) {
  return String(s).replace(/[&<>"]/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
  ));
}

function accion(e) {
  const btn = e.target.closest('[data-action="elegir-look"]');
  if (!btn) return;
  data.perfil.avatar[btn.dataset.grupo] = btn.dataset.id;
  save(data);
  renderAvatar();
  // El avatar también vive en el cuarto: hay que redibujarlo allá.
  document.dispatchEvent(new CustomEvent("avatar-cambiado"));
}

/* ===================== API ===================== */

export function setDatosAvatar(appData) {
  data = appData;
  renderAvatar();
}

export function initAvatar(appData) {
  data = appData;
  document.getElementById("view-vos").addEventListener("click", accion);

  // Cuando cambia algo que afecta la expresión (completar una
  // misión, cerrar el diario), otros módulos avisan con este
  // evento y el avatar se vuelve a dibujar con la cara nueva.
  document.addEventListener("contexto-cambiado", renderAvatar);

  renderAvatar();
}
