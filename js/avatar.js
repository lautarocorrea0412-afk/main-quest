/* ============================================================
   MAIN QUEST — avatar.js
   ------------------------------------------------------------
   Vos, en pixel art, parado en tu propio cuarto.

   El avatar se DIBUJA por código (no se descarga ninguna
   imagen): cada peinado y cada prenda es una función que
   devuelve rectángulos. Cambiar de ropa es instantáneo y
   agregar una prenda nueva es agregar una función más.

   Regla de desbloqueo (sección 5 del PRD, interpretada):
   - Los PEINADOS son gratis. Quién sos no se gana.
   - La ROPA se desbloquea subiendo árboles. Lo que te
     ponés es la prueba de lo que hiciste.
   ============================================================ */

import { save } from "./store.js";
import { ARBOLES_META } from "./xp.js";

let data;

/* ===================== PALETA ===================== */
const P = {
  piel:      "#E8B88A",
  piel_sh:   "#C9946A",
  pelo:      "#241E2A",
  pelo_lt:   "#3A3145",
  negro:     "#2E2836",
  gris:      "#6B6478",
  crema:     "#FBF0E4",
  denim:     "#4A5A78",
  jogging:   "#3E3346",
  amber:     "#FFB067",
  sakura:    "#F58EA8",
  matcha:    "#8FD6A9",
  rojo:      "#E05A5A"
};

function r(x, y, w, h, c) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
}

/* ===================== PEINADOS (gratis) ===================== */
const PELOS = {
  largo: {
    nombre: "Largo",
    dibujo: () => // el de siempre: negro, hasta los hombros
      r(9, 4, 14, 5, P.pelo) +
      r(8, 6, 3, 14, P.pelo) +
      r(21, 6, 3, 14, P.pelo) +
      r(9, 4, 14, 2, P.pelo_lt)
  },
  corto: {
    nombre: "Corto",
    dibujo: () =>
      r(9, 4, 14, 4, P.pelo) +
      r(8, 5, 2, 5, P.pelo) +
      r(22, 5, 2, 5, P.pelo) +
      r(9, 4, 14, 1, P.pelo_lt)
  },
  tomado: {
    nombre: "Tomado",
    dibujo: () =>
      r(9, 4, 14, 4, P.pelo) +
      r(8, 5, 2, 6, P.pelo) +
      r(22, 5, 2, 6, P.pelo) +
      r(23, 8, 4, 7, P.pelo) + // colita atrás
      r(9, 4, 14, 1, P.pelo_lt)
  },
  gorra: {
    nombre: "Con gorra",
    dibujo: () =>
      r(9, 3, 14, 5, P.negro) +
      r(7, 7, 18, 2, P.negro) +
      r(14, 4, 4, 3, P.amber) +
      r(8, 8, 3, 12, P.pelo) +
      r(21, 8, 3, 12, P.pelo)
  }
};

/* ===================== ROPA (se gana) ===================== */
const REMERAS = {
  oversize: {
    nombre: "Remera oversize",
    req: null, // la de arranque
    dibujo: () =>
      r(8, 20, 16, 14, P.negro) +   // cuerpo ancho (oversize)
      r(6, 21, 3, 10, P.negro) +    // mangas caídas
      r(23, 21, 3, 10, P.negro) +
      r(13, 20, 6, 2, P.gris)       // cuello
  },
  hoodie: {
    nombre: "Hoodie",
    req: { arbol: "edicion", nivel: 2 },
    dibujo: () =>
      r(8, 20, 16, 15, P.gris) +
      r(6, 21, 3, 11, P.gris) +
      r(23, 21, 3, 11, P.gris) +
      r(11, 18, 10, 4, P.gris) +    // capucha
      r(14, 26, 4, 6, "#5A5468") +  // bolsillo canguro
      r(15, 22, 1, 5, P.crema) +    // cordones
      r(17, 22, 1, 5, P.crema)
  },
  camisa: {
    nombre: "Camisa",
    req: { arbol: "facultad", nivel: 2 },
    dibujo: () =>
      r(8, 20, 16, 14, P.crema) +
      r(6, 21, 3, 10, P.crema) +
      r(23, 21, 3, 10, P.crema) +
      r(15, 20, 2, 14, "#D9CDBC") + // botonadura
      r(12, 20, 3, 3, "#D9CDBC") +  // cuello
      r(17, 20, 3, 3, "#D9CDBC")
  },
  jersey: {
    nombre: "Jersey deportivo",
    req: { arbol: "fitness", nivel: 2 },
    dibujo: () =>
      r(8, 20, 16, 14, P.matcha) +
      r(6, 21, 3, 6, P.matcha) +
      r(23, 21, 3, 6, P.matcha) +
      r(8, 20, 16, 2, P.crema) +
      r(14, 24, 4, 5, P.crema)      // número
  },
  campera: {
    nombre: "Campera bomber",
    req: { arbol: "streaming", nivel: 2 },
    dibujo: () =>
      r(8, 20, 16, 14, P.sakura) +
      r(6, 21, 3, 11, P.sakura) +
      r(23, 21, 3, 11, P.sakura) +
      r(8, 32, 16, 2, P.negro) +    // elástico
      r(15, 20, 2, 12, P.negro)     // cierre
  }
};

