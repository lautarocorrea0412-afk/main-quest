/* ============================================================
   tests/suite-distribucion.js — Resumen + hoja (Entrega 8c)
   ------------------------------------------------------------
   La mejora fue de distribución: la pestaña VOS muestra un
   resumen compacto y el detalle completo se abre en una hoja.
   Verificamos que la lógica de "cuántos entran en el resumen"
   y "el recorrido completo existe" siga sana.
   ============================================================ */

import { suite, test, assert, igual, crearDatos, hoyLocal } from "./helpers.js";
import { armarHistoria } from "../js/history.js";
import { registrarAporte } from "../js/japon.js";

export function correr() {
  suite("Distribución: historia y camino");

  test("armarHistoria devuelve TODO (la hoja necesita el recorrido completo)", () => {
    const d = crearDatos(hoyLocal());
    for (let i = 1; i <= 20; i++) {
      d.misiones.historial.push({ fecha: hoyLocal(-i), principal: { titulo: "x", completada: true } });
    }
    const dias = armarHistoria(d);
    igual(dias.length, 20, "no recorta: el resumen recorta en el render, los datos están completos");
  });

  test("la historia sigue ordenada del más reciente al más viejo para la hoja", () => {
    const d = crearDatos(hoyLocal());
    d.misiones.historial = [
      { fecha: hoyLocal(-10), principal: { titulo: "viejo", completada: true } },
      { fecha: hoyLocal(-1), principal: { titulo: "nuevo", completada: true } }
    ];
    const dias = armarHistoria(d);
    igual(dias[0].principal.titulo, "nuevo", "primero el más reciente");
  });

  test("el camino a Japón conserva todos los aportes para la hoja", () => {
    const d = crearDatos();
    for (let i = 0; i < 12; i++) registrarAporte(d, 100);
    igual(d.contexto.objetivo_japon.aportes.length, 12, "los 12 aportes quedan, aunque el panel muestre 3");
  });
}
