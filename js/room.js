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

  const total = grupos.length;
  const info = document.getElementById("cuarto-progreso");
  if (info) {
    info.textContent = comprados.size === 0
      ? "Tu cuarto arranca simple. Todo lo demás se gana."
      : `${comprados.size} de ${total} cosas desbloqueadas`;
  }
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
    cont.innerHTML = await resp.text();
    svgCargado = true;
    aplicarInventario();
  } catch {
    cont.innerHTML = `<p class="secundarias-vacio">No se pudo cargar el cuarto. Probá abrir la app con internet una vez.</p>`;
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
  cargarCuarto();
}
