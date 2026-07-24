/* ============================================================
   MAIN QUEST — iconos.js
   ------------------------------------------------------------
   Íconos propios en pixel art, dibujados por código, en el
   mismo lenguaje visual del cuarto y del avatar (A-3).

   Reemplazan a los emojis, que eran placeholders puestos y
   olvidados: 🟦 para "Alfombra" y 🔴 para "Figura Pokémon"
   desentonaban con todo lo demás.

   Los de la TIENDA no están acá: se generan recortando el
   propio SVG del cuarto (js/iconos-tienda.js), así el ícono
   no se parece al mueble, ES el mueble.

   Grilla de 12x12. `cc` = color que hereda del CSS
   (currentColor), para que el mismo ícono sirva encendido o
   apagado sin duplicarlo.
   ============================================================ */

const C = {
  cc:    "currentColor",
  ambar: "#FFB067",
  rosa:  "#F58EA8",
  verde: "#8FD6A9",
  oro:   "#FFD98E",
  crema: "#FBF0E4",
  gris:  "#8A8194",
  osc:   "#2E2836",
  rojo:  "#E05A5A",
  azul:  "#7FC4E8"
};

const r = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;

function svg(piezas, extra = "") {
  return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" class="ico"${extra}>${piezas}</svg>`;
}

/* ===================== ÁRBOLES DE HABILIDAD ===================== */

export const ICONOS_ARBOL = {
  // Mancuerna
  fitness: svg(
    r(1, 4, 2, 4, C.gris) + r(9, 4, 2, 4, C.gris) +
    r(3, 5, 6, 2, C.crema) + r(0, 5, 1, 2, C.gris) + r(11, 5, 1, 2, C.gris)
  ),
  // Claqueta de edición
  edicion: svg(
    r(1, 4, 10, 6, C.osc) + r(1, 2, 10, 2, C.crema) +
    r(2, 2, 2, 2, C.osc) + r(6, 2, 2, 2, C.osc) +
    r(4, 6, 4, 2, C.ambar)
  ),
  // Libro abierto
  facultad: svg(
    r(1, 3, 4, 7, C.crema) + r(7, 3, 4, 7, C.crema) +
    r(5, 3, 2, 7, C.gris) +
    r(2, 5, 2, 1, C.gris) + r(8, 5, 2, 1, C.gris) +
    r(2, 7, 2, 1, C.gris) + r(8, 7, 2, 1, C.gris)
  ),
  // Torii
  japones: svg(
    r(1, 2, 10, 2, C.rojo) + r(2, 5, 8, 1, C.rojo) +
    r(3, 4, 2, 7, C.rojo) + r(7, 4, 2, 7, C.rojo)
  ),
  // Moneda
  finanzas: svg(
    r(3, 1, 6, 10, C.oro) + r(1, 3, 10, 6, C.oro) +
    r(5, 3, 2, 6, "#C9A85F") + r(4, 4, 4, 1, "#C9A85F") + r(4, 7, 4, 1, "#C9A85F")
  ),
  // Cámara de stream
  streaming: svg(
    r(1, 3, 7, 6, C.osc) + r(8, 4, 3, 4, C.gris) +
    r(2, 4, 3, 2, C.azul) + r(2, 2, 2, 1, C.rojo)
  )
};

/* ===================== PESTAÑAS ===================== */

export const ICONOS_TAB = {
  // Espada: la misión del día
  hoy: svg(
    r(5, 1, 2, 7, C.cc) + r(4, 8, 4, 1, C.cc) +
    r(3, 9, 6, 1, C.cc) + r(5, 10, 2, 2, C.cc)
  ),
  // Casita
  habitacion: svg(
    r(5, 1, 2, 2, C.cc) + r(3, 3, 6, 2, C.cc) +
    r(1, 5, 10, 1, C.cc) + r(2, 6, 8, 6, C.cc) +
    r(5, 8, 2, 4, "rgba(0,0,0,0.35)")
  ),
  // Barras que suben
  progreso: svg(
    r(1, 8, 2, 4, C.cc) + r(5, 5, 2, 7, C.cc) + r(9, 2, 2, 10, C.cc)
  ),
  // Persona
  vos: svg(
    r(4, 1, 4, 4, C.cc) + r(2, 6, 8, 3, C.cc) + r(1, 9, 10, 3, C.cc)
  )
};

/* ===================== LOGROS =====================
   Diecisiete íconos para diecinueve logros: los tres de
   racha comparten la llama, que es justamente lo que los
   hace leer como una familia. */

