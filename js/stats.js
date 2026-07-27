/* ============================================================
   MAIN QUEST — stats.js
   ------------------------------------------------------------
   Estadísticas, pensadas como ESPEJO y no como dashboard.
   Cada bloque no muestra un número: te dice algo de vos.

   Tres lecturas, todas de datos que ya existen (no se agrega
   nada al modelo):
   1. Constancia — misiones principales cumplidas por semana,
      últimas 6 semanas.
   2. Balance — en qué árboles estás poniendo la energía. No
      para que estén parejos (la vida no es pareja), sino para
      que VEAS hacia dónde va tu tiempo.
   3. Energía — promedio del diario, para notar rachas de
      cansancio antes de que te pasen por encima.

   Con pocos días los promedios mienten, así que cada bloque
   tiene un umbral mínimo: por debajo, invita a seguir usando
   la app en vez de mostrar ruido.
   ============================================================ */

import { ARBOLES_META } from "./xp.js";
import { dibujarAvatar } from "./avatar.js";

let data;

/* Lunes de la semana de una fecha dada (para agrupar por semana) */
function lunesDe(fecha) {
  const d = new Date(fecha);
  const dia = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dia);
  d.setHours(0, 0, 0, 0);
  return d;
}

function claveISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ------------------------------------------------------------
   1. Constancia: cumplidas por semana (últimas 6). Exportado.
   ------------------------------------------------------------ */
export function porSemana(datos, semanas = 6) {
  const cumplidas = datos.misiones.historial.filter(
    (d) => d.principal && d.principal.completada
  );
  if (datos.misiones.hoy && datos.misiones.hoy.principal && datos.misiones.hoy.principal.completada) {
    cumplidas.push(datos.misiones.hoy);
  }

  // Arranca en el lunes de hace (semanas-1) y llena hasta hoy.
  const hoyLunes = lunesDe(new Date());
  const buckets = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const l = new Date(hoyLunes);
    l.setDate(l.getDate() - i * 7);
    buckets.push({ lunes: claveISO(l), total: 0 });
  }
  const indexPorClave = new Map(buckets.map((b, i) => [b.lunes, i]));

  for (const d of cumplidas) {
    const clave = claveISO(lunesDe(new Date(d.fecha)));
    if (indexPorClave.has(clave)) buckets[indexPorClave.get(clave)].total += 1;
  }
  return buckets;
}

/* ------------------------------------------------------------
   2. Balance: cuántas cumplidas por árbol (histórico). Exportado.
   ------------------------------------------------------------ */
export function porArbol(datos) {
  const conteo = {};
  for (const id of Object.keys(ARBOLES_META)) conteo[id] = 0;

  const todas = [...datos.misiones.historial];
  if (datos.misiones.hoy) todas.push(datos.misiones.hoy);

  for (const d of todas) {
    if (d.principal && d.principal.completada && d.principal.arbol && conteo[d.principal.arbol] !== undefined) {
      conteo[d.principal.arbol] += 1;
    }
  }
  return conteo;
}

/* ------------------------------------------------------------
   3. Energía promedio del diario (últimas N entradas). Exportado.
   ------------------------------------------------------------ */
export function energiaPromedio(datos, ultimas = 14) {
  const conE = datos.diario.filter((e) => e.energia).slice(-ultimas);
  if (conE.length === 0) return null;
  const suma = conE.reduce((a, e) => a + e.energia, 0);
  return { promedio: suma / conE.length, cantidad: conE.length };
}

/* ===================== RENDER ===================== */

function barrasSemana(buckets) {
  const max = Math.max(1, ...buckets.map((b) => b.total));
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `<div class="stat-semanas">${buckets.map((b) => {
    const h = Math.round((b.total / max) * 100);
    const [y, m, d] = b.lunes.split("-").map(Number);
    return `
      <div class="stat-semana">
        <div class="stat-semana__barra">
          <div class="stat-semana__fill" style="height:${h}%"></div>
          ${b.total > 0 ? `<span class="stat-semana__num">${b.total}</span>` : ""}
        </div>
        <span class="stat-semana__label">${d}/${MESES[m - 1]}</span>
      </div>`;
  }).join("")}</div>`;
}

