/* ============================================================
   MAIN QUEST — tests/run.js
   ------------------------------------------------------------
   La suite completa, con un solo comando:

       node tests/run.js

   Hace tres cosas, en orden:
   1. Chequeo de sintaxis de todos los .js (node --check).
   2. Validación del balance de etiquetas de index.html.
   3. Los tests de lógica, contra los módulos REALES.

   Sale con código 1 si algo falla, así nunca se empaqueta
   una entrega rota.

   Sin dependencias: solo Node y los módulos de la app.
   ============================================================ */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");

let fallosPrevios = 0;

/* ============ 1. Sintaxis ============ */

function chequearSintaxis() {
  console.log("\n  Sintaxis (node --check)");
  const archivos = [
    ...readdirSync(join(RAIZ, "js")).filter((f) => f.endsWith(".js")).map((f) => join("js", f)),
    "sw.js"
  ];
  for (const rel of archivos) {
    try {
      execFileSync(process.execPath, ["--check", join(RAIZ, rel)], { stdio: "pipe" });
      console.log(`    ✓ ${rel}`);
    } catch (err) {
      console.log(`    ✗ ${rel}`);
      console.log(`      ${String(err.stderr || err.message).split("\n")[0]}`);
      fallosPrevios += 1;
    }
  }
}

/* ============ 2. HTML ============
   Balance de etiquetas. Detecta el clásico </div> de más
   que rompe el layout entero sin dar ningún error visible. */

const VACIAS = new Set(["meta", "link", "input", "br", "img", "hr", "source", "track", "wbr", "area", "base", "col", "embed", "param"]);

function chequearHTML() {
  console.log("\n  HTML (balance de etiquetas)");
  const html = readFileSync(join(RAIZ, "index.html"), "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!DOCTYPE[^>]*>/i, "");

  const pila = [];
  let fallo = null;

  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [, cierre, tag, attrs, autoCierre] = m;
    const nombre = tag.toLowerCase();
    if (VACIAS.has(nombre) || autoCierre === "/") continue;

    if (cierre) {
      const ultimo = pila.pop();
      if (ultimo !== nombre) {
        fallo = `</${nombre}> inesperado (había <${ultimo || "nada"}> abierto)`;
        break;
      }
    } else {
      pila.push(nombre);
    }
  }

  if (!fallo && pila.length) fallo = `quedaron etiquetas sin cerrar: ${pila.join(", ")}`;

  if (fallo) {
    console.log(`    ✗ index.html — ${fallo}`);
    fallosPrevios += 1;
  } else {
    console.log("    ✓ index.html");
  }
}

/* ============ 3. Coherencia del proyecto ============
   Chequeos rápidos de las convenciones que ya nos costaron
   entregas fallidas. Baratos y salvan tiempo. */

function chequearConvenciones() {
  console.log("\n  Convenciones del proyecto");
  const errores = [];

  const sw = readFileSync(join(RAIZ, "sw.js"), "utf8");
  const app = readFileSync(join(RAIZ, "js", "app.js"), "utf8");
  const version = readFileSync(join(RAIZ, "VERSION.txt"), "utf8");

  const cache = sw.match(/CACHE_VERSION\s*=\s*"([^"]+)"/)?.[1];
  if (!cache) errores.push("sw.js no tiene CACHE_VERSION");
  else if (!version.includes(cache)) {
    errores.push(`VERSION.txt no menciona la caché actual (${cache})`);
  }

  if (!/MAIN QUEST · [^"]+ · datos v/.test(app)) {
    errores.push("app.js no muestra el texto de versión");
  }

  // Todo archivo de js/ tiene que estar cacheado por el SW.
  for (const f of readdirSync(join(RAIZ, "js")).filter((f) => f.endsWith(".js"))) {
    if (!sw.includes(`./js/${f}`)) errores.push(`sw.js no cachea js/${f}`);
  }

  // toISOString() para fechas de calendario es el bug de UTC.
  for (const f of readdirSync(join(RAIZ, "js")).filter((f) => f.endsWith(".js"))) {
    const src = readFileSync(join(RAIZ, "js", f), "utf8");
    for (const linea of src.split("\n")) {
      if (linea.includes("toISOString().slice(0, 10)") && !linea.trim().startsWith("//")) {
        errores.push(`${f} usa toISOString() para una fecha de calendario (usar hoyISO())`);
      }
    }
  }

  if (errores.length) {
    for (const e of errores) console.log(`    ✗ ${e}`);
    fallosPrevios += errores.length;
  } else {
    console.log("    ✓ caché, versiones y fechas en orden");
  }
}

/* ============ 4. Tests de lógica ============ */

async function correrTests() {
  // Los stubs se instalan ANTES de importar los módulos.
  const { instalarStubs, resumen } = await import("./helpers.js");
  const dom = instalarStubs();

  const suites = [
    await import("./suite-store.js"),
    await import("./suite-xp.js"),
    await import("./suite-engine.js"),
    await import("./suite-sistemas.js"),
    await import("./suite-historia.js"),
    await import("./suite-iconos.js"),
    await import("./suite-arranque.js")  // va último: deja datos cargados
  ];

  for (const s of suites) s.correr(dom);

  return resumen();
}

/* ============ Main ============ */

console.log("\n╔══════════════════════════════════════════╗");
console.log("║  MAIN QUEST — suite de tests             ║");
console.log("╚══════════════════════════════════════════╝");

chequearSintaxis();
chequearHTML();
chequearConvenciones();

const { ok, fallos } = await correrTests();

console.log("\n────────────────────────────────────────────");
console.log(`  Tests de lógica: ${ok} ✓   ${fallos.length} ✗`);
console.log(`  Chequeos previos: ${fallosPrevios} ✗`);

if (fallos.length || fallosPrevios) {
  console.log("\n  FALLÓ. No empaquetar hasta arreglarlo.\n");
  for (const f of fallos) console.log(`   · [${f.suite}] ${f.nombre}\n     ${f.err.message}`);
  console.log("");
  process.exit(1);
}

console.log("\n  TODO EN VERDE. Listo para empaquetar.\n");
