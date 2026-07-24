/* ============================================================
   tests/suite-historia.js — Tu historia y el backup
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { armarHistoria } from "../js/history.js";
import { estadoBackup } from "../js/util.js";

export function correr() {
  suite("Tu historia");

  test("une misiones, diario y timeline en el mismo día", () => {
    const d = crearDatos(hoyLocal());
    const ayer = hoyLocal(-1);
    d.misiones.historial = [{
      fecha: ayer,
      principal: { titulo: "Editar el reel", arbol: "edicion", completada: true },
      secundarias: [{ id: "1", titulo: "a", completada: true }, { id: "2", titulo: "b", completada: false }]
    }];
    d.diario = [{ fecha: ayer, energia: 4, mejor: "el gym" }];
    d.timeline = [
      { fecha: ayer, tipo: "compra", titulo: "Desbloqueaste: Cojín" },
      { fecha: ayer, tipo: "logro", titulo: "Logro: El primer paso" }
    ];

    const h = armarHistoria(d);
    igual(h.length, 1, "todo cae en un solo día");
    igual(h[0].principal.titulo, "Editar el reel", "la misión");
    igual(h[0].secundarias, 1, "solo cuenta las secundarias COMPLETADAS");
    igual(h[0].energia, 4, "la energía del diario");
    igual(h[0].eventos.length, 2, "los dos eventos de la timeline");
  });

  test("ordena del día más reciente al más viejo", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-5), principal: { titulo: "viejo", completada: true } },
      { fecha: hoyLocal(-1), principal: { titulo: "reciente", completada: true } },
      { fecha: hoyLocal(-3), principal: { titulo: "medio", completada: true } }
    ];
    const h = armarHistoria(d);
    igual(h[0].principal.titulo, "reciente", "primero lo último que pasó");
    igual(h[2].principal.titulo, "viejo", "último lo más antiguo");
  });

  test("un día con evento pero sin misión aparece igual", () => {
    // Comprar algo un día libre también es parte de tu historia.
    const d = crearDatos(hoyLocal());
    d.timeline = [{ fecha: hoyLocal(-2), tipo: "compra", titulo: "Desbloqueaste: Planta" }];
    const h = armarHistoria(d);
    igual(h.length, 1, "el día existe");
    igual(h[0].principal, null, "sin misión, y está bien");
    igual(h[0].eventos.length, 1, "con su evento");
  });

  test("el diario del día queda disponible para desplegar", () => {
    const d = crearDatos(hoyLocal());
    const dia = hoyLocal(-1);
    d.diario = [{ fecha: dia, energia: 4, mejor: "el gym", orgullo: "no aflojé", manana: "dormir antes" }];
    const h = armarHistoria(d);
    assert(h[0].diario, "el texto del diario está");
    igual(h[0].diario.mejor, "el gym", "lo mejor");
    igual(h[0].diario.orgullo, "no aflojé", "el orgullo");
    igual(h[0].diario.manana, "dormir antes", "qué mejorar");
  });

  test("un día con solo energía NO ofrece desplegar (sin texto no hay nada que leer)", () => {
    const d = crearDatos(hoyLocal());
    d.diario = [{ fecha: hoyLocal(-1), energia: 3, mejor: "", orgullo: "", manana: "" }];
    const h = armarHistoria(d);
    igual(h[0].energia, 3, "la energía sí se guarda");
    igual(h[0].diario, null, "pero no hay diario que desplegar");
  });

  test("historia vacía no rompe nada", () => {
    igual(armarHistoria(crearDatos(hoyLocal())).length, 0, "usuario nuevo, historia vacía");
  });

  suite("Recordatorio de backup");

  test("nunca exportado: tolerante al principio, insiste con el tiempo", () => {
    const creado = (dias) => hoyLocal(-dias) + "T12:00:00.000Z";
    igual(estadoBackup(null, creado(3)).nivel, "ok", "recién empezaste: no molesta");
    igual(estadoBackup(null, creado(20)).nivel, "conviene", "a las 3 semanas, avisa");
    igual(estadoBackup(null, creado(90)).nivel, "urgente", "a los 3 meses, insiste");
  });

  test("con backups previos, los umbrales son 30 y 60 días", () => {
    igual(estadoBackup(hoyLocal(-2), null).nivel, "ok", "hace 2 días");
    igual(estadoBackup(hoyLocal(-29), null).nivel, "ok", "hace 29 días todavía va");
    igual(estadoBackup(hoyLocal(-30), null).nivel, "conviene", "al mes, avisa");
    igual(estadoBackup(hoyLocal(-61), null).nivel, "urgente", "a los dos meses, insiste");
  });

  test("informa los días exactos para poder mostrarlos", () => {
    const e = estadoBackup(hoyLocal(-7), null);
    igual(e.dias, 7, "días desde el último backup");
    igual(e.nunca, false, "sabe que sí exportó alguna vez");
    assert(estadoBackup(null, hoyLocal(-5) + "T00:00:00.000Z").nunca, "sabe que nunca exportó");
  });
}
