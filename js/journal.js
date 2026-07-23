/* ============================================================
   MAIN QUEST — journal.js
   ------------------------------------------------------------
   El cierre del día. Desde las 21:00 aparece en HOY un
   panel con 4 respuestas rápidas:
   - Energía del día (5 emojis, un toque).
   - Lo mejor del día / orgullo / qué mejorar mañana (texto).

   Decisiones de diseño:
   - Antes de las 21 el panel NO existe: es un ritual
     nocturno, no un pendiente que te mira todo el día.
   - Todo es opcional. Cerrar el día solo con la energía
     marcada ya vale. Nunca se reclama un día sin cerrar.
   - No da XP: reflexionar no es grinding. Si diera puntos,
     terminarías escribiendo cualquier cosa por cobrarlos.
   - La energía alimenta al motor de contexto: varios días
     de energía baja y los mensajes bajan un cambio.
   ============================================================ */

import { save } from "./store.js";
import { hoyISO, escapar } from "./util.js";

let data;
let editando = false;   // true mientras el formulario está abierto para editar
let energiaSel = null;  // energía elegida en el formulario (estado temporal)

const HORA_CIERRE = 21;
const EMOJIS = { 1: "😴", 2: "😕", 3: "😐", 4: "🙂", 5: "🔥" };

function entradaDeHoy() {
  return data.diario.find((e) => e.fecha === hoyISO());
}

/* ------------------------------------------------------------
   Render. Tres estados:
   A) Antes de las 21 y sin entrada -> nada.
   B) Desde las 21 sin entrada (o editando) -> formulario.
   C) Entrada guardada -> día cerrado, con opción de editar.
   ------------------------------------------------------------ */
function render() {
  const cont = document.getElementById("diario-cierre");
  const entrada = entradaDeHoy();
  const hora = new Date().getHours();

  if (!entrada && hora < HORA_CIERRE) {
    cont.innerHTML = "";
    return;
  }

  if (entrada && !editando) {
    cont.innerHTML = `
      <div class="panel panel--diario-cerrado">
        <div class="panel__label">Cierre del día</div>
        <div class="stamp">✦ Día cerrado ${entrada.energia ? EMOJIS[entrada.energia] : ""}</div>
        ${entrada.mejor ? `<p class="diario-eco">Lo mejor: ${escapar(entrada.mejor)}</p>` : ""}
        <button class="deshacer" data-action="editar-diario">editar</button>
      </div>`;
    return;
  }

  // Formulario (nuevo o edición con datos precargados)
  const previa = entrada || {};
  if (energiaSel === null && previa.energia) energiaSel = previa.energia;

  const botonesEnergia = [1, 2, 3, 4, 5].map((n) => `
    <button class="energia ${energiaSel === n ? "activa" : ""}"
            data-action="elegir-energia" data-nivel="${n}"
            aria-label="Energía ${n} de 5">${EMOJIS[n]}</button>`).join("");

  cont.innerHTML = `
    <div class="panel">
      <div class="panel__label">Cierre del día</div>
      <p class="diario-pregunta">¿Cómo estuvo tu energía?</p>
      <div class="energia-row">${botonesEnergia}</div>
      <input type="text" id="diario-mejor" class="campo campo--diario"
             placeholder="¿Qué fue lo mejor del día?" maxlength="120"
             value="${escapar(previa.mejor || "")}">
      <input type="text" id="diario-orgullo" class="campo campo--diario"
             placeholder="¿De qué estás orgulloso?" maxlength="120"
             value="${escapar(previa.orgullo || "")}">
      <input type="text" id="diario-manana" class="campo campo--diario"
             placeholder="¿Qué harías mejor mañana?" maxlength="120"
             value="${escapar(previa.manana || "")}">
      <button class="btn btn--completar" data-action="guardar-diario">Cerrar el día</button>
    </div>`;
}

/* ------------------------------------------------------------
   Acciones (listener propio en el contenedor del diario,
   para no mezclar con las acciones de misiones).
   ------------------------------------------------------------ */
function accion(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  switch (btn.dataset.action) {

    /* Elegir energía no redibuja todo el panel: eso
       borraría lo que ya escribiste en los campos. */
    case "elegir-energia": {
      const nivel = Number(btn.dataset.nivel);
      energiaSel = (energiaSel === nivel) ? null : nivel;
      document.querySelectorAll(".energia").forEach((b) => {
        b.classList.toggle("activa", Number(b.dataset.nivel) === energiaSel);
      });
      return;
    }

    case "guardar-diario": {
      const mejor = document.getElementById("diario-mejor").value.trim();
      const orgullo = document.getElementById("diario-orgullo").value.trim();
      const manana = document.getElementById("diario-manana").value.trim();

      // Con todo vacío no hay nada que cerrar.
      if (!energiaSel && !mejor && !orgullo && !manana) return;

      const nueva = { fecha: hoyISO(), energia: energiaSel, mejor, orgullo, manana };
      const idx = data.diario.findIndex((e) => e.fecha === nueva.fecha);
      if (idx >= 0) data.diario[idx] = nueva;
      else data.diario.push(nueva);

      save(data);
      editando = false;
      energiaSel = null;
      render();
      return;
    }

    case "editar-diario": {
      editando = true;
      energiaSel = null; // render() la precarga desde la entrada
      render();
      return;
    }
  }
}

/* ------------------------------------------------------------
   API del módulo
   ------------------------------------------------------------ */
export function setDatosDiario(appData) {
  data = appData;
  editando = false;
  energiaSel = null;
  render();
}

export function initDiario(appData) {
  data = appData;

  const cont = document.getElementById("diario-cierre");
  cont.addEventListener("click", accion);

  // Si la app quedó abierta y pasan las 21 (o cambia el día),
  // al volver a primer plano el panel aparece o se renueva.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      editando = false;
      render();
    }
  });

  render();
}
