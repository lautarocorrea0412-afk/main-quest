/* ============================================================
   tests/suite-ceremonia.js — Ceremonia "El regreso" (7A v4)
   ------------------------------------------------------------
   La ceremonia ahora aparece SIEMPRE (sin cooldown), así que
   ya no hay lógica de "cuándo mostrarla" que testear: eso es
   incondicional. Lo que sí tiene lógica es la FRASE, que la
   elige el motor según el día — y eso se prueba acá.

   El resto de la ceremonia (la coreografía) es CSS + DOM y se
   valida en el teléfono, no en Node.
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { setDatosEngine, fraseCeremonia } from "../js/engine.js";

export function correr() {
  suite("Ceremonia: la frase del motor");

  test("con parcial cerca, la frase nombra la materia", () => {
    const d = crearDatos(hoyLocal());
    d.contexto.parciales = [{ id: "p", materia: "Anatomía", fecha: hoyLocal(4) }];
    setDatosEngine(d);
    assert(fraseCeremonia().includes("Anatomía"), "la frase habla del parcial real");
  });

  test("con parcial mañana, cambia el tono (ya casi)", () => {
    const d = crearDatos(hoyLocal());
    d.contexto.parciales = [{ id: "p", materia: "Fisio", fecha: hoyLocal(1) }];
    setDatosEngine(d);
    assert(/ya casi/.test(fraseCeremonia()), "a un día, el tono aprieta un poco");
  });

  test("con racha, la frase la celebra", () => {
    const d = crearDatos(hoyLocal());
    for (let i = 1; i <= 5; i++) d.misiones.historial.push({ fecha: hoyLocal(-i), principal: { completada: true } });
    setDatosEngine(d);
    assert(/5 días/.test(fraseCeremonia()), "menciona la racha");
  });

  test("el domingo invita a planear", () => {
    setDatosEngine(crearDatos(hoyLocal()));
    assert(/Plane/.test(fraseCeremonia(new Date(2026, 6, 26))), "domingo = planear");
  });

  test("sin nada especial, cae en una genérica estable", () => {
    const d = crearDatos(hoyLocal());
    setDatosEngine(d);
    const a = fraseCeremonia(new Date(2026, 6, 22));
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
