/* ============================================================
   tests/suite-xp.js — Experiencia, niveles y árboles
   ------------------------------------------------------------
   Incluye el test que más caro salió del proyecto: el ciclo
   render → tap → despliegue de los árboles, que falló DOS
   veces en Safari antes de que existiera esta suite.
   ============================================================ */

import { suite, test, assert, igual, incluye, noIncluye, crearDatos } from "./helpers.js";
import { costoNivel, ganarXp, quitarXp, renderArboles } from "../js/xp.js";

export function correr(dom) {
  suite("XP, niveles y árboles");

  test("la curva es 60n+40 y NV10 cuesta ~1 año de dedicación", () => {
    igual(costoNivel(1), 100, "NV1→2");
    igual(costoNivel(2), 160, "NV2→3");
    igual(costoNivel(9), 580, "NV9→10");
    let total = 0;
    for (let n = 1; n <= 9; n++) total += costoNivel(n);
    igual(total, 3060, "total NV1→NV10");
    // A ~60 XP por semana en un árbol: 51 semanas.
    assert(total / 60 > 45 && total / 60 < 56, "la curva debe rondar el año");
  });

  test("ganar XP sube de nivel y guarda el resto", () => {
    const d = crearDatos();
    ganarXp(d, "edicion", 50);
    igual(d.arboles.edicion.nivel, 1, "50 XP no alcanza para NV2");
    ganarXp(d, "edicion", 50);
    igual(d.arboles.edicion.nivel, 2, "100 XP sube a NV2");
    igual(d.arboles.edicion.xp, 0, "sin resto");
  });

  test("un solo golpe de XP puede saltar varios niveles", () => {
    const d = crearDatos();
    ganarXp(d, "fitness", 1000);
    // 100+160+220+280 = 760 → NV5 con 240 de resto
    igual(d.arboles.fitness.nivel, 5, "nivel tras 1000 XP");
    igual(d.arboles.fitness.xp, 240, "resto");
  });

  test("deshacer devuelve el XP y puede bajar de nivel", () => {
    const d = crearDatos();
    ganarXp(d, "japones", 100);
    igual(d.arboles.japones.nivel, 2, "subió");
    quitarXp(d, "japones", 50);
    igual(d.arboles.japones.nivel, 1, "bajó al deshacer");
    igual(d.arboles.japones.xp, 50, "con el XP correcto");
  });

  test("el XP nunca baja del piso (NV1 con 0)", () => {
    const d = crearDatos();
    quitarXp(d, "finanzas", 99999);
    igual(d.arboles.finanzas.nivel, 1, "piso de nivel");
    igual(d.arboles.finanzas.xp, 0, "piso de xp");
  });

  test("una misión sin árbol no da XP a nadie", () => {
    const d = crearDatos();
    const antes = JSON.stringify(d.arboles);
    const r = ganarXp(d, null, 50);
    igual(r, null, "devuelve null");
    igual(JSON.stringify(d.arboles), antes, "ningún árbol cambió");
  });

  test("ganar y deshacer deja todo como estaba (anti-exploit)", () => {
    const d = crearDatos();
    d.arboles.edicion = { xp: 30, nivel: 3 };
    const antes = JSON.stringify(d.arboles.edicion);
    ganarXp(d, "edicion", 50);
    quitarXp(d, "edicion", 50);
    igual(JSON.stringify(d.arboles.edicion), antes, "el ciclo completo es neutro");
  });

  /* ---- El bug caro: el despliegue de las líneas de evolución ---- */

  test("renderArboles dibuja los 6 árboles con su botón", () => {
    const cont = dom.montar("arboles");
    const d = crearDatos();
    renderArboles(d);
    const botones = cont.querySelectorAll("[data-arbol]");
    igual(botones.length, 6, "un botón por árbol");
    assert(botones.every((b) => typeof b.onclick === "function"),
      "cada botón debe tener onclick DIRECTO (la delegación falla en Safari iOS)");
  });

  test("colapsado muestra la zanahoria y esconde el NV10", () => {
    const cont = dom.montar("arboles");
    renderArboles(crearDatos());
    incluye(cont.innerHTML, "Próximo: NV 2", "zanahoria visible");
    noIncluye(cont.innerHTML, "NV 10", "el NV10 no debe verse colapsado");
  });

  test("tocar un árbol despliega su línea completa hasta NV10", () => {
    const cont = dom.montar("arboles");
    renderArboles(crearDatos());
    const btn = cont.querySelectorAll("[data-arbol]").find((b) => b.dataset.arbol === "edicion");
    btn.onclick();
    incluye(cont.innerHTML, "▾", "la flecha se abre");
    incluye(cont.innerHTML, "NV 10", "aparece el nivel 10");
    incluye(cont.innerHTML, "Estación encendida", "aparece la recompensa épica");
  });

  test("volver a tocar cierra la línea", () => {
    const cont = dom.montar("arboles");
    renderArboles(crearDatos());
    const abrir = cont.querySelectorAll("[data-arbol]").find((b) => b.dataset.arbol === "fitness");
    abrir.onclick();
    incluye(cont.innerHTML, "Barra y discos", "abierta");
    const cerrar = cont.querySelectorAll("[data-arbol]").find((b) => b.dataset.arbol === "fitness");
    cerrar.onclick();
    noIncluye(cont.innerHTML, "Barra y discos", "cerrada");
  });

  test("la línea marca lo ganado y lo pendiente", () => {
    const cont = dom.montar("arboles");
    const d = crearDatos();
    d.arboles.facultad.nivel = 3;
    renderArboles(d);
    cont.querySelectorAll("[data-arbol]").find((b) => b.dataset.arbol === "facultad").onclick();
    incluye(cont.innerHTML, "✔", "lo ganado va tildado");
    incluye(cont.innerHTML, "Diploma en la pared", "lo pendiente también se muestra");
  });
}
