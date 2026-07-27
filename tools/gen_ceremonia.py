#!/usr/bin/env python3
"""
MAIN QUEST — generador de la escena de la ceremonia.

En vez de componer la intro con <div> de colores (que se leían
como bloques y rompían la ilusión), dibujamos UNA ilustración
pixel-art en SVG, como el cuarto real de la app, pensada como
escena y no como layout.

Lienzo 200x150 (más alto que el cuarto de la app: la ceremonia
mira más arriba, hacia la ventana y la pared). Se dibuja de
atrás hacia adelante, con cada objeto en su propio <g id> para
poder animarlo por capas desde el CSS.

Salida: assets/ceremonia.svg
"""

W, H = 200, 150
out = []

def r(x, y, w, h, c, extra=""):
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"{extra}/>')

def g_open(gid, extra=""):
    out.append(f'<g id="{gid}"{extra}>')

def g_close():
    out.append('</g>')

# ---- Paleta de la escena (cálida, coherente con Atardecer) ----
C = {
    "pared_alta": "#3A3048",
    "pared_baja": "#2E2638",
    "zocalo":     "#241D2E",
    "piso":       "#43384F",
    "piso_tabla": "#3A3046",
    "ventana_marco": "#1C1526",
    "vidrio_top":  "#FFD98C",
    "vidrio_bot":  "#E88A6A",
    "ciudad":      "#5A4A6E",
    "ciudad_luz":  "#FFE0A0",
    "escritorio":  "#6B4E38",
    "escritorio_sh": "#523C2B",
    "pata":        "#3E2E20",
    "monitor_marco": "#211B2A",
    "monitor_luz": "#7FC4E8",
    "cama_madera": "#5A4030",
    "cama_sabana": "#E8DCC8",
    "cama_manta":  "#C77B8B",
    "almohada":    "#FBF0E4",
    "lampara_base":"#2E2838",
    "lampara_luz": "#FFE9B8",
    "planta_mac":  "#B5654A",
    "planta_hoja": "#7CA85F",
    "planta_hoja2":"#8FD6A9",
    "taza":        "#E8E0D4",
    "taza_sh":     "#C9BDAA",
    "cafe":        "#3A2418",
    "libro_a":     "#8F9ED6",
    "libro_b":     "#D68F9E",
    "libro_c":     "#8FD6A9",
    "switch":      "#2A2E38",
    "switch_a":    "#4A9FE0",
    "switch_b":    "#E05A5A",
    "alfombra":    "#B5556E",
    "alfombra2":   "#9E4560",
    "poster_marco":"#FFD98E",
    "poster_bg":   "#241D32",
    "cuadro":      "#2E3A50",
    "sombra":      "#00000030",
}

svg_header = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
    f'shape-rendering="crispEdges" width="{W}" height="{H}">'
)

# ============ FONDO: pared y piso ============
g_open("esc-pared")
r(0, 0, W, 108, C["pared_alta"])
r(0, 70, W, 38, C["pared_baja"])          # la pared baja un poco más oscura
r(0, 104, W, 4, C["zocalo"])              # zócalo
g_close()

g_open("esc-piso")
r(0, 108, W, 42, C["piso"])
for i in range(0, W, 16):                 # tablones
    r(i, 108, 1, 42, C["piso_tabla"])
r(0, 108, W, 2, C["piso_tabla"])
g_close()

# ============ VENTANA (izquierda, con ciudad al atardecer) ============
g_open("esc-ventana")
r(18, 20, 64, 66, C["ventana_marco"])     # marco
# vidrio con degradé atardecer (dos bloques + banda)
r(21, 23, 58, 30, C["vidrio_top"])
r(21, 53, 58, 30, C["vidrio_bot"])
r(21, 48, 58, 8, "#FFB067")               # banda del horizonte
# skyline de la ciudad
for (bx, bw, bh) in [(24,8,14),(33,6,20),(40,10,11),(52,7,18),(60,9,13),(70,6,16)]:
    r(bx, 83 - bh, bw, bh, C["ciudad"])
# ventanitas encendidas de la ciudad
for (lx, ly) in [(26,74),(35,68),(36,73),(54,70),(62,75),(71,72)]:
    r(lx, ly, 1, 1, C["ciudad_luz"])
