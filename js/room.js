/* ============================================================
   MAIN QUEST — room.js
   ------------------------------------------------------------
   Tu habitación. La función más importante del PRD (sección 6):
   no es un avatar, es un hogar que evoluciona con vos.

   Cómo funciona:
   - El cuarto es UN archivo SVG (assets/cuarto.svg) con el
     arte base siempre visible (cama, escritorio, notebook,
     ventana al atardecer) y un grupo <g id="item-XXX"> por
     cada cosa comprable.
   - Este módulo carga ese SVG una vez y apaga los grupos
     que todavía no compraste. Comprar = encender un grupo.

   Por qué SVG y no imágenes PNG: pesa 6 KB en total, se ve
   nítido en cualquier pantalla (incluida la Retina de tu
   iPhone), y cambiar un color del cuarto es editar una línea.
   ============================================================ */

import { dibujarAvatar } from "./avatar.js";

let data;
let svgCargado = false;

/* ------------------------------------------------------------
   Enciende o apaga cada ítem según el inventario.
   ------------------------------------------------------------ */
function aplicarInventario() {
  const comprados = new Set(data.economia.inventario.map((i) => i.id));

  // Los ítems se leen del propio SVG, no del catálogo: así el
  // cuarto no depende de economy.js (evita el import circular)
  // y agregar un mueble nuevo es tocar un solo archivo, el SVG.
  const grupos = document.querySelectorAll("#cuarto [id^='item-']");

  for (const g of grupos) {
    const id = g.id.replace("item-", "");
    if (comprados.has(id)) {
      g.style.display = "";
      // Lo recién comprado entra con un pop (ver CSS .item-nuevo)
      if (!g.dataset.visto) {
        g.classList.add("item-nuevo");
        g.dataset.visto = "1";
        g.addEventListener("animationend", () => g.classList.remove("item-nuevo"), { once: true });
      }
    } else {
      g.style.display = "none";
      delete g.dataset.visto;
    }
  }

  dibujarEnEscena();

  const total = grupos.length;
  const info = document.getElementById("cuarto-progreso");
  if (info) {
    info.textContent = comprados.size === 0
      ? "Tu cuarto arranca simple. Todo lo demás se gana."
      : `${comprados.size} de ${total} cosas desbloqueadas`;
  }
}

/* ------------------------------------------------------------
   Mete tu avatar dentro de la escena, parado sobre la
   alfombra. El cuarto mide 160x120 y el avatar 48x80; la
   escala 0.625 lo deja de 30x50, que es la mitad del alto
   de la pared: presencia de protagonista, no de NPC.
   ------------------------------------------------------------ */
function dibujarEnEscena() {
  const svg = document.querySelector("#cuarto svg");
  if (!svg) return;

  const anterior = document.getElementById("avatar-en-cuarto");
  if (anterior) anterior.remove();

  const cuerpo = dibujarAvatar()
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.id = "avatar-en-cuarto";
  g.setAttribute("transform", "translate(38, 62) scale(0.625)");
  g.innerHTML = cuerpo;
  svg.appendChild(g); // último = adelante de los muebles
}

/* ------------------------------------------------------------
   Carga del SVG. Se hace una sola vez: después solo se
   encienden y apagan grupos, que es instantáneo.
   ------------------------------------------------------------ */
async function cargarCuarto() {
  const cont = document.getElementById("cuarto");
  if (!cont || svgCargado) return;

  try {
    const resp = await fetch("./assets/cuarto.svg");

    // fetch NO falla solo por un 404: devuelve la página de
    // error. Sin este chequeo, inyectábamos el HTML del 404
    // en el cuarto y quedaba en blanco sin decir por qué.
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const texto = await resp.text();
    if (!texto.trim().startsWith("<svg")) throw new Error("no es un SVG");

    cont.innerHTML = texto;
    svgCargado = true;
    aplicarInventario();
  } catch (err) {
    cont.innerHTML = `<p class="secundarias-vacio">
      No se pudo cargar el cuarto (${err.message}).<br>
      Revisá que <strong>assets/cuarto.svg</strong> esté subido al repo.
    </p>`;
  }
}

/* ------------------------------------------------------------
   API del módulo
   ------------------------------------------------------------ */
export function refrescarCuarto() {
  if (svgCargado) aplicarInventario();
}

export function setDatosCuarto(appData) {
  data = appData;
  if (svgCargado) {
    // Backup importado: el inventario puede ser otro,
    // así que se recalcula todo desde cero.
    document.querySelectorAll("[id^='item-']").forEach((g) => delete g.dataset.visto);
    aplicarInventario();
  }
}

export function initCuarto(appData) {
  data = appData;

  // Si cambiás de ropa en VOS, el avatar del cuarto se actualiza.
  document.addEventListener("avatar-cambiado", dibujarEnEscena);

  cargarCuarto();
}
