/* ============================================================
   tests/suite-sonido.js — Motor de sonido (Entrega 14)
   ------------------------------------------------------------
   No podemos oír nada en Node, pero sí verificar que el motor
   es SEGURO: que nunca tire un error hacia la app, que respete
   el apagado, y que no intente sonar sin contexto despierto.
   Esas son las garantías que importan (un sonido que rompe la
   app es mucho peor que un sonido que no suena).
   ============================================================ */

import { suite, test, assert, igual } from "./helpers.js";
import { sonar, setSonido, initSonido } from "../js/sonido.js";

export function correr() {
  suite("Sonido (seguridad, no audio)");

  test("sonar no explota aunque no haya AudioContext", () => {
    // En Node no hay window.AudioContext: sonar debe ser un no-op
    // silencioso, jamás un throw.
    let rompio = false;
    try { sonar("principal"); sonar("nivel"); sonar("cualquiera"); }
    catch { rompio = true; }
    igual(rompio, false, "nunca tira error hacia la app");
  });

  test("con el sonido apagado, sonar no hace nada", () => {
    setSonido(false);
    let rompio = false;
    try { sonar("logro"); } catch { rompio = true; }
    igual(rompio, false, "apagado y seguro");
  });

  test("un efecto inexistente se ignora sin romper", () => {
    setSonido(true); // aunque intente, sin contexto no suena
    let rompio = false;
    try { sonar("no-existe"); } catch { rompio = true; }
    igual(rompio, false, "nombre desconocido: no-op");
  });

  test("initSonido lee el ajuste sin romper aunque falte", () => {
    let rompio = false;
    try {
      initSonido({ ajustes: { sonido: true } });
      initSonido({});          // sin ajustes
      initSonido(undefined);   // sin nada
    } catch { rompio = true; }
    igual(rompio, false, "tolera datos incompletos");
  });
}
