/* ============================================================
   MAIN QUEST — avatar-arte.js
   ------------------------------------------------------------
   SOLO ARTE. Ni una decisión, ni un dato del usuario, ni una
   línea de DOM: tablas de rectángulos y nada más.

   Se separó de avatar.js en la Entrega 6 (D-29). El archivo
   original tenía 617 líneas y era 80% dibujo, así que cada
   vez que había que tocar la lógica había que scrollear por
   cinco peinados y once prendas para encontrarla.

   Agregar una prenda, un peinado, un accesorio o una
   expresión = agregar una entrada acá. La lógica ni se entera.
   ============================================================ */

/* ===================== PALETA ===================== */
export const P = {
  piel:      "#F0C39A",
  piel_sh:   "#D9A277",
  blush:     "#E89A9E",
  pelo:      "#211C28",
  pelo_lt:   "#3B3247",   // brillo del pelo (le da volumen)
  pelo_dk:   "#161219",
  ojo:       "#6B4530",
  ojo_lt:    "#A87A52",
  blanco:    "#FBF0E4",
  boca:      "#B5766A",
  negro:     "#2E2836",
  negro_lt:  "#403A4A",
  gris:      "#6E6779",
  gris_dk:   "#524C5E",
  crema:     "#FBF0E4",
  crema_dk:  "#D9CDBC",
  denim:     "#4A5A78",
  denim_dk:  "#3A4A66",
  jogging:   "#3E3346",
  jogging_dk:"#2E2636",
  cargo:     "#5A5340",
  cargo_dk:  "#4A4433",
  amber:     "#FFB067",
  sakura:    "#F58EA8",
  sakura_dk: "#D4708A",
  matcha:    "#8FD6A9",
  suela:     "#E8DCC8",
  oro:       "#FFD98E"
};

export function r(x, y, w, h, c) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
}

/* ===================== PEINADOS (gratis) =====================
   Cada peinado tiene DOS capas: "atras" (la melena que cae
   detrás del cuerpo, se dibuja primero) y "adelante" (flequillo
   y mechones que tapan la cara y los hombros).
   En pixel art el pelo es lo que más identifica a un personaje:
   por eso es lo que más detalle tiene de todo el avatar. */
export const PELOS = {
  largo: {
    nombre: "Largo",
    atras: () =>
      r(11, 12, 26, 42, P.pelo) +      // melena ancha detrás
      r(9, 18, 4, 32, P.pelo_dk) +
      r(35, 18, 4, 32, P.pelo_dk) +
      r(13, 50, 22, 6, P.pelo_dk),     // puntas
    adelante: () =>
      r(12, 2, 24, 8, P.pelo) +        // techo
      r(10, 6, 5, 46, P.pelo) +        // mechón izquierdo largo
      r(33, 6, 5, 46, P.pelo) +        // mechón derecho largo
      r(11, 48, 5, 6, P.pelo_dk) +     // puntas de los mechones
      r(32, 48, 5, 6, P.pelo_dk) +
      r(13, 8, 22, 5, P.pelo) +        // flequillo
      r(15, 12, 7, 3, P.pelo) +        // caídas del flequillo
      r(26, 12, 7, 3, P.pelo) +
      r(21, 12, 4, 2, P.pelo) +
      r(14, 3, 16, 3, P.pelo_lt) +     // brillo (volumen)
      r(12, 14, 3, 20, P.pelo_lt)
  },
  corto: {
    nombre: "Corto",
    atras: () => r(13, 12, 22, 12, P.pelo),
    adelante: () =>
      r(12, 2, 24, 9, P.pelo) +
      r(10, 6, 4, 18, P.pelo) +
      r(34, 6, 4, 18, P.pelo) +
      r(13, 9, 22, 4, P.pelo) +
      r(16, 12, 6, 3, P.pelo) +
      r(27, 12, 6, 3, P.pelo) +
      r(14, 3, 16, 3, P.pelo_lt)
  },
  tomado: {
    nombre: "Tomado",
    atras: () =>
      r(13, 12, 22, 12, P.pelo) +
      r(35, 16, 7, 34, P.pelo) +       // la colita, bien larga
      r(36, 46, 6, 7, P.pelo_dk) +
      r(36, 20, 3, 20, P.pelo_lt),
    adelante: () =>
      r(12, 2, 24, 9, P.pelo) +
      r(10, 6, 4, 16, P.pelo) +
      r(34, 6, 4, 14, P.pelo) +
      r(13, 9, 22, 4, P.pelo) +
      r(15, 12, 7, 3, P.pelo) +
      r(27, 12, 6, 3, P.pelo) +
      r(14, 3, 16, 3, P.pelo_lt)
  },
  gorra: {
    nombre: "Con gorra",
    atras: () => r(11, 14, 26, 40, P.pelo) + r(13, 50, 22, 5, P.pelo_dk),
    adelante: () =>
      r(11, 1, 26, 9, P.negro) +       // copa
      r(8, 9, 32, 3, P.negro) +        // visera
      r(21, 3, 6, 5, P.amber) +        // logo
      r(11, 1, 26, 2, P.negro_lt) +
      r(10, 10, 5, 42, P.pelo) +       // el pelo largo asoma igual
      r(33, 10, 5, 42, P.pelo) +
      r(11, 48, 5, 6, P.pelo_dk) +
      r(32, 48, 5, 6, P.pelo_dk)
  }
};

