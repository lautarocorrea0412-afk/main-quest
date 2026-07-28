/* ============================================================
   MAIN QUEST — sonido.js
   ------------------------------------------------------------
   Sonido chiptune SINTETIZADO con Web Audio API. Cero archivos:
   cada efecto son unas pocas notas de onda cuadrada generadas
   por código, en el espíritu de una consola retro.

   Las trampas de iOS, todas contempladas:
   - El AudioContext arranca "suspendido" hasta el PRIMER gesto
     del usuario (toque). Por eso se despierta en el primer tap,
     no antes: si sonara solo, iOS lo silenciaría.
   - El interruptor físico de silencio del iPhone puede callar
     TODO esto sin que la app se entere. No es un bug de la app;
     es iOS. La UI lo advierte.
   - Arranca apagado (data.ajustes.sonido = false). Nada suena
     hasta que vos lo prendas.
   - Sin vibración: la Vibration API no existe en PWA de iOS.

   La app entera llama a sonar("nombre"); este módulo decide si
   hay que hacer ruido y cómo, sin que nadie más sepa de audio.
   ============================================================ */

let habilitado = false;   // refleja data.ajustes.sonido
const VOL_MUSICA = 0.06;  // volumen base del pad (bajo, de fondo)
let ctx = null;           // AudioContext, creado en el primer gesto
let despierto = false;

/* Cada efecto: lista de notas [frecuencia Hz, inicio s, duración s].
   Frecuencias de una escala pentatónica cálida, para que hasta
   los errores suenen amables (nada estridente). */
const EFECTOS = {
  // Completar la misión principal: un arpegio ascendente, triunfal.
  principal: { onda: "triangle", vol: 0.13, notas: [[523, 0, 0.10], [659, 0.09, 0.10], [784, 0.18, 0.16]] },
  // Secundaria: un "tic" corto y satisfactorio, más suave.
  secundaria: { onda: "triangle", vol: 0.09, notas: [[659, 0, 0.06], [880, 0.05, 0.08]] },
  // Comprar en la tienda: dos notas tipo "caja registradora" suave.
  compra: { onda: "triangle", vol: 0.11, notas: [[784, 0, 0.07], [1047, 0.07, 0.12]] },
  // Subir de nivel: fanfarria de cuatro notas.
  nivel: { onda: "triangle", vol: 0.14, notas: [[523, 0, 0.10], [659, 0.10, 0.10], [784, 0.20, 0.10], [1047, 0.30, 0.20]] },
  // Logro: brillo de tres notas altas.
  logro: { onda: "triangle", vol: 0.12, notas: [[880, 0, 0.09], [1047, 0.09, 0.09], [1319, 0.18, 0.18]] },
  // Abrir la app / entrar desde la ceremonia: un acorde cálido y suave.
  entrar: { onda: "triangle", vol: 0.11, notas: [[392, 0, 0.22], [523, 0.04, 0.22], [659, 0.08, 0.26]] },
  // Cambiar de pestaña: agudo y BRILLANTE, fuera del rango de la
  // música (que vive en los graves-medios). Antes caía justo
  // encima del pad y no se oía. Ahora suena claro por arriba.
  tab: { onda: "triangle", vol: 0.07, notas: [[1175, 0, 0.05], [1568, 0.045, 0.06]] },
  // Probarse ropa / cambiar el avatar: un "blip" suave y agudo.
  vestir: { onda: "triangle", vol: 0.08, notas: [[988, 0, 0.05], [1319, 0.04, 0.06]] },
  // Aportar ahorro a Japón: dos notas que suben, esperanzadas.
  aporte: { onda: "triangle", vol: 0.11, notas: [[587, 0, 0.09], [880, 0.09, 0.14]] },
  // Guardar el cierre del diario: una nota tibia, de calma.
  diario: { onda: "triangle", vol: 0.09, notas: [[440, 0, 0.16], [587, 0.06, 0.18]] },
  // Abrir una hoja/panel: un "swish" corto y suave.
  abrir: { onda: "triangle", vol: 0.06, notas: [[698, 0, 0.05], [880, 0.03, 0.05]] }
};

