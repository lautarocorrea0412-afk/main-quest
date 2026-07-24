/* ============================================================
   tests/suite-sistemas.js — Logros, progresión y avatar
   ------------------------------------------------------------
   Incluye el test que protege la decisión de arquitectura
   más importante del proyecto: que las dos economías
   (monedas y XP) nunca se crucen.
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal, ARBOLES } from "./helpers.js";
import { LOGROS, setDatosLogros, verificarLogros, marcarLogroManual, deshacerLogro } from "../js/achievements.js";
import { franjaLuz } from "../js/util.js";
import { PROGRESION, desbloqueosCuarto, proximaRecompensa, nuevasEntre, requisitoDe } from "../js/progression.js";
import { CATALOGO, setDatosEconomia } from "../js/economy.js";
import { setDatosEngine } from "../js/engine.js";
import { setDatosAvatar, expresionAutomatica, dibujarAvatar, desbloqueada } from "../js/avatar.js";
import { misionesFrecuentes } from "../js/missions.js";

/* Prepara los módulos que comparten los mismos datos */
function montar(d) {
  setDatosEngine(d);
  setDatosEconomia(d);
  setDatosLogros(d);
  setDatosAvatar(d);
  return d;
}

export function correr() {

  /* ================= LOGROS ================= */
  suite("Logros");

  test("usuario nuevo no desbloquea nada (sin falsos positivos)", () => {
    const d = montar(crearDatos(hoyLocal()));
    verificarLogros({ celebrar: false });
    igual(d.logros.length, 0, "sin logros");
    igual(d.economia.monedas, 0, "sin monedas regaladas");
  });

  test("verificación retroactiva: reconoce el historial existente", () => {
    const d = crearDatos(hoyLocal());
    for (let i = 1; i <= 8; i++) {
      d.misiones.historial.push({ fecha: hoyLocal(-i), principal: { completada: true } });
    }
    d.diario = Array.from({ length: 8 }, (_, i) => ({ fecha: `d${i}`, energia: 4 }));
    d.economia.inventario = [{ id: "planta" }, { id: "poster" }, { id: "led" }, { id: "figura" }, { id: "silla" }];
    d.arboles.edicion.nivel = 5;
    montar(d);
    verificarLogros({ celebrar: false });

    const ids = d.logros.map((l) => l.id);
    for (const esperado of ["primera", "racha3", "racha7", "nivel5", "diario7", "decorador"]) {
      assert(ids.includes(esperado), `faltó desbloquear "${esperado}"`);
    }
    assert(d.economia.monedas > 0, "los logros pagan monedas");
    igual(d.timeline.length, d.logros.length, "cada logro deja rastro en la timeline");
  });

  test("no se desbloquea dos veces ni paga dos veces", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.hoy.principal = { titulo: "x", completada: true };
    montar(d);
    verificarLogros({ celebrar: false });
    const logros = d.logros.length;
    const monedas = d.economia.monedas;
    verificarLogros({ celebrar: false });
    verificarLogros({ celebrar: false });
    igual(d.logros.length, logros, "sin logros duplicados");
    igual(d.economia.monedas, monedas, "sin monedas duplicadas");
  });

  test("los logros manuales nunca se auto-desbloquean", () => {
    const d = crearDatos(hoyLocal());
    d.arboles.edicion.nivel = 10;
    d.economia.inventario = CATALOGO.map((i) => ({ id: i.id }));
    montar(d);
    verificarLogros({ celebrar: false });
    const manuales = LOGROS.filter((l) => l.manual).map((l) => l.id);
    for (const id of manuales) {
      assert(!d.logros.some((l) => l.id === id), `"${id}" es manual y no debe desbloquearse solo`);
    }
  });

  test("marcar y deshacer un logro manual es un ciclo neutro", () => {
    const d = montar(crearDatos(hoyLocal()));
    const antes = { logros: d.logros.length, monedas: d.economia.monedas, timeline: d.timeline.length };

    assert(marcarLogroManual("cliente"), "se puede marcar");
    igual(d.logros.length, antes.logros + 1, "logro registrado");
    assert(d.economia.monedas > antes.monedas, "premio pagado");
    igual(d.timeline.length, antes.timeline + 1, "rastro en la timeline");

    assert(deshacerLogro("cliente"), "se puede deshacer");
    igual(d.logros.length, antes.logros, "logro borrado");
    igual(d.economia.monedas, antes.monedas, "monedas devueltas");
    igual(d.timeline.length, antes.timeline, "timeline limpia");
  });

  test("los logros automáticos NO se pueden deshacer", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.hoy.principal = { titulo: "x", completada: true };
    montar(d);
    verificarLogros({ celebrar: false });
    assert(d.logros.some((l) => l.id === "primera"), "el automático se desbloqueó");
    igual(deshacerLogro("primera"), false, "deshacer un automático debe rechazarse");
    assert(d.logros.some((l) => l.id === "primera"), "y sigue desbloqueado");
  });

  test("marcar un logro inexistente o automático a mano falla", () => {
    montar(crearDatos(hoyLocal()));
    igual(marcarLogroManual("no-existe"), false, "id inventado");
    igual(marcarLogroManual("racha3"), false, "un automático no se marca a mano");
  });

  /* ================= LUZ AMBIENTE ================= */
  suite("Luz ambiente");

  test("las franjas de luz cubren las 24 horas sin huecos", () => {
    for (let h = 0; h < 24; h++) {
      assert(["manana", "tarde", "noche"].includes(franjaLuz(h)), `hora ${h} sin franja`);
    }
  });

  test("los bordes de las franjas son los acordados", () => {
    igual(franjaLuz(5), "noche", "5 AM todavía es noche");
    igual(franjaLuz(6), "manana", "6 AM arranca la mañana");
    igual(franjaLuz(11), "manana", "11 AM sigue siendo mañana");
    igual(franjaLuz(12), "tarde", "mediodía es tarde");
    igual(franjaLuz(18), "tarde", "18 sigue siendo tarde");
    igual(franjaLuz(19), "noche", "a las 19 arranca la noche");
    igual(franjaLuz(23), "noche", "a las 23 el cuarto YA está en modo noche");
  });

  suite("Logros (continuación)");

  test("la curva de premios respeta la dificultad", () => {
    const p = Object.fromEntries(LOGROS.map((l) => [l.id, l.premio]));
    assert(p.racha30 > p.racha7 && p.racha7 > p.racha3, "las rachas escalan");
    assert(p.mis365 > p.mis50, "365 misiones vale más que 50");
    assert(p.nivel10 > p.nivel5, "la maestría vale más");
    assert(p.mis365 > p.racha30, "el logro de un año supera al del mes");
    const max = Math.max(...LOGROS.map((l) => l.premio));
    igual(p.japon, max, "volver a Japón es el techo de toda la tabla");
  });

  test("todos los logros automáticos contables tienen progreso sano", () => {
    const d = montar(crearDatos(hoyLocal()));
    d.arboles.edicion.nivel = 3;
    for (const l of LOGROS.filter((x) => !x.manual)) {
      assert(l.progreso, `${l.id} sin función de progreso`);
      const { actual, meta } = l.progreso();
      assert(Number.isFinite(actual) && actual >= 0, `${l.id}: actual inválido`);
      assert(meta > 0, `${l.id}: meta inválida`);
    }
  });

  test("todos los logros tienen id único y premio positivo", () => {
    const ids = new Set();
    for (const l of LOGROS) {
      assert(!ids.has(l.id), `id repetido: ${l.id}`);
      ids.add(l.id);
      assert(l.premio > 0, `${l.id} sin premio`);
      assert(l.nombre && l.desc, `${l.id} sin nombre o descripción`);
    }
  });

  /* ================= PROGRESIÓN ================= */
  suite("Progresión RPG");

  test("30 recompensas, 5 por árbol, en los niveles 2/3/5/7/10", () => {
    igual(PROGRESION.length, 30, "total");
    for (const arbol of ARBOLES) {
      const del = PROGRESION.filter((e) => e.arbol === arbol);
      igual(del.length, 5, `recompensas de ${arbol}`);
      igual(del.map((e) => e.nivel).sort((a, b) => a - b).join(","), "2,3,5,7,10", `niveles de ${arbol}`);
    }
  });

  test("el progreso se CALCULA, no se guarda", () => {
    const d = crearDatos();
    montar(d);
    igual(desbloqueada("hoodie"), false, "NV1 no tiene hoodie");
    d.arboles.edicion.nivel = 2;
    igual(desbloqueada("hoodie"), true, "NV2 sí, sin tocar ningún inventario");
    igual(d.economia.inventario.length, 0, "el inventario de tienda no se ensucia");
  });

  test("las piezas sin requisito son libres", () => {
    igual(requisitoDe("oversize"), null, "la remera inicial es libre");
    igual(requisitoDe("jogging"), null, "el jogging inicial es libre");
    assert(requisitoDe("haori"), "el haori sí tiene requisito");
  });

  test("los objetos del cuarto se encienden por nivel", () => {
    const d = crearDatos();
    igual(desbloqueosCuarto(d).size, 0, "NV1: cuarto sin extras");
    d.arboles.japones.nivel = 10;
    const activos = desbloqueosCuarto(d);
    assert(activos.has("kanji"), "NV5 de japonés incluido");
    assert(activos.has("fx-tokio"), "NV10 de japonés incluido");
  });

  test("nuevasEntre detecta todo lo ganado en un salto de nivel", () => {
    const ids = nuevasEntre("edicion", 1, 5).map((e) => e.id);
    igual(ids.join(","), "hoodie,auriculares,placa-creador", "salto de NV1 a NV5");
  });

  test("proximaRecompensa apunta al siguiente escalón y se agota en NV10", () => {
    const d = crearDatos();
    igual(proximaRecompensa(d, "edicion").nivel, 2, "desde NV1");
    d.arboles.edicion.nivel = 7;
    igual(proximaRecompensa(d, "edicion").nivel, 10, "desde NV7");
    d.arboles.edicion.nivel = 10;
    igual(proximaRecompensa(d, "edicion"), null, "en NV10 no queda nada");
  });

  test("REGLA DE ORO: las dos economías nunca se cruzan", () => {
    const idsTienda = new Set(CATALOGO.map((i) => i.id));
    const idsProgreso = PROGRESION.filter((e) => e.tipo === "cuarto" || e.tipo === "efecto").map((e) => e.id);
    for (const id of idsProgreso) {
      assert(!idsTienda.has(id), `"${id}" está en la tienda Y en la progresión`);
    }
    // Y al revés: ningún ítem de tienda pide nivel.
    for (const item of CATALOGO) {
      igual(requisitoDe(item.id), null, `el ítem de tienda "${item.id}" no debe depender del nivel`);
    }
  });

  /* ================= MISIONES FRECUENTES ================= */
  suite("Misiones frecuentes");

  test("C-23: top 3, mínimo 2 repeticiones, normaliza mayúsculas", () => {
    const d = crearDatos(hoyLocal());
    const dias = [
      ["Entrenar", "fitness"], ["entrenar", "fitness"], ["ENTRENAR", "fitness"],
      ["Editar video", "edicion"], ["Editar video", "edicion"],
      ["Japonés", "japones"], ["Japonés", "japones"],
      ["Leer", null], // una sola vez: no califica
      ["Estudiar", "facultad"], ["Estudiar", "facultad"]
    ];
    d.misiones.historial = dias.map(([titulo, arbol], i) => ({
      fecha: hoyLocal(-20 + i),
      principal: { titulo, arbol, completada: true }
    }));
    const f = misionesFrecuentes(d);
    igual(f.length, 3, "nunca más de 3");
    igual(f[0].titulo.toLowerCase(), "entrenar", "la más repetida primera (3 veces, cualquier mayúscula)");
    assert(!f.some((x) => x.titulo === "Leer"), "una sola vez no califica");
    assert(f.every((x) => x.veces >= 2), "todas con 2 o más repeticiones");
  });

  test("C-23: las incompletas no cuentan", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-2), principal: { titulo: "Editar", arbol: "edicion", completada: false } },
      { fecha: hoyLocal(-1), principal: { titulo: "Editar", arbol: "edicion", completada: false } }
    ];
    igual(misionesFrecuentes(d).length, 0, "prometido dos veces no es hecho dos veces");
  });

  /* ================= AVATAR ================= */
  suite("Avatar y expresiones");

  const conContexto = (mod) => {
    const d = crearDatos(hoyLocal());
    mod(d);
    montar(d);
    return d;
  };

  test("expresión por defecto: tranquilo", () => {
    conContexto(() => {});
    igual(expresionAutomatica(), "normal");
  });

  test("misión cumplida hoy → orgullo", () => {
    conContexto((d) => { d.misiones.hoy.principal = { titulo: "x", completada: true }; });
    igual(expresionAutomatica(), "feliz");
  });

  test("parcial cerca → concentrado", () => {
    conContexto((d) => { d.contexto.parciales = [{ id: "p", materia: "X", fecha: hoyLocal(5) }]; });
    igual(expresionAutomatica(), "concentrado");
  });

  test("energía baja → cansado", () => {
    conContexto((d) => { d.diario = [{ fecha: "a", energia: 1 }, { fecha: "b", energia: 2 }]; });
    igual(expresionAutomatica(), "cansado");
  });

  test("racha alta → confiado", () => {
    conContexto((d) => {
      for (let i = 1; i <= 4; i++) d.misiones.historial.push({ fecha: hoyLocal(-i), principal: { completada: true } });
    });
    igual(expresionAutomatica(), "confiado");
  });

  test("PRIORIDAD: el cansancio le gana al parcial también en la cara", () => {
    conContexto((d) => {
      d.diario = [{ fecha: "a", energia: 1 }, { fecha: "b", energia: 1 }];
      d.contexto.parciales = [{ id: "p", materia: "X", fecha: hoyLocal(5) }];
    });
    igual(expresionAutomatica(), "cansado", "salud primero, igual que en los mensajes");
  });

  test("el avatar se dibuja con cualquier combinación", () => {
    const d = conContexto(() => {});
    const combos = [
      ["largo", "oversize", "jogging", "ninguno"],
      ["gorra", "haori", "cargo", "auriculares"],
      ["tomado", "blazer", "jean", "reloj"],
      ["corto", "varsity", "jogging", "anteojos"]
    ];
    for (const [pelo, remera, pantalon, accesorio] of combos) {
      d.perfil.avatar = { pelo, remera, pantalon, accesorio };
      setDatosAvatar(d);
      const svg = dibujarAvatar(1);
      assert(svg.startsWith("<svg"), `${remera} no genera SVG`);
      assert(svg.length > 1500, `${remera} genera un SVG sospechosamente corto`);
      assert(svg.includes('viewBox="0 0 48 80"'), "viewBox correcto");
    }
  });

  test("las 5 expresiones producen dibujos distintos", () => {
    const d = conContexto(() => {});
    const vistos = new Set();
    for (const e of ["normal", "feliz", "concentrado", "cansado", "confiado"]) {
      vistos.add(dibujarAvatar(1, e));
    }
    igual(vistos.size, 5, "cada expresión debe dibujar algo distinto");
  });
}
