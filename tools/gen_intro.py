#!/usr/bin/env python3
"""
MAIN QUEST — generador de la escena de la intro "¿Vamos?".

La nueva intro no pasa en el cuarto: pasa en una COLINA al
atardecer, con un valle y un lago abajo, y un sakura a un lado.
Es una escena de aventura, no de descanso.

Se dibuja de atrás hacia adelante, en capas con <g id> para
poder animar cada una por separado desde el CSS (parallax,
viento, destello del agua, pétalos). El avatar y el compañero
NO se dibujan acá: se inyectan en runtime (el avatar ya se
dibuja por código; el compañero-brasa se dibuja en su módulo).

Lienzo 240x160: panorámico, para que haya profundidad y valle.
Los colores NO se clavan acá: se usan tonos neutros y la CAPA
de luz por hora (en el CSS) tiñe la escena según tu momento.

Salida: assets/intro.svg
"""

W, H = 240, 420
out = []

def r(x, y, w, h, c, extra=""):
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"{extra}/>')

def poly(pts, c, extra=""):
    p = " ".join(f"{x},{y}" for x, y in pts)
    out.append(f'<polygon points="{p}" fill="{c}"{extra}/>')

def circle(cx, cy, rad, c, extra=""):
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{rad}" fill="{c}"{extra}/>')

def ellipse(cx, cy, rx, ry, c, extra=""):
    out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{c}"{extra}/>')

def g_open(gid, extra=""):
    out.append(f'<g id="{gid}"{extra}>')

def g_close():
    out.append('</g>')

# ---- Paleta base (tonos que la luz por hora va a teñir) ----
# Cielo en degradé por bandas; montañas lila; colina verde-musgo;
# lago celeste; sakura rosa. Todo apagado, la luz lo levanta.
CIELO_ALTO  = "#3A3350"
CIELO_MEDIO = "#5A4A66"
CIELO_BAJO  = "#8A6A78"
SOL         = "#FFD98E"
SOL_HALO    = "#FFC170"
MONTE_LEJOS = "#4A4460"
MONTE_CERCA = "#574F6E"
LAGO        = "#6E7EA8"
LAGO_BRILLO = "#AEC0E0"
COLINA_1    = "#5E7A55"   # colina del fondo
COLINA_2    = "#4A6444"   # colina media
COLINA_3    = "#3E5539"   # colina del avatar (primer plano)
PASTO_DET   = "#567A4E"
TRONCO      = "#6B4A3A"
TRONCO_SH   = "#553A2E"
SAKURA_1    = "#F58EA8"
SAKURA_2    = "#F5A8BE"
SAKURA_3    = "#E87A98"
PETALO      = "#F8B8CC"

out.append(f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" '
           f'shape-rendering="crispEdges" preserveAspectRatio="xMidYMid slice">')

# ============ CIELO (bandas verticales, ocupa la mitad de arriba) ============
g_open("intro-cielo")
r(0, 0, W, 150, CIELO_ALTO)
r(0, 110, W, 60, CIELO_MEDIO)
r(0, 165, W, 55, CIELO_BAJO)
g_close()

# ============ SOL/LUNA en su capa, alto en el cielo ============
g_open("intro-sol")
circle(180, 96, 22, SOL_HALO, ' opacity="0.5"')
circle(180, 96, 14, SOL, ' id="intro-astro"')
g_close()

# ============ MONTAÑAS LEJANAS ============
g_open("intro-montes")
poly([(0,220),(46,165),(96,220)], MONTE_LEJOS)
poly([(64,220),(120,158),(178,220)], MONTE_LEJOS)
poly([(150,220),(206,168),(240,220)], MONTE_CERCA)
r(0, 216, W, 8, MONTE_CERCA)
g_close()

# ============ LAGO ============
g_open("intro-lago")
ellipse(120, 250, 110, 20, LAGO)
r(172, 232, 7, 30, LAGO_BRILLO, ' opacity="0.5" id="intro-reflejo"')
r(90, 246, 12, 3, LAGO_BRILLO, ' opacity="0.6" class="intro-destello" style="--d:0"')
r(132, 254, 16, 3, LAGO_BRILLO, ' opacity="0.5" class="intro-destello" style="--d:1"')
r(108, 260, 10, 2, LAGO_BRILLO, ' opacity="0.55" class="intro-destello" style="--d:2"')
g_close()

# ============ COLINAS (tres planos) ============
g_open("intro-colina-fondo")
poly([(0,244),(70,232),(160,248),(240,238),(240,300),(0,300)], COLINA_1)
g_close()
g_open("intro-colina-media")
poly([(0,280),(90,268),(180,284),(240,274),(240,340),(0,340)], COLINA_2)
g_close()

# ============ SAKURA (izquierda, copa bien dentro del cuadro) ============
g_open("intro-sakura")
# Tronco desde la colina del frente hacia arriba
r(40, 250, 11, 130, TRONCO)
r(40, 250, 4, 130, TRONCO_SH)
poly([(45,300),(64,380),(54,380),(40,306)], TRONCO)
# Ramas
poly([(45,270),(22,250),(27,253),(47,274)], TRONCO)
poly([(49,258),(74,236),(69,240),(51,262)], TRONCO)
poly([(46,285),(64,270),(60,274),(47,288)], TRONCO)
# Copa: racimos grandes, altos, que se ciernen
for (cx, cy, rad) in [(30,224,26),(60,210,30),(92,226,24),(46,244,26),(78,196,22),(20,250,19),(104,214,18)]:
    circle(cx, cy, rad, SAKURA_2)
for (cx, cy, rad) in [(38,214,18),(66,216,20),(52,198,17),(84,214,15),(26,238,14),(96,224,13)]:
    circle(cx, cy, rad, SAKURA_1)
for (cx, cy, rad) in [(44,208,10),(62,228,9),(34,228,9),(78,204,8)]:
    circle(cx, cy, rad, SAKURA_3)
g_close()

# ============ COLINA DEL FRENTE (donde se sienta el avatar) ============
g_open("intro-colina-frente")
poly([(0,330),(80,318),(170,332),(240,324),(240,420),(0,420)], COLINA_3)
for (x, y) in [(24,346),(64,354),(104,342),(150,356),(190,346),(216,360),(44,378),(160,384)]:
    r(x, y, 6, 3, PASTO_DET, ' opacity="0.6"')
for i, (x, y) in enumerate([(56,332),(112,328),(168,334),(210,328)]):
    poly([(x,y),(x+2,y-10),(x+5,y)], PASTO_DET, f' class="intro-brizna" style="--b:{i}"')
g_close()

out.append('</svg>')

svg = "\n".join(out)
with open("assets/intro.svg", "w") as f:
    f.write(svg)

print(f"assets/intro.svg generado ({len(svg)} bytes, {svg.count('<g ')} capas)")