/* Despierta el AudioContext. Debe llamarse desde un gesto real
   (un click/touch), o iOS lo deja suspendido. */
function despertar() {
  if (despierto) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
    // Bus propio para los efectos, separado de la música.
    efectosBus = ctx.createGain();
    efectosBus.gain.value = 1;
    efectosBus.connect(ctx.destination);
    despierto = true;
  } catch {
    ctx = null;
  }
}

/* ------------------------------------------------------------
   sonar(nombre): reproduce un efecto. Si la música está
   sonando, la baja un instante (ducking) para que el efecto
   SIEMPRE se oiga por encima, sin importar su frecuencia.
   Silencioso y seguro si algo falta: nunca tira un error.
   ------------------------------------------------------------ */
export function sonar(nombre) {
  if (!habilitado || !despierto || !ctx) return;
  const efecto = EFECTOS[nombre];
  if (!efecto) return;

  // Cada toque es una oportunidad de reanimar el contexto que
  // iOS pudo haber suspendido. Barato y salva la música.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  try {
    const ahora = ctx.currentTime;

    // Ducking: la música cede el paso al efecto y vuelve.
    const durTotal = Math.max(...efecto.notas.map(([, t0, d]) => t0 + d));
    agacharMusica(durTotal);

    for (const [freq, t0, dur] of efecto.notas) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = efecto.onda;
      osc.frequency.value = freq;
      const inicio = ahora + t0;
      gain.gain.setValueAtTime(0, inicio);
      gain.gain.linearRampToValueAtTime(efecto.vol, inicio + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
      osc.connect(gain).connect(efectosBus || ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + dur + 0.02);
    }
  } catch {
    // Si el navegador se queja, mejor mudo que roto.
  }
}

/* El bus de efectos: un gain fijo por el que pasan todos los
   efectos, separado de la música. Se crea al despertar. */
let efectosBus = null;

/* Baja la música durante ~dur segundos y la devuelve, para que
   el efecto se destaque. No hace nada si la música está apagada. */
function agacharMusica(dur) {
  if (!musicaNodos || !ctx) return;
  try {
    const g = musicaNodos.master.gain;
    const t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(VOL_MUSICA * 0.35, t + 0.05); // agacha
    g.linearRampToValueAtTime(VOL_MUSICA, t + dur + 0.5);    // vuelve
  } catch { /* nada */ }
}

/* ------------------------------------------------------------
   API de control
   ------------------------------------------------------------ */

/* Prende/apaga según los ajustes. Al prender, si venimos de un
   gesto, despierta el contexto en el acto. */
export function setSonido(activo) {
  habilitado = !!activo;
  if (habilitado) despertar();
}

/* Engancha el primer gesto del usuario para despertar el audio.
   Y además deja un handler PERMANENTE que, en cada toque,
   reanima el contexto si iOS lo suspendió por inactividad — es
   lo que evita que la música "se apague sola" al rato. */
export function initSonido(appData) {
  habilitado = !!(appData && appData.ajustes && appData.ajustes.sonido);

  const primerGesto = () => {
    despertar();
    document.removeEventListener("pointerdown", primerGesto);
  };
  document.addEventListener("pointerdown", primerGesto);

  // Handler permanente: cada toque es una chance de revivir el
  // audio. Barato (solo actúa si está suspendido) y salva la
  // música sin que el usuario note nada.
  document.addEventListener("pointerdown", () => {
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    // Si la música debía sonar pero el pad se perdió, rearmar.
    if (musicaOn && ctx && ctx.state === "running" && !musicaNodos) arrancarMusica();
  });
}

