/* ============================================================
   tests/suite-rituales.js — Rituales (Entrega 16)
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { ritualesDeHoy, agregarRitual, borrarRitual,
         sembrarSugeridos, ritualSugeridoHoy, RITUALES_SUGERIDOS } from "../js/rituales.js";

export function correr() {
  suite("Rituales");

  test("ritualesDeHoy filtra por el día de la semana", () => {
    const d = crearDatos();
    // Un martes conocido: 2026-07-28 es martes (getDay()=2).
    const martes = new Date(2026, 6, 28, 12, 0, 0);
    d.rituales = [
      { id: "a", titulo: "Japonés", arbol: "japones", dias: [2, 4], activo: true },
      { id: "b", titulo: "Gym", arbol: "fitness", dias: [1, 3], activo: true }
    ];
    const hoy = ritualesDeHoy(d, martes);
    igual(hoy.length, 1, "solo el que incluye martes");
    igual(hoy[0].titulo, "Japonés", "es el de japonés");
  });

  test("agregarRitual valida título y días", () => {
    const d = crearDatos();
    igual(agregarRitual(d, { titulo: "", dias: [1] }), false, "sin título no");
    igual(agregarRitual(d, { titulo: "Leer", dias: [] }), false, "sin días no");
    igual(agregarRitual(d, { titulo: "Leer", arbol: null, dias: [1, 3] }), true, "válido sí");
    igual(d.rituales.length, 1, "quedó uno");
    assert(d.rituales[0].id, "tiene id");
  });

  test("borrarRitual quita por id", () => {
    const d = crearDatos();
    agregarRitual(d, { titulo: "Gym", dias: [1] });
    const id = d.rituales[0].id;
    borrarRitual(d, id);
    igual(d.rituales.length, 0, "se borró");
  });

  test("sembrarSugeridos solo siembra si no hay ninguno", () => {
    const d = crearDatos();
    igual(sembrarSugeridos(d), true, "siembra la primera vez");
    igual(d.rituales.length, RITUALES_SUGERIDOS.length, "están todos los sugeridos");
    igual(sembrarSugeridos(d), false, "no vuelve a sembrar si ya hay");
    igual(d.rituales.length, RITUALES_SUGERIDOS.length, "no duplicó");
  });

  test("ritualSugeridoHoy no repite el que ya usaste hoy", () => {
    const d = crearDatos();
    const martes = new Date(2026, 6, 28, 12, 0, 0);
    d.rituales = [
      { id: "a", titulo: "Japonés", arbol: "japones", dias: [2], activo: true }
    ];
    // Sin misión: lo sugiere.
    const antes = ritualSugeridoHoy(d, martes);
    assert(antes && antes.titulo === "Japonés", "lo sugiere");
    // Si la misión de hoy ya ES ese ritual, no lo vuelve a sugerir.
    d.misiones.hoy = { fecha: hoyLocal(), principal: { titulo: "Japonés", arbol: "japones", completada: false }, secundarias: [] };
    const despues = ritualSugeridoHoy(d, martes);
    igual(despues, null, "ya no lo sugiere: ya es la misión de hoy");
  });

  test("un ritual inactivo no aparece", () => {
    const d = crearDatos();
    const martes = new Date(2026, 6, 28, 12, 0, 0);
    d.rituales = [
      { id: "a", titulo: "Japonés", arbol: "japones", dias: [2], activo: false }
    ];
    igual(ritualesDeHoy(d, martes).length, 0, "inactivo no cuenta");
  });
}
