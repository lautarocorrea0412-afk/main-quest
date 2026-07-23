/* ============================================================
   MAIN QUEST — store.js
   ------------------------------------------------------------
   Único módulo que habla con localStorage.
   Ningún otro archivo lee o escribe datos directamente:
   todos pasan por acá. Eso permite cambiar cómo se guardan
   los datos en el futuro sin tocar el resto de la app.
   ============================================================ */

const STORAGE_KEY = "mainquest_data";

/* v2 (Fase 1 · Paso 1): las misiones dejan de ser un
   placeholder y guardan { fecha, principal, secundarias }.
   completarFaltantes() ya agrega los campos nuevos a los
   datos viejos, así que la migración es automática. */
const DATA_VERSION = 2;

/* ------------------------------------------------------------
   Estado inicial (el "personaje nivel 1").
   Si algún día agregamos campos nuevos, la función load()
   los completa automáticamente en datos viejos (migración).
   ------------------------------------------------------------ */
const DEFAULT_DATA = {
  version: DATA_VERSION,
  perfil: {
    nombre: "Lautaro",
    creado_en: null // se fija la primera vez que se abre la app
  },
  arboles: {
    fitness:   { xp: 0, nivel: 1 },
    edicion:   { xp: 0, nivel: 1 },
    facultad:  { xp: 0, nivel: 1 },
    japones:   { xp: 0, nivel: 1 },
    finanzas:  { xp: 0, nivel: 1 },
    streaming: { xp: 0, nivel: 1 }
  },
  contexto: {
    parciales: [],
    objetivo_japon: { meta_usd: 10000, ahorrado_usd: 0, fecha_ideal: "2027-02" },
    ingresos_edicion: []
  },
  misiones: { hoy: null, historial: [] },
  economia: { monedas: 0, recompensas_reales: [], inventario: [] },
  diario: [],
  logros: [],
  timeline: []
};

/* ------------------------------------------------------------
   Mezcla profunda: completa en "target" los campos que
   existan en "source" pero falten en target. No pisa datos.
   ------------------------------------------------------------ */
function completarFaltantes(target, source) {
  for (const key of Object.keys(source)) {
    const sv = source[key];
    if (!(key in target)) {
      target[key] = structuredClone(sv);
    } else if (
      sv !== null && typeof sv === "object" && !Array.isArray(sv) &&
      target[key] !== null && typeof target[key] === "object" && !Array.isArray(target[key])
    ) {
      completarFaltantes(target[key], sv);
    }
  }
  return target;
}

/* ------------------------------------------------------------
   API pública del store
   ------------------------------------------------------------ */

export function load() {
  let data;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : structuredClone(DEFAULT_DATA);
  } catch {
    // Datos corruptos: mejor arrancar limpio que romper la app.
    data = structuredClone(DEFAULT_DATA);
  }
  completarFaltantes(data, DEFAULT_DATA);
  // Los datos migrados quedan marcados con la versión actual,
  // para que los backups exportados digan la verdad.
  if (data.version !== DATA_VERSION) {
    data.version = DATA_VERSION;
    save(data);
  }
  if (!data.perfil.creado_en) {
    data.perfil.creado_en = new Date().toISOString();
    save(data);
  }
  return data;
}

export function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ------------------------------------------------------------
   Backup: exportar / importar JSON.
   Es el seguro de vida del proyecto a 10 años.
   ------------------------------------------------------------ */

export function exportar(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `mainquest-backup-${fecha}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (typeof data !== "object" || data === null || !("version" in data)) {
          throw new Error("El archivo no es un backup de MAIN QUEST.");
        }
        completarFaltantes(data, DEFAULT_DATA);
        save(data);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsText(file);
  });
}
