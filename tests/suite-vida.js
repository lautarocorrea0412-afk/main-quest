/* ============================================================
   tests/suite-vida.js — Registro de datos de vida (Entrega 12)
   ============================================================ */

import { suite, test, assert, igual, crearDatos } from "./helpers.js";
import { resumenVida, registrarTrabajo } from "../js/vida.js";

export function correr() {
  suite("Datos de vida (edición)");

  test("usuario nuevo: todo en cero", () => {
    const r = resumenVida(crearDatos());
    igual(r.totalUSD, 0); igual(r.totalHoras, 0);
    igual(r.clientes, 0); igual(r.trabajos, 0);
  });

  test("un trabajo con monto, horas y cliente suma todo", () => {
    const d = crearDatos();
    assert(registrarTrabajo(d, { monto: 500, horas: 6, cliente: "Estudio X" }), "lo acepta");
    const r = resumenVida(d);
    igual(r.totalUSD, 500); igual(r.totalHoras, 6);
    igual(r.clientes, 1); igual(r.trabajos, 1);
    igual(d.timeline.length, 1, "deja rastro en la historia");
  });

  test("se puede anotar solo horas (práctica) o solo un cobro", () => {
    const d = crearDatos();
    assert(registrarTrabajo(d, { horas: 3 }), "solo horas");
    assert(registrarTrabajo(d, { monto: 200 }), "solo monto");
    const r = resumenVida(d);
    igual(r.totalHoras, 3); igual(r.totalUSD, 200); igual(r.trabajos, 2);
  });

  test("sin monto ni horas se rechaza", () => {
    const d = crearDatos();
    igual(registrarTrabajo(d, { cliente: "solo un nombre" }), false, "hace falta monto u horas");
    igual(resumenVida(d).trabajos, 0, "nada se guardó");
  });

  test("cuenta clientes únicos, sin repetir", () => {
    const d = crearDatos();
    registrarTrabajo(d, { monto: 100, cliente: "Ana" });
    registrarTrabajo(d, { monto: 100, cliente: "ana" });   // mismo, distinta caja
    registrarTrabajo(d, { monto: 100, cliente: "Beto" });
    igual(resumenVida(d).clientes, 2, "Ana y Beto, no tres");
  });

  test("el ingreso del mes solo suma trabajos del mes en curso", () => {
    const d = crearDatos();
    registrarTrabajo(d, { monto: 800 }); // hoy: cuenta
    // Un registro viejo, mes pasado, insertado a mano:
    d.contexto.ingresos_edicion.push({ fecha: "2020-01-15", monto_usd: 999, cliente: "", horas: 0 });
    igual(resumenVida(d).delMes, 800, "el de 2020 no cuenta para este mes");
    igual(resumenVida(d).totalUSD, 1799, "pero sí para el total histórico");
  });
}
