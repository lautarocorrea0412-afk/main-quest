/* ============================================================
   tests/suite-iconos.js — Íconos propios (A-3) y la separación
   de avatar.js (D-29)
   ============================================================ */

import { suite, test, assert, igual } from "./helpers.js";
import { ICONOS_ARBOL, ICONOS_TAB, ICONOS_LOGRO, LOGRO_ICONO, iconoLogro } from "../js/iconos.js";
import { ICONOS_TIENDA } from "../js/iconos-tienda.js";
import { CATALOGO } from "../js/economy.js";
import { LOGROS } from "../js/achievements.js";
import { ARBOLES_META } from "../js/xp.js";
import { PELOS, REMERAS, PANTALONES, ACCESORIOS } from "../js/avatar-arte.js";

const esSVG = (s) => typeof s === "string" && s.startsWith("<svg") && s.endsWith("</svg>");

export function correr() {
  suite("Íconos propios");

  test("cada ítem de la tienda tiene su ícono recortado del cuarto", () => {
    for (const item of CATALOGO) {
      assert(ICONOS_TIENDA[item.id], `falta el ícono de "${item.id}"`);
      assert(esSVG(ICONOS_TIENDA[item.id]), `el ícono de "${item.id}" no es un SVG`);
    }
  });

  test("los íconos de tienda usan los MISMOS rectángulos que el cuarto", () => {
    // Si son el mismo objeto, comparten colores exactos.
    assert(ICONOS_TIENDA.cojin.includes("#F58EA8"), "el cojín conserva su sakura");
    assert(ICONOS_TIENDA.planta.includes("#6BA85F"), "la planta conserva su verde");
    assert(ICONOS_TIENDA.pcgamer.includes("#2A3A4A") || ICONOS_TIENDA.pcgamer.includes("#241E2A"),
      "la PC conserva sus grises");
  });

  test("cada árbol y cada pestaña tienen ícono", () => {
    for (const id of Object.keys(ARBOLES_META)) {
      assert(esSVG(ICONOS_ARBOL[id]), `falta el ícono del árbol "${id}"`);
    }
    for (const vista of ["hoy", "habitacion", "progreso", "vos"]) {
      assert(esSVG(ICONOS_TAB[vista]), `falta el ícono de la pestaña "${vista}"`);
    }
  });

  test("los íconos de pestaña heredan el color (currentColor)", () => {
    for (const [vista, ico] of Object.entries(ICONOS_TAB)) {
      assert(ico.includes("currentColor"),
        `"${vista}" no hereda color: la pestaña activa no se pintaría`);
    }
  });

  test("los 19 logros tienen ícono y las rachas comparten familia", () => {
    for (const l of LOGROS) {
      assert(LOGRO_ICONO[l.id], `el logro "${l.id}" no tiene ícono asignado`);
      assert(esSVG(iconoLogro(l.id)), `el ícono de "${l.id}" no es un SVG`);
    }
    igual(LOGRO_ICONO.racha3, LOGRO_ICONO.racha7, "las rachas comparten ícono");
    igual(LOGRO_ICONO.racha7, LOGRO_ICONO.racha30, "las tres");
  });

  test("un logro desconocido no rompe: cae en el trofeo", () => {
    assert(esSVG(iconoLogro("no-existe")), "debe haber un ícono por defecto");
  });

  test("todos los íconos dibujados usan la grilla de 12x12", () => {
    for (const [nombre, ico] of Object.entries({ ...ICONOS_ARBOL, ...ICONOS_TAB, ...ICONOS_LOGRO })) {
      assert(ico.includes('viewBox="0 0 12 12"'), `"${nombre}" se salió de la grilla`);
      assert(ico.includes("crispEdges"), `"${nombre}" perdería el filo del pixel art`);
    }
  });

  suite("Separación de avatar.js (D-29)");

  test("el arte sigue completo tras la mudanza", () => {
    igual(Object.keys(PELOS).length, 4, "peinados");
    igual(Object.keys(REMERAS).length, 11, "remeras y camperas");
    igual(Object.keys(PANTALONES).length, 3, "pantalones");
    igual(Object.keys(ACCESORIOS).length, 7, "accesorios (incluye 'ninguno')");
  });

  test("cada pieza de arte sabe dibujarse", () => {
    for (const [grupo, coleccion] of Object.entries({ REMERAS, PANTALONES, ACCESORIOS })) {
      for (const [id, pieza] of Object.entries(coleccion)) {
        const dibujo = pieza.dibujo();
        assert(typeof dibujo === "string", `${grupo}.${id} no devuelve nada`);
        if (id !== "ninguno") assert(dibujo.includes("<rect"), `${grupo}.${id} dibuja vacío`);
      }
    }
    for (const [id, pelo] of Object.entries(PELOS)) {
      assert(pelo.atras().includes("<rect"), `pelo ${id}: falta la capa de atrás`);
      assert(pelo.adelante().includes("<rect"), `pelo ${id}: falta la capa de adelante`);
    }
  });
}
