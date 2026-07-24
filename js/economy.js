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
  /* El ítem de arranque: a 40 🪙, una misión principal (30)
     más una secundaria (10) lo compran el PRIMER día. El
     ciclo "cumplo → gano → compro → veo el cambio en mi
     cuarto" se cierra en 24 horas, no en una semana. */
  { id: "cojin",        emoji: "🔶", nombre: "Cojín",              precio: 40 },
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
  renderTienda(); // los "te faltan X" se recalculan con cada moneda
}

/* Con piso en 0: si gastaste y después deshacés una misión,
   la billetera no queda en negativo. Preferimos perdonar
   la diferencia antes que tener deuda en un juego. */
export function quitarMonedas(cantidad) {
  data.economia.monedas = Math.max(0, data.economia.monedas - cantidad);
  save(data);
  renderMonedas();
  renderTienda();
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
  if (!el) return;
  const objetivo = data.economia.monedas;
  const desde = Number(el.dataset.valor ?? objetivo);
  el.dataset.valor = String(objetivo);

  // El valor FINAL se escribe primero: la animación es
  // cosmética y si algo la interrumpe, el número queda bien.
  el.textContent = `🪙 ${objetivo}`;
  if (desde === objetivo) return;

  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");

  // Contador rodante: del valor viejo al nuevo en ~450ms.
  const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reducir || typeof requestAnimationFrame !== "function") return;
  const inicio = performance.now();
  const rodar = (t) => {
    const p = Math.min(1, (t - inicio) / 450);
    const suave = 1 - Math.pow(1 - p, 3); // arranca rápido, frena al llegar
    el.textContent = `🪙 ${Math.round(desde + (objetivo - desde) * suave)}`;
    if (p < 1) requestAnimationFrame(rodar);
  };
  requestAnimationFrame(rodar);
}

/* ------------------------------------------------------------
   Moneditas que vuelan desde donde tocaste hasta la billetera
   del header. Tres, escalonadas. Puro deleite, cero función:
   por eso respetan "reducir movimiento" y se autodestruyen.
   ------------------------------------------------------------ */
export function volarMonedas(origenEl) {
  if (!origenEl?.getBoundingClientRect) return;
  const destino = document.getElementById("monedas-contador");
  if (!destino?.getBoundingClientRect) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

  const desde = origenEl.getBoundingClientRect();
  const hasta = destino.getBoundingClientRect();
  const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2);
  const dy = hasta.top + hasta.height / 2 - (desde.top + desde.height / 2);

  for (let i = 0; i < 3; i++) {
    const m = document.createElement("span");
    m.className = "moneda-vuelo";
    m.textContent = "🪙";
    m.style.left = desde.left + desde.width / 2 + "px";
    m.style.top = desde.top + "px";
    m.style.transitionDelay = `${i * 70}ms`;
    document.body.appendChild(m);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        m.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`;
        m.style.opacity = "0";
      });
    });
    m.addEventListener("transitionend", () => m.remove(), { once: true });
    setTimeout(() => m.remove(), 1400); // red de seguridad > animación
  }
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