/* ===================== CARA Y EXPRESIONES =====================
   Las expresiones NO son emojis que cambian de cara: son
   pequeños ajustes de cejas, párpados y boca sobre la misma
   cara, como en un slice of life. La estructura ósea nunca
   cambia; cambia el gesto.

   Cada expresión define tres piezas: cejas, ojos y boca.
   Agregar una nueva en el futuro = agregar una entrada acá. */

const EXPRESIONES = {

  /* Tranquila: la de todos los días. */
  normal: {
    nombre: "Tranquilo",
    cejas: () => r(17, 14, 6, 1, P.pelo) + r(26, 14, 6, 1, P.pelo),
    ojos: () =>
      r(17, 16, 6, 1, P.pelo) + r(17, 17, 6, 7, P.blanco) +
      r(18, 18, 4, 5, P.ojo) + r(18, 18, 4, 2, P.pelo) +
      r(21, 18, 1, 1, P.blanco) + r(18, 22, 3, 1, P.ojo_lt) +
      r(26, 16, 6, 1, P.pelo) + r(26, 17, 6, 7, P.blanco) +
      r(27, 18, 4, 5, P.ojo) + r(27, 18, 4, 2, P.pelo) +
      r(30, 18, 1, 1, P.blanco) + r(28, 22, 3, 1, P.ojo_lt),
    boca: () => r(23, 25, 3, 1, P.boca),
    extra: () => r(15, 24, 2, 2, P.blush) + r(31, 24, 2, 2, P.blush)
  },

  /* Misión cumplida: orgullo. Ojos un poco entrecerrados de
     satisfacción y sonrisa con las comisuras levantadas. */
  feliz: {
    nombre: "Orgulloso",
    cejas: () => r(17, 13, 6, 1, P.pelo) + r(26, 13, 6, 1, P.pelo),
    ojos: () =>
      r(17, 17, 6, 1, P.pelo) + r(17, 18, 6, 6, P.blanco) +
      r(18, 19, 4, 4, P.ojo) + r(18, 19, 4, 2, P.pelo) +
      r(21, 19, 1, 1, P.blanco) +
      r(26, 17, 6, 1, P.pelo) + r(26, 18, 6, 6, P.blanco) +
      r(27, 19, 4, 4, P.ojo) + r(27, 19, 4, 2, P.pelo) +
      r(30, 19, 1, 1, P.blanco),
    boca: () => r(22, 25, 4, 1, P.boca) + r(21, 24, 1, 1, P.boca) + r(26, 24, 1, 1, P.boca),
    extra: () => r(14, 24, 3, 2, P.blush) + r(31, 24, 3, 2, P.blush)
  },

  /* Modo parcial: concentración. Cejas hacia adentro y abajo,
     párpado más bajo, boca en línea recta. */
  concentrado: {
    nombre: "Concentrado",
    cejas: () =>
      r(17, 13, 3, 1, P.pelo) + r(20, 15, 3, 1, P.pelo) +
      r(26, 15, 3, 1, P.pelo) + r(29, 13, 3, 1, P.pelo),
    ojos: () =>
      r(17, 17, 6, 2, P.pelo) + r(17, 19, 6, 5, P.blanco) +
      r(18, 19, 4, 4, P.ojo) + r(18, 19, 4, 2, P.pelo) +
      r(21, 20, 1, 1, P.blanco) +
      r(26, 17, 6, 2, P.pelo) + r(26, 19, 6, 5, P.blanco) +
      r(27, 19, 4, 4, P.ojo) + r(27, 19, 4, 2, P.pelo) +
      r(30, 20, 1, 1, P.blanco),
    boca: () => r(22, 25, 4, 1, P.boca),
    extra: () => ""
  },

  /* Energía baja: párpados a media asta y ojeras suaves.
     No es tristeza: es cansancio honesto. */
  cansado: {
    nombre: "Cansado",
    cejas: () =>
      r(17, 15, 3, 1, P.pelo) + r(20, 13, 3, 1, P.pelo) +
      r(26, 13, 3, 1, P.pelo) + r(29, 15, 3, 1, P.pelo),
    ojos: () =>
      r(17, 17, 6, 2, P.pelo) + r(17, 19, 6, 4, P.blanco) +
      r(18, 20, 4, 3, P.ojo) + r(18, 20, 4, 1, P.pelo) +
      r(26, 17, 6, 2, P.pelo) + r(26, 19, 6, 4, P.blanco) +
      r(27, 20, 4, 3, P.ojo) + r(27, 20, 4, 1, P.pelo),
    boca: () => r(23, 25, 2, 1, P.boca),
    extra: () => r(17, 24, 6, 1, P.piel_sh) + r(26, 24, 6, 1, P.piel_sh)
  },

  /* Racha alta: confianza. Una ceja levantada y media sonrisa. */
  confiado: {
    nombre: "Confiado",
    cejas: () => r(17, 12, 6, 1, P.pelo) + r(26, 14, 6, 1, P.pelo),
    ojos: () =>
      r(17, 16, 6, 1, P.pelo) + r(17, 17, 6, 7, P.blanco) +
      r(18, 18, 4, 5, P.ojo) + r(18, 18, 4, 2, P.pelo) +
      r(21, 18, 1, 1, P.blanco) +
      r(26, 17, 6, 1, P.pelo) + r(26, 18, 6, 6, P.blanco) +
      r(27, 19, 4, 4, P.ojo) + r(27, 19, 4, 2, P.pelo) +
      r(30, 19, 1, 1, P.blanco),
    boca: () => r(22, 25, 4, 1, P.boca) + r(26, 24, 1, 1, P.boca),
    extra: () => r(31, 24, 2, 2, P.blush)
  }
};

