#!/usr/bin/env python3
"""Genera el SVG del cuarto pixel art de MAIN QUEST.
Cada ítem comprable es un grupo <g id="item-XXX"> que room.js
enciende o apaga según el inventario."""

W, H = 200, 120  # "pixeles" logicos (agrandado en Fase 3 para la progresion)

C = {
    "wall":      "#3E3346",
    "wall_dark": "#332A3A",
    "floor":     "#6B4B3E",
    "floor_dk":  "#5A3E33",
    "sky1":      "#F58EA8",
    "sky2":      "#FFB067",
    "sky3":      "#FFD98E",
    "frame":     "#4A3D52",
    "wood":      "#8A6248",
    "wood_dk":   "#6B4A36",
    "wood_lt":   "#A67C5B",
    "cream":     "#FBF0E4",
    "plum":      "#5E4A6B",
    "sakura":    "#F58EA8",
    "matcha":    "#8FD6A9",
    "amber":     "#FFB067",
    "gold":      "#FFD98E",
    "dark":      "#241E2A",
    "screen":    "#2A3A4A",
    "screen_on": "#7FC4E8",
    "gray":      "#8A8194",
    "gray_dk":   "#5A5364",
    "green":     "#6BA85F",
    "green_dk":  "#4A7D42",
    "red":       "#E05A5A",
    "white":     "#FFFFFF",
}

out = []

def r(x, y, w, h, color, extra=""):
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"{extra}/>')

def g_open(gid):
    out.append(f'<g id="item-{gid}">')

def g_close():
    out.append('</g>')

# ============ BASE: paredes, piso, ventana, cama, escritorio ============
r(0, 0, W, 80, C["wall"])
r(0, 0, W, 6, C["wall_dark"])          # zocalo superior
r(0, 80, W, 40, C["floor"])
r(0, 80, W, 2, C["floor_dk"])          # linea pared/piso
for x in range(0, W, 16):              # tablones
    r(x, 82, 1, 38, C["floor_dk"])

# --- Ventana con cielo de atardecer (el corazon calido del cuarto)
r(22, 8, 38, 36, C["frame"])
r(24, 10, 34, 32, C["sky1"])
r(24, 22, 34, 12, C["sky2"])
r(24, 34, 34, 8, C["sky3"])
r(40, 10, 2, 32, C["frame"])           # cruceta vertical
r(24, 24, 34, 2, C["frame"])           # cruceta horizontal
r(30, 14, 3, 3, C["cream"])            # nubecitas
r(48, 17, 4, 2, C["cream"])

# --- Cama (base del PRD)
r(4, 74, 40, 6, C["wood"])             # respaldo
r(4, 80, 40, 22, C["plum"])            # colchon/manta
r(4, 96, 40, 6, C["wood_dk"])          # pie
r(8, 76, 12, 8, C["cream"])            # almohada
r(4, 102, 4, 4, C["wood_dk"])          # patas
r(40, 102, 4, 4, C["wood_dk"])

# --- Escritorio (base del PRD)
r(90, 58, 64, 5, C["wood_lt"])         # tabla
r(92, 63, 4, 25, C["wood_dk"])         # patas
r(148, 63, 4, 25, C["wood_dk"])

# --- Notebook (base del PRD)
r(98, 46, 20, 12, C["gray_dk"])        # tapa
r(100, 48, 16, 8, C["screen_on"])      # pantalla
r(96, 58, 24, 3, C["gray"])            # teclado

# ============ ITEMS COMPRABLES ============

# El item de arranque (40 monedas): un cojín sobre la cama.
# Chico, visible, y no choca con nada.
g_open("cojin")
r(22, 76, 9, 7, C["sakura"])
r(22, 76, 9, 2, "#D4708A")             # sombra del pliegue
r(25, 79, 3, 2, C["cream"])            # botón del centro
g_close()

g_open("alfombra")
r(40, 96, 56, 20, C["sakura"])
r(44, 100, 48, 12, "#E07A96")
r(52, 104, 32, 4, C["sakura"])
g_close()

g_open("poster")
r(66, 12, 20, 22, C["frame"])
r(68, 14, 16, 18, C["dark"])
r(72, 18, 8, 8, C["sakura"])           # figura abstracta anime
r(70, 27, 12, 2, C["amber"])
r(74, 21, 4, 4, C["cream"])
g_close()