# crucetas del marco
r(48, 23, 3, 60, C["ventana_marco"])
r(21, 51, 58, 3, C["ventana_marco"])
# alféizar
r(15, 84, 70, 4, C["escritorio_sh"])
g_close()

# (El título MAIN QUEST ya no vive en la pared como cuadro:
#  se dibuja como texto grande flotante en el CSS, centrado
#  arriba. Antes había un marco acá que se superponía con el
#  texto y se veía mal.)

# ============ CAMA (derecha del todo, en perspectiva) ============
g_open("esc-cama")
r(168, 98, 40, 20, C["cama_madera"])      # base (rincón derecho)
r(168, 94, 40, 6, C["cama_manta"])        # manta
r(168, 90, 18, 8, C["almohada"])          # almohada
r(168, 90, 40, 2, C["cama_sabana"])
r(170, 116, 4, 8, C["pata"])
r(202, 116, 4, 8, C["pata"])
g_close()

# ============ ESCRITORIO (centro-derecha, protagonista) ============
g_open("esc-escritorio")
# tabla
r(96, 86, 68, 6, C["escritorio"])
r(96, 86, 68, 2, "#7E5C42")               # brillo del canto
r(96, 92, 68, 2, C["escritorio_sh"])
# patas
r(100, 92, 4, 24, C["pata"])
r(156, 92, 4, 24, C["pata"])
g_close()

# ---- cosas sobre el escritorio ----
g_open("esc-monitor")
r(112, 60, 34, 24, C["monitor_marco"])    # marco
r(115, 63, 28, 18, "#14101C")             # pantalla apagada (se enciende en CSS)
r(126, 84, 6, 4, C["monitor_marco"])      # pie
r(122, 88, 14, 2, C["monitor_marco"])     # base
g_close()

g_open("esc-taza")
r(102, 78, 8, 7, C["taza"])
r(102, 78, 8, 2, C["taza_sh"])
r(110, 79, 2, 4, C["taza_sh"])            # asa
r(103, 78, 6, 1, C["cafe"])              # café
g_close()

g_open("esc-libros")
r(148, 74, 12, 3, C["libro_a"])
r(149, 71, 11, 3, C["libro_b"])
r(150, 68, 9, 3, C["libro_c"])
r(158, 66, 2, 11, C["libro_a"])          # uno parado
g_close()

g_open("esc-switch")
r(100, 82, 12, 3, C["switch"])
r(100, 82, 3, 3, C["switch_a"])          # joy-con izq
r(109, 82, 3, 3, C["switch_b"])          # joy-con der
g_close()

# ============ LÁMPARA de pie (entre escritorio y cama) ============
g_open("esc-lampara")
r(80, 44, 16, 9, C["lampara_base"])       # pantalla (sobre el escritorio, a la izq)
r(81, 45, 14, 2, C["lampara_luz"])        # borde iluminado (se aviva en CSS)
r(86, 53, 4, 33, C["lampara_base"])       # pie corto (lámpara de escritorio)
r(82, 84, 12, 3, C["lampara_base"])       # base sobre la mesa
g_close()

# ============ PLANTA (rincón, delante de la ventana) ============
g_open("esc-planta")
r(6, 96, 14, 14, C["planta_mac"])         # maceta
r(6, 96, 14, 3, "#C9765A")
r(9, 84, 3, 12, C["planta_hoja"])         # tallo
r(4, 80, 7, 7, C["planta_hoja"])          # hojas
r(11, 78, 7, 7, C["planta_hoja2"])
r(7, 74, 6, 6, C["planta_hoja2"])
g_close()

# ============ ALFOMBRA (piso, adelante) ============
g_open("esc-alfombra")
r(70, 124, 80, 18, C["alfombra"])
r(70, 124, 80, 3, C["alfombra2"])
r(76, 130, 68, 6, C["alfombra2"])
g_close()

# ============ SOMBRAS de contacto (dan peso a los muebles) ============
g_open("esc-sombras")
r(96, 116, 68, 3, C["sombra"])            # escritorio
r(168, 118, 40, 3, C["sombra"])           # cama
r(6, 110, 14, 3, C["sombra"])             # planta
g_close()

svg = svg_header + "".join(out) + "</svg>"
with open("assets/ceremonia.svg", "w") as f:
    f.write(svg)

print(f"Escena generada: {len(svg)} bytes, {out.__len__()} elementos")