export const NOMBRES_EXPRESION = Object.fromEntries(
  Object.entries(EXPRESIONES).map(([k, v]) => [k, v.nombre])
);

export function dibujarCara(expr) {
  const e = EXPRESIONES[expr] || EXPRESIONES.normal;
  return (
    r(15, 8, 18, 22, P.piel) +          // óvalo
    r(15, 27, 18, 3, P.piel_sh) +       // mentón sombreado
    r(20, 29, 8, 5, P.piel_sh) +        // cuello
    e.cejas() + e.ojos() + e.extra() + e.boca()
  );
}

/* ------------------------------------------------------------
   Expresión automática según tu contexto real.
   Este es el enganche con el motor: el avatar no es
   decoración, reacciona a tu vida.

   Prioridad (y el porqué de cada una):
   1. Misión principal cumplida hoy → orgullo. Es EL momento.
   2. Energía baja varios días      → cansado. Salud primero.
   3. Parcial a ≤14 días            → concentrado.
   4. Racha de 3+ días              → confiado.
   5. Si no                          → tranquilo.
   ------------------------------------------------------------ */
/* ===================== ROPA (se gana) =====================
   Todo es OVERSIZE: el torso es más ancho que la cabeza y las
   mangas caen largas. Eso da la silueta que pediste. */
