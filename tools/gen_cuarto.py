#!/usr/bin/env python3
"""Genera el SVG del cuarto pixel art de MAIN QUEST.
Cada ítem comprable es un grupo <g id="item-XXX"> que room.js
enciende o apaga según el inventario."""

W, H = 160, 120  # "pixeles" logicos

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

g_open("planta")
r(50, 84, 10, 8, C["wood_dk"])         # maceta
r(52, 82, 6, 2, C["wood"])
r(53, 74, 4, 8, C["green_dk"])         # tallo
r(48, 70, 6, 6, C["green"])            # hojas
r(56, 72, 6, 6, C["green"])
r(52, 66, 6, 6, C["green"])
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

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
    f'width="100%" shape-rendering="crispEdges" '
    f'style="display:block;border-radius:14px" '
    f'role="img" aria-label="Tu habitación">\n  '
    + "\n  ".join(out)
    + "\n</svg>\n"
)

with open("assets/cuarto.svg", "w") as f:
    f.write(svg)

print(f"SVG generado: {len(svg)} bytes, {len(out)} elementos")