# La planta vive en el rincón delantero izquierdo: ahí no la
# tapa el avatar, que se para sobre la alfombra.
g_open("planta")
r(4, 100, 12, 10, C["wood_dk"])        # maceta
r(6, 97, 8, 3, C["wood"])
r(8, 88, 4, 9, C["green_dk"])          # tallo
r(2, 84, 7, 6, C["green"])             # hojas
r(11, 86, 7, 6, C["green"])
r(6, 79, 7, 6, C["green"])
g_close()

g_open("biblioteca")
r(64, 56, 24, 36, C["wood_dk"])
r(66, 58, 20, 10, C["wall_dark"])      # huecos
r(66, 70, 20, 10, C["wall_dark"])
r(66, 82, 20, 8, C["wall_dark"])
for i, col in enumerate([C["sakura"], C["matcha"], C["gold"], C["amber"]]):
    r(68 + i * 4, 60, 3, 8, col)       # libros
for i, col in enumerate([C["matcha"], C["amber"], C["sakura"]]):
    r(68 + i * 4, 72, 3, 8, col)
g_close()

g_open("tv")
r(66, 38, 20, 16, C["dark"])
r(68, 40, 16, 12, C["screen"])
r(74, 54, 4, 2, C["gray_dk"])
g_close()

g_open("consola")
r(68, 92, 12, 5, C["gray_dk"])
r(70, 93, 8, 2, C["screen_on"])
r(82, 93, 5, 3, C["gray"])             # joystick
g_close()

g_open("estante")
r(96, 30, 38, 4, C["wood"])
r(96, 34, 2, 3, C["wood_dk"])
r(132, 34, 2, 3, C["wood_dk"])
g_close()

g_open("figura")
r(104, 20, 8, 10, C["red"])            # pokebola-ish
r(104, 24, 8, 2, C["white"])
r(106, 22, 4, 4, C["white"])
r(107, 25, 2, 2, C["dark"])
g_close()

g_open("led")
r(90, 42, 64, 2, C["sakura"])
r(90, 44, 64, 1, C["amber"])
g_close()

g_open("noren")
r(20, 4, 42, 8, C["plum"])
r(20, 4, 42, 2, C["wood_dk"])
r(30, 6, 2, 6, C["cream"])
r(40, 6, 2, 6, C["cream"])
r(50, 6, 2, 6, C["cream"])
g_close()

g_open("silla")
r(100, 66, 18, 4, C["dark"])           # asiento
r(100, 70, 3, 14, C["gray_dk"])        # patas
r(115, 70, 3, 14, C["gray_dk"])
r(116, 48, 4, 18, C["dark"])           # respaldo
r(114, 46, 8, 4, C["amber"])           # detalle gamer
r(104, 84, 10, 3, C["gray_dk"])        # base
g_close()

g_open("monitor2")
r(122, 42, 24, 16, C["dark"])
r(124, 44, 20, 12, C["screen_on"])
r(132, 58, 4, 3, C["gray_dk"])
g_close()

g_open("microfono")
r(146, 40, 6, 10, C["gray"])
r(147, 41, 4, 8, C["gray_dk"])
r(148, 50, 2, 8, C["gray"])            # brazo
r(144, 57, 10, 2, C["gray_dk"])        # base
g_close()

g_open("pcgamer")
r(136, 62, 16, 26, C["dark"])
r(138, 64, 12, 10, C["screen"])        # panel lateral
r(139, 66, 10, 2, C["sakura"])         # RGB
r(139, 69, 10, 2, C["amber"])
r(140, 78, 8, 3, C["gray_dk"])
r(141, 83, 6, 2, C["matcha"])
g_close()


# ============ RECOMPENSAS DE PROGRESION (grupos "nivel-") ============
# NO son de la tienda: se encienden por nivel de arbol, nunca
# por compra. La pared y el piso nuevos (x>=160) son su zona.

def n_open(gid):
    out.append(f'<g id="nivel-{gid}">')

# --- Edicion NV5: placa de creador (pared, sobre el escritorio)
n_open("placa-creador")
r(133, 16, 12, 9, C["frame"])
r(135, 18, 8, 5, C["dark"])
r(137, 19, 3, 3, C["amber"])           # "play"
g_close()