export const REMERAS = {
  oversize: {
    nombre: "Remera oversize",
    dibujo: () =>
      r(9, 32, 30, 25, P.negro) +
      r(4, 34, 6, 20, P.negro) +        // mangas caídas
      r(38, 34, 6, 20, P.negro) +
      r(9, 32, 30, 2, P.negro_lt) +     // hombros
      r(19, 32, 10, 3, P.gris) +        // cuello ancho
      r(9, 54, 30, 3, P.negro_lt)       // ruedo
  },
  hoodie: {
    nombre: "Hoodie",
    dibujo: () =>
      r(14, 27, 20, 7, P.gris_dk) +     // capucha detrás del cuello
      r(9, 32, 30, 27, P.gris) +
      r(4, 34, 6, 22, P.gris) +
      r(38, 34, 6, 22, P.gris) +
      r(9, 32, 30, 2, "#7E7789") +
      r(17, 45, 14, 9, P.gris_dk) +     // bolsillo canguro
      r(20, 35, 2, 8, P.crema) +        // cordones
      r(26, 35, 2, 8, P.crema) +
      r(9, 56, 30, 3, P.gris_dk) +      // elástico
      r(4, 53, 6, 3, P.gris_dk) +       // puños
      r(38, 53, 6, 3, P.gris_dk)
  },
  camisa: {
    nombre: "Camisa",
    dibujo: () =>
      r(9, 32, 30, 25, P.crema) +
      r(4, 34, 6, 20, P.crema) +
      r(38, 34, 6, 20, P.crema) +
      r(22, 32, 4, 25, P.crema_dk) +    // botonadura
      r(23, 38, 2, 1, P.gris) +
      r(23, 45, 2, 1, P.gris) +
      r(17, 31, 6, 4, P.crema_dk) +     // cuello
      r(25, 31, 6, 4, P.crema_dk)
  },
  jersey: {
    nombre: "Jersey deportivo",
    dibujo: () =>
      r(9, 32, 30, 25, P.matcha) +
      r(4, 34, 6, 10, P.matcha) +       // manga corta
      r(38, 34, 6, 10, P.matcha) +
      r(9, 32, 30, 3, P.crema) +
      r(19, 32, 10, 3, "#6FB88A") +
      r(20, 41, 8, 9, P.crema) +        // número
      r(9, 54, 30, 3, "#6FB88A")
  },
  campera: {
    nombre: "Campera bomber",
    dibujo: () =>
      r(9, 32, 30, 25, P.sakura) +
      r(4, 34, 6, 20, P.sakura) +
      r(38, 34, 6, 20, P.sakura) +
      r(17, 31, 14, 3, P.negro) +       // cuello bomber
      r(22, 34, 3, 21, P.negro) +       // cierre
      r(9, 54, 30, 3, P.negro) +
      r(4, 51, 6, 3, P.negro) +
      r(38, 51, 6, 3, P.negro) +
      r(11, 45, 6, 2, P.sakura_dk)      // bolsillo
  },
  tecnica: {
    nombre: "Campera técnica",
    dibujo: () =>
      r(9, 32, 30, 27, P.negro) +
      r(4, 34, 6, 22, P.negro) +
      r(38, 34, 6, 22, P.negro) +
      r(22, 32, 3, 24, P.amber) +       // cierre ámbar
      r(9, 32, 30, 2, P.negro_lt) +
      r(11, 42, 7, 6, P.negro_lt) +     // bolsillos técnicos
      r(30, 42, 7, 6, P.negro_lt) +
      r(12, 43, 5, 1, P.amber) +
      r(31, 43, 5, 1, P.amber) +
      r(9, 56, 30, 3, P.negro_lt)
  },
  training: {
    nombre: "Conjunto training",
    dibujo: () =>
      r(9, 32, 30, 25, "#5FA87A") +
      r(4, 34, 6, 20, "#5FA87A") +
      r(38, 34, 6, 20, "#5FA87A") +
      r(4, 34, 6, 2, P.crema) +         // franjas en las mangas
      r(38, 34, 6, 2, P.crema) +
      r(4, 40, 6, 2, P.crema) +
      r(38, 40, 6, 2, P.crema) +
      r(22, 32, 3, 25, "#4A8862") +
      r(9, 54, 30, 3, "#4A8862")
  },
  sweater: {
    nombre: "Sweater universitario",
    dibujo: () =>
      r(9, 32, 30, 25, "#5E4A6B") +
      r(4, 34, 6, 20, "#5E4A6B") +
      r(38, 34, 6, 20, "#5E4A6B") +
      r(16, 31, 6, 4, P.crema) +        // cuello de camisa asomando
      r(26, 31, 6, 4, P.crema) +
      r(22, 33, 4, 3, P.crema) +
      r(9, 54, 30, 3, "#4A3A56") +      // puño del sweater
      r(4, 51, 6, 3, "#4A3A56") +
      r(38, 51, 6, 3, "#4A3A56") +
      r(17, 42, 14, 2, "#4A3A56")       // trenzado sugerido
  },
  haori: {
    nombre: "Haori",
    dibujo: () =>
      r(8, 32, 32, 27, P.negro_lt) +    // caída amplia
      r(3, 34, 7, 24, P.negro_lt) +     // mangas anchas
      r(38, 34, 7, 24, P.negro_lt) +
      r(3, 56, 7, 2, P.crema) +         // borde de las mangas
      r(38, 56, 7, 2, P.crema) +
      r(14, 32, 3, 27, P.crema) +       // solapas
      r(31, 32, 3, 27, P.crema) +
      r(17, 34, 14, 23, P.negro) +      // interior oscuro
      r(19, 48, 3, 3, P.sakura) +       // detalle sakura
      r(8, 57, 32, 2, P.negro)
  },
  blazer: {
    nombre: "Blazer",
    dibujo: () =>
      r(9, 32, 30, 25, P.gris_dk) +
      r(4, 34, 6, 20, P.gris_dk) +
      r(38, 34, 6, 20, P.gris_dk) +
      r(19, 32, 10, 22, P.crema) +      // camisa abajo
      r(14, 32, 5, 20, "#433D4E") +     // solapas
      r(29, 32, 5, 20, "#433D4E") +
      r(23, 36, 2, 8, P.amber) +        // corbata fina? no: botón
      r(9, 54, 30, 3, "#433D4E")
  },
  varsity: {
    nombre: "Campera varsity",
    dibujo: () =>
      r(9, 32, 30, 25, P.sakura) +
      r(4, 34, 6, 20, P.crema) +        // mangas crema clásicas
      r(38, 34, 6, 20, P.crema) +
      r(17, 31, 14, 3, P.negro) +
      r(22, 34, 3, 21, P.negro) +
      r(9, 54, 30, 3, P.negro) +
      r(4, 51, 6, 3, P.negro) +
      r(38, 51, 6, 3, P.negro) +
      r(12, 38, 5, 6, P.crema)          // letra del equipo
  }
};

