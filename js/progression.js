/* ============================================================
   MAIN QUEST — progression.js
   ------------------------------------------------------------
   Las líneas de evolución RPG: qué desbloquea cada nivel de
   cada árbol. La regla de oro del diseño:

   ⭐ PROGRESO: no se guarda, SE CALCULA. Si tenés Edición
      NV3, tenés los auriculares. Siempre. Sin registro, sin
      bugs de sincronización. Son hitos permanentes.
   🪙 TIENDA: es stock comprado, vive en el inventario.

   Un objeto de progreso nunca aparece en la tienda; uno de
   tienda nunca depende del nivel. Esa separación es la
   arquitectura, no una convención.

   Tipos de recompensa:
   - prenda    → ropa del avatar (remera o pantalón)
   - accesorio → capa extra del avatar (auriculares, mochila…)
   - cuarto    → objeto en la habitación (grupo "nivel-" del SVG)
   - efecto    → cambio visual de la escena (grupo "nivel-fx-")

   Agregar una recompensa nueva = una entrada acá + su dibujo.
   ============================================================ */

export const PROGRESION = [

  /* ---------- 🎬 EDICIÓN ---------- */
  { arbol: "edicion",   nivel: 2,  tipo: "prenda",    id: "hoodie",          nombre: "Hoodie de editor" },
  { arbol: "edicion",   nivel: 3,  tipo: "accesorio", id: "auriculares",     nombre: "Auriculares" },
  { arbol: "edicion",   nivel: 5,  tipo: "cuarto",    id: "placa-creador",   nombre: "Placa de creador" },
  { arbol: "edicion",   nivel: 7,  tipo: "prenda",    id: "tecnica",         nombre: "Campera técnica" },
  { arbol: "edicion",   nivel: 10, tipo: "efecto",    id: "fx-monitores",    nombre: "Estación encendida" },

  /* ---------- 🏋️ FITNESS ---------- */
  { arbol: "fitness",   nivel: 2,  tipo: "prenda",    id: "jersey",          nombre: "Jersey deportivo" },
  { arbol: "fitness",   nivel: 3,  tipo: "accesorio", id: "munequera",       nombre: "Muñequera" },
  { arbol: "fitness",   nivel: 5,  tipo: "cuarto",    id: "mancuernas",      nombre: "Mancuernas" },
  { arbol: "fitness",   nivel: 7,  tipo: "prenda",    id: "training",        nombre: "Conjunto training" },
  { arbol: "fitness",   nivel: 10, tipo: "cuarto",    id: "barra-discos",    nombre: "Barra y discos" },

  /* ---------- 📚 FACULTAD ---------- */
  { arbol: "facultad",  nivel: 2,  tipo: "prenda",    id: "camisa",          nombre: "Camisa" },
  { arbol: "facultad",  nivel: 3,  tipo: "accesorio", id: "mochila",         nombre: "Mochila" },
  { arbol: "facultad",  nivel: 5,  tipo: "cuarto",    id: "apuntes",         nombre: "Pila de apuntes" },
  { arbol: "facultad",  nivel: 7,  tipo: "prenda",    id: "sweater",         nombre: "Sweater universitario" },
  { arbol: "facultad",  nivel: 10, tipo: "cuarto",    id: "diploma",         nombre: "Diploma en la pared" },

  /* ---------- 🇯🇵 JAPONÉS ---------- */
  { arbol: "japones",   nivel: 2,  tipo: "prenda",    id: "cargo",           nombre: "Cargo" },
  { arbol: "japones",   nivel: 3,  tipo: "accesorio", id: "rinonera",        nombre: "Riñonera de viaje" },
  { arbol: "japones",   nivel: 5,  tipo: "cuarto",    id: "kanji",           nombre: "Cuadro con kanji" },
  { arbol: "japones",   nivel: 7,  tipo: "prenda",    id: "haori",           nombre: "Haori" },
  { arbol: "japones",   nivel: 10, tipo: "efecto",    id: "fx-tokio",        nombre: "Vista a Tokio" },

  /* ---------- 💰 FINANZAS ---------- */
  { arbol: "finanzas",  nivel: 2,  tipo: "prenda",    id: "jean",            nombre: "Jean" },
  { arbol: "finanzas",  nivel: 3,  tipo: "accesorio", id: "reloj",           nombre: "Reloj" },
  { arbol: "finanzas",  nivel: 5,  tipo: "cuarto",    id: "alcancia",        nombre: "Alcancía" },
  { arbol: "finanzas",  nivel: 7,  tipo: "prenda",    id: "blazer",          nombre: "Blazer" },
  { arbol: "finanzas",  nivel: 10, tipo: "cuarto",    id: "mapa",            nombre: "Mapa de viajes" },

  /* ---------- 🎥 STREAMING ---------- */
  { arbol: "streaming", nivel: 2,  tipo: "prenda",    id: "campera",         nombre: "Campera bomber" },
  { arbol: "streaming", nivel: 3,  tipo: "accesorio", id: "anteojos",        nombre: "Anteojos" },
  { arbol: "streaming", nivel: 5,  tipo: "cuarto",    id: "camara",          nombre: "Cámara con trípode" },
  { arbol: "streaming", nivel: 7,  tipo: "prenda",    id: "varsity",         nombre: "Campera varsity" },
  { arbol: "streaming", nivel: 10, tipo: "cuarto",    id: "neon",            nombre: "Neón ON AIR" }
];

/* ------------------------------------------------------------
   Consultas. Todas reciben los datos: este módulo no guarda
   estado propio ni toca el DOM. Es una tabla con lógica.
   ------------------------------------------------------------ */

/* ¿Qué nivel exige esta prenda o accesorio? (null = libre) */
export function requisitoDe(id) {
  const e = PROGRESION.find((p) => p.id === id);
  return e ? { arbol: e.arbol, nivel: e.nivel } : null;
}

/* ¿Está desbloqueada esta entrada para estos datos? */
export function desbloqueada(data, entrada) {
  return data.arboles[entrada.arbol].nivel >= entrada.nivel;
}

/* Ids de objetos del cuarto y efectos activos (grupos nivel-*) */
export function desbloqueosCuarto(data) {
  const set = new Set();
  for (const e of PROGRESION) {
    if ((e.tipo === "cuarto" || e.tipo === "efecto") && desbloqueada(data, e)) {
      set.add(e.id);
    }
  }
  return set;
}

/* La próxima recompensa de un árbol (para "Próximo: NV3 · …") */
export function proximaRecompensa(data, arbolId) {
  const nivel = data.arboles[arbolId].nivel;
  return PROGRESION
    .filter((e) => e.arbol === arbolId && e.nivel > nivel)
    .sort((a, b) => a.nivel - b.nivel)[0] || null;
}

/* Qué se desbloqueó al pasar de un nivel a otro (para celebrar) */
export function nuevasEntre(arbolId, nivelViejo, nivelNuevo) {
  return PROGRESION.filter(
    (e) => e.arbol === arbolId && e.nivel > nivelViejo && e.nivel <= nivelNuevo
  );
}

export const ICONO_TIPO = {
  prenda: "👕",
  accesorio: "🎒",
  cuarto: "🛋️",
  efecto: "✨"
};
