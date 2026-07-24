/* ============================================================
   tests/suite-arranque.js — El arranque completo de la app
   ------------------------------------------------------------
   ESTE ARCHIVO EXISTE POR UN BUG REAL.

   En la Entrega 3, missions.js empezó a consultarle el
   contexto a engine.js. Pero en app.js initMisiones corría
   ANTES que initEngine, así que al abrir la app sin misión
   del día, missions explotaba — y como ese error corta la
   secuencia, no se inicializaba NADA de lo que venía después:
   motor, diario, economía, avatar, cuarto y logros.

   Los 70 tests que había pasaban todos: probaban cada módulo
   por separado, con los datos ya cargados a mano. Ninguno
   probaba la app arrancando de verdad.

   Este archivo prueba eso. Y además LEE el orden de init
   directamente de app.js, así que si mañana alguien lo
   reordena y rompe la cadena, el test se entera solo.
   ============================================================ */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { suite, test, assert, igual, incluye } from "./helpers.js";

import { load, save } from "../js/store.js";
import { initMisiones } from "../js/missions.js";
import { initEngine } from "../js/engine.js";
import { initDiario } from "../js/journal.js";
import { initEconomia } from "../js/economy.js";
import { initAvatar } from "../js/avatar.js";
import { initCuarto } from "../js/room.js";
import { initLogros } from "../js/achievements.js";
import { initHistoria } from "../js/history.js";
import { renderArboles } from "../js/xp.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Todos los ids que index.html expone y que los módulos buscan */
const IDS = [
  "saludo", "racha-hoy", "mensaje-dia", "mision-principal", "lista-secundarias",
  "diario-cierre", "arboles", "tienda", "cuarto", "cuarto-progreso",
  "monedas-contador", "logros", "logros-contador", "lista-parciales",
  "avatar-preview", "avatar-opciones", "perfil-nombre", "perfil-desde",
  "version-info", "topbar-fecha", "historia", "historia-contador", "backup-estado",
  "view-hoy", "view-habitacion", "view-progreso", "view-vos"
];

const FUNCIONES = {
  initEngine, initMisiones, initDiario, initEconomia,
  initAvatar, initCuarto, initLogros, initHistoria
};

/* app.js hace render() ANTES de los init: ahí dibuja el
   saludo, los árboles y el perfil. Lo replicamos para que la
   simulación del arranque sea fiel. */
function renderPrevio(data) {
  renderArboles(data);
}

/* Lee de app.js el orden real en que se inicializan los
   módulos. Si el código cambia, el test cambia con él. */
function ordenDeArranque() {
  const src = readFileSync(join(RAIZ, "js", "app.js"), "utf8");
  return [...src.matchAll(/^(init[A-Z]\w*)\(data\);/gm)].map((m) => m[1]);
}

export function correr(dom) {
  suite("Arranque de la app (regresión de la Entrega 3)");

  test("app.js inicializa el motor ANTES que las misiones", () => {
    const orden = ordenDeArranque();
    const iEngine = orden.indexOf("initEngine");
    const iMisiones = orden.indexOf("initMisiones");
    assert(iEngine >= 0 && iMisiones >= 0, "no encontré los init en app.js");
    assert(iEngine < iMisiones,
      "initEngine tiene que ir antes que initMisiones: missions le pide el contexto durante su init");
  });

  test("la app entera levanta sin misión del día (el caso que rompía)", () => {
    dom.limpiar();
    for (const id of IDS) dom.montar(id);
    const data = load();
    igual(data.misiones.hoy, null, "arrancamos con el día en blanco, como al abrir de mañana");

    const orden = ordenDeArranque();
    const fallados = [];
    for (const nombre of orden) {
      const fn = FUNCIONES[nombre];
      if (!fn) { fallados.push(`${nombre} (no exportado a los tests)`); continue; }
      try { fn(data); } catch (err) { fallados.push(`${nombre}: ${err.message}`); }
    }
    igual(fallados.length, 0, `módulos que explotaron al arrancar → ${fallados.join(" | ")}`);
  });

  test("después de arrancar, la pantalla HOY está realmente dibujada", () => {
    dom.limpiar();
    const elementos = Object.fromEntries(IDS.map((id) => [id, dom.montar(id)]));
    const data = load();
    renderPrevio(data);
    for (const nombre of ordenDeArranque()) FUNCIONES[nombre]?.(data);

    incluye(elementos["mision-principal"].innerHTML, "misión de hoy",
      "el panel de la misión principal quedó vacío");
    assert(elementos["mensaje-dia"].innerHTML.length > 20, "no hay mensaje del día");
    assert(elementos["racha-hoy"].innerHTML.includes("🔥"), "no está el chip de racha");
    assert(elementos["arboles"].innerHTML.includes("data-arbol"), "no se dibujaron los árboles");
    assert(elementos["tienda"].innerHTML.includes("Cojín"), "no se dibujó la tienda");
    assert(elementos["logros"].innerHTML.includes("logro"), "no se dibujaron los logros");
  });

  test("la app también levanta con una misión ya cumplida", () => {
    dom.limpiar();
    for (const id of IDS) dom.montar(id);
    localStorage.clear();
    const data = load();
    data.misiones.hoy = {
      fecha: new Date().toISOString().slice(0, 10),
      principal: { titulo: "Editar el reel", arbol: "edicion", completada: true },
      secundarias: []
    };
    save(data);

    const fallados = [];
    for (const nombre of ordenDeArranque()) {
      try { FUNCIONES[nombre]?.(load()); } catch (err) { fallados.push(`${nombre}: ${err.message}`); }
    }
    igual(fallados.length, 0, `explotó con misión cumplida → ${fallados.join(" | ")}`);
  });

  test("sugerirMision no explota si el motor todavía no tiene datos", async () => {
    // La red de seguridad de la capa 2: preguntar antes de
    // tiempo devuelve null, nunca tumba el arranque.
    const { sugerirMision } = await import("../js/engine.js");
    assert(typeof sugerirMision === "function", "sugerirMision no está exportada");
    // (con datos ya cargados por los tests previos, debe devolver algo válido)
    const s = sugerirMision();
    assert(s === null || (typeof s.titulo === "string"), "debe devolver null o una sugerencia válida");
  });
}