function barrasArbol(conteo) {
  const total = Object.values(conteo).reduce((a, n) => a + n, 0);
  if (total === 0) return "";
  // Ordenadas de más a menos: se lee hacia dónde va tu tiempo.
  const orden = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  return `<div class="stat-arboles">${orden.map(([id, n]) => {
    const pct = Math.round((n / total) * 100);
    const meta = ARBOLES_META[id];
    return `
      <div class="stat-arbol">
        <span class="stat-arbol__nombre">${meta.emoji} ${meta.nombre}</span>
        <span class="stat-arbol__barra"><span class="stat-arbol__fill" style="width:${pct}%"></span></span>
        <span class="stat-arbol__pct">${pct}%</span>
      </div>`;
  }).join("")}</div>`;
}

export function renderStats() {
  const cont = document.getElementById("stats-panel");
  if (!cont || !data) return;

  const rec = records(data);

  // Umbral anti-ruido: con muy poco, invitamos a seguir.
  if (rec.totalMisiones < 3) {
    cont.innerHTML = `<p class="stats-vacio">Acá se va a escribir tu leyenda: tu constancia, tus récords, la forma de tu personaje. Todavía es pronto — cumplí unas misiones y volvé.</p>`;
    return;
  }

  const ficha = fichaPersonaje(data);
  const mapa = mapaConstancia(data);
  const arboles = porArbol(data);
  const energiaSem = energiaPorSemana(data);

  cont.innerHTML = `
    ${cartaHTML(ficha)}
    ${mapaHTML(mapa)}
    ${recordsHTML(rec)}
    ${radarHTML(arboles)}
    ${lineaEnergiaHTML(energiaSem)}
  `;

  // Microanimaciones al entrar: contadores que suben y celdas
  // del mapa que se encienden escalonadas.
  animarEntrada(cont, rec);
}

/* --- Carta de personaje (protagonista) --- */
function cartaHTML(f) {
  return `
    <div class="leyenda-carta" id="leyenda-carta">
      <div class="leyenda-carta__brillo"></div>
      <div class="leyenda-carta__avatar">${dibujarAvatarMini()}</div>
      <div class="leyenda-carta__info">
        <div class="leyenda-carta__titulo">${f.titulo}</div>
        <div class="leyenda-carta__nombre">${escaparT(data.perfil.nombre || "vos")}</div>
        <div class="leyenda-carta__stats">
          <span><b data-cuenta="${f.dias}">0</b> días de viaje</span>
          <span><b data-cuenta="${f.nivelTotal}">0</b> nivel total</span>
        </div>
      </div>
    </div>`;
}

/* --- Mapa de constancia (calendario tipo GitHub) --- */
function mapaHTML(celdas) {
  const cuadros = celdas.map((c, i) =>
    `<span class="leyenda-celda leyenda-celda--${c.nivel}" style="--i:${i}" title="${c.fecha}"></span>`
  ).join("");
  return `
    <div class="leyenda-bloque">
      <div class="leyenda-titulo">Tu constancia</div>
      <div class="leyenda-mapa">${cuadros}</div>
      <div class="leyenda-mapa__leyenda">
        <span>menos</span>
        <span class="leyenda-celda leyenda-celda--0"></span>
        <span class="leyenda-celda leyenda-celda--1"></span>
        <span class="leyenda-celda leyenda-celda--2"></span>
        <span class="leyenda-celda leyenda-celda--3"></span>
        <span>más</span>
      </div>
    </div>`;
}

