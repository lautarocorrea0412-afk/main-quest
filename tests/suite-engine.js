/* ============================================================
   tests/suite-engine.js — Motor de contexto
   ------------------------------------------------------------
   Las reglas del PRD viven acá. Si un test de este archivo
   falla, la app está rompiendo una promesa: la regla de las
   2 semanas, el orden de prioridades o el cero culpa.
   ============================================================ */

import { suite, test, assert, igual, noIncluye, crearDatos, hoyLocal } from "./helpers.js";
import { setDatosEngine, contextoActual, elegirMensaje, sugerirMision } from "../js/engine.js";

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

  test("A-2: el mensaje matchea el árbol de la misión del día", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.hoy.principal = { titulo: "Editar el reel", arbol: "edicion", completada: false };
    setDatosEngine(d);
    igual(elegirMensaje().modo, "arbol", "con misión de edición, habla de edición");
    d.misiones.hoy.principal.arbol = "facultad";
    setDatosEngine(d);
    igual(elegirMensaje().modo, "arbol", "con misión de facultad, ídem");
  });

  test("A-2: misión cumplida cambia el mensaje a modo festejo", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.hoy.principal = { titulo: "x", arbol: "edicion", completada: true };
    setDatosEngine(d);
    igual(elegirMensaje().modo, "cumplida", "el día sellado se celebra, no se empuja");
  });

  test("A-2: la jerarquía manda — energía y parcial le ganan a la misión", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.hoy.principal = { titulo: "x", arbol: "edicion", completada: false };
    d.contexto.parciales = [{ id: "p", materia: "Fisio", fecha: hoyLocal(5) }];
    setDatosEngine(d);
    igual(elegirMensaje().modo, "parcial", "el parcial pisa a la misión");
    d.diario = [{ fecha: "a", energia: 1 }, { fecha: "b", energia: 1 }];
    setDatosEngine(d);
    igual(elegirMensaje().modo, "energia", "y la salud pisa a todos");
  });

  test("C-22: con parcial cerca sugiere estudiar ESA materia", () => {
    const d = crearDatos(hoyLocal());
    d.contexto.parciales = [{ id: "p", materia: "Biomecánica", fecha: hoyLocal(6) }];
    setDatosEngine(d);
    const s = sugerirMision(new Date(2026, 6, 22)); // miércoles
    igual(s.arbol, "facultad", "árbol facultad");
    assert(s.titulo.includes("Biomecánica"), "con la materia real");
    assert(s.titulo.includes("2 horas"), "a 6 días, intensidad alta");
  });

  test("C-22: SIN parcial, jamás sugiere facultad (regla de Lautaro)", () => {
    const d = crearDatos(hoyLocal());
    setDatosEngine(d);
    for (const dia of [1, 2, 3, 4, 5, 6]) { // lunes a sábado
      const s = sugerirMision(new Date(2026, 6, 20 + dia - 1));
      assert(s.arbol !== "facultad", `el día ${dia} sugirió facultad sin parcial`);
    }
  });

  test("C-22: el domingo sugiere planear la semana", () => {
    setDatosEngine(crearDatos(hoyLocal()));
    const s = sugerirMision(new Date(2026, 6, 26)); // domingo
    assert(s.titulo.includes("Planear"), "domingo = planificación");
  });

  test("C-22: no repite el árbol de ayer si hay alternativa", () => {
    const d = crearDatos(hoyLocal());
    // Todos los árboles igual de atrasados; ayer fue edición.
    d.misiones.historial = [{ fecha: hoyLocal(-1), principal: { titulo: "x", arbol: "edicion", completada: true } }];
    setDatosEngine(d);
    const s = sugerirMision(new Date(2026, 6, 22));
    assert(s.arbol !== "edicion", "la semana tiene que tener variedad");
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

  test("RACHA: un día salteado no rompe (regla de Lautaro)", () => {
    const d = crearDatos(hoyLocal());
    // Cumplió -3 y -2, faltó ayer (-1): la racha sobrevive.
    d.misiones.historial = [
      { fecha: hoyLocal(-3), principal: { completada: true } },
      { fecha: hoyLocal(-2), principal: { completada: true } }
    ];
    setDatosEngine(d);
    igual(contextoActual().racha, 2, "el domingo de fútbol no borra la semana");
    igual(contextoActual().rachaEnRiesgo, true, "pero queda en riesgo hasta cumplir hoy");
  });

  test("RACHA: el día salteado no suma, solo perdona", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-4), principal: { completada: true } },
      { fecha: hoyLocal(-3), principal: { completada: true } },
      // -2 faltó
      { fecha: hoyLocal(-1), principal: { completada: true } }
    ];
    setDatosEngine(d);
    igual(contextoActual().racha, 3, "3 cumplidos, el hueco no cuenta como día");
    igual(contextoActual().rachaEnRiesgo, false, "ayer cumplió: sin riesgo");
  });

  test("RACHA: dos días seguidos sin misión la cortan", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-5), principal: { completada: true } },
      { fecha: hoyLocal(-4), principal: { completada: true } }
      // -3 y -2 faltaron: corte. -1 tampoco, pero ya está cortada.
    ];
    d.misiones.hoy.principal = { titulo: "x", completada: true };
    setDatosEngine(d);
    igual(contextoActual().racha, 1, "solo cuenta hoy: lo anterior quedó del otro lado del corte");
  });

  test("RACHA: cumplir hoy saca el estado de riesgo", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [{ fecha: hoyLocal(-2), principal: { completada: true } }];
    setDatosEngine(d);
    igual(contextoActual().rachaEnRiesgo, true, "ayer faltó: en riesgo");
    d.misiones.hoy.principal = { titulo: "x", completada: true };
    setDatosEngine(d);
    igual(contextoActual().rachaEnRiesgo, false, "cumplida hoy: asegurada");
    igual(contextoActual().racha, 2, "y el hueco de ayer quedó perdonado");
  });

  test("no cumplir todavía HOY no corta la racha", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [{ fecha: hoyLocal(-1), principal: { completada: true } }];
    setDatosEngine(d);
    igual(contextoActual().racha, 1, "el día en curso no penaliza");
  });
}
