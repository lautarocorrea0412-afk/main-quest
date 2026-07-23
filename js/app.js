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
import { renderArboles } from "./xp.js";
import { initEngine, setDatosEngine } from "./engine.js";
import { initDiario, setDatosDiario } from "./journal.js";
import { initEconomia, setDatosEconomia } from "./economy.js";
import { initCuarto, setDatosCuarto } from "./room.js";

let data = load();

/* ------------------------------------------------------------
   Render inicial
   ------------------------------------------------------------ */

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

  // Árboles de habilidades (los dibuja el módulo de XP)
  renderArboles(data);

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
    "MAIN QUEST · Fase 2 · Paso 2b · datos v" + data.version;
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
    setDatosEngine(data);
    setDatosDiario(data);
    setDatosEconomia(data);
    setDatosCuarto(data);
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
initEngine(data);
initDiario(data);
initEconomia(data);
initCuarto(data);
