/* ============================================================
   tests/suite-store.js — Datos y migraciones
   ------------------------------------------------------------
   Lo más crítico del proyecto: Lautaro va a usar esta app
   durante años. Una migración que pierda datos es el único
   bug verdaderamente irreversible.
   ============================================================ */

import { suite, test, assert, igual, crearDatos } from "./helpers.js";
import { load, save } from "../js/store.js";

export function correr() {
  suite("Store y migraciones");

  test("usuario nuevo arranca en la versión actual y con los 6 árboles", () => {
    localStorage.clear();
    const d = load();
    igual(d.version, 6, "versión inicial");
    igual(Object.keys(d.arboles).length, 6, "cantidad de árboles");
    igual(d.economia.monedas, 0, "monedas iniciales");
    assert(d.perfil.creado_en, "creado_en debe fijarse en el primer arranque");
  });

  test("migra datos v1 antiguos sin perder nada del usuario", () => {
    localStorage.clear();
    // Así se veían los datos en la Fase 0: sin avatar, sin
    // accesorio, con misiones en formato viejo.
    const viejo = {
      version: 1,
      perfil: { nombre: "Lautaro", creado_en: "2026-01-01T00:00:00.000Z" },
      arboles: { fitness: { xp: 40, nivel: 2 } },
      misiones: { hoy: null, historial: [] },
      economia: { monedas: 999 },
      diario: [{ fecha: "2026-02-01", energia: 4 }]
    };
    localStorage.setItem("mainquest_data", JSON.stringify(viejo));

    const d = load();

    igual(d.version, 6, "debe quedar migrado a la versión actual");
    // Lo del usuario se respeta
    igual(d.economia.monedas, 999, "las monedas no se pisan");
    igual(d.arboles.fitness.nivel, 2, "el nivel ganado no se pierde");
    igual(d.arboles.fitness.xp, 40, "el xp no se pierde");
    igual(d.diario.length, 1, "el diario no se pierde");
    igual(d.perfil.creado_en, "2026-01-01T00:00:00.000Z", "la fecha de inicio no se pisa");
    // Lo que faltaba aparece
    igual(d.arboles.streaming.nivel, 1, "los árboles nuevos se completan");
    igual(d.perfil.avatar.pelo, "largo", "el avatar se completa (v4)");
    igual(d.perfil.avatar.accesorio, "ninguno", "el accesorio se completa (v5)");
    igual(d.perfil.ultimo_backup, null, "el campo de backup se completa (v6)");
    assert(Array.isArray(d.logros), "logros se completa");
    assert(Array.isArray(d.timeline), "timeline se completa");
    assert(d.contexto.objetivo_japon.meta_usd === 10000, "objetivo Japón se completa");
  });

  test("la migración queda persistida, no solo en memoria", () => {
    localStorage.clear();
    localStorage.setItem("mainquest_data", JSON.stringify({ version: 2, economia: { monedas: 50 } }));
    load();
    const guardado = JSON.parse(localStorage.getItem("mainquest_data"));
    igual(guardado.version, 6, "la versión migrada se guarda en disco");
    igual(guardado.economia.monedas, 50, "los datos del usuario siguen ahí");
  });

  test("datos corruptos no rompen la app: arranca limpio", () => {
    localStorage.clear();
    localStorage.setItem("mainquest_data", "{esto no es json valido");
    const d = load();
    igual(d.version, 6, "cae al estado inicial");
    igual(Object.keys(d.arboles).length, 6, "con todos los árboles");
  });

  test("save y load son simétricos", () => {
    localStorage.clear();
    const d = crearDatos();
    d.economia.monedas = 1234;
    d.arboles.edicion.nivel = 7;
    save(d);
    const recuperado = load();
    igual(recuperado.economia.monedas, 1234, "monedas");
    igual(recuperado.arboles.edicion.nivel, 7, "nivel");
  });

  test("un array vacío del usuario no se rellena con el default", () => {
    // Sutil pero importante: si el usuario borró todos sus
    // parciales, la migración no debe devolvérselos.
    localStorage.clear();
    const d = crearDatos();
    d.contexto.parciales = [];
    save(d);
    const r = load();
    igual(r.contexto.parciales.length, 0, "los arrays vacíos se respetan");
  });
}
