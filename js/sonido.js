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
let ctx = null;           // AudioContext, creado en el primer gesto
let despierto = false;

/* Cada efecto: lista de notas [frecuencia Hz, inicio s, duración s].
   Frecuencias de una escala pentatónica cálida, para que hasta
   los errores suenen amables (nada estridente). */
const EFECTOS = {
  // Completar la misión principal: un arpegio ascendente, triunfal.
  principal: { onda: "square", vol: 0.16, notas: [[523, 0, 0.09], [659, 0.08, 0.09], [784, 0.16, 0.14]] },
  // Secundaria: un "tic" corto y satisfactorio.
  secundaria: { onda: "square", vol: 0.12, notas: [[659, 0, 0.06], [880, 0.05, 0.08]] },
  // Comprar en la tienda: dos notas tipo "caja registradora" suave.
  compra: { onda: "triangle", vol: 0.14, notas: [[784, 0, 0.07], [1047, 0.07, 0.11]] },
  // Subir de nivel: fanfarria de cuatro notas.
  nivel: { onda: "square", vol: 0.17, notas: [[523, 0, 0.09], [659, 0.09, 0.09], [784, 0.18, 0.09], [1047, 0.27, 0.18]] },
  // Logro: brillo de tres notas altas.
  logro: { onda: "triangle", vol: 0.15, notas: [[880, 0, 0.08], [1047, 0.08, 0.08], [1319, 0.16, 0.16]] },
  // Abrir la app / entrar desde la ceremonia: un acorde cálido y suave.
  entrar: { onda: "triangle", vol: 0.12, notas: [[392, 0, 0.22], [523, 0.04, 0.22], [659, 0.08, 0.26]] }
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
    despierto = true;
  } catch {
    ctx = null;
  }
}

/* ------------------------------------------------------------
   sonar(nombre): reproduce un efecto, si el sonido está
   habilitado y el contexto ya despertó. Silencioso y seguro si
   algo falta: nunca tira un error hacia la app.
   ------------------------------------------------------------ */
export function sonar(nombre) {
  if (!habilitado || !despierto || !ctx) return;
  const efecto = EFECTOS[nombre];
  if (!efecto) return;

  try {
    const ahora = ctx.currentTime;
    for (const [freq, t0, dur] of efecto.notas) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = efecto.onda;
      osc.frequency.value = freq;
      // Envolvente corta: ataque rápido, caída suave. Evita el
      // "click" de cortar una onda de golpe.
      const inicio = ahora + t0;
      gain.gain.setValueAtTime(0, inicio);
      gain.gain.linearRampToValueAtTime(efecto.vol, inicio + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + dur + 0.02);
    }
  } catch {
    // Si el navegador se queja, mejor mudo que roto.
  }
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
   Una vez. Sin esto, iOS nunca deja sonar nada. */
export function initSonido(appData) {
  habilitado = !!(appData && appData.ajustes && appData.ajustes.sonido);

  const primerGesto = () => {
    despertar();
    document.removeEventListener("pointerdown", primerGesto);
  };
  document.addEventListener("pointerdown", primerGesto);
}
