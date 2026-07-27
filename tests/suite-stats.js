/* ============================================================
   tests/suite-stats.js — Estadísticas (Entrega 10)
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { porSemana, porArbol, energiaPromedio } from "../js/stats.js";

export function correr() {
  suite("Estadísticas");

  test("porSemana devuelve 6 semanas, la última es la actual", () => {
    const d = crearDatos(hoyLocal());
    const s = porSemana(d);
    igual(s.length, 6, "seis buckets");
    // La misión de hoy cumplida cae en la última semana.
    d.misiones.hoy = { fecha: hoyLocal(), principal: { titulo: "x", completada: true }, secundarias: [] };
    const s2 = porSemana(d);
    igual(s2[s2.length - 1].total, 1, "hoy suma a la semana actual");
  });

  test("porSemana agrupa cumplidas de días distintos", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-1), principal: { completada: true } },
      { fecha: hoyLocal(-2), principal: { completada: true } },
      { fecha: hoyLocal(-3), principal: { completada: false } } // no cuenta
    ];
    const s = porSemana(d);
    const total = s.reduce((a, b) => a + b.total, 0);
    igual(total, 2, "dos cumplidas, la incompleta no");
  });

  test("porArbol cuenta cumplidas por árbol", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-1), principal: { completada: true, arbol: "edicion" } },
      { fecha: hoyLocal(-2), principal: { completada: true, arbol: "edicion" } },
      { fecha: hoyLocal(-3), principal: { completada: true, arbol: "fitness" } },
      { fecha: hoyLocal(-4), principal: { completada: false, arbol: "japones" } }
    ];
    const c = porArbol(d);
    igual(c.edicion, 2, "dos de edición");
    igual(c.fitness, 1, "una de fitness");
    igual(c.japones, 0, "la incompleta no cuenta");
  });

  test("energiaPromedio saca el promedio de las últimas entradas", () => {
    const d = crearDatos(hoyLocal());
    d.diario = [
      { fecha: hoyLocal(-2), energia: 4 },
      { fecha: hoyLocal(-1), energia: 2 }
    ];
    const e = energiaPromedio(d);
    igual(e.promedio, 3, "(4+2)/2");
    igual(e.cantidad, 2, "dos cierres");
  });

  test("energiaPromedio es null sin diario (no inventa un número)", () => {
    igual(energiaPromedio(crearDatos(hoyLocal())), null, "sin datos, sin promedio");
  });

  test("las entradas sin energía marcada se ignoran", () => {
    const d = crearDatos(hoyLocal());
    d.diario = [
      { fecha: hoyLocal(-1), energia: 5 },
      { fecha: hoyLocal(-2) } // sin energía
    ];
    const e = energiaPromedio(d);
    igual(e.promedio, 5, "solo cuenta la que tiene energía");
    igual(e.cantidad, 1, "una sola válida");
  });
}
