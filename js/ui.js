/* ============================================================
   MAIN QUEST — ui.js
   ------------------------------------------------------------
   Piezas de interfaz compartidas. Nació cuando los logros y
   las subidas de nivel necesitaron el mismo cartel de
   celebración: en vez de duplicarlo, vive acá.

   mostrarCartel(icono, titulo, sub):
   Un cartel que baja desde arriba, se queda 2.6s y se va.
   Si llegan varios juntos (p. ej. una subida de nivel que
   desbloquea recompensa Y un logro), se encolan y salen
   de a uno. Celebrar dos cosas a la vez es no celebrar
   ninguna.
   ============================================================ */

const cola = [];
let mostrando = false;

export function mostrarCartel(icono, titulo, sub) {
  cola.push({ icono, titulo, sub });
  if (!mostrando) siguiente();
}

function siguiente() {
  const c = cola.shift();
  if (!c) { mostrando = false; return; }
  mostrando = true;

  const el = document.createElement("div");
  el.className = "celebracion";
  el.innerHTML = `
    <span class="celebracion__icono">${c.icono}</span>
    <span class="celebracion__texto">
      <strong>${c.titulo}</strong>
      ${c.sub ? `<em>${c.sub}</em>` : ""}
    </span>`;
  document.body.appendChild(el);

  setTimeout(() => {
    el.classList.add("saliendo");
    setTimeout(() => { el.remove(); siguiente(); }, 400);
  }, 2600);
}
