/* ============================================================
   tests/suite-ceremonia.js — Ceremonia de apertura (7A v2)
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { tocaCeremonia, registrarCierre } from "../js/ceremonia.js";
import { setDatosEngine, fraseCeremonia } from "../js/engine.js";

/* Storage falso para las pruebas de la ventana de gracia */
function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

export function correr() {
  suite("Ceremonia: cuándo aparece");

  test("aparece en una apertura normal (sin cierre reciente)", () => {
    assert(tocaCeremonia(Date.now(), fakeStorage()), "storage limpio: sí aparece");
  });

  test("NO aparece si cerraste hace 10 segundos (accidental)", () => {
    const st = fakeStorage();
    const ahora = 1_000_000;
    registrarCierre({ setItem: (k, v) => st.setItem(k, String(ahora)) });
    igual(tocaCeremonia(ahora + 10_000, st), false, "10s < 30s: reapertura accidental");
  });

  test("SÍ aparece si pasaron más de 30 segundos", () => {
    const st = fakeStorage();
    const ahora = 2_000_000;
    st.setItem("mainquest_cerrada_en", String(ahora));
    assert(tocaCeremonia(ahora + 31_000, st), "31s > 30s: apertura de verdad");
  });

  test("el borde de los 30s no repite de más", () => {
    const st = fakeStorage();
    const ahora = 3_000_000;
    st.setItem("mainquest_cerrada_en", String(ahora));
    igual(tocaCeremonia(ahora + 29_999, st), false, "justo antes de 30s: no");
    assert(tocaCeremonia(ahora + 30_001, st), "justo después: sí");
  });

  suite("Ceremonia: la frase del motor");

  test("con parcial cerca, la frase nombra la materia", () => {
    const d = crearDatos(hoyLocal());
    d.contexto.parciales = [{ id: "p", materia: "Anatomía", fecha: hoyLocal(4) }];
    setDatosEngine(d);
    assert(fraseCeremonia().includes("Anatomía"), "la frase habla del parcial real");
  });

  test("con racha, la frase la celebra", () => {
    const d = crearDatos(hoyLocal());
    for (let i = 1; i <= 5; i++) d.misiones.historial.push({ fecha: hoyLocal(-i), principal: { completada: true } });
    setDatosEngine(d);
    assert(/5 días/.test(fraseCeremonia()), "menciona la racha");
  });

  test("sin nada especial, cae en una genérica estable", () => {
    const d = crearDatos(hoyLocal());
    setDatosEngine(d);
    const a = fraseCeremonia(new Date(2026, 6, 22)); // miércoles, sin parcial ni racha
    const b = fraseCeremonia(new Date(2026, 6, 22));
    assert(a.length > 0, "hay frase");
    igual(a, b, "la misma jornada da la misma frase (determinística)");
  });

  test("prioridad: la energía baja le gana a todo", () => {
    const d = crearDatos(hoyLocal());
    d.diario = [{ fecha: "a", energia: 1 }, { fecha: "b", energia: 1 }];
    d.contexto.parciales = [{ id: "p", materia: "X", fecha: hoyLocal(3) }];
    setDatosEngine(d);
    assert(/sin exigirte/.test(fraseCeremonia()), "salud primero, también en la ceremonia");
  });
}
