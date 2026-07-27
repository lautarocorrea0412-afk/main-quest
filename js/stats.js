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

  const historicoCumplidas =
    data.misiones.historial.filter((d) => d.principal && d.principal.completada).length +
    (data.misiones.hoy && data.misiones.hoy.principal && data.misiones.hoy.principal.completada ? 1 : 0);

  // Umbral: con muy poco no hay nada honesto que mostrar.
  if (historicoCumplidas < 3) {
    cont.innerHTML = `<p class="stats-vacio">Cumplí unas cuantas misiones y acá vas a ver cómo se reparte tu energía, tu constancia semana a semana y cómo venís de ánimo. Todavía es pronto: seguí un poco más.</p>`;
    return;
  }

  const semanas = porSemana(data);
  const arboles = porArbol(data);
  const energia = energiaPromedio(data);

  // Lectura de la constancia: comparar esta semana con el promedio.
  const totales = semanas.map((s) => s.total);
  const estaSemana = totales[totales.length - 1];
  const promSemanas = totales.slice(0, -1).reduce((a, n) => a + n, 0) / Math.max(1, totales.length - 1);
  let lecturaConstancia = "";
  if (promSemanas >= 1) {
    if (estaSemana >= promSemanas) lecturaConstancia = "Vas igual o mejor que tu promedio. Buena semana.";
    else lecturaConstancia = "Esta semana venís más tranquila que tu promedio. Un día a la vez.";
  }

  // Lectura del balance: cuál domina.
  const orden = Object.entries(arboles).sort((a, b) => b[1] - a[1]);
  const dominante = orden[0][1] > 0 ? ARBOLES_META[orden[0][0]].nombre : null;

  // Lectura de la energía.
  let lecturaEnergia = "";
  if (energia) {
    if (energia.promedio >= 3.8) lecturaEnergia = "Venís con buena energía en general.";
    else if (energia.promedio >= 2.5) lecturaEnergia = "Energía intermedia: ojo con no exigirte de más.";
    else lecturaEnergia = "Venís con la energía baja últimamente. Descansar también es avanzar.";
  }

  cont.innerHTML = `
    <div class="stat-bloque">
      <div class="stat-titulo">Tu constancia</div>
      ${barrasSemana(semanas)}
      ${lecturaConstancia ? `<p class="stat-lectura">${lecturaConstancia}</p>` : ""}
    </div>

    <div class="stat-bloque">
      <div class="stat-titulo">Hacia dónde va tu energía</div>
      ${barrasArbol(arboles)}
      ${dominante ? `<p class="stat-lectura">Últimamente le estás dando más a <strong>${dominante}</strong>.</p>` : ""}
    </div>

    ${energia ? `
    <div class="stat-bloque">
      <div class="stat-titulo">Tu ánimo</div>
      <div class="stat-energia">
        <span class="stat-energia__num">${energia.promedio.toFixed(1)}</span>
        <span class="stat-energia__de">/ 5</span>
        <span class="stat-energia__base">promedio de tus últimos ${energia.cantidad} cierres</span>
      </div>
      <p class="stat-lectura">${lecturaEnergia}</p>
    </div>` : ""}`;
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