/* --- Récords personales (cartas chicas) --- */
function recordsHTML(r) {
  const cartas = [
    { ico: "🔥", n: r.mejorRacha, txt: "racha más larga", suf: r.mejorRacha === 1 ? "día" : "días" },
    { ico: "⭐", n: r.mejorSemana, txt: "mejor semana", suf: "misiones" },
    { ico: "🏅", n: r.totalMisiones, txt: "misiones totales", suf: "" },
    { ico: "⚡", n: r.diaTopSecundarias, txt: "día más activo", suf: "extras" }
  ];
  return `
    <div class="leyenda-bloque">
      <div class="leyenda-titulo">Tus récords</div>
      <div class="leyenda-records">
        ${cartas.map((c) => `
          <div class="record-carta">
            <span class="record-ico">${c.ico}</span>
            <span class="record-num"><b data-cuenta="${c.n}">0</b> <em>${c.suf}</em></span>
            <span class="record-txt">${c.txt}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

/* --- Radar de árboles (la forma de tu personaje) --- */
function radarHTML(conteo) {
  const ids = Object.keys(ARBOLES_META);
  const total = Object.values(conteo).reduce((a, n) => a + n, 0);
  if (total === 0) return "";
  const max = Math.max(1, ...Object.values(conteo));
  const N = ids.length;
  const cx = 100, cy = 100, R = 74;

  const punto = (i, r) => {
    const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
  };
  // Anillos de referencia
  let anillos = "";
  for (let k = 1; k <= 3; k++) {
    const pts = ids.map((_, i) => punto(i, (R * k) / 3).map((v) => v.toFixed(1)).join(",")).join(" ");
    anillos += `<polygon points="${pts}" class="radar-anillo"/>`;
  }
  // Ejes + etiquetas
  let ejes = "", labels = "";
  ids.forEach((id, i) => {
    const [x, y] = punto(i, R);
    ejes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="radar-eje"/>`;
    const [lx, ly] = punto(i, R + 14);
    labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="radar-label">${ARBOLES_META[id].emoji}</text>`;
  });
  // El polígono de datos
  const pts = ids.map((id, i) => punto(i, (conteo[id] / max) * R).map((v) => v.toFixed(1)).join(",")).join(" ");

  return `
    <div class="leyenda-bloque">
      <div class="leyenda-titulo">La forma de tu personaje</div>
      <svg class="leyenda-radar" viewBox="0 0 200 200" aria-hidden="true">
        ${anillos}${ejes}
        <polygon points="${pts}" class="radar-datos"/>
        ${labels}
      </svg>
    </div>`;
}

/* --- Línea de energía por semana --- */
function lineaEnergiaHTML(serie) {
  const conDatos = serie.filter((s) => s.prom !== null);
  if (conDatos.length < 2) return "";
  const W = 260, H = 70, pad = 8;
  const paso = (W - pad * 2) / (serie.length - 1);
  const y = (v) => H - pad - ((v - 1) / 4) * (H - pad * 2); // energía 1..5
  let d = "", puntos = "";
  serie.forEach((s, i) => {
    if (s.prom === null) return;
    const px = pad + i * paso, py = y(s.prom);
    d += (d ? " L" : "M") + px.toFixed(1) + "," + py.toFixed(1);
    puntos += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" class="linea-punto"/>`;
  });
  return `
    <div class="leyenda-bloque">
      <div class="leyenda-titulo">Tu ánimo en el tiempo</div>
      <svg class="leyenda-linea" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <path d="${d}" class="linea-path"/>
        ${puntos}
      </svg>
      <p class="stat-lectura">De <b>${conDatos.length}</b> semanas con diario. Los valles suelen ser semanas de parcial.</p>
    </div>`;
}

/* Avatar chico para la carta (sin la lógica de expresión). */
function dibujarAvatarMini() {
  try { return dibujarAvatar(1, "confiado"); } catch { return ""; }
}

function escaparT(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* Contadores que suben desde 0 + mapa que se enciende. */
function animarEntrada(cont, rec) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    cont.querySelectorAll("[data-cuenta]").forEach((el) => { el.textContent = el.dataset.cuenta; });
    return;
  }
  cont.querySelectorAll("[data-cuenta]").forEach((el) => {
    const fin = parseInt(el.dataset.cuenta, 10) || 0;
    if (fin === 0) { el.textContent = "0"; return; }
    const t0 = performance.now(), dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const val = Math.round(fin * (1 - Math.pow(1 - p, 3)));
      el.textContent = val;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ===================== API ===================== */

export function setDatosStats(appData) {
  data = appData;
  renderStats();
}

export function initStats(appData) {
  data = appData;
  document.addEventListener("contexto-cambiado", renderStats);
  renderStats();
}

/* ============================================================
   "TU LEYENDA" — cálculos del rediseño (Entrega 11)
   Todo sobre datos que ya existen. Exportados para testear.
   ============================================================ */

/* Todos los días con actividad, unificados: para el mapa y los
   récords. Cada uno: { fecha, cumplida, secundarias, energia }. */
function diasActividad(datos) {
  const mapa = new Map();
  const tocar = (f) => {
    if (!mapa.has(f)) mapa.set(f, { fecha: f, cumplida: false, secundarias: 0, energia: null });
    return mapa.get(f);
  };
  const todas = [...datos.misiones.historial];
  if (datos.misiones.hoy) todas.push(datos.misiones.hoy);
  for (const d of todas) {
    if (!d.fecha) continue;
    const e = tocar(d.fecha);
    if (d.principal && d.principal.completada) e.cumplida = true;
    e.secundarias = (d.secundarias || []).filter((s) => s.completada).length;
  }
  for (const e of datos.diario) {
    if (e.fecha) tocar(e.fecha).energia = e.energia || null;
  }
  return [...mapa.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* La carta de personaje: días de viaje, nivel total y título. */
export function fichaPersonaje(datos) {
  const creado = datos.perfil.creado_en ? new Date(datos.perfil.creado_en) : new Date();
  const dias = Math.max(1, Math.floor((Date.now() - creado.getTime()) / 86400000) + 1);
  const nivelTotal = Object.values(datos.arboles).reduce((a, x) => a + x.nivel, 0);

  // El título sale del árbol más avanzado (nivel, después XP).
  const arboles = Object.entries(datos.arboles)
    .sort((a, b) => b[1].nivel - a[1].nivel || b[1].xp - a[1].xp);
  const [domId, domVal] = arboles[0];
  const TITULOS = {
    edicion: "El Editor", fitness: "El Atleta", facultad: "El Estudiante",
    japones: "El Viajero", finanzas: "El Estratega", streaming: "El Creador"
  };
  // Si todo está muy parejo y bajo, todavía no hay título ganado.
  const titulo = domVal.nivel >= 2 ? (TITULOS[domId] || "El Aventurero") : "Recién llegado";

  return { dias, nivelTotal, titulo, arbolDominante: domId };
}

/* Récords personales: los números de orgullo. */
export function records(datos) {
  const dias = diasActividad(datos);
  const cumplidas = dias.filter((d) => d.cumplida);

  // Racha más larga histórica (días consecutivos con cumplida).
  let mejorRacha = 0, rachaActual = 0, prev = null;
  for (const d of dias) {
    if (!d.cumplida) { rachaActual = 0; prev = null; continue; }
    if (prev) {
      const gap = (new Date(d.fecha) - new Date(prev)) / 86400000;
      rachaActual = gap === 1 ? rachaActual + 1 : 1;
    } else rachaActual = 1;
    mejorRacha = Math.max(mejorRacha, rachaActual);
    prev = d.fecha;
  }

  // Mejor semana (más cumplidas en una ventana lunes-domingo).
  const semanas = porSemana(datos, 52).map((s) => s.total);
  const mejorSemana = Math.max(0, ...semanas);

  // Día más productivo (más secundarias en un día).
  const diaTop = dias.reduce((max, d) => d.secundarias > (max?.secundarias ?? -1) ? d : max, null);

  return {
    totalMisiones: cumplidas.length,
    mejorRacha,
    mejorSemana,
    diaTopSecundarias: diaTop ? diaTop.secundarias : 0
  };
}

/* Mapa de constancia: los últimos ~112 días (16 semanas) con
   su intensidad (0-3) según cuánto hiciste ese día. */
export function mapaConstancia(datos, dias = 112) {
  const act = new Map(diasActividad(datos).map((d) => [d.fecha, d]));
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const celdas = [];
  for (let i = dias - 1; i >= 0; i--) {
    const f = new Date(hoy); f.setDate(f.getDate() - i);
    const clave = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
    const d = act.get(clave);
    let nivel = 0;
    if (d) {
      if (d.cumplida) nivel = 2 + Math.min(1, d.secundarias); // 2 o 3
      else if (d.secundarias > 0 || d.energia) nivel = 1;     // algo pasó
    }
    celdas.push({ fecha: clave, nivel });
  }
  return celdas;
}

/* Serie de energía por semana (para la línea de ánimo). */
export function energiaPorSemana(datos, semanas = 8) {
  const conE = datos.diario.filter((e) => e.energia && e.fecha);
  const hoyLunes = lunesDe(new Date());
  const buckets = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const l = new Date(hoyLunes); l.setDate(l.getDate() - i * 7);
    buckets.push({ lunes: claveISO(l), suma: 0, n: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.lunes, i]));
  for (const e of conE) {
    const clave = claveISO(lunesDe(new Date(e.fecha)));
    if (idx.has(clave)) { const b = buckets[idx.get(clave)]; b.suma += e.energia; b.n += 1; }
  }
  return buckets.map((b) => ({ lunes: b.lunes, prom: b.n ? b.suma / b.n : null }));
}
