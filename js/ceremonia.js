/* ============================================================
   MAIN QUEST — ceremonia.js  ·  "El regreso"
   ------------------------------------------------------------
   No es una intro que construye un cuarto. Es un cuarto que
   YA ESTABA VIVO y al que volvés. La diferencia narrativa lo
   es todo: no armás la escena, interrumpís una que ya estaba
   pasando. Él ya estaba ahí. Vos llegaste.

   Cuatro tiempos (~5s, después espera tu toque):

   T1 (0-1.5s) · YA HAY ALGUIEN. El cuarto en penumbra azul.
      El avatar ya está, de espaldas, mirando la ventana,
      respirando. No aparece: lo descubrís. Polvo flotando.

   T2 (1.5-2.8s) · EL MOMENTO WOW. Prende la lámpara y la luz
      cálida se DERRAMA desde ese punto, revelando el cuarto
      como cuando prendés el velador. El polvo brilla dorado.

   T3 (2.8-4s) · TE MIRA. Levanta la cabeza, gira despacio, te
      mira. Ese giro es el vínculo. Cae sakura (de noche, más
      lenta y tenue).

   T4 (4-5s +) · EL TÍTULO Y TU DECISIÓN. La luz revela el
      póster de MAIN QUEST en la pared. Tu frase debajo. Y la
      ceremonia SE QUEDA: el cuarto sigue vivo (respira, la
      cortina se mueve, cae alguna hoja, la lámpara titila),
      esperando "Tocar para entrar". Vos decidís.

   Al tocar: travelling hacia adelante (la cámara entra al
   cuarto) y recién ahí aparece HOY. No un fade: entrás.

   Decisiones (con Lautaro):
   - Aparece SIEMPRE que la app se abre desde cero.
   - No desaparece sola: espera tu toque.
   - Luz según la hora real.
   - Solo sakura, sin luciérnagas (rendimiento en iPhone).
   - Respeta prefers-reduced-motion.
   - Muda (en iOS el audio necesita toque previo).
   ============================================================ */

import { hoyISO } from "./util.js";
import { dibujarAvatar } from "./avatar.js";
import { franjaLuz } from "./util.js";
import { fraseCeremonia } from "./engine.js";
import { sonar, setSonido } from "./sonido.js";

let data;
let escenaCache = null;

/* Carga la ilustración una vez. La trampa de iOS de siempre:
   fetch NO falla con 404, hay que chequear resp.ok o se
   inyecta el HTML de error dentro de la escena. */
async function cargarEscena() {
  if (escenaCache) return escenaCache;
  try {
    const resp = await fetch("./assets/ceremonia.svg");
    if (!resp.ok) throw new Error("no se pudo cargar la escena");
    escenaCache = await resp.text();
  } catch {
    escenaCache = ""; // sin ilustración, la ceremonia sigue (solo luz)
  }
  return escenaCache;
}

const LUCES = {
  manana: "#FFD98C",
  tarde:  "#FFB067",
  noche:  "#8FA2E8"
};

function reduceMovimiento() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

/* Pocas partículas a propósito: 10 motas de polvo y 6 pétalos
   se SIENTEN sin trabar el iPhone. No es un campo de mil
   hojas; son las justas para que el cuarto respire. */
function polvo(n = 10) {
  let html = "";
  for (let i = 0; i < n; i++) {
    const x = Math.round(Math.random() * 100);
    const y = Math.round(Math.random() * 100);
    const d = (Math.random() * 3 + 3).toFixed(1);
    const delay = (Math.random() * 4).toFixed(1);
    html += `<span class="cer-mota" style="left:${x}%;top:${y}%;animation-duration:${d}s;animation-delay:${delay}s"></span>`;
  }
  return html;
}

function sakura(n = 6) {
  let html = "";
  for (let i = 0; i < n; i++) {
    const x = Math.round(Math.random() * 100);
    const d = (Math.random() * 4 + 5).toFixed(1);
    const delay = (Math.random() * 5).toFixed(1);
    html += `<span class="cer-petalo" style="left:${x}%;animation-duration:${d}s;animation-delay:${delay}s"></span>`;
  }
  return html;
}

/* ------------------------------------------------------------
   Corre la ceremonia. La promesa se resuelve cuando el
   usuario TOCA para entrar (no sola), tras el travelling.
   ------------------------------------------------------------ */
export async function correrCeremonia(datos) {
  data = datos;
  if (reduceMovimiento()) return;

  const svgTexto = await cargarEscena();

  return new Promise((resolve) => {
    let entrado = false;
    const franja = franjaLuz(new Date().getHours());
    const luz = LUCES[franja];

    const overlay = document.createElement("div");
    overlay.className = `ceremonia cer-${franja}`;
    overlay.style.setProperty("--luz-ceremonia", luz);
    overlay.setAttribute("role", "presentation");

    /* El avatar arranca DE ESPALDAS (mirando la ventana) y en
       T3 gira al frente. Dos versiones: la de espaldas es una
       silueta simple; la de frente es el avatar de siempre. */
    /* La escena es una ILUSTRACIÓN pixel-art (assets/ceremonia.svg),
       no bloques CSS. Se carga inline para poder animar sus
       capas (<g id="esc-...">) y superponerle la luz. */
    overlay.innerHTML = `
      <div class="cer-vineta"></div>
      <div class="cer-camara">
        <div class="cer-escena">
          ${svgTexto}
          <div class="cer-cono"></div>
          <div class="cer-avatar">${dibujarAvatar(1)}</div>
          <div class="cer-titulo-txt"><span>MAIN<b>/</b>QUEST</span></div>
          <div class="cer-polvo">${polvo()}</div>
          <div class="cer-sakura">${sakura()}</div>
        </div>
      </div>
      <div class="cer-marca">
        <div class="cer-frase">${fraseCeremonia()}</div>
      </div>
      <button class="cer-entrar" type="button">Tocar para comenzar</button>`;

    document.body.appendChild(overlay);

    const entrar = () => {
      if (entrado) return;
      entrado = true;
      // El toque de "entrar" es un gesto real: buen momento para
      // que el audio despierte y suene el acorde de bienvenida.
      setSonido(data.ajustes && data.ajustes.sonido);
      sonar("entrar");
      /* Travelling: la cámara AVANZA hacia el cuarto (zoom in)
         y funde a HOY. No es un fade plano: entrás al juego. */
      overlay.classList.add("cer-entrando");
      const salir = () => { overlay.remove(); resolve(); };
      overlay.addEventListener("transitionend", salir, { once: true });
      setTimeout(salir, 1100); // red de seguridad > animación
    };

    const btn = overlay.querySelector(".cer-entrar");
    // El botón aparece recién al final; hasta entonces no responde.
    btn.addEventListener("click", entrar);
    // Tocar en cualquier lado del cuarto ya revelado también entra.
    overlay.querySelector(".cer-camara").addEventListener("click", () => {
      if (overlay.classList.contains("cer-lista")) entrar();
    });

    /* La coreografía por tiempos. Clases que entran a su hora;
       el CSS hace todo el resto. Sin librerías. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add("cer-t1")); // penumbra + silueta
    });
    setTimeout(() => overlay.classList.add("cer-lampara-on"), 1500); // WOW: prende la luz
    setTimeout(() => overlay.classList.add("cer-revelado"), 1900);   // el cuarto se derrama
    setTimeout(() => overlay.classList.add("cer-gira"), 2800);       // te mira
    setTimeout(() => overlay.classList.add("cer-titulo"), 4000);     // póster + frase
    setTimeout(() => overlay.classList.add("cer-lista"), 4700);      // "tocar para entrar"
  });
}
