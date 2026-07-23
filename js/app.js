/* ============================================================
   MAIN QUEST — app.js
   ------------------------------------------------------------
   Punto de entrada. Hace tres cosas:
   1. Carga los datos (store.js) y pinta la pantalla.
   2. Maneja la navegación entre pestañas.
   3. Conecta los botones de backup.
   La lógica de misiones, XP y mensajes llega en la Fase 1
   como módulos separados: este archivo solo orquesta.
   ============================================================ */

import { load, save, exportar, importar } from "./store.js";
import { initMisiones, setDatos } from "./missions.js";

let data = load();

/* ------------------------------------------------------------
   Render inicial
   ------------------------------------------------------------ */

const ARBOLES_META = {
  fitness:   { emoji: "🏋️", nombre: "Fitness" },
  edicion:   { emoji: "🎬", nombre: "Edición" },
  facultad:  { emoji: "📚", nombre: "Facultad" },
  japones:   { emoji: "🇯🇵", nombre: "Japonés" },
  finanzas:  { emoji: "💰", nombre: "Finanzas" },
  streaming: { emoji: "🎥", nombre: "Streaming" }
};

function render() {
  // Saludo según la hora del día
  const hora = new Date().getHours();
  const saludo =
    hora < 6  ? "Es de madrugada. Dormir también es parte del plan." :
    hora < 13 ? "Buen día" :
    hora < 20 ? "Buenas tardes" :
                "Buenas noches";
  document.getElementById("saludo").innerHTML =
    hora < 6 ? saludo : `${saludo}, <strong>${data.perfil.nombre}</strong>.`;

  // Árboles de habilidades
  const cont = document.getElementById("arboles");
  cont.innerHTML = "";
  for (const [id, meta] of Object.entries(ARBOLES_META)) {
    const arbol = data.arboles[id];
    cont.insertAdjacentHTML("beforeend", `
      <div class="arbol">
        <div class="arbol__emoji">${meta.emoji}</div>
        <div class="arbol__info">
          <div class="arbol__nombre">
            <span>${meta.nombre}</span>
            <span class="arbol__nivel">NV ${arbol.nivel}</span>
          </div>
          <div class="barra"><div class="barra__fill" style="width:0%"></div></div>
        </div>
      </div>
    `);
  }

  // Objetivo Japón
  const japon = data.contexto.objetivo_japon;
  const pct = Math.min(100, Math.round((japon.ahorrado_usd / japon.meta_usd) * 100));
  document.getElementById("japon-titulo").textContent = "Japón · Feb 2027";
  document.getElementById("japon-barra").style.width = pct + "%";
  document.getElementById("japon-detalle").innerHTML =
    `<strong>USD ${japon.ahorrado_usd}</strong> de ${japon.meta_usd} · ${pct}%`;

  // Perfil
  document.getElementById("perfil-nombre").textContent = data.perfil.nombre;
  const desde = new Date(data.perfil.creado_en);
  document.getElementById("perfil-desde").textContent =
    "En esta aventura desde el " + desde.toLocaleDateString("es-AR");

  document.getElementById("version-info").textContent =
    "MAIN QUEST · Fase 1 · Paso 1 · datos v" + data.version;
}

/* ------------------------------------------------------------
   Navegación por pestañas
   ------------------------------------------------------------ */

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("view-" + tab.dataset.view).classList.add("active");
  });
});

/* ------------------------------------------------------------
   Backup
   ------------------------------------------------------------ */

document.getElementById("btn-exportar").addEventListener("click", () => {
  exportar(data);
});

const inputImportar = document.getElementById("input-importar");

document.getElementById("btn-importar").addEventListener("click", () => {
  inputImportar.click();
});

inputImportar.addEventListener("change", async () => {
  const file = inputImportar.files[0];
  if (!file) return;
  try {
    data = await importar(file);
    render();
    setDatos(data);
    alert("Backup restaurado. Bienvenido de vuelta.");
  } catch (err) {
    alert("No se pudo importar: " + err.message);
  }
  inputImportar.value = "";
});

/* ------------------------------------------------------------
   Service worker (offline)
   ------------------------------------------------------------ */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

render();
initMisiones(data);