# --- Fitness NV5: mancuernas (piso, zona nueva)
n_open("mancuernas")
r(164, 96, 4, 7, C["gray_dk"])
r(174, 96, 4, 7, C["gray_dk"])
r(167, 98, 8, 3, C["gray"])
g_close()

# --- Fitness NV10: barra y discos (piso, zona nueva)
n_open("barra-discos")
r(158, 109, 40, 3, C["gray"])
r(155, 104, 6, 12, C["dark"])
r(195, 104, 6, 12, C["dark"])
r(161, 106, 3, 8, C["gray_dk"])
r(192, 106, 3, 8, C["gray_dk"])
g_close()

# --- Facultad NV5: pila de apuntes (sobre el estante)
n_open("apuntes")
r(116, 24, 12, 2, C["cream"])
r(117, 22, 10, 2, C["sakura"])
r(116, 20, 12, 2, C["cream"])
r(118, 18, 8, 2, C["matcha"])
g_close()

# --- Facultad NV10: diploma (pared nueva)
n_open("diploma")
r(158, 12, 18, 15, C["wood"])
r(160, 14, 14, 11, C["cream"])
r(163, 17, 8, 1, C["gray"])
r(163, 20, 8, 1, C["gray"])
r(169, 22, 3, 3, C["sakura"])          # sello
g_close()

# --- Japones NV5: cuadro con kanji (pared nueva)
n_open("kanji")
r(180, 12, 14, 17, C["dark"])
r(182, 14, 10, 13, C["cream"])
r(186, 16, 2, 4, C["dark"])            # trazos (abstraccion de 夢)
r(184, 18, 6, 2, C["dark"])
r(185, 22, 4, 2, C["dark"])
r(187, 24, 2, 2, C["dark"])
g_close()

# --- Finanzas NV5: alcancia (piso, delante de la cama)
n_open("alcancia")
r(74, 105, 12, 7, C["sakura"])
r(72, 107, 3, 4, C["sakura"])          # trompa
r(76, 103, 3, 2, C["sakura"])          # oreja
r(78, 105, 4, 1, C["dark"])            # ranura
r(75, 112, 2, 2, "#D4708A")            # patas
r(82, 112, 2, 2, "#D4708A")
g_close()

# --- Finanzas NV10: mapa de viajes con chinchetas (pared nueva)
n_open("mapa")
r(156, 32, 28, 18, C["cream"])
r(156, 32, 28, 2, C["wood_dk"])
r(160, 38, 7, 5, C["green"])           # continentes sugeridos
r(170, 36, 6, 4, C["green"])
r(176, 42, 5, 4, C["green"])
r(163, 39, 2, 2, C["red"])             # chincheta: Argentina
r(179, 38, 2, 2, C["red"])             # chincheta: Japon
g_close()

# --- Streaming NV5: camara con tripode (piso, zona nueva)
n_open("camara")
r(164, 62, 12, 8, C["dark"])
r(174, 64, 4, 4, C["gray_dk"])         # lente
r(166, 60, 3, 2, C["red"])             # luz rec
r(168, 70, 4, 22, C["gray_dk"])        # columna
r(162, 90, 6, 3, C["gray_dk"])         # patas
r(172, 90, 6, 3, C["gray_dk"])
g_close()

# --- Streaming NV10: neon ON AIR (pared nueva, arriba)
n_open("neon")
r(158, 2, 38, 8, C["dark"])
r(160, 4, 15, 4, C["sakura"])          # ON
r(178, 4, 15, 4, C["amber"])           # AIR
r(158, 2, 38, 1, C["sakura"])
r(158, 9, 38, 1, C["sakura"])
g_close()

# ============ EFECTOS (grupos "nivel-fx-") ============

# --- Edicion NV10: la estacion se enciende
n_open("fx-monitores")
r(100, 48, 16, 8, "#A8E0FF")           # notebook brillante
r(102, 50, 8, 1, C["cream"])           # timeline sugerida
r(102, 52, 12, 1, C["amber"])
r(124, 44, 20, 12, "#A8E0FF")          # monitor 2 brillante
r(126, 46, 10, 1, C["cream"])
r(126, 49, 16, 1, C["sakura"])
r(126, 52, 13, 1, C["amber"])
g_close()

