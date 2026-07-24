/* ============================================================
   tests/suite-engine.js — Motor de contexto
   ------------------------------------------------------------
   Las reglas del PRD viven acá. Si un test de este archivo
   falla, la app está rompiendo una promesa: la regla de las
   2 semanas, el orden de prioridades o el cero culpa.
   ============================================================ */

import { suite, test, assert, igual, noIncluye, crearDatos, hoyLocal } from "./helpers.js";
import { setDatosEngine, contextoActual, elegirMensaje } from "../js/engine.js";

export function correr() {
  suite("Motor de contexto");

  const conParcial = (dias, materia = "Anatomía") => {
    const d = crearDatos(hoyLocal());
    d.contexto.parciales = [{ id: "p1", materia, fecha: hoyLocal(dias) }];
    setDatosEngine(d);
    return d;
  };

  test("regla de las 2 semanas: a 20 días NO entra en modo parcial", () => {
    conParcial(20);
    igual(contextoActual().parcialProximo, null, "a 20 días no molesta con estudiar");
  });

  test("regla de las 2 semanas: a 14 días SÍ entra", () => {
    conParcial(14);
    const ctx = contextoActual();
    assert(ctx.parcialProximo, "a 14 días entra en modo parcial");
    igual(ctx.parcialProximo.dias, 14, "días calculados");
  });

  test("el día del parcial sigue contando; el día siguiente ya no", () => {
    conParcial(0);
    assert(contextoActual().parcialProximo, "el mismo día cuenta");
    conParcial(-1);
    igual(contextoActual().parcialProximo, null, "un parcial pasado se descarta");
  });

  test("con varios parciales toma el más cercano", () => {
    const d = crearDatos(hoyLocal());
    d.contexto.parciales = [
      { id: "a", materia: "Fisiología", fecha: hoyLocal(10) },
      { id: "b", materia: "Anatomía", fecha: hoyLocal(3) }
    ];
    setDatosEngine(d);
    igual(contextoActual().parcialProximo.materia, "Anatomía", "el más cercano manda");
  });

  test("energía baja necesita al menos 2 entradas", () => {
    const d = crearDatos();
    d.diario = [{ fecha: "a", energia: 1 }];
    setDatosEngine(d);
    igual(contextoActual().energiaBaja, false, "una sola entrada no alcanza");
    d.diario.push({ fecha: "b", energia: 2 });
    setDatosEngine(d);
    igual(contextoActual().energiaBaja, true, "dos entradas con promedio ≤2 sí");
  });

  test("energía normal no dispara el modo cansado", () => {
    const d = crearDatos();
    d.diario = [{ fecha: "a", energia: 3 }, { fecha: "b", energia: 4 }];
    setDatosEngine(d);
    igual(contextoActual().energiaBaja, false, "promedio 3.5 está bien");
  });

  test("PRIORIDAD: salud le gana al parcial (regla 15 del PRD)", () => {
    const d = crearDatos(hoyLocal());
    d.contexto.parciales = [{ id: "p", materia: "Fisio", fecha: hoyLocal(7) }];
    d.diario = [{ fecha: "a", energia: 1 }, { fecha: "b", energia: 1 }];
    setDatosEngine(d);
    const { texto } = elegirMensaje();
    assert(/tanque bajo|energía se recupera|bajá un cambio|semana pesada/i.test(texto),
      `con energía baja debe primar el descanso, pero dijo: "${texto}"`);
  });

  test("PERO si el parcial es mañana, el mensaje es de parcial", () => {
    const d = crearDatos(hoyLocal());
    d.contexto.parciales = [{ id: "p", materia: "Fisio", fecha: hoyLocal(1) }];
    d.diario = [{ fecha: "a", energia: 1 }, { fecha: "b", energia: 1 }];
    setDatosEngine(d);
    const { texto } = elegirMensaje();
    assert(texto.includes("Fisio"), `debía hablar del parcial inminente: "${texto}"`);
  });

  test("el mensaje del día es determinístico (no cambia al reabrir)", () => {
    conParcial(5);
    const a = elegirMensaje().texto;
    const b = elegirMensaje().texto;
    const c = elegirMensaje().texto;
    igual(a, b, "misma llamada, mismo mensaje");
    igual(b, c, "y una tercera vez también");
  });

  test("CERO CULPA: ningún mensaje reprocha el pasado", () => {
    // Barrido sobre muchos contextos distintos.
    const contextos = [
      () => crearDatos(hoyLocal()),
      () => { const d = crearDatos(hoyLocal()); d.contexto.parciales = [{ id: "p", materia: "X", fecha: hoyLocal(3) }]; return d; },
      () => { const d = crearDatos(hoyLocal()); d.diario = [{ fecha: "a", energia: 1 }, { fecha: "b", energia: 1 }]; return d; },
      () => { const d = crearDatos(hoyLocal()); d.arboles.edicion.nivel = 5; return d; }
    ];
    const prohibidas = ["hace 5 días", "no entrenás", "abandonaste", "fallaste", "no cumpliste", "perdiste la racha"];
    for (const armar of contextos) {
      setDatosEngine(armar());
      const { texto } = elegirMensaje();
      for (const frase of prohibidas) noIncluye(texto.toLowerCase(), frase, "mensaje con culpa");
    }
  });

  test("la racha cuenta días consecutivos terminando hoy o ayer", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-3), principal: { completada: true } },
      { fecha: hoyLocal(-2), principal: { completada: true } },
      { fecha: hoyLocal(-1), principal: { completada: true } }
    ];
    setDatosEngine(d);
    igual(contextoActual().racha, 3, "racha de ayer hacia atrás");
    d.misiones.hoy.principal = { titulo: "x", completada: true };
    setDatosEngine(d);
    igual(contextoActual().racha, 4, "cumplir hoy la extiende");
  });

  test("no cumplir todavía HOY no corta la racha", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [{ fecha: hoyLocal(-1), principal: { completada: true } }];
    setDatosEngine(d);
    igual(contextoActual().racha, 1, "el día en curso no penaliza");
  });
}
