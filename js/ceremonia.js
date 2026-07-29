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
import { sonar, setSonido, setMusica } from "./sonido.js";
import { pezEasterEgg } from "./brasa.js";

let data;
let escenaCache = null;

/* Carga la ilustración una vez. La trampa de iOS de siempre:
   fetch NO falla con 404, hay que chequear resp.ok o se
   inyecta el HTML de error dentro de la escena. */
async function cargarEscena() {
  if (escenaCache) return escenaCache;
  try {
    const resp = await fetch("./assets/intro.svg");
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

function sakura(n = 10) {
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

  const svgTexto = await cargarEscena();
  const franja = franjaLuz(new Date().getHours());
  const luz = LUCES[franja];

  // El easter egg: 1 de cada 50 aberturas, en vez del pajarito
  // lejano salta un pez en el lago. Tan raro que dudás si lo viste.
  const easterEgg = Math.floor(Math.random() * 50) === 0;

  // reduce-motion: sin coreografía, pero NO nos saltamos la intro
  // entera —mostramos la escena quieta y el botón—, así el momento
  // (el mate, el compañero) sigue existiendo para quien lo pidió.
  const quieto = reduceMovimiento();

  return new Promise((resolve) => {
    let entrado = false;

    const overlay = document.createElement("div");
    overlay.className = `intro intro-${franja}` + (quieto ? " intro-quieto" : "");
    overlay.style.setProperty("--luz-intro", luz);
    overlay.setAttribute("role", "presentation");

    /* Estructura por planos, de atrás hacia adelante:
       - la escena SVG (colina/valle/lago/sakura) con su capa de luz
       - la fauna lejana (pajarito o, raras veces, el pez)
       - el avatar (de espaldas primero, mirando el valle)
       - el compañero-brasa (dormido primero)
       - los pétalos que caen sobre todo
       - el título + la frase + el botón */
    const fauna = easterEgg
      ? `<div class="intro-fauna intro-fauna--pez">${pezEasterEgg()}</div>`
      : `<div class="intro-fauna intro-fauna--ave"><span class="intro-ave"></span></div>`;

    overlay.innerHTML = `
      <div class="intro-camara">
        <div class="intro-escena">
          ${svgTexto}
          <div class="intro-luz"></div>
          ${fauna}
          <div class="intro-avatar">
            <div class="intro-avatar__frente">${dibujarAvatar(1)}</div>
          </div>
          <div class="intro-mate"></div>
          <div class="intro-petalos">${sakura()}</div>
        </div>
      </div>
      <div class="intro-titulo"><span>MAIN<b>/</b>QUEST</span></div>
      <div class="intro-marca"><div class="intro-frase">${fraseCeremonia()}</div></div>
      <button class="intro-entrar" type="button">Tocá para aceptar el mate</button>`;

    document.body.appendChild(overlay);

    const entrar = () => {
      if (entrado) return;
      entrado = true;
      // El toque despierta el audio (gesto real) y suena el acorde.
      setSonido(data.ajustes && data.ajustes.sonido);
      sonar("entrar");
      setMusica(data.ajustes && data.ajustes.musica);
      /* EL "¿VAMOS?": el avatar se para de un envión y el compañero
         salta, la llama prende fuerte. Después, la cámara avanza y
         funde a HOY. No cerrás una postal: arranca la aventura. */
      overlay.classList.add("intro-vamos");
      const salir = () => { overlay.remove(); resolve(); };
      // Damos tiempo al "let's go" antes del fundido.
      setTimeout(() => {
        overlay.classList.add("intro-entrando");
        overlay.addEventListener("transitionend", salir, { once: true });
        setTimeout(salir, 1200); // red de seguridad
      }, quieto ? 0 : 620);
    };

    const btn = overlay.querySelector(".intro-entrar");
    btn.addEventListener("click", entrar);
    // Tocar en la escena ya revelada también entra.
    overlay.querySelector(".intro-camara").addEventListener("click", () => {
      if (overlay.classList.contains("intro-lista")) entrar();
    });

    if (quieto) {
      // Sin animación: mostramos todo listo y el botón activo.
      overlay.classList.add("intro-revelada", "intro-mira", "intro-lista");
      return;
    }

    /* LA COREOGRAFÍA. Clases que entran a su tiempo; el CSS hace
       el resto. Ritmo pensado para que en los primeros ~2s ya
       haya pasado algo (fauna, viento) y el mundo se sienta vivo
       ANTES de que el avatar te note. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add("intro-revelada"));
    });
    // 1.1s: el avatar te nota y gira; el compañero despierta.
    setTimeout(() => overlay.classList.add("intro-mira"), 1100);
    // 1.9s: EL MOMENTO — ofrece el mate, aparece el título.
    setTimeout(() => overlay.classList.add("intro-mate-on"), 1900);
    setTimeout(() => overlay.classList.add("intro-titulo-on"), 2200);
    // 2.9s: queda vivo, esperando. El botón responde.
    setTimeout(() => overlay.classList.add("intro-lista"), 2900);
  });
}
