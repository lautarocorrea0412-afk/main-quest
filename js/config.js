/* ============================================================
   MAIN QUEST — config.js
   ------------------------------------------------------------
   La pestaña VOS necesitaba un lugar para los ajustes que
   hasta ahora estaban clavados en el código: el nombre, la
   hora del diario (era 21 fija) y la base del sonido (que la
   Entrega de sonido va a usar).

   Nada acá manda notificaciones: una PWA en iOS no puede
   despertar sola a una hora. "Hora del diario" es cuándo la
   app te MUESTRA el cierre del día al abrirla, no una alarma.
   El texto de ayuda lo dice, para no prometer lo que iOS no
   permite.
   ============================================================ */

import { save } from "./store.js";
import { escapar } from "./util.js";
import { setSonido, sonar, setMusica } from "./sonido.js";

let data;

/* Aplica el nombre nuevo en todos los lugares donde aparece,
   sin recargar toda la app. */
function aplicarNombre() {
  const el = document.getElementById("perfil-nombre");
  if (el) el.textContent = data.perfil.nombre;
  // El saludo de HOY se recalcula al volver a esa pestaña; acá
  // avisamos por si algún módulo quiere refrescar.
  document.dispatchEvent(new CustomEvent("contexto-cambiado"));
}

export function renderConfig() {
  const cont = document.getElementById("config-panel");
  if (!cont || !data) return;

  const nombre = data.perfil.nombre || "";
  const hora = data.ajustes.hora_diario;
  const sonido = !!data.ajustes.sonido;
  const musica = !!data.ajustes.musica;

  // Opciones de hora razonables para el cierre del día.
  const horas = [18, 19, 20, 21, 22, 23, 0];
  const opcionesHora = horas.map((h) => {
    const etiqueta = h === 0 ? "medianoche" : `${h}:00`;
    return `<option value="${h}" ${h === hora ? "selected" : ""}>${etiqueta}</option>`;
  }).join("");

  cont.innerHTML = `
    <div class="config-item">
      <label class="config-label" for="config-nombre">Tu nombre</label>
      <input type="text" id="config-nombre" class="campo" maxlength="24"
             value="${escapar(nombre)}" placeholder="¿Cómo te llamás?"
             enterkeyhint="done">
    </div>

    <div class="config-item">
      <label class="config-label" for="config-hora">Hora del diario</label>
      <select id="config-hora" class="campo campo--select">${opcionesHora}</select>
      <p class="config-ayuda">Desde esta hora aparece el cierre del día cuando abrís la app. No es una alarma: iOS no deja que una app así te avise sola.</p>
    </div>

    <div class="config-item config-item--fila">
      <div>
        <span class="config-label">Sonido</span>
        <p class="config-ayuda">Efectos suaves al cumplir misiones, comprar y subir de nivel. Ojo: el interruptor de silencio físico del iPhone los calla, aunque acá estén encendidos.</p>
      </div>
      <button type="button" class="switch ${sonido ? "switch--on" : ""}" id="config-sonido"
              role="switch" aria-checked="${sonido}" aria-label="Sonido">
        <span class="switch__bola"></span>
      </button>
    </div>

    <div class="config-item config-item--fila">
      <div>
        <span class="config-label">Música de fondo</span>
        <p class="config-ayuda">Un pad ambiental suave, tranqui. Aparte de los efectos: podés tener uno sin el otro. También lo calla el interruptor de silencio del iPhone.</p>
      </div>
      <button type="button" class="switch ${musica ? "switch--on" : ""}" id="config-musica"
              role="switch" aria-checked="${musica}" aria-label="Música">
        <span class="switch__bola"></span>
      </button>
    </div>`;

  // onclick / oninput directos, la regla de la casa.
  const inNombre = document.getElementById("config-nombre");
  if (inNombre) {
    inNombre.oninput = () => {
      const v = inNombre.value.trim();
      data.perfil.nombre = v || "vos"; // nunca vacío
      save(data);
      aplicarNombre();
    };
  }

  const selHora = document.getElementById("config-hora");
  if (selHora) {
    selHora.onchange = () => {
      data.ajustes.hora_diario = parseInt(selHora.value, 10);
      save(data);
      // El diario puede aparecer o esconderse según la hora nueva.
      document.dispatchEvent(new CustomEvent("contexto-cambiado"));
    };
  }

  const swSonido = document.getElementById("config-sonido");
  if (swSonido) {
    swSonido.onclick = () => {
      data.ajustes.sonido = !data.ajustes.sonido;
      save(data);
      setSonido(data.ajustes.sonido);
      if (data.ajustes.sonido) sonar("secundaria"); // muestra cómo suena
      renderConfig();
    };
  }

  const swMusica = document.getElementById("config-musica");
  if (swMusica) {
    swMusica.onclick = () => {
      data.ajustes.musica = !data.ajustes.musica;
      save(data);
      setMusica(data.ajustes.musica);
      renderConfig();
    };
  }
}

/* ===================== API ===================== */

export function setDatosConfig(appData) {
  data = appData;
  renderConfig();
}

export function initConfig(appData) {
  data = appData;
  renderConfig();
}