export const PANTALONES = {
  jogging: {
    nombre: "Jogging",
    dibujo: () =>
      r(16, 57, 7, 20, P.jogging) +     // piernas flacas
      r(25, 57, 7, 20, P.jogging) +
      r(16, 57, 16, 2, P.jogging_dk) +
      r(16, 73, 7, 3, P.jogging_dk) +   // puños del jogging
      r(25, 73, 7, 3, P.jogging_dk)
  },
  jean: {
    nombre: "Jean",
    dibujo: () =>
      r(16, 57, 7, 20, P.denim) +
      r(25, 57, 7, 20, P.denim) +
      r(16, 57, 16, 3, P.denim_dk) +
      r(17, 62, 1, 8, P.denim_dk) +
      r(30, 62, 1, 8, P.denim_dk)
  },
  cargo: {
    nombre: "Cargo",
    dibujo: () =>
      r(16, 57, 7, 20, P.cargo) +
      r(25, 57, 7, 20, P.cargo) +
      r(16, 57, 16, 2, P.cargo_dk) +
      r(16, 64, 3, 5, P.cargo_dk) +     // bolsillos laterales
      r(29, 64, 3, 5, P.cargo_dk)
  }
};


/* ===================== ACCESORIOS (se ganan) =====================
   Capa que se dibuja ÚLTIMA, por encima de todo. Un solo
   accesorio a la vez: en pixel art, dos accesorios juntos
   se pisan y ninguno se lee. */
