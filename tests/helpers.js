/* ============================================================
   MAIN QUEST — tests/helpers.js
   ------------------------------------------------------------
   Todo lo que los tests necesitan para correr los módulos
   REALES de la app fuera del navegador:

   - Stubs de localStorage y document (sin librerías).
   - Un mini framework de assertions.
   - Un fixture de datos limpio.

   Regla: los tests importan los módulos de verdad, nunca
   copias de su lógica. Un test que reimplementa lo que
   prueba no prueba nada.
   ============================================================ */

/* ============ Stubs del navegador ============
   Se instalan ANTES de importar cualquier módulo de la app. */

class FakeStorage {
  constructor() { this.mapa = new Map(); }
  getItem(k) { return this.mapa.has(k) ? this.mapa.get(k) : null; }
  setItem(k, v) { this.mapa.set(k, String(v)); }
  removeItem(k) { this.mapa.delete(k); }
  clear() { this.mapa.clear(); }
}

/* Elemento falso: guarda su HTML y sabe encontrar botones
   con data-arbol, que es lo que necesita el test del
   despliegue de árboles. */
class FakeEl {
  constructor(id = "") {
    this.id = id;
    this._html = "";
    this.dataset = {};
    this.style = {};
    this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
    this.children = [];
  }
  set innerHTML(v) { this._html = String(v); }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); this._html = String(v); }
  get textContent() { return this._text; }
  insertAdjacentHTML(_pos, html) { this._html += html; }
  appendChild(el) { this.children.push(el); return el; }
  removeChild() {}
  remove() {}
  addEventListener() {}
  removeEventListener() {}
  setAttribute(k, v) { this[k] = v; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; }
  querySelectorAll(sel) {
    // Soporta el único selector que los tests necesitan.
    if (sel !== "[data-arbol]") return [];
    const ids = [...this._html.matchAll(/data-arbol="(\w+)"/g)].map((m) => m[1]);
    // Se cachean para que asignar onclick y volver a pedirlos
    // devuelva los MISMOS objetos, como en un DOM real.
    if (!this._botonesCache || this._cacheHtml !== this._html) {
      this._cacheHtml = this._html;
      this._botonesCache = ids.map((id) => ({ dataset: { arbol: id }, onclick: null }));
    }
    return this._botonesCache;
  }
  querySelector() { return null; }
  closest() { return null; }
}

export function instalarStubs() {
  const registro = new Map();

  global.localStorage = new FakeStorage();
  global.document = {
    _registro: registro,
    getElementById(id) { return registro.get(id) || null; },
    createElement() { return new FakeEl(); },
    createElementNS() { return new FakeEl(); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    body: new FakeEl("body"),
    visibilityState: "visible"
  };
  global.CustomEvent = class CustomEvent { constructor(t) { this.type = t; } };
  global.requestAnimationFrame = () => 0;
  global.window = { innerWidth: 390, innerHeight: 844 };
  // Los timers se anulan: las animaciones no deben mantener
  // vivo el proceso ni ejecutarse a destiempo en los tests.
  global.setTimeout = () => 0;

  return {
    /* Registra un elemento con id para que getElementById lo encuentre */
    montar(id) {
      const el = new FakeEl(id);
      registro.set(id, el);
      return el;
    },
    limpiar() {
      registro.clear();
      global.localStorage.clear();
    }
  };
}

/* ============ Mini framework de tests ============ */

const resultados = { ok: 0, fallos: [] };
let suiteActual = "";

export function suite(nombre) {
  suiteActual = nombre;
  console.log(`\n  ${nombre}`);
}

export function test(nombre, fn) {
  try {
    fn();
    resultados.ok += 1;
    console.log(`    ✓ ${nombre}`);
  } catch (err) {
    resultados.fallos.push({ suite: suiteActual, nombre, err });
    console.log(`    ✗ ${nombre}`);
    console.log(`      ${err.message}`);
  }
}

export function assert(cond, mensaje) {
  if (!cond) throw new Error(mensaje || "se esperaba verdadero");
}

export function igual(actual, esperado, mensaje) {
  if (actual !== esperado) {
    throw new Error(`${mensaje || "valores distintos"}: esperaba ${JSON.stringify(esperado)}, obtuve ${JSON.stringify(actual)}`);
  }
}

export function incluye(texto, fragmento, mensaje) {
  if (!String(texto).includes(fragmento)) {
    throw new Error(`${mensaje || "falta el fragmento"}: no encontré "${fragmento}"`);
  }
}

export function noIncluye(texto, fragmento, mensaje) {
  if (String(texto).includes(fragmento)) {
    throw new Error(`${mensaje || "fragmento indebido"}: encontré "${fragmento}" y no debería estar`);
  }
}

export function resumen() {
  return resultados;
}

/* ============ Fixture de datos ============
   Un usuario nuevo, limpio. Cada test lo modifica a gusto
   sin ensuciar a los demás. */

export const ARBOLES = ["fitness", "edicion", "facultad", "japones", "finanzas", "streaming"];

export function crearDatos(hoy = "2026-07-23") {
  return {
    version: 5,
    perfil: {
      nombre: "Lautaro",
      creado_en: "2026-01-01T12:00:00.000Z",
      avatar: { pelo: "largo", remera: "oversize", pantalon: "jogging", accesorio: "ninguno" }
    },
    arboles: Object.fromEntries(ARBOLES.map((k) => [k, { xp: 0, nivel: 1 }])),
    contexto: {
      parciales: [],
      objetivo_japon: { meta_usd: 10000, ahorrado_usd: 0, fecha_ideal: "2027-02" },
      ingresos_edicion: []
    },
    misiones: { hoy: { fecha: hoy, principal: null, secundarias: [] }, historial: [] },
    economia: { monedas: 0, recompensas_reales: [], inventario: [] },
    diario: [],
    logros: [],
    timeline: []
  };
}

/* Fecha local YYYY-MM-DD, igual que util.hoyISO().
   Los tests que dependen del calendario la usan para no
   romperse mañana. */
export function hoyLocal(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
