/* ============================================================
   MAIN QUEST — util.js
   ------------------------------------------------------------
   Helpers compartidos por varios módulos. Nació en el
   Paso 4: hoyISO() y escapar() estaban duplicadas en
   missions.js y engine.js, y el diario iba a ser la tercera
   copia. Tres usos = se extrae. Dos = se tolera.
   ============================================================ */

/* Fecha local en formato YYYY-MM-DD.
   No usamos toISOString() porque devuelve UTC: a la noche
   en Argentina (UTC-3) ya sería "mañana". */
export function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/* Días entre hoy y una fecha YYYY-MM-DD (días calendario). */
export function diasHasta(fechaISO) {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const objetivo = new Date(y, m - 1, d);
  const ahora = new Date();
  const hoy0 = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((objetivo - hoy0) / 86400000);
}

/* Franja de luz según la hora local. La usa la luz ambiente
   del cuarto y del fondo de la app:
   - mañana (6-11): dorada
   - tarde (12-18): ámbar, la paleta Atardecer tal cual
   - noche (19-5): fría y tenue
   La noche arranca a las 19 a propósito: a las 23 el cuarto
   YA está en modo noche antes de que ningún mensaje te
   sugiera dormir. La regla del sueño, dicha con luz. */
export function franjaLuz(hora) {
  if (hora >= 6 && hora < 12) return "manana";
  if (hora >= 12 && hora < 19) return "tarde";
  return "noche";
}

/* Escape de HTML: lo que escribe el usuario se muestra
   como texto, nunca se interpreta como código. */
export function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
