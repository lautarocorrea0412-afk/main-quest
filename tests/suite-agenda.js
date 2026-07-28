/* ============================================================
   tests/suite-agenda.js — Agenda (Entrega 17)
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { eventosDeHoy, proximosEventos, agregarEvento,
         borrarEvento, marcarAvisados } from "../js/agenda.js";

export function correr() {
  suite("Agenda");

  test("agregarEvento valida título y fecha", () => {
    const d = crearDatos();
    igual(agregarEvento(d, { fecha: "2026-08-01", titulo: "" }), false, "sin título no");
    igual(agregarEvento(d, { fecha: "mala", titulo: "Parcial" }), false, "fecha mala no");
    igual(agregarEvento(d, { fecha: "2026-08-01", titulo: "Parcial" }), true, "válido sí");
    igual(d.contexto.agenda.length, 1, "quedó uno");
    assert(d.contexto.agenda[0].id, "tiene id");
  });

  test("eventosDeHoy trae solo los de hoy no avisados", () => {
    const d = crearDatos();
    const hoy = hoyLocal();
    agregarEvento(d, { fecha: hoy, titulo: "Entrega cliente" });
    agregarEvento(d, { fecha: "2027-01-01", titulo: "Año nuevo" });
    const dehoy = eventosDeHoy(d, hoy);
    igual(dehoy.length, 1, "solo el de hoy");
    igual(dehoy[0].titulo, "Entrega cliente", "es el correcto");
  });

  test("proximosEventos ordena de hoy en adelante, sin pasado", () => {
    const d = crearDatos();
    const hoy = hoyLocal();
    agregarEvento(d, { fecha: "2020-01-01", titulo: "Viejo" });     // pasado
    agregarEvento(d, { fecha: "2027-03-01", titulo: "Lejano" });
    agregarEvento(d, { fecha: hoy, titulo: "Hoy" });
    const prox = proximosEventos(d, hoy);
    igual(prox.length, 2, "el pasado no aparece");
    igual(prox[0].titulo, "Hoy", "primero el más cercano");
    igual(prox[1].titulo, "Lejano", "después el lejano");
  });

  test("marcarAvisados evita repetir el aviso el mismo día", () => {
    const d = crearDatos();
    const hoy = hoyLocal();
    agregarEvento(d, { fecha: hoy, titulo: "Turno médico" });
    igual(eventosDeHoy(d, hoy).length, 1, "primero aparece");
    marcarAvisados(d, hoy);
    igual(eventosDeHoy(d, hoy).length, 0, "ya no aparece hoy");
  });

  test("un evento de hoy avisado AYER vuelve a aparecer hoy", () => {
    const d = crearDatos();
    const hoy = hoyLocal();
    agregarEvento(d, { fecha: hoy, titulo: "Cumple" });
    // Simulamos que se avisó ayer (otro día): debe reaparecer hoy.
    d.contexto.agenda[0].avisado_en = hoyLocal(-1);
    igual(eventosDeHoy(d, hoy).length, 1, "reaparece porque el aviso fue otro día");
  });

  test("borrarEvento quita por id", () => {
    const d = crearDatos();
    agregarEvento(d, { fecha: "2026-09-09", titulo: "X" });
    const id = d.contexto.agenda[0].id;
    borrarEvento(d, id);
    igual(d.contexto.agenda.length, 0, "se borró");
  });
}
