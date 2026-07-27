/* ============================================================
   tests/suite-japon.js — El objetivo Japón (Entrega 8)
   ============================================================ */

import { suite, test, assert, igual, crearDatos } from "./helpers.js";
import { estadoJapon, registrarAporte } from "../js/japon.js";

export function correr() {
  suite("Objetivo Japón");

  test("usuario nuevo: 0 ahorrado, meta 10.000, 0%", () => {
    const e = estadoJapon(crearDatos());
    igual(e.ahorrado, 0, "arranca en cero");
    igual(e.meta, 10000, "la meta");
    igual(e.pct, 0, "0%");
    igual(e.falta, 10000, "falta todo");
  });

  test("un aporte suma y queda registrado con fecha", () => {
    const d = crearDatos();
    assert(registrarAporte(d, 500), "acepta el aporte");
    igual(d.contexto.objetivo_japon.ahorrado_usd, 500, "suma al total");
    igual(d.contexto.objetivo_japon.aportes.length, 1, "queda en el historial");
    assert(d.contexto.objetivo_japon.aportes[0].fecha, "con su fecha");
    igual(d.timeline.length, 1, "y deja rastro en la timeline");
  });

  test("varios aportes acumulan", () => {
    const d = crearDatos();
    registrarAporte(d, 300);
    registrarAporte(d, 200);
    registrarAporte(d, 500);
    igual(d.contexto.objetivo_japon.ahorrado_usd, 1000, "300+200+500");
    igual(estadoJapon(d).pct, 10, "1000 de 10000 = 10%");
  });

  test("un aporte negativo corrige, pero nunca baja de 0", () => {
    const d = crearDatos();
    registrarAporte(d, 200);
    registrarAporte(d, -50);
    igual(d.contexto.objetivo_japon.ahorrado_usd, 150, "resta bien");
    registrarAporte(d, -9999);
    igual(d.contexto.objetivo_japon.ahorrado_usd, 0, "no baja de cero");
  });

  test("montos inválidos se rechazan", () => {
    const d = crearDatos();
    igual(registrarAporte(d, 0), false, "cero no");
    igual(registrarAporte(d, "abc"), false, "texto no");
    igual(registrarAporte(d, NaN), false, "NaN no");
    igual(d.contexto.objetivo_japon.aportes.length, 0, "nada se registró");
  });

  test("al llegar a la meta, se marca cumplido", () => {
    const d = crearDatos();
    registrarAporte(d, 10000);
    const e = estadoJapon(d);
    assert(e.cumplido, "cumplido");
    igual(e.pct, 100, "100%");
    igual(e.falta, 0, "no falta nada");
  });

  test("el pct nunca pasa de 100 aunque te pases de la meta", () => {
    const d = crearDatos();
    registrarAporte(d, 12000);
    igual(estadoJapon(d).pct, 100, "topeado en 100%");
  });

  test("proyección: divide lo que falta por los meses restantes", () => {
    const d = crearDatos();
    d.contexto.objetivo_japon.fecha_ideal = "2027-02";
    registrarAporte(d, 1000);
    const e = estadoJapon(d);
    // No fijamos el número exacto (depende de la fecha de hoy),
    // pero con meta lejana debe pedir un aporte mensual razonable.
    assert(e.porMes > 0, "propone un aporte mensual");
    assert(e.porMes <= e.falta, "nunca más que lo que falta");
  });
}
