/* ============================================================
   MAIN QUEST — ceremonia.js
   ------------------------------------------------------------
   "Tu rincón": la ceremonia de apertura, UNA vez por día.

   Por qué una vez por día y no en cada apertura: Lautaro abre
   esta app cada mañana durante años. Todo lo que se meta entre
   el tap y su misión es fricción, y la fricción diaria mata
   las apps de hábito. Una vez por día no se gasta nunca, y
   encima marca "arrancó el día", que es justo lo que la app
   quiere hacer.

   La secuencia (una sola idea encadenada, ~1.8s):
   1. Pantalla oscura.
   2. La espada del logo se dibuja píxel por píxel (booteo retro).
   3. Ese último píxel SE TRANSFORMA en la luz de la lámpara.
      El logo no termina y empieza otra cosa: el logo se vuelve
      la luz. Si esa transición no se siente como una sola cosa,
      la ceremonia falló.
   4. El cuarto se enciende de abajo hacia arriba.
   5. El avatar queda mirando al frente.

   Decisiones tomadas (de las notas de Lautaro):
   - NO es una pestaña: es un momento previo, sin tab bar.
   - MUDA. En iOS el audio necesita un toque previo para
     sonar, y esto arranca solo. Se diseña sin sonido.
   - Salteable con un tap en cualquier momento.
   - Respeta prefers-reduced-motion: si está activo, no hay
     ceremonia (se lee del sistema, no necesita ajuste propio).
   - El hanko NO se usa acá: es el premio por cumplir, si
     también abriera la app dejaría de ser un momento ganado.
   ============================================================ */

import { save } from "./store.js";
import { hoyISO } from "./util.js";
import { dibujarAvatar } from "./avatar.js";

let data;

/* ¿Corresponde la ceremonia? Solo la primera apertura del día.
   Exportada para testearse. */
export function tocaCeremonia(datos, hoy = hoyISO()) {
  return datos.perfil.ultima_ceremonia !== hoy;
}

function reduceMovimiento() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

/* ------------------------------------------------------------
   Marca la ceremonia como vista hoy. Se llama SIEMPRE que
   correspondía, con o sin animación, así el que activó
   "reducir movimiento" tampoco la ve dos veces.
   ------------------------------------------------------------ */
function marcarVista() {
  data.perfil.ultima_ceremonia = hoyISO();
  save(data);
}

/* La espada del logo, en píxeles. Cada rect es un "paso" del
   booteo: se encienden en orden con un pequeño retraso. */
const ESPADA = [
  // [x, y, w, h] sobre una grilla de 40x40, centrada
  [19, 4, 2, 20],   // hoja
  [18, 6, 1, 16], [21, 6, 1, 16],
  [16, 24, 8, 2],   // guarda
  [14, 24, 2, 2], [24, 24, 2, 2],
  [18, 26, 4, 6],   // empuñadura
  [19, 32, 2, 3]    // pomo
];

/* ------------------------------------------------------------
   Corre la ceremonia. Devuelve una promesa que se resuelve
   cuando termina (o cuando el usuario la saltea), para que
   el que la llama muestre la app recién después.
   ------------------------------------------------------------ */
export function correrCeremonia(datos) {
  data = datos;

  // Sin animación: marcar y seguir de largo. La app aparece
  // directo, sin ningún parpadeo.
  if (reduceMovimiento()) {
    marcarVista();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let cerrada = false;
    const cerrar = () => {
      if (cerrada) return;
      cerrada = true;
      marcarVista();
      overlay.classList.add("ceremonia--fin");
      // El timeout de seguridad dura MÁS que la animación de
      // salida (regla de la casa): si transitionend no llega,
      // igual se limpia.
      const quitar = () => { overlay.remove(); resolve(); };
      overlay.addEventListener("transitionend", quitar, { once: true });
      setTimeout(quitar, 600);
    };

    const overlay = document.createElement("div");
    overlay.className = "ceremonia";
    overlay.setAttribute("role", "presentation");

    const piezasEspada = ESPADA.map((_, i) =>
      `<rect class="ceremonia__px" data-i="${i}" width="0" height="0" fill="#FBF0E4"/>`
    ).join("");

    overlay.innerHTML = `
      <div class="ceremonia__escena">
        <svg class="ceremonia__logo" viewBox="0 0 40 40" shape-rendering="crispEdges" aria-hidden="true">
          ${piezasEspada}
        </svg>
        <div class="ceremonia__cuarto" aria-hidden="true">
          <div class="ceremonia__luz"></div>
          <div class="ceremonia__avatar">${dibujarAvatar(1)}</div>
        </div>
      </div>
      <button class="ceremonia__saltar" type="button">Saltar</button>`;

    document.body.appendChild(overlay);

    // Un tap en cualquier lado la saltea; el botón también.
    overlay.onclick = cerrar;

    /* --- La coreografía, con timeouts encadenados ---
       No usamos librerías de animación: cada fase es una
       clase que se agrega en su momento y el CSS hace el
       resto. Fácil de leer, fácil de frenar. */
    const px = [...overlay.querySelectorAll(".ceremonia__px")];

    // Fase 1: la espada se dibuja píxel por píxel (~600ms)
    px.forEach((rect, i) => {
      setTimeout(() => {
        const [x, y, w, h] = ESPADA[i];
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", w);
        rect.setAttribute("height", h);
        rect.classList.add("on");
      }, 60 * i);
    });

    // Fase 2: el logo se transforma en la luz de la lámpara
    setTimeout(() => overlay.classList.add("ceremonia--luz"), 720);

    // Fase 3: el cuarto se enciende de abajo hacia arriba
    setTimeout(() => overlay.classList.add("ceremonia--cuarto"), 1050);

    // Fase 4: cierre solo, salvo que ya la hayan salteado
    setTimeout(cerrar, 1900);
  });
}