export const ACCESORIOS = {
  ninguno: {
    nombre: "Ninguno",
    dibujo: () => ""
  },
  auriculares: {
    nombre: "Auriculares",
    dibujo: () =>
      r(12, 5, 24, 2, P.gris_dk) +      // vincha sobre el pelo
      r(11, 15, 4, 8, P.negro) +        // almohadillas
      r(33, 15, 4, 8, P.negro) +
      r(11, 17, 1, 4, P.amber) +        // detalle ámbar
      r(36, 17, 1, 4, P.amber)
  },
  munequera: {
    nombre: "Muñequera",
    dibujo: () =>
      r(38, 51, 7, 3, P.matcha) +
      r(38, 51, 7, 1, "#6BAF85")
  },
  mochila: {
    nombre: "Mochila",
    dibujo: () =>
      r(13, 33, 3, 12, P.cargo_dk) +    // correas al pecho
      r(32, 33, 3, 12, P.cargo_dk) +
      r(13, 38, 3, 2, P.amber) +        // hebillas
      r(32, 38, 3, 2, P.amber) +
      r(6, 33, 3, 3, P.cargo) +         // la mochila asoma a los costados
      r(39, 33, 3, 3, P.cargo)
  },
  rinonera: {
    nombre: "Riñonera",
    dibujo: () =>
      r(13, 34, 3, 2, P.negro) + r(16, 36, 3, 2, P.negro) +
      r(19, 38, 3, 2, P.negro) + r(22, 40, 3, 2, P.negro) +
      r(25, 42, 3, 2, P.negro) + r(28, 44, 3, 2, P.negro) +
      r(28, 46, 9, 6, P.amber) +        // el bolsito
      r(28, 46, 9, 2, "#C97F3D")
  },
  reloj: {
    nombre: "Reloj",
    dibujo: () =>
      r(3, 53, 7, 3, P.negro) +
      r(5, 53, 3, 3, P.oro)
  },
  anteojos: {
    nombre: "Anteojos",
    dibujo: () =>
      r(15, 16, 9, 1, P.negro_lt) + r(24, 16, 9, 1, P.negro_lt) +
      r(15, 17, 1, 6, P.negro_lt) + r(23, 17, 1, 6, P.negro_lt) +
      r(24, 17, 1, 6, P.negro_lt) + r(32, 17, 1, 6, P.negro_lt) +
      r(15, 23, 9, 1, P.negro_lt) + r(24, 23, 9, 1, P.negro_lt) +
      r(23, 19, 2, 1, P.negro_lt)       // puente
  }
};


/* ------------------------------------------------------------
   ¿Está desbloqueada esta prenda?
   ------------------------------------------------------------ */
