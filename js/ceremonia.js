/* ============================================================
   MAIN QUEST — ceremonia.js
   ------------------------------------------------------------
   "Tu rincón": la ceremonia de apertura. La firma visual de
   la app, pensada como el inicio de un videojuego, no como
   una pantalla de carga.

   La secuencia (~3.8s, una sola idea: tu cuarto despertando):
   0.0-0.6  oscuridad + un punto de luz cálido que late donde
            va la lámpara. Su color ya es el de tu hora real.
   0.6-2.0  el cuarto se enciende POR PARTES y en orden:
            ventana → cama → escritorio → avatar. Cada cosa
            entra con un rebote. Es "mi rincón despertando".
   2.0-2.8  el avatar cobra vida: respira y hace UNA micro-
            acción al azar (pestañea, mira al costado, ajusta
            los hombros). Aleatoria: nunca es idéntica.
   2.8-3.8  aparece MAIN QUEST y, debajo, una frase que el
            motor elige según tu día. Disolvencia a HOY.

   Decisiones (tomadas con Lautaro):
   - Aparece SIEMPRE, salvo reapertura accidental (<30s).
   - Salteable solo manteniendo apretado (no un tap): es una
     ceremonia, no un obstáculo, pero el día apurado tenés
     salida.
   - Luz según la hora real (mañana/tarde/noche).
   - Respeta prefers-reduced-motion: sin animación, va directo.
   - Muda: en iOS el audio necesita un toque previo y esto
     arranca solo.
   ============================================================ */

import { save } from "./store.js";
import { hoyISO } from "./util.js";
import { dibujarAvatar } from "./avatar.js";
import { franjaLuz } from "./util.js";
import { fraseCeremonia } from "./engine.js";

let data;

/* La ventana de gracia: si cerraste hace menos de esto, fue
   sin querer y no repetimos la ceremonia. */
const GRACIA_MS = 30000;
const CLAVE_CIERRE = "mainquest_cerrada_en";

/* Luz de la ceremonia según la hora. Más saturada que la luz
   ambiente normal: acá la luz es protagonista. */
const LUCES = {
  manana: "#FFD98C",
  tarde:  "#FFB067",
  noche:  "#8FA2E8"
};

/* ¿Corresponde la ceremonia? Siempre, salvo que hayas cerrado
   hace menos de 30 segundos (reapertura accidental).
   Exportada para testearse. */
export function tocaCeremonia(ahora = Date.now(), storage = globalThis.localStorage) {
  try {
    const cerrada = Number(storage?.getItem(CLAVE_CIERRE) || 0);
    if (cerrada && ahora - cerrada < GRACIA_MS) return false;
  } catch { /* sin storage: que aparezca */ }
  return true;
}

/* Registrar el cierre, para poder detectar la reapertura
   accidental. Lo llama app.js al perder visibilidad. */
export function registrarCierre(storage = globalThis.localStorage) {
  try { storage?.setItem(CLAVE_CIERRE, String(Date.now())); } catch { /* nada */ }
}

function reduceMovimiento() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

/* Las micro-acciones del avatar: una se elige al azar cada
   apertura, así la ceremonia nunca se siente calcada. */
const ACCIONES = ["pestanear", "mirar", "hombros", "respirar"];

/* ------------------------------------------------------------
   Corre la ceremonia. Promesa que se resuelve al terminar (o
   al saltearla), para que app.js muestre HOY recién después.
   ------------------------------------------------------------ */
export function correrCeremonia(datos) {
  data = datos;

  if (reduceMovimiento()) return Promise.resolve();

  return new Promise((resolve) => {
    let cerrada = false;
    const franja = franjaLuz(new Date().getHours());
    const luz = LUCES[franja];
    const accion = ACCIONES[Math.floor(Math.random() * ACCIONES.length)];

    const overlay = document.createElement("div");
    overlay.className = `ceremonia ceremonia--${franja}`;
    overlay.style.setProperty("--luz-ceremonia", luz);
    overlay.setAttribute("role", "presentation");

    overlay.innerHTML = `
      <div class="cer-escena">
        <div class="cer-luz"></div>
        <div class="cer-cuarto">
          <div class="cer-ventana"></div>
          <div class="cer-cama"></div>
          <div class="cer-escritorio"></div>
          <div class="cer-avatar cer-accion--${accion}">${dibujarAvatar(1)}</div>
        </div>
      </div>
      <div class="cer-marca">
        <div class="cer-logo">MAIN<span>/</span>QUEST</div>
        <div class="cer-frase">${fraseCeremonia()}</div>
      </div>
      <div class="cer-saltar"><span>Mantené apretado para saltar</span></div>`;

    document.body.appendChild(overlay);

    const terminar = () => {
      if (cerrada) return;
      cerrada = true;
      overlay.classList.add("cer-fin");
      const quitar = () => { overlay.remove(); resolve(); };
      overlay.addEventListener("transitionend", quitar, { once: true });
      setTimeout(quitar, 700); // red de seguridad > animación de salida
    };

    /* Saltar solo con MANTENER APRETADO (600ms). Un tap no
       hace nada: la ceremonia no se saltea sin querer. */
    let timerHold = null;
    const saltar = overlay.querySelector(".cer-saltar");
    const iniciarHold = (e) => {
      e.preventDefault();
      saltar.classList.add("cer-saltar--activo");
      timerHold = setTimeout(terminar, 600);
    };
    const cancelarHold = () => {
      saltar.classList.remove("cer-saltar--activo");
      if (timerHold) { clearTimeout(timerHold); timerHold = null; }
    };
    saltar.addEventListener("pointerdown", iniciarHold);
    saltar.addEventListener("pointerup", cancelarHold);
    saltar.addEventListener("pointerleave", cancelarHold);
    saltar.addEventListener("pointercancel", cancelarHold);

    /* La coreografía: clases que entran en su momento. El CSS
       hace el resto. Sin librerías. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add("cer-luz-on"));
    });
    setTimeout(() => overlay.classList.add("cer-p1"), 600);   // ventana
    setTimeout(() => overlay.classList.add("cer-p2"), 900);   // cama
    setTimeout(() => overlay.classList.add("cer-p3"), 1200);  // escritorio
    setTimeout(() => overlay.classList.add("cer-p4"), 1550);  // avatar
    setTimeout(() => overlay.classList.add("cer-viva"), 2100); // micro-acción
    setTimeout(() => overlay.classList.add("cer-marca-on"), 2850); // logo + frase
    setTimeout(terminar, 3800);
  });
}