/* ============================================================
   MÚSICA DE FONDO — pad ambiental (Entrega 15)
   ------------------------------------------------------------
   No es una melodía: es una cama de acordes lentos, pensada
   para estar SIN cansar. Onda triangular (suave), filtro
   pasa-bajos que le quita el brillo metálico, volumen muy
   bajo, y cambios de acorde cada ~8 segundos. Cero archivos.

   Vive aparte de los efectos: su propio flag (data.ajustes.
   musica) y su propio interruptor en Configuración.
   ============================================================ */

let musicaOn = false;
let musicaNodos = null;   // { oscs, gain, filtro, timer }

/* Una progresión suave en La menor pentatónica: cuatro acordes
   que giran en loop. Cada acorde son 3 frecuencias (Hz). */
const ACORDES = [
  [220.0, 261.6, 329.6], // Am
  [196.0, 246.9, 329.6], // G/B-ish
  [174.6, 220.0, 261.6], // F
  [196.0, 246.9, 293.7]  // G
];
let acordeIdx = 0;

function arrancarMusica() {
  if (musicaNodos || !ctx) return;

  const master = ctx.createGain();
  master.gain.value = 0;
  // Filtro pasa-bajos: le saca el filo, lo vuelve "cálido".
  const filtro = ctx.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.value = 900;
  filtro.Q.value = 0.4;
  filtro.connect(master).connect(ctx.destination);

  // Tres osciladores fijos: se les cambia la frecuencia por
  // acorde, en vez de crear/destruir (más suave, sin clicks).
  const oscs = ACORDES[0].map((f) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.33;
    o.connect(g).connect(filtro);
    o.start();
    return { o, g };
  });

  // Fade-in suave hasta un volumen bajo.
  master.gain.linearRampToValueAtTime(VOL_MUSICA, ctx.currentTime + 2.5);

  const cambiarAcorde = () => {
    acordeIdx = (acordeIdx + 1) % ACORDES.length;
    const acorde = ACORDES[acordeIdx];
    const t = ctx.currentTime;
    oscs.forEach((n, i) => {
      // Glissando lento entre acordes: nada de saltos bruscos.
      n.o.frequency.linearRampToValueAtTime(acorde[i], t + 3);
    });
  };
  const timer = setInterval(cambiarAcorde, 8000);

  musicaNodos = { oscs, master, filtro, timer };
}

function pararMusica() {
  if (!musicaNodos) return;
  const { oscs, master, timer } = musicaNodos;
  clearInterval(timer);
  if (latidoMusica) { clearInterval(latidoMusica); latidoMusica = null; }
  try {
    // Fade-out y recién ahí frenar los osciladores.
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    setTimeout(() => {
      oscs.forEach((n) => { try { n.o.stop(); } catch {} });
    }, 1400);
  } catch {
    oscs.forEach((n) => { try { n.o.stop(); } catch {} });
  }
  musicaNodos = null;
}

/* El latido: cada pocos segundos revisa que el contexto siga
   vivo. iOS suspende el AudioContext no solo al ir al fondo,
   también por inactividad con la app abierta — y ahí el pad
   "se apagaba". Esto lo reanima; y si los osciladores ya
   murieron (iOS a veces los mata), reconstruye el pad. */
let latidoMusica = null;
function vigilarMusica() {
  if (latidoMusica) clearInterval(latidoMusica);
  latidoMusica = setInterval(() => {
    if (!musicaOn) return;
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    // Si el pad se perdió pero la música sigue "puesta", rearmar.
    if (musicaOn && !musicaNodos && ctx && ctx.state === "running") {
      arrancarMusica();
    }
  }, 2500);
}

/* Prende/apaga la música. Necesita el contexto despierto (un
   gesto previo), igual que los efectos. */
export function setMusica(activo) {
  musicaOn = !!activo;
  if (musicaOn) { despertar(); arrancarMusica(); vigilarMusica(); }
  else pararMusica();
}

/* iOS suspende el audio al mandar la app al fondo. Al volver,
   si la música estaba puesta, la reanudamos (y el latido se
   encarga del resto de los casos). */
export function retomarMusica() {
  if (!musicaOn || !ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  if (!musicaNodos && ctx.state === "running") arrancarMusica();
}
