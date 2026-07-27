/* ============================================================
   tests/suite-config.js — Configuración (Entrega 9)
   ============================================================ */

import { suite, test, assert, igual, crearDatos } from "./helpers.js";

export function correr() {
  suite("Configuración");

  test("los ajustes tienen valores por defecto sanos", () => {
    const d = crearDatos();
    assert(d.ajustes, "existe el bloque ajustes");
    igual(d.ajustes.hora_diario, 21, "el diario arranca a las 21");
    igual(d.ajustes.sonido, false, "el sonido arranca apagado");
  });

  test("la hora del diario configurable manda sobre el diario", async () => {
    // El diario mira data.ajustes.hora_diario; comprobamos que
    // el módulo la lea de ahí y no de una constante fija.
    const { initDiario, setDatosDiario } = await import("../js/journal.js");
    const src = (await import("node:fs")).readFileSync(
      new URL("../js/journal.js", import.meta.url), "utf8");
    assert(!/const HORA_CIERRE = 21/.test(src), "ya no hay hora fija en el código");
    assert(/ajustes.*hora_diario/s.test(src), "el diario lee la hora de los ajustes");
  });

  test("datos viejos sin ajustes se completan al migrar", async () => {
    const { load, save } = await import("../js/store.js");
    // Simulamos datos v9 sin el bloque ajustes.
    const viejo = crearDatos();
    delete viejo.ajustes;
    localStorage.setItem("mainquest_data", JSON.stringify(viejo));
    const migrado = load();
    assert(migrado.ajustes, "la migración crea ajustes");
    igual(migrado.ajustes.hora_diario, 21, "con la hora por defecto");
    igual(migrado.ajustes.sonido, false, "y el sonido apagado");
    igual(migrado.ajustes.musica, false, "y la música apagada (v11)");
  });
}
