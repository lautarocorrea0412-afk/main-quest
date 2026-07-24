/* ============================================================
   MAIN QUEST — app.js
   ------------------------------------------------------------
   Punto de entrada. Hace tres cosas:
   1. Carga los datos (store.js) y pinta la pantalla.
   2. Maneja la navegación entre pestañas.
   3. Conecta los botones de backup.
   Orquesta la navegación e inicializa todos los módulos
   como módulos separados: este archivo solo orquesta.
   ============================================================ */

import { load, save, exportar, importar } from "./store.js";
import { franjaLuz, estadoBackup } from "./util.js";
import { initMisiones, setDatos } from "./missions.js";
import { renderArboles } from "./xp.js";
import { initEngine, setDatosEngine } from "./engine.js";
import { initDiario, setDatosDiario } from "./journal.js";
import { initEconomia, setDatosEconomia } from "./economy.js";
import { initCuarto, setDatosCuarto } from "./room.js";
import { initAvatar, setDatosAvatar } from "./avatar.js";
import { initLogros, setDatosLogros } from "./achievements.js";
import { initHistoria, setDatosHistoria } from "./history.js";
import { contextoActual } from "./engine.js";

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
    "MAIN QUEST · Entrega 5 · modo parcial · datos v" + data.version;
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
  renderBackup();
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
    setDatosAvatar(data);
    setDatosLogros(data);
    setDatosHistoria(data);
    renderBackup();
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

/* ------------------------------------------------------------
   Modo parcial visible (C-24). La app se ORDENA, no se alarma:
   luz más fría y desaturada, menos cosas decorativas en
   pantalla, la facultad al frente. Nada de rojos ni de
   cuentas regresivas ansiosas: el conteo ya está en el pill
   como dato. Solo cambia la temperatura del ambiente.
   ------------------------------------------------------------ */
function aplicarModoParcial() {
  let activo = false;
  try { activo = !!contextoActual().parcialProximo; } catch { activo = false; }
  document.body.classList.toggle("modo-parcial", activo);
}

/* ------------------------------------------------------------
   Estado del backup (C-26). Aviso suave: un cartelito en el
   panel de Backup y un puntito en la pestaña VOS. Nunca un
   modal, nunca bloquea nada.
   ------------------------------------------------------------ */
function renderBackup() {
  const est = estadoBackup(data.perfil.ultimo_backup, data.perfil.creado_en);

  const cont = document.getElementById("backup-estado");
  if (cont) {
    const cuando = est.nunca
      ? "Todavía no exportaste ninguno"
      : est.dias === 0 ? "Exportado hoy"
      : est.dias === 1 ? "Último backup: ayer"
      : `Último backup: hace ${est.dias} días`;

    const aviso = est.nivel === "ok" ? ""
      : est.nivel === "conviene"
        ? "<br>Buen momento para exportar uno nuevo."
        : "<br>Pasó bastante: si borrás datos de Safari, se pierde todo.";

    cont.innerHTML = `<div class="backup-estado backup-estado--${est.nivel}">${cuando}${aviso}</div>`;
  }

  // Puntito en la pestaña VOS, que se ve desde cualquier pantalla.
  const tabVos = document.querySelector('.tab[data-view="vos"]');
  if (tabVos) tabVos.classList.toggle("tab--aviso", est.nivel !== "ok");
}

/* Luz ambiente del fondo según la hora. Es sutil a propósito:
   la app entera baja o sube la temperatura sin que ningún
   color de la paleta deje de ser él mismo. */
function aplicarLuzAmbiente() {
  const franja = franjaLuz(new Date().getHours());
  document.body.classList.remove("luz-manana", "luz-tarde", "luz-noche");
  document.body.classList.add(`luz-${franja}`);
}

aplicarLuzAmbiente();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    aplicarLuzAmbiente();
    aplicarModoParcial(); // un parcial puede haberse acercado desde ayer
  }
});

render();

/* ORDEN IMPORTANTE: el motor va PRIMERO porque missions y
   avatar le consultan el contexto durante su propio init.
   Inicializarlo después rompía toda la cadena de arranque
   (bug de la Entrega 3). Hay un test que verifica este orden. */
initEngine(data);
initMisiones(data);
initDiario(data);
initEconomia(data);
initAvatar(data);
initCuarto(data);
initLogros(data);
initHistoria(data);
renderBackup();
aplicarModoParcial();

document.addEventListener("contexto-cambiado", aplicarModoParcial);
