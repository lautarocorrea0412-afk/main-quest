/* ============================================================
   MAIN QUEST — xp.js
   ------------------------------------------------------------
   El sistema de experiencia completo:
   - Los 6 árboles de habilidades y sus metadatos.
   - La curva de niveles (cuánto cuesta subir).
   - Ganar y quitar XP (quitar existe para que "deshacer"
     sea honesto: si no devolviera el XP, marcar y desmarcar
     una misión sería una maquinita de XP infinito).
   - El render de las barras en la pestaña Progreso.
   - La animación de "+XP" flotante al completar.

   Regla de diseño: este módulo no sabe qué es una misión.
   Solo sabe de árboles y números. Misiones, logros o
   economía (futuro) lo usan desde afuera.
   ============================================================ */

import { save } from "./store.js";
import { proximaRecompensa, nuevasEntre, ICONO_TIPO } from "./progression.js";
import { mostrarCartel } from "./ui.js";

/* Metadatos de los árboles. Antes vivían en app.js;
   ahora que el XP tiene módulo propio, se mudan acá. */
export const ARBOLES_META = {
  fitness:   { emoji: "🏋️", nombre: "Fitness" },
  edicion:   { emoji: "🎬", nombre: "Edición" },
  facultad:  { emoji: "📚", nombre: "Facultad" },
  japones:   { emoji: "🇯🇵", nombre: "Japonés" },
  finanzas:  { emoji: "💰", nombre: "Finanzas" },
  streaming: { emoji: "🎥", nombre: "Streaming" }
};

/* Cuánto vale cada tipo de misión. Un solo lugar para
   rebalancear la economía del juego en el futuro. */
export const XP_PRINCIPAL = 50;
export const XP_SECUNDARIA = 15;

/* ------------------------------------------------------------
   Curva de niveles: subir del nivel N al N+1 cuesta 60×N + 40.
   NV1→2: 100 · NV2→3: 160 · NV5→6: 340 · NV9→10: 580.
   Total del NV1 al NV10: 3060 XP ≈ un año de dedicación real
   a un árbol (~60 XP/semana). Recalibrada de la curva 100×N
   original, que hacía el NV10 casi inalcanzable.
   Los niveles ya ganados con la curva vieja se respetan.
   Cada árbol guarda { xp, nivel } donde xp es el progreso
   DENTRO del nivel actual (no el total histórico).
   ------------------------------------------------------------ */
export function costoNivel(nivel) {
  return 60 * nivel + 40;
}

/* ------------------------------------------------------------
   Ganar XP. Devuelve info del resultado para que quien
   llama pueda celebrarlo (animación, mensaje, etc.).
   ------------------------------------------------------------ */
export function ganarXp(data, arbolId, cantidad) {
  const arbol = data.arboles[arbolId];
  if (!arbol) return null; // misión sin árbol: no pasa nada

  arbol.xp += cantidad;

  const nivelViejo = arbol.nivel;
  let subioNivel = false;
  while (arbol.xp >= costoNivel(arbol.nivel)) {
    arbol.xp -= costoNivel(arbol.nivel);
    arbol.nivel += 1;
    subioNivel = true;
  }

  save(data);

  /* Si el nivel nuevo desbloqueó recompensas de evolución,
     se celebran acá: la subida de nivel es el momento. */
  if (subioNivel) {
    for (const rec of nuevasEntre(arbolId, nivelViejo, arbol.nivel)) {
      mostrarCartel(ICONO_TIPO[rec.tipo], `¡Desbloqueaste: ${rec.nombre}!`,
        `${ARBOLES_META[arbolId].emoji} ${ARBOLES_META[arbolId].nombre} NV ${rec.nivel}`);
    }
  }

  return { arbolId, cantidad, subioNivel, nivel: arbol.nivel };
}

/* ------------------------------------------------------------
   Quitar XP (el espejo de ganar, para "deshacer").
   Puede bajar de nivel. Nunca baja del nivel 1 con 0 XP.
   ------------------------------------------------------------ */
export function quitarXp(data, arbolId, cantidad) {
  const arbol = data.arboles[arbolId];
  if (!arbol) return;

  arbol.xp -= cantidad;

  while (arbol.xp < 0) {
    if (arbol.nivel === 1) { arbol.xp = 0; break; }
    arbol.nivel -= 1;
    arbol.xp += costoNivel(arbol.nivel);
  }

  save(data);
}

/* ------------------------------------------------------------
   Render de los árboles en la pestaña Progreso.
   (Este código estaba en app.js con las barras en 0%;
   ahora las barras muestran el progreso real.)
   ------------------------------------------------------------ */
export function renderArboles(data) {
  const cont = document.getElementById("arboles");
  cont.innerHTML = "";
  for (const [id, meta] of Object.entries(ARBOLES_META)) {
    const arbol = data.arboles[id];
    const pct = Math.min(100, Math.round((arbol.xp / costoNivel(arbol.nivel)) * 100));
    cont.insertAdjacentHTML("beforeend", `
      <div class="arbol">
        <div class="arbol__emoji">${meta.emoji}</div>
        <div class="arbol__info">
          <div class="arbol__nombre">
            <span>${meta.nombre}</span>
            <span class="arbol__nivel">NV ${arbol.nivel} · ${arbol.xp}/${costoNivel(arbol.nivel)}</span>
          </div>
          <div class="barra"><div class="barra__fill" style="width:${pct}%"></div></div>
          ${proximoHTML(data, id)}
        </div>
      </div>
    `);
  }
}

/* La zanahoria: qué desbloquea el próximo nivel con premio.
   Esto es lo que convierte "subió un número" en "me estoy
   convirtiendo en alguien más avanzado". */
function proximoHTML(data, arbolId) {
  const prox = proximaRecompensa(data, arbolId);
  if (!prox) return `<div class="arbol__proximo arbol__proximo--fin">Línea completa ✦</div>`;
  return `<div class="arbol__proximo">Próximo: NV ${prox.nivel} · ${prox.nombre}</div>`;
}

/* ------------------------------------------------------------
   Animación de XP flotante.
   Crea un texto sobre el elemento tocado que sube y se
   desvanece. Se autodestruye al terminar para no acumular
   elementos invisibles en la página.
   ------------------------------------------------------------ */
export function flotarXp(texto, origenEl) {
  const rect = origenEl.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "xp-float";
  el.textContent = texto;
  el.style.left = rect.left + rect.width / 2 + "px";
  el.style.top = rect.top + "px";
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
  // Red de seguridad por si la animación está desactivada
  // (modo "reducir movimiento" del iPhone). Tiene que durar
  // MÁS que la animación (2.4s) o cortaría el cartelito
  // antes de que termine de leerse.
  setTimeout(() => el.remove(), 3200);
}
