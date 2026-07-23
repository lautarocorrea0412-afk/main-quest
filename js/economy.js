/* ============================================================
   MAIN QUEST — economy.js
   ------------------------------------------------------------
   La economía virtual (sección 7 del PRD):
   - Las monedas se ganan cumpliendo misiones.
   - Se gastan en la tienda, en cosas para tu habitación.
   - Nunca tocan dinero real.

   Filosofía de la moneda vs el XP:
   - Las MONEDAS premian HACER: caen por toda misión
     cumplida, tenga árbol o no. "Comprar omiyage" también
     paga.
   - El XP premia la DIRECCIÓN: solo lo dan las misiones
     con árbol.

   ⚙️ BALANCE: todas las tarifas y precios están acá abajo,
   juntos. Calibrar la economía con datos reales de uso =
   cambiar estos números y nada más.
   ============================================================ */

import { save } from "./store.js";
import { hoyISO } from "./util.js";
import { refrescarCuarto } from "./room.js";

let data;

/* ===================== TARIFAS ===================== */

export const MONEDAS_PRINCIPAL = 30;
export const MONEDAS_SECUNDARIA = 10;

/* ===================== CATÁLOGO =====================
   Los emojis son placeholders honestos: en el Paso 2
   cada ítem pasa a ser un sprite pixel art en el cuarto.
   Escalones de precio (a ~350-400 🪙/semana estimadas):
   chico ≈ días · medio ≈ 1-2 semanas · grande ≈ un mes. */
export const CATALOGO = [
  { id: "planta",       emoji: "🪴", nombre: "Planta",             precio: 120 },
  { id: "poster",       emoji: "🖼️", nombre: "Póster anime",       precio: 150 },
  { id: "alfombra",     emoji: "🟦", nombre: "Alfombra",           precio: 200 },
  { id: "figura",       emoji: "🔴", nombre: "Figura Pokémon",     precio: 250 },
  { id: "led",          emoji: "💡", nombre: "Luces LED",          precio: 300 },
  { id: "estante",      emoji: "🗄️", nombre: "Estante",            precio: 350 },
  { id: "noren",        emoji: "⛩️", nombre: "Noren japonés",      precio: 400 },
  { id: "silla",        emoji: "🪑", nombre: "Silla gamer",        precio: 450 },
  { id: "tv",           emoji: "📺", nombre: "Televisión",         precio: 600 },
  { id: "consola",      emoji: "🕹️", nombre: "Consola retro",      precio: 700 },
  { id: "biblioteca",   emoji: "📚", nombre: "Biblioteca",         precio: 800 },
  { id: "monitor2",     emoji: "🖥️", nombre: "Segundo monitor",    precio: 900 },
  { id: "microfono",    emoji: "🎙️", nombre: "Micrófono",          precio: 1000 },
  { id: "pcgamer",      emoji: "🖥️", nombre: "PC Gamer",           precio: 1500 }
];

/* ===================== MONEDAS ===================== */

export function ganarMonedas(cantidad) {
  data.economia.monedas += cantidad;
  save(data);
  renderMonedas();
}

/* Con piso en 0: si gastaste y después deshacés una misión,
   la billetera no queda en negativo. Preferimos perdonar
   la diferencia antes que tener deuda en un juego. */
export function quitarMonedas(cantidad) {
  data.economia.monedas = Math.max(0, data.economia.monedas - cantidad);
  save(data);
  renderMonedas();
}

function tiene(itemId) {
  return data.economia.inventario.some((i) => i.id === itemId);
}

/* ===================== COMPRA ===================== */

function comprar(itemId) {
  const item = CATALOGO.find((i) => i.id === itemId);
  if (!item || tiene(itemId)) return;
  if (data.economia.monedas < item.precio) return;

  data.economia.monedas -= item.precio;
  data.economia.inventario.push({ id: item.id, comprado_en: new Date().toISOString() });

  // La compra queda en tu historia (la timeline de la
  // Fase 3 va a mostrar esto: los datos empiezan hoy).
  data.timeline.push({
    fecha: hoyISO(),
    tipo: "compra",
    titulo: `Desbloqueaste: ${item.nombre}`
  });

  save(data);
  renderMonedas();
  renderTienda();
  refrescarCuarto(); // lo comprado aparece en el cuarto al instante
  document.dispatchEvent(new CustomEvent("contexto-cambiado"));
}

/* ===================== RENDER ===================== */

export function renderMonedas() {
  const el = document.getElementById("monedas-contador");
  if (el) el.textContent = `🪙 ${data.economia.monedas}`;
}

export function renderTienda() {
  const cont = document.getElementById("tienda");
  if (!cont) return;

  cont.innerHTML = CATALOGO.map((item) => {
    const comprado = tiene(item.id);
    const alcanza = data.economia.monedas >= item.precio;

    let boton;
    if (comprado) {
      boton = `<span class="tienda__estado">✓ Tuyo</span>`;
    } else if (alcanza) {
      boton = `<button class="btn-comprar" data-action="comprar" data-id="${item.id}">
                 Comprar · ${item.precio} 🪙
               </button>`;
    } else {
      boton = `<span class="tienda__estado tienda__estado--falta">
                 Te faltan ${item.precio - data.economia.monedas} 🪙
               </span>`;
    }

    return `
      <div class="tienda__item ${comprado ? "tienda__item--tuyo" : ""}">
        <div class="tienda__emoji">${item.emoji}</div>
        <div class="tienda__nombre">${item.nombre}</div>
        ${boton}
      </div>`;
  }).join("");
}

function accionTienda(e) {
  const btn = e.target.closest('[data-action="comprar"]');
  if (!btn) return;
  comprar(btn.dataset.id);
}

/* ===================== API ===================== */

export function setDatosEconomia(appData) {
  data = appData;
  renderMonedas();
  renderTienda();
}

export function initEconomia(appData) {
  data = appData;
  document.getElementById("view-habitacion").addEventListener("click", accionTienda);
  renderMonedas();
  renderTienda();
}
