/* ============================================================
   tests/suite-ceremonia.js — La ceremonia de apertura (7A)
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { tocaCeremonia } from "../js/ceremonia.js";

export function correr() {
  suite("Ceremonia de apertura");

  test("corresponde la primera apertura del día", () => {
    const d = crearDatos(hoyLocal());
    d.perfil.ultima_ceremonia = null;
    assert(tocaCeremonia(d, hoyLocal()), "usuario nuevo: sí");
  });

  test("NO corresponde en la segunda apertura del mismo día", () => {
    const d = crearDatos(hoyLocal());
    d.perfil.ultima_ceremonia = hoyLocal();
    igual(tocaCeremonia(d, hoyLocal()), false, "ya la vio hoy: no se repite");
  });

  test("vuelve a corresponder al día siguiente", () => {
    const d = crearDatos(hoyLocal());
    d.perfil.ultima_ceremonia = hoyLocal(-1);
    assert(tocaCeremonia(d, hoyLocal()), "ayer la vio, hoy es otro día: sí");
  });

  test("la fecha se compara como día, no como timestamp", () => {
    // Es un YYYY-MM-DD, no un ISO con hora: dos aperturas en
    // horas distintas del mismo día no deben disparar dos veces.
    const d = crearDatos(hoyLocal());
    d.perfil.ultima_ceremonia = hoyLocal();
    igual(tocaCeremonia(d, hoyLocal()), false, "misma jornada, una sola ceremonia");
  });
}