const PANTALONES = {
  jogging: {
    nombre: "Jogging",
    req: null,
    dibujo: () =>
      r(10, 34, 5, 10, P.jogging) +
      r(17, 34, 5, 10, P.jogging) +
      r(10, 34, 12, 1, "#2A2130")
  },
  jean: {
    nombre: "Jean",
    req: { arbol: "finanzas", nivel: 2 },
    dibujo: () =>
      r(10, 34, 5, 10, P.denim) +
      r(17, 34, 5, 10, P.denim) +
      r(10, 34, 12, 2, "#3A4A66")
  },
  cargo: {
    nombre: "Cargo",
    req: { arbol: "japones", nivel: 2 },
    dibujo: () =>
      r(10, 34, 5, 10, "#5A5340") +
      r(17, 34, 5, 10, "#5A5340") +
      r(10, 38, 2, 3, "#4A4433") +  // bolsillos laterales
      r(20, 38, 2, 3, "#4A4433")
  }
};

/* ------------------------------------------------------------
   ¿Está desbloqueada esta prenda?
   ------------------------------------------------------------ */
export function desbloqueada(prenda) {
  if (!prenda.req) return true;
  return data.arboles[prenda.req.arbol].nivel >= prenda.req.nivel;
}

function textoRequisito(prenda) {
  if (!prenda.req) return "";
  const meta = ARBOLES_META[prenda.req.arbol];
  return `${meta.emoji} ${meta.nombre} NV ${prenda.req.nivel}`;
}

/* ------------------------------------------------------------
   Dibujo completo del avatar.
   Orden de capas: piernas → cuerpo → cabeza → pelo.
   ------------------------------------------------------------ */
export function dibujarAvatar(escala = 1) {
  if (!data) return ""; // todavía no se inicializó
  const a = data.perfil.avatar;
  const pelo = PELOS[a.pelo] || PELOS.largo;
  const remera = REMERAS[a.remera] || REMERAS.oversize;
  const pantalon = PANTALONES[a.pantalon] || PANTALONES.jogging;

  const piezas =
    pantalon.dibujo() +
    r(11, 44, 4, 2, P.negro) +      // zapatillas
    r(17, 44, 4, 2, P.negro) +
    remera.dibujo() +
    r(9, 30, 3, 5, P.piel) +        // manos
    r(20, 30, 3, 5, P.piel) +
    r(11, 8, 10, 11, P.piel) +      // cara
    r(11, 17, 10, 4, P.piel_sh) +   // cuello
    r(13, 12, 2, 2, P.pelo) +       // ojos
    r(17, 12, 2, 2, P.pelo) +
    pelo.dibujo();

  return `<svg viewBox="0 0 32 48" width="${32 * escala}" shape-rendering="crispEdges" role="img" aria-label="Tu avatar">${piezas}</svg>`;
}

/* ------------------------------------------------------------
   Panel de personalización (pestaña VOS).
   ------------------------------------------------------------ */
function opcionesHTML(grupo, coleccion, actual) {
  return Object.entries(coleccion).map(([id, item]) => {
    const libre = desbloqueada(item);
    const activa = actual === id;
    return `
      <button class="opcion ${activa ? "activa" : ""} ${libre ? "" : "trabada"}"
              data-action="elegir-look" data-grupo="${grupo}" data-id="${id}"
              ${libre ? "" : "disabled"}>
        <span class="opcion__nombre">${item.nombre}</span>
        ${libre ? "" : `<span class="opcion__req">${textoRequisito(item)}</span>`}
      </button>`;
  }).join("");
}

export function renderAvatar() {
  const vista = document.getElementById("avatar-preview");
  if (vista) vista.innerHTML = dibujarAvatar(3);

  const panel = document.getElementById("avatar-opciones");
  if (!panel) return;

  const a = data.perfil.avatar;
  panel.innerHTML = `
    <p class="diario-pregunta">Peinado</p>
    <div class="opciones">${opcionesHTML("pelo", PELOS, a.pelo)}</div>
    <p class="diario-pregunta">Ropa</p>
    <div class="opciones">${opcionesHTML("remera", REMERAS, a.remera)}</div>
    <p class="diario-pregunta">Pantalón</p>
    <div class="opciones">${opcionesHTML("pantalon", PANTALONES, a.pantalon)}</div>`;
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
  renderAvatar();
}
