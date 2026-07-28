/* ============================================================
   tests/suite-stats.js — Tu leyenda (Entrega 11)
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { porSemana, porArbol, energiaPromedio,
         fichaPersonaje, records, mapaConstancia, energiaPorSemana } from "../js/stats.js";

export function correr() {
  suite("Tu leyenda — cálculos base");

  test("porSemana: 6 semanas, hoy en la última", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.hoy = { fecha: hoyLocal(), principal: { completada: true }, secundarias: [] };
    const s = porSemana(d);
    igual(s.length, 6);
    igual(s[s.length - 1].total, 1, "hoy suma a la semana actual");
  });

  test("porArbol cuenta cumplidas por árbol, ignora incompletas", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-1), principal: { completada: true, arbol: "edicion" } },
      { fecha: hoyLocal(-2), principal: { completada: true, arbol: "edicion" } },
      { fecha: hoyLocal(-3), principal: { completada: false, arbol: "japones" } }
    ];
    const c = porArbol(d);
    igual(c.edicion, 2); igual(c.japones, 0);
  });

  test("energiaPromedio null sin diario, no inventa", () => {
    igual(energiaPromedio(crearDatos(hoyLocal())), null);
  });

  suite("Tu leyenda — ficha y récords");

  test("la ficha cuenta días de viaje y nivel total", () => {
    const d = crearDatos(hoyLocal());
    d.perfil.creado_en = new Date(Date.now() - 9 * 86400000).toISOString();
    d.arboles.edicion.nivel = 4;
    d.arboles.fitness.nivel = 2;
    const f = fichaPersonaje(d);
    assert(f.dias >= 9 && f.dias <= 11, "días de viaje ~10");
    igual(f.nivelTotal, 4 + 2 + 1 + 1 + 1 + 1, "suma de niveles");
    igual(f.arbolDominante, "edicion", "el árbol más avanzado");
    igual(f.titulo, "El Editor", "título según el dominante");
  });

  test("sin progreso, el título es 'Recién llegado'", () => {
    const f = fichaPersonaje(crearDatos(hoyLocal()));
    igual(f.titulo, "Recién llegado", "todavía no se ganó título");
  });

  test("récords: racha más larga histórica", () => {
    const d = crearDatos(hoyLocal());
    // 3 días seguidos, hueco, 2 días seguidos.
    d.misiones.historial = [
      { fecha: hoyLocal(-10), principal: { completada: true } },
      { fecha: hoyLocal(-9), principal: { completada: true } },
      { fecha: hoyLocal(-8), principal: { completada: true } },
      { fecha: hoyLocal(-5), principal: { completada: true } },
      { fecha: hoyLocal(-4), principal: { completada: true } }
    ];
    igual(records(d).mejorRacha, 3, "la mejor fue de 3 días");
  });

  test("récords: total y día más activo por secundarias", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-2), principal: { completada: true }, secundarias: [{ completada: true }, { completada: true }] },
      { fecha: hoyLocal(-1), principal: { completada: true }, secundarias: [{ completada: true }] }
    ];
    const r = records(d);
    igual(r.totalMisiones, 2, "dos principales cumplidas");
    igual(r.diaTopSecundarias, 2, "el día top tuvo 2 secundarias");
  });

  suite("Tu leyenda — mapa y energía");

  test("el mapa devuelve una celda por día del rango", () => {
    const m = mapaConstancia(crearDatos(hoyLocal()), 112);
    igual(m.length, 112, "112 celdas");
    assert(m.every((c) => c.nivel >= 0 && c.nivel <= 3), "intensidad 0-3");
  });

  test("el mapa marca intensidad alta un día cumplido con extras", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-1), principal: { completada: true }, secundarias: [{ completada: true }] }
    ];
    const celda = mapaConstancia(d, 112).find((c) => c.fecha === hoyLocal(-1));
    igual(celda.nivel, 3, "cumplida + secundaria = intensidad máxima");
  });

  test("energiaPorSemana promedia por semana y deja null las vacías", () => {
    const d = crearDatos(hoyLocal());
    // Dos días de UNA misma semana (mié y jue de la misma semana),
    // para no depender de qué día real sea hoy.
    d.diario = [
      { fecha: "2026-07-22", energia: 4 }, // miércoles
      { fecha: "2026-07-23", energia: 2 }  // jueves de la misma semana
    ];
    const s = energiaPorSemana(d, 60); // ventana amplia para incluir julio
    igual(s.length, 60, "sesenta semanas");
    const semana = s.find((x) => x.prom !== null);
    assert(semana, "hay una semana con datos");
    igual(semana.prom, 3, "(4+2)/2 en esa semana");
  });
}