export const ICONOS_LOGRO = {
  espada: svg(r(5, 1, 2, 7, C.crema) + r(4, 8, 4, 1, C.gris) + r(5, 9, 2, 3, C.gris)),
  llama:  svg(r(5, 1, 2, 3, C.ambar) + r(3, 4, 6, 5, C.ambar) + r(2, 7, 8, 4, C.rosa) + r(5, 8, 2, 3, C.oro)),
  pergamino: svg(r(2, 1, 8, 10, C.crema) + r(3, 3, 6, 1, C.gris) + r(3, 5, 6, 1, C.gris) + r(3, 7, 4, 1, C.gris)),
  trofeo: svg(r(3, 1, 6, 5, C.oro) + r(1, 2, 2, 2, C.oro) + r(9, 2, 2, 2, C.oro) + r(5, 6, 2, 3, C.oro) + r(3, 9, 6, 2, C.oro)),
  estrella: svg(r(5, 1, 2, 10, C.oro) + r(1, 4, 10, 3, C.oro) + r(3, 2, 6, 7, C.oro)),
  estrella2: svg(r(5, 0, 2, 12, C.rosa) + r(0, 5, 12, 2, C.rosa) + r(2, 2, 8, 8, C.oro) + r(4, 4, 4, 4, C.crema)),
  balanza: svg(r(5, 1, 2, 10, C.crema) + r(1, 3, 10, 1, C.crema) + r(1, 4, 3, 2, C.ambar) + r(8, 4, 3, 2, C.ambar) + r(3, 11, 6, 1, C.crema)),
  cuaderno: svg(r(2, 1, 8, 10, C.rosa) + r(2, 1, 2, 10, "#D4708A") + r(5, 3, 4, 1, C.crema) + r(5, 5, 4, 1, C.crema) + r(5, 7, 3, 1, C.crema)),
  sillon: svg(r(1, 5, 10, 4, C.rosa) + r(2, 3, 8, 3, "#D4708A") + r(1, 9, 2, 2, C.gris) + r(9, 9, 2, 2, C.gris)),
  casa: svg(r(5, 1, 2, 2, C.verde) + r(3, 3, 6, 2, C.verde) + r(1, 5, 10, 1, C.verde) + r(2, 6, 8, 5, C.verde) + r(5, 8, 2, 3, C.osc)),
  torta: svg(r(5, 0, 2, 3, C.ambar) + r(2, 3, 8, 3, C.crema) + r(1, 6, 10, 5, C.rosa) + r(1, 8, 10, 1, C.crema)),
  birrete: svg(r(1, 4, 10, 2, C.osc) + r(3, 6, 6, 2, C.osc) + r(5, 2, 2, 2, C.osc) + r(9, 6, 1, 4, C.oro)),
  manos: svg(r(1, 4, 5, 4, C.crema) + r(6, 4, 5, 4, "#D9A277") + r(4, 5, 4, 2, C.ambar)),
  billete: svg(r(1, 3, 10, 6, C.verde) + r(3, 5, 6, 2, "#6BAF85") + r(5, 5, 2, 2, C.crema)),
  claqueta: svg(r(1, 4, 10, 6, C.osc) + r(1, 2, 10, 2, C.crema) + r(3, 2, 2, 2, C.osc) + r(7, 2, 2, 2, C.osc) + r(4, 6, 4, 2, C.ambar)),
  camara: svg(r(1, 3, 7, 6, C.osc) + r(8, 4, 3, 4, C.gris) + r(2, 4, 3, 2, C.azul) + r(2, 2, 2, 1, C.rojo)),
  torii: svg(r(1, 2, 10, 2, C.rojo) + r(2, 5, 8, 1, C.rojo) + r(3, 4, 2, 7, C.rojo) + r(7, 4, 2, 7, C.rojo))
};

/* Qué ícono usa cada logro. Los tres de racha comparten
   llama a propósito: se leen como una familia. */
export const LOGRO_ICONO = {
  primera: "espada", racha3: "llama", racha7: "llama", racha30: "llama",
  mis50: "pergamino", mis365: "trofeo", nivel5: "estrella", nivel10: "estrella2",
  equilibrio: "balanza", diario7: "cuaderno", decorador: "sillon", hogar: "casa",
  anio: "torta", materia: "birrete", cliente: "manos", dolares: "billete",
  horas100: "claqueta", stream: "camara", japon: "torii"
};

export function iconoLogro(id) {
  return ICONOS_LOGRO[LOGRO_ICONO[id]] || ICONOS_LOGRO.trofeo;
}