# --- Japones NV10: la ventana ahora mira a Tokio de noche
n_open("fx-tokio")
r(24, 10, 34, 32, "#2A3550")           # cielo nocturno
r(28, 13, 2, 2, C["cream"])            # estrellas
r(48, 16, 2, 2, C["cream"])
r(38, 12, 1, 1, C["cream"])
r(52, 26, 4, 4, C["gold"])             # luna
r(38, 22, 6, 20, "#E05A5A")            # Torre de Tokio
r(36, 30, 10, 12, "#E05A5A")
r(39, 18, 4, 4, "#E05A5A")
r(40, 14, 2, 4, "#E05A5A")
r(38, 26, 6, 2, C["cream"])            # plataformas iluminadas
r(37, 34, 8, 2, C["cream"])
r(26, 36, 6, 6, "#3A4A66")             # skyline
r(50, 34, 6, 8, "#3A4A66")
r(27, 38, 1, 1, C["gold"])             # ventanitas
r(52, 36, 1, 1, C["gold"])
r(54, 39, 1, 1, C["gold"])
r(40, 10, 2, 32, C["frame"])           # crucetas de la ventana encima
r(24, 24, 34, 2, C["frame"])
g_close()

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
    f'shape-rendering="crispEdges" '
    f'style="display:block;border-radius:14px" '
    f'role="img" aria-label="Tu habitación">\n  '
    + "\n  ".join(out)
    + "\n</svg>\n"
)

with open("assets/cuarto.svg", "w") as f:
    f.write(svg)

# ============ ICONOS DE TIENDA ============
# Se recortan del MISMO dibujo del cuarto: el ícono de la
# tienda no se parece al mueble, ES el mueble. Si mañana se
# rediseña un objeto, su ícono cambia solo.

import re as _re

def _rects_de(gid, texto):
    m = _re.search(rf'<g id="{gid}">(.*?)</g>', texto, _re.S)
    if not m:
        return []
    return _re.findall(
        r'<rect x="(-?\d+)" y="(-?\d+)" width="(\d+)" height="(\d+)" fill="([^"]+)"/>',
        m.group(1))

def generar_iconos(svg_texto):
    entradas = []
    for gid in [g for g in _re.findall(r'<g id="(item-[\w-]+)">', svg_texto)]:
        rects = _rects_de(gid, svg_texto)
        if not rects:
            continue
        xs = [int(r[0]) for r in rects]; ys = [int(r[1]) for r in rects]
        x2 = [int(r[0]) + int(r[2]) for r in rects]
        y2 = [int(r[1]) + int(r[3]) for r in rects]
        x0, y0, x1, y1 = min(xs), min(ys), max(x2), max(y2)
        # Margen de 1px para que no quede pegado al borde
        x0 -= 1; y0 -= 1; x1 += 1; y1 += 1
        ancho, alto = x1 - x0, y1 - y0
        # Lienzo cuadrado: todos los iconos ocupan lo mismo
        lado = max(ancho, alto)
        ox = x0 - (lado - ancho) / 2
        oy = y0 - (lado - alto) / 2
        cuerpo = "".join(
            f'<rect x="{r[0]}" y="{r[1]}" width="{r[2]}" height="{r[3]}" fill="{r[4]}"/>'
            for r in rects)
        icono = (f'<svg viewBox="{ox:g} {oy:g} {lado} {lado}" '
                 f'shape-rendering="crispEdges" class="ico">{cuerpo}</svg>')
        entradas.append(f'  "{gid.replace("item-", "")}": \'{icono}\'')
    return (
        "/* ============================================================\n"
        "   MAIN QUEST - iconos-tienda.js  (GENERADO, no editar a mano)\n"
        "   ------------------------------------------------------------\n"
        "   Lo produce tools/gen_cuarto.py recortando cada mueble del\n"
        "   propio SVG del cuarto. El icono de la tienda no se PARECE\n"
        "   al mueble: es el mueble. Si el objeto se rediseña, su\n"
        "   icono cambia solo.\n"
        "   ============================================================ */\n\n"
        "export const ICONOS_TIENDA = {\n" + ",\n".join(entradas) + "\n};\n")

with open("js/iconos-tienda.js", "w") as f:
    f.write(generar_iconos(svg))

print(f"Iconos de tienda generados desde el propio cuarto")


print(f"SVG generado: {len(svg)} bytes, {len(out)} elementos")
