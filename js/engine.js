/* ============================================================
   MAIN QUEST — engine.js
   ------------------------------------------------------------
   El cerebro de la app. No es IA: es algo mejor para esta
   fase — un motor que conoce TUS datos (parciales, rachas,
   metas) y elige un mensaje que hable de tu vida real.

   Tres responsabilidades:
   1. Armar el "contexto" del día (qué está pasando en tu vida).
   2. Elegir UN mensaje del día usando ese contexto.
      La regla de las 2 semanas manda: parcial a ≤14 días
      = solo mensajes de modo parcial.
   3. La pantalla de carga de parciales en la pestaña VOS.

   El mensaje es determinístico: se elige usando la fecha
   como semilla. Un mensaje por día, siempre el mismo.
   Un compañero no es una máquina tragamonedas.
   ============================================================ */

import { save } from "./store.js";
import { hoyISO, diasHasta, escapar } from "./util.js";

let data;

/* ------------------------------------------------------------
   Racha: días calendario consecutivos con la misión
   principal cumplida, terminando hoy o ayer.
   (Si hoy todavía no la cumpliste, la racha no se corta:
   se corta recién cuando el día termina sin misión.)
   ------------------------------------------------------------ */
function calcularRacha() {
  const cumplidas = new Set();
  for (const dia of data.misiones.historial) {
    if (dia.principal && dia.principal.completada) cumplidas.add(dia.fecha);
  }
  const hoy = data.misiones.hoy;
  if (hoy && hoy.principal && hoy.principal.completada) cumplidas.add(hoy.fecha);

  const fechaDe = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  /* Reglas (decididas por Lautaro, no negociables sin él):
     - Se corta con DOS días seguidos sin misión principal.
     - UN día salteado no rompe ni suma: la racha se sostiene
       pero ese día no cuenta. El domingo de fútbol no te
       borra la semana.
     - El día en curso nunca juega en contra: si hoy todavía
       no cumpliste, no es una falta — el día no terminó. */
  let racha = 0;
  let faltas = 0;

  const cursor = new Date();
  const hoyStr = fechaDe(cursor);
  const hoyCumplida = cumplidas.has(hoyStr);
  if (hoyCumplida) racha += 1;
  cursor.setDate(cursor.getDate() - 1);

  // Tope de seguridad de ~3 años de recorrido.
  for (let i = 0; i < 1100; i++) {
    const f = fechaDe(cursor);
    if (cumplidas.has(f)) {
      racha += 1;
      faltas = 0;
    } else {
      faltas += 1;
      if (faltas >= 2) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const enRiesgo = racha > 0 && !hoyCumplida && !cumplidas.has(fechaDe(ayer));

  return { racha, enRiesgo };
}

/* ------------------------------------------------------------
   El contexto: la foto de tu vida hoy, en un objeto.
   Todo lo que las plantillas pueden usar sale de acá.
   ------------------------------------------------------------ */
function armarContexto() {
  const proximos = data.contexto.parciales
    .map((p) => ({ ...p, dias: diasHasta(p.fecha) }))
    .filter((p) => p.dias >= 0)
    .sort((a, b) => a.dias - b.dias);

  const parcialProximo = proximos.length && proximos[0].dias <= 14 ? proximos[0] : null;

  const [jy, jm] = data.contexto.objetivo_japon.fecha_ideal.split("-").map(Number);
  const ahora = new Date();
  const mesesJapon = (jy - ahora.getFullYear()) * 12 + (jm - (ahora.getMonth() + 1));

  let totalPrincipales = 0;
  for (const dia of data.misiones.historial) {
    if (dia.principal && dia.principal.completada) totalPrincipales += 1;
  }

  /* Energía de las últimas 3 entradas del diario.
     "Energía baja" = al menos 2 entradas y promedio ≤ 2.
     Es la señal de que hay que bajar un cambio. */
  const ultimas = data.diario.slice(-3).filter((e) => e.energia);
  const energiaBaja =
    ultimas.length >= 2 &&
    ultimas.reduce((suma, e) => suma + e.energia, 0) / ultimas.length <= 2;

  const hoyMis = data.misiones.hoy;

  const infoRacha = calcularRacha();

  return {
    parcialProximo,               // { materia, fecha, dias } o null
    energiaBaja,
    principalCumplidaHoy: !!(hoyMis && hoyMis.principal && hoyMis.principal.completada),
    racha: infoRacha.racha,
    rachaEnRiesgo: infoRacha.enRiesgo,
    totalPrincipales,
    mesesJapon: Math.max(0, mesesJapon),
    diaSemana: ahora.getDay(),    // 0=domingo, 1=lunes...
    hora: ahora.getHours(),
    nivelEdicion: data.arboles.edicion.nivel,
    nivelFitness: data.arboles.fitness.nivel
  };
}

/* ------------------------------------------------------------
   El contexto, disponible para otros módulos.
   Lo usa avatar.js para elegir la expresión: así el motor
   sigue siendo el único que sabe interpretar tu vida, y el
   avatar solo la refleja.
   ------------------------------------------------------------ */
export function contextoActual() {
  if (!data) throw new Error("engine sin datos todavía");
  return armarContexto();
}

/* ============================================================
   PLANTILLAS DE MENSAJES
   ------------------------------------------------------------
   Esta sección es TUYA. Es texto, no lógica: cambiá palabras,
   borrá las que no te suenen, agregá las tuyas. Reglas del
   PRD que toda plantilla respeta:
   - Nunca culpa. Nunca "hace X días que no...".
   - Siempre hacia adelante, conectado con tus metas.
   - "modo" parcial = solo aparecen con parcial a ≤14 días.
   - "cond" (opcional) = condición extra para ser elegible.
   ============================================================ */

const PLANTILLAS = [

  /* ===== MODO ENERGÍA BAJA (salud primero, regla 15) ===== */
  { modo: "energia",
    texto: () => `Venís con el tanque bajo estos días. Hoy la mejor misión puede ser corta: comer bien, dormir bien, y mañana se retoma.` },
  { modo: "energia",
    texto: () => `La energía se recupera, no se exige. Bajá un cambio hoy: una misión chica también suma, y descansar también construye.` },
  { modo: "energia",
    texto: () => `Semana pesada, se nota. Elegí la misión más liviana que igual te deje conforme. Con eso alcanza por hoy.` },

  /* ===== MODO PARCIAL (regla de las 2 semanas) ===== */
  { modo: "parcial", cond: (c) => c.parcialProximo.dias > 10,
    texto: (c) => `${c.parcialProximo.materia} en ${c.parcialProximo.dias} días. Empezar hoy, aunque sea una hora, es rendir tranquilo después.` },
  { modo: "parcial", cond: (c) => c.parcialProximo.dias > 10,
    texto: (c) => `Arranca la cuenta regresiva: ${c.parcialProximo.materia} en ${c.parcialProximo.dias} días. La edición puede esperar unos días — hoy el objetivo es aprobar.` },
  { modo: "parcial", cond: (c) => c.parcialProximo.dias >= 4 && c.parcialProximo.dias <= 10,
    texto: (c) => `${c.parcialProximo.materia} en ${c.parcialProximo.dias} días. Esta semana se define: cada hora de estudio de hoy vale doble.` },
  { modo: "parcial", cond: (c) => c.parcialProximo.dias >= 4 && c.parcialProximo.dias <= 10,
    texto: (c) => `Semana de ${c.parcialProximo.materia}. Aprobar todas las materias del año: ese es el plan, y hoy es parte del plan.` },
  { modo: "parcial", cond: (c) => c.parcialProximo.dias >= 2 && c.parcialProximo.dias <= 3,
    texto: (c) => `${c.parcialProximo.materia} en ${c.parcialProximo.dias} días. Repaso fino y a dormir temprano: la cabeza descansada rinde más que la trasnochada.` },
  { modo: "parcial", cond: (c) => c.parcialProximo.dias === 1,
    texto: (c) => `Mañana: ${c.parcialProximo.materia}. Ya hiciste el trabajo. Hoy repaso liviano, buena cena y a dormir antes de las 00:00.` },
  { modo: "parcial", cond: (c) => c.parcialProximo.dias === 0,
    texto: (c) => `Hoy: ${c.parcialProximo.materia}. Respirá hondo. Sabés más de lo que creés. A buscarlo.` },

  /* ===== RACHAS ===== */
  { cond: (c) => c.racha >= 14,
    texto: (c) => `${c.racha} días seguidos cumpliendo tu misión. Esto ya no es motivación: es identidad.` },
  { cond: (c) => c.racha >= 7 && c.racha < 14,
    texto: (c) => `Una semana entera de misiones cumplidas (${c.racha} días). Así se ve la constancia que pedías tener.` },
  { cond: (c) => c.racha >= 3 && c.racha < 7,
    texto: (c) => `${c.racha} días seguidos. La racha no es el número: es la prueba de que podés sostener lo que empezás.` },

  /* ===== DÍAS DE LA SEMANA (tu rutina real) ===== */
  { cond: (c) => c.diaSemana === 1,
    texto: () => `Lunes libre de facultad. Día perfecto: fierros a la mañana, Premiere a la tarde. Los lunes son tuyos.` },
  { cond: (c) => c.diaSemana === 3,
    texto: () => `Miércoles libre. Gym, edición, japonés: elegí una y hacela en serio. Mejor una completa que tres a medias.` },
  { cond: (c) => c.diaSemana === 0,
    texto: () => `Domingo: fútbol a la mañana, y a la tarde diez minutos para planear la semana. El Lautaro del lunes te lo agradece.` },
  { cond: (c) => c.diaSemana === 6,
    texto: () => `Sábado. Descansar también construye: el físico crece durmiendo y las ideas de edición llegan cuando no las forzás.` },

  /* ===== NOCHE (prioridad sueño, regla 15 del PRD) ===== */
  { cond: (c) => c.hora >= 23,
    texto: () => `Ya es tarde. Lo más productivo que podés hacer ahora por mañana es dormir. La misión puede esperar 8 horas.` },

  /* ===== EDICIÓN Y CLIENTES ===== */
  { arbol: "edicion", texto: () => `No estás aprendiendo Premiere. Estás construyendo la carrera que puede llevarte a trabajar con clientes de todo el mundo.` },
  { arbol: "edicion", texto: () => `USD 3000 por mes no empieza con diez clientes. Empieza con uno. Y ese uno empieza con el portfolio de hoy.` },
  { arbol: "edicion", texto: () => `Cada timeline que armás en Premiere es una hora menos de distancia entre vos y tu primer cliente internacional.` },
  { arbol: "edicion", cond: (c) => c.nivelEdicion >= 3,
    texto: (c) => `Edición nivel ${c.nivelEdicion}. Eso no lo regala la app: lo ganaste hora por hora. Seguí apilando.` },

  /* ===== GYM ===== */
  { arbol: "fitness", texto: () => `Entrenar hoy es un paso más hacia el físico que querés recuperar. Uno solo, pero tuyo.` },
  { arbol: "fitness", texto: () => `El cuerpo que buscás se construye 45 minutos a la vez. Hoy pueden ser esos 45.` },
  { arbol: "fitness", cond: (c) => c.diaSemana >= 1 && c.diaSemana <= 5,
    texto: () => `Gym a la mañana = el resto del día ya arranca ganado. Vos lo sabés mejor que nadie.` },

  /* ===== JAPÓN ===== */
  { cond: (c) => c.mesesJapon > 0,
    texto: (c) => `Faltan ${c.mesesJapon} meses para febrero 2027. Todo lo que hacés hoy — estudiar, editar, ahorrar — también es pasaje a Japón.` },
  { cond: (c) => c.mesesJapon > 0,
    texto: () => `Ya caminaste Tokio una vez. La próxima no es un sueño: es un plan con fecha. Hoy se financia con constancia.` },

  /* ===== JAPONÉS ===== */
  { arbol: "japones", texto: () => `Diez minutos de japonés hoy valen más que dos horas "algún día". La próxima vez en Japón, pedís la comida sin señalar el menú.` },

  /* ===== FACULTAD (fuera de modo parcial, sin presión) ===== */
  { arbol: "facultad", texto: () => `Kinesiología no se aprueba en las semanas de parcial: se aprueba en las clases a las que ya estás yendo. Vas bien.` },

  /* ===== STREAMING ===== */
  { arbol: "streaming",
    texto: () => `El primer stream no tiene que ser perfecto: tiene que existir. Hoy acercate un paso.` },
  { arbol: "streaming",
    texto: () => `Cada prueba de setup, cada ensayo, es el detrás de escena del canal que querés tener.` },

  /* ===== FINANZAS ===== */
  { arbol: "finanzas",
    texto: () => `Saber a dónde va tu plata es el primer sueldo que te pagás. Hoy, diez minutos de números.` },
  { arbol: "finanzas",
    texto: () => `Cada peso ordenado hoy es un pedacito de pasaje. Febrero 2027 se financia así.` },

  /* ===== JAPONÉS (extra) ===== */
  { arbol: "japones",
    texto: () => `Hoy toca japonés: veinte minutos que tu próximo viaje te devuelve con intereses.` },

  /* ===== FACULTAD (misión de facultad sin parcial cerca) ===== */
  { arbol: "facultad",
    texto: () => `Hoy la misión es de facultad. Sin drama: una sesión enfocada y a otra cosa.` },

  /* ===== MISIÓN CUMPLIDA (el día ya está sellado) ===== */
  { modo: "cumplida",
    texto: () => `Misión del día: cumplida. Lo que venga ahora es yapa — disfrutala sin culpa.` },
  { modo: "cumplida",
    texto: (c) => c.racha >= 2
      ? `Otra más a la racha (${c.racha}). Así, día por día, se construye la década.`
      : `Ya está lo importante de hoy. El resto del día es tuyo.` },
  { modo: "cumplida",
    texto: () => `Lo de hoy ya quedó sellado. Mañana hay otra misión, pero ese es problema del Lautaro de mañana.` },

  /* ===== IDENTIDAD / GENERALES ===== */
  { texto: () => `No abriste una app. Abriste el mapa de hacia dónde vas. Elegí LA misión de hoy y dale.` },
  { texto: () => `La persona que querés ser no aparece un día: se construye con días como hoy.` },
  { cond: (c) => c.totalPrincipales >= 10,
    texto: (c) => `${c.totalPrincipales} misiones principales cumplidas desde que empezaste. Eso ya es un historial, no una promesa.` },
  { texto: () => `Regla de hoy: una sola misión importa. Si cumplís esa, el día ya valió.` }
];

/* ------------------------------------------------------------
   Elección del mensaje del día.
   Semilla = fecha de hoy → mismo mensaje todo el día.
   ------------------------------------------------------------ */
function hashDeTexto(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function elegirMensaje() {
  const ctx = armarContexto();

  /* Jerarquía de modos, reescrita en la Entrega 3 para que
     el mensaje y la misión del día SE HABLEN:
     1. Energía baja (salud primero)... salvo parcial hoy/mañana.
     2. Parcial inminente (hoy o mañana).
     3. Misión de hoy CUMPLIDA: el día está sellado, el
        mensaje festeja en vez de empujar.
     4. Modo parcial (regla de las 2 semanas).
     5. El ÁRBOL de la misión de hoy: si tu misión es de
        Anatomía, el motor no te habla de Premiere. Acá se
        cosía la costura que se veía.
     6. General.
     Devuelve también el modo elegido: los tests lo verifican. */
  const parcialInminente = ctx.parcialProximo && ctx.parcialProximo.dias <= 1;
  const misionArbol =
    (!ctx.principalCumplidaHoy && data.misiones.hoy && data.misiones.hoy.principal
      ? data.misiones.hoy.principal.arbol
      : null) || null;

  let pool = [];
  let modo = "general";

  if (ctx.energiaBaja && !parcialInminente) {
    modo = "energia";
    pool = PLANTILLAS.filter((p) => p.modo === "energia");
  } else if (parcialInminente) {
    modo = "parcial";
    pool = PLANTILLAS.filter((p) => p.modo === "parcial" && (!p.cond || p.cond(ctx)));
  } else if (ctx.principalCumplidaHoy) {
    modo = "cumplida";
    pool = PLANTILLAS.filter((p) => p.modo === "cumplida" && (!p.cond || p.cond(ctx)));
  } else if (ctx.parcialProximo) {
    modo = "parcial";
    pool = PLANTILLAS.filter((p) => p.modo === "parcial" && (!p.cond || p.cond(ctx)));
  } else if (misionArbol) {
    modo = "arbol";
    pool = PLANTILLAS.filter((p) => p.arbol === misionArbol && !p.modo && (!p.cond || p.cond(ctx)));
  }

  if (pool.length === 0) {
    modo = modo === "arbol" ? "general" : modo;
    pool = PLANTILLAS.filter((p) => !p.modo && (!p.cond || p.cond(ctx)));
  }
  if (pool.length === 0) return { texto: "Hoy también se construye.", ctx, modo };

  const idx = hashDeTexto(hoyISO()) % pool.length;
  return { texto: pool[idx].texto(ctx), ctx, modo };
}

/* ------------------------------------------------------------
   Render del mensaje del día en HOY.
   ------------------------------------------------------------ */
function renderMensaje() {
  const cont = document.getElementById("mensaje-dia");
  if (!cont) return;
  const { texto, ctx } = elegirMensaje();

  /* El conteo como DATO, no como amenaza: sin la palabra
     "modo", sin alarma, sin rojo. Solo la materia y cuándo. */
  const pill = ctx.parcialProximo
    ? `<span class="pill-parcial">${escapar(ctx.parcialProximo.materia)} · ${
        ctx.parcialProximo.dias === 0 ? "hoy" :
        ctx.parcialProximo.dias === 1 ? "mañana" :
        `en ${ctx.parcialProximo.dias} días`}</span>`
    : "";

  cont.innerHTML = `
    <div class="mensaje ${ctx.parcialProximo ? "mensaje--parcial" : ""}">
      ${pill}
      <p>${texto}</p>
    </div>`;
}

/* ------------------------------------------------------------
   Sugerencia de misión del día (C-22). La app PROPONE, no
   impone: esto solo precarga el campo, siempre editable.

   Reglas:
   - Parcial a ≤14 días → estudiar esa materia, con la
     intensidad según la cercanía.
   - NUNCA facultad fuera del modo parcial: Lautaro estudia
     cerca de los parciales, y la app lo respeta.
   - Domingo → planear la semana.
   - Resto → el árbol más atrasado, evitando repetir el de
     ayer para que la semana tenga variedad.
   Recibe la fecha para poder testearse con días fijos.
   ------------------------------------------------------------ */
export function sugerirMision(ahora = new Date()) {
  // Red de seguridad: si alguien pregunta antes de que el
  // motor tenga datos, devolvemos null en vez de explotar.
  // Un módulo de UI nunca debería poder tumbar el arranque.
  if (!data) return null;
  const ctx = armarContexto();

  if (ctx.parcialProximo) {
    const p = ctx.parcialProximo;
    const titulo = p.dias <= 2
      ? `Repaso general de ${p.materia}`
      : `Estudiar ${p.materia} (${p.dias <= 7 ? "2 horas" : "1 hora"})`;
    return { titulo, arbol: "facultad" };
  }

  if (ahora.getDay() === 0) {
    return { titulo: "Planear la semana (10 min)", arbol: null };
  }

  const TITULOS = {
    edicion:   "Una hora de Premiere",
    fitness:   "Entrenar (45 min)",
    japones:   "20 minutos de japonés",
    finanzas:  "Ordenar los números de la semana",
    streaming: "Avanzar el setup del stream"
  };

  const ultimo = data.misiones.historial[data.misiones.historial.length - 1];
  const arbolDeAyer = (ultimo && ultimo.principal && ultimo.principal.arbol) || null;

  const orden = Object.keys(TITULOS)
    .map((id) => ({ id, avance: data.arboles[id].nivel * 10000 + data.arboles[id].xp }))
    .sort((a, b) => a.avance - b.avance)
    .map((x) => x.id);

  let elegido = orden[0];
  if (elegido === arbolDeAyer && orden.length > 1) elegido = orden[1];

  return { titulo: TITULOS[elegido], arbol: elegido };
}

/* ------------------------------------------------------------
   El chip de racha, arriba de todo en HOY.
   Tres estados, los tres mirando hacia adelante:
   - viva: "🔥 N días de racha"
   - en riesgo (ayer faltó): "se sostiene si cumplís hoy"
   - en cero: "tu racha arranca con la misión de hoy"
   Jamás "perdiste" ni "se cortó". Cero culpa, también acá.
   ------------------------------------------------------------ */
function renderRacha() {
  const cont = document.getElementById("racha-hoy");
  if (!cont) return;
  const ctx = armarContexto();

  if (ctx.racha === 0) {
    cont.innerHTML = `<div class="racha racha--cero">🔥 Tu racha arranca con la misión de hoy</div>`;
    return;
  }
  if (ctx.rachaEnRiesgo) {
    cont.innerHTML = `<div class="racha racha--riesgo">🔥 ${ctx.racha} ${ctx.racha === 1 ? "día" : "días"} · se sostiene si cumplís hoy</div>`;
    return;
  }
  cont.innerHTML = `<div class="racha">🔥 ${ctx.racha} ${ctx.racha === 1 ? "día" : "días"} de racha</div>`;
}

/* ------------------------------------------------------------
   Panel de parciales en la pestaña VOS.
   ------------------------------------------------------------ */
function renderParciales() {
  const lista = document.getElementById("lista-parciales");
  if (!lista) return;
  const items = [...data.contexto.parciales].sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (items.length === 0) {
    lista.innerHTML = `<li class="secundarias-vacio">Sin parciales cargados. Cuando agregues uno, la app entra sola en modo parcial 14 días antes.</li>`;
    return;
  }

  lista.innerHTML = items.map((p) => {
    const dias = diasHasta(p.fecha);
    const cuando =
      dias < 0  ? "pasó" :
      dias === 0 ? "HOY" :
      dias === 1 ? "mañana" : `en ${dias} días`;
    return `
    <li class="secundaria">
      <span class="secundaria__titulo">${escapar(p.materia)}
        <span class="parcial-fecha">${p.fecha} · ${cuando}</span>
      </span>
      <button class="secundaria__borrar" data-action="borrar-parcial" data-id="${p.id}"
              aria-label="Borrar parcial de ${escapar(p.materia)}">×</button>
    </li>`;
  }).join("");
}

function accionVos(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  switch (btn.dataset.action) {

    case "agregar-parcial": {
      const materia = document.getElementById("input-parcial-materia").value.trim();
      const fecha = document.getElementById("input-parcial-fecha").value; // YYYY-MM-DD
      if (!materia || !fecha) return;
      data.contexto.parciales.push({ id: crypto.randomUUID(), materia, fecha });
      document.getElementById("input-parcial-materia").value = "";
      document.getElementById("input-parcial-fecha").value = "";
      break;
    }

    case "borrar-parcial": {
      data.contexto.parciales = data.contexto.parciales.filter((p) => p.id !== btn.dataset.id);
      break;
    }

    default:
      return;
  }

  save(data);
  renderParciales();
  renderMensaje(); // agregar/borrar un parcial puede cambiar el modo del día
}

/* ------------------------------------------------------------
   API del módulo
   ------------------------------------------------------------ */
export function setDatosEngine(appData) {
  data = appData;
  renderParciales();
  renderMensaje();
  renderRacha();
}

export function initEngine(appData) {
  data = appData;
  document.getElementById("view-vos").addEventListener("click", accionVos);

  // Si volvés a la app al día siguiente, el mensaje se renueva.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { renderMensaje(); renderRacha(); }
  });

  // Completar o deshacer la misión mueve la racha al instante.
  document.addEventListener("contexto-cambiado", () => {
    renderRacha();
    renderMensaje(); // fijar o cumplir la misión puede cambiar el modo del mensaje
  });

  renderParciales();
  renderMensaje();
  renderRacha();
}
