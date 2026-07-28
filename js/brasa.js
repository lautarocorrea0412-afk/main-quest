/* ============================================================
   MAIN QUEST — brasa.js
   ------------------------------------------------------------
   El compañero de la intro: una criatura naranja cálida con
   una llamita en la cola. Evoca a un starter de fuego —la
   chispa, el entusiasmo— pero dibujada por nosotros, en SVG,
   para que la llama pueda ILUMINAR de verdad y reaccionar a la
   luz por hora (más viva de noche).

   Tres piezas, cada una un SVG independiente:
   - brasaDormida(): hecho un ovillo, en paz. Para el arranque.
   - brasaAlerta(): cabeza levantada, te mira. Para cuando el
     avatar te nota.
   - La LLAMA va como capa aparte (clase .brasa-llama) para que
     el CSS la haga titilar e iluminar sin re-dibujar el cuerpo.

   Paleta cálida propia (no copia ninguna IP): naranja quemado,
   panza crema, llama amarillo-naranja.
   ============================================================ */

const C = {
  cuerpo: "#E8843C",   // naranja brasa
  cuerpo_sh: "#C96A2A",// sombra del cuerpo
  panza: "#F6D9A8",    // crema
  llama_1: "#FFD24A",  // amarillo (centro)
  llama_2: "#FF9A3C",  // naranja (medio)
  llama_3: "#FF6B3C",  // rojo-naranja (borde)
  ojo: "#3A2418"       // marrón oscuro cálido
};

function r(x, y, w, h, c, extra="") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`;
}
function circ(cx, cy, rad, c, extra="") {
  return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${c}"${extra}/>`;
}
function poly(pts, c, extra="") {
  const p = pts.map(([x, y]) => `${x},${y}`).join(" ");
  return `<polygon points="${p}" fill="${c}"${extra}/>`;
}

/* La llama, como pieza reutilizable. Va en su propio <g> con la
   clase que el CSS anima. cx,cy es la base de la llama. */
function llamaSVG(cx, cy, escala = 1) {
  const s = escala;
  return `<g class="brasa-llama">
    ${poly([[cx, cy - 14*s], [cx - 5*s, cy], [cx + 5*s, cy]], C.llama_3)}
    ${poly([[cx, cy - 10*s], [cx - 3.5*s, cy], [cx + 3.5*s, cy]], C.llama_2)}
    ${poly([[cx, cy - 6*s], [cx - 2*s, cy], [cx + 2*s, cy]], C.llama_1)}
  </g>`;
}

/* ------------------------------------------------------------
   DORMIDA: un ovillo. Cuerpo redondeado, cola enroscada al
   costado con la llamita asomando, ojos como líneas (cerrados).
   viewBox 60x48. La llama titila suave (dormida = respira).
   ------------------------------------------------------------ */
export function brasaDormida() {
  return `<svg viewBox="0 0 60 48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" class="brasa brasa--dormida">
    <!-- cola enroscada a la derecha, con la llama en la punta -->
    ${circ(46, 34, 7, C.cuerpo_sh)}
    ${llamaSVG(52, 28, 0.8)}
    <!-- cuerpo ovillado -->
    ${circ(26, 32, 15, C.cuerpo)}
    ${circ(26, 36, 12, C.cuerpo_sh, ' opacity="0.5"')}
    <!-- panza -->
    ${circ(24, 36, 8, C.panza, ' opacity="0.9"')}
    <!-- cabeza apoyada -->
    ${circ(15, 30, 9, C.cuerpo)}
    <!-- orejita -->
    ${poly([[9,24],[13,20],[15,26]], C.cuerpo)}
    <!-- ojo cerrado (línea) -->
    ${r(11, 30, 5, 1.4, C.ojo)}
  </svg>`;
}

/* ------------------------------------------------------------
   ALERTA: sentado, cabeza en alto, te mira. Ojos abiertos,
   orejas paradas, cola con la llama viva atrás. viewBox 60x56.
   ------------------------------------------------------------ */
export function brasaAlerta() {
  return `<svg viewBox="0 0 60 56" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" class="brasa brasa--alerta">
    <!-- cola atrás con la llama viva -->
    ${r(40, 30, 6, 14, C.cuerpo_sh)}
    ${poly([[43,30],[52,22],[48,32]], C.cuerpo_sh)}
    ${llamaSVG(50, 22, 1)}
    <!-- cuerpo sentado -->
    ${circ(24, 40, 13, C.cuerpo)}
    ${r(12, 40, 24, 12, C.cuerpo)}
    <!-- panza -->
    ${circ(24, 44, 8, C.panza)}
    <!-- patitas -->
    ${r(16, 50, 5, 4, C.cuerpo_sh)}
    ${r(28, 50, 5, 4, C.cuerpo_sh)}
    <!-- cabeza en alto -->
    ${circ(24, 22, 12, C.cuerpo)}
    <!-- orejas paradas -->
    ${poly([[14,14],[18,4],[22,14]], C.cuerpo)}
    ${poly([[26,14],[30,4],[34,14]], C.cuerpo)}
    ${poly([[15,13],[18,7],[20,13]], C.cuerpo_sh)}
    <!-- ojos abiertos, mirándote -->
    ${circ(20, 22, 2.4, C.ojo)}
    ${circ(29, 22, 2.4, C.ojo)}
    ${circ(20.8, 21.2, 0.8, "#fff")}
    ${circ(29.8, 21.2, 0.8, "#fff")}
    <!-- naricita -->
    ${r(23, 27, 3, 2, C.cuerpo_sh)}
  </svg>`;
}

/* Un pez saltando: el easter egg del 1-de-50. Naranja/plata,
   tonto y feliz. viewBox chico; se anima con un arco en CSS. */
export function pezEasterEgg() {
  const cuerpo = "#C0C8D4", aleta = "#E8843C";
  return `<svg viewBox="0 0 32 24" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" class="intro-pez">
    ${poly([[4,12],[10,6],[10,18]], aleta)}
    ${circ(18, 12, 8, cuerpo)}
    ${poly([[26,12],[31,7],[31,17]], aleta)}
    ${circ(20, 10, 1.6, "#3A2418")}
    ${r(14, 8, 8, 1.2, "#fff", ' opacity="0.5"')}
  </svg>`;
}
