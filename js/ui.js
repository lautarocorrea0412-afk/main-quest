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

/* ------------------------------------------------------------
   abrirHoja(titulo, htmlContenido, alRenderizar):
   Una hoja que SUBE desde abajo (bottom sheet), como las apps
   nativas. Nació en la Entrega 8c: el historial de Japón y la
   historia completa crecían hacia abajo y volvían la página
   interminable. En vez de expandir el flujo, esto abre el
   detalle ENCIMA, ocupando solo lo necesario, con su propio
   scroll. La página principal queda compacta e intacta.

   - titulo: encabezado de la hoja.
   - htmlContenido: el HTML del cuerpo (ya scrolleable).
   - alRenderizar(cont): callback opcional para cablear onclicks
     dentro de la hoja (la regla de la casa: nada de delegación).

   Se cierra tocando el fondo, el botón X, o arrastrando hacia
   abajo. Devuelve una función para cerrarla desde afuera.
   ------------------------------------------------------------ */
export function abrirHoja(titulo, htmlContenido, alRenderizar) {
  const fondo = document.createElement("div");
  fondo.className = "hoja-fondo";
  fondo.innerHTML = `
    <div class="hoja" role="dialog" aria-label="${titulo}">
      <div class="hoja__tirador"></div>
      <div class="hoja__cabecera">
        <h3 class="hoja__titulo">${titulo}</h3>
        <button class="hoja__cerrar" aria-label="Cerrar">✕</button>
      </div>
      <div class="hoja__cuerpo">${htmlContenido}</div>
    </div>`;
  document.body.appendChild(fondo);
  document.body.classList.add("hoja-abierta");

  const hoja = fondo.querySelector(".hoja");
  const cuerpo = fondo.querySelector(".hoja__cuerpo");

  // Entrada en el próximo frame, para que la transición corra.
  requestAnimationFrame(() => requestAnimationFrame(() => fondo.classList.add("hoja-fondo--on")));

  const cerrar = () => {
    fondo.classList.remove("hoja-fondo--on");
    document.body.classList.remove("hoja-abierta");
    const quitar = () => fondo.remove();
    hoja.addEventListener("transitionend", quitar, { once: true });
    setTimeout(quitar, 500); // red de seguridad > animación
  };

  // Cerrar con la X y tocando el fondo (no el interior de la hoja).
  fondo.querySelector(".hoja__cerrar").onclick = cerrar;
  fondo.onclick = (e) => { if (e.target === fondo) cerrar(); };

  /* Arrastre hacia abajo para cerrar: gesto nativo de bottom
     sheet. Solo cuenta si empezás desde arriba (tirador o
     cabecera) o si el cuerpo ya está en el tope del scroll,
     para no pelear con el scroll interno. */
  let y0 = null, arrastre = 0;
  const tirador = fondo.querySelector(".hoja__tirador");
  const cabecera = fondo.querySelector(".hoja__cabecera");
  const iniciar = (e) => {
    const desdeArriba = e.target === tirador || cabecera.contains(e.target);
    if (!desdeArriba && cuerpo.scrollTop > 0) return;
    y0 = e.touches ? e.touches[0].clientY : e.clientY;
    arrastre = 0;
  };
  const mover = (e) => {
    if (y0 === null) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    arrastre = Math.max(0, y - y0);
    hoja.style.transform = `translateY(${arrastre}px)`;
  };
  const soltar = () => {
    if (y0 === null) return;
    hoja.style.transform = "";
    if (arrastre > 90) cerrar(); // pasó el umbral: se cierra
    y0 = null;
  };
  hoja.addEventListener("pointerdown", iniciar);
  hoja.addEventListener("pointermove", mover);
  hoja.addEventListener("pointerup", soltar);
  hoja.addEventListener("pointercancel", soltar);

  if (typeof alRenderizar === "function") alRenderizar(cuerpo);

  return cerrar;
}
