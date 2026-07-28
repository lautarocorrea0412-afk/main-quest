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

W, H = 240, 160
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

# ============ CIELO (fondo, capa que no se mueve) ============
g_open("intro-cielo")
r(0, 0, W, 60, CIELO_ALTO)
r(0, 40, W, 30, CIELO_MEDIO)
r(0, 62, W, 22, CIELO_BAJO)
g_close()

# El sol/luna en su PROPIA capa, arriba del cielo entero, para
# que ninguna banda lo corte. Alto en el cielo, no sobre el valle.
g_open("intro-sol")
circle(178, 40, 15, SOL_HALO, ' opacity="0.5"')
circle(178, 40, 10, SOL, ' id="intro-astro"')
g_close()

# ============ MONTAÑAS LEJANAS (parallax lento) ============
g_open("intro-montes")
poly([(0,84),(38,58),(76,84)], MONTE_LEJOS)
poly([(52,84),(96,54),(140,84)], MONTE_LEJOS)
poly([(120,84),(168,60),(216,84)], MONTE_CERCA)
poly([(190,84),(228,62),(240,80),(240,84)], MONTE_CERCA)
r(0, 82, W, 6, MONTE_CERCA)  # base de las montañas
g_close()

# ============ LAGO (con brillo que va a destellar) ============
g_open("intro-lago")
# El lago ocupa el valle, entre las montañas y la colina media.
ellipse(120, 104, 92, 16, LAGO)
# Reflejo del sol sobre el agua: una franja clara vertical.
r(170, 92, 6, 22, LAGO_BRILLO, ' opacity="0.5" id="intro-reflejo"')
# Destellos: tres rayitas que el CSS hará titilar.
r(96, 100, 10, 2, LAGO_BRILLO, ' opacity="0.6" class="intro-destello" style="--d:0"')
r(130, 106, 14, 2, LAGO_BRILLO, ' opacity="0.5" class="intro-destello" style="--d:1"')
r(112, 110, 8, 2, LAGO_BRILLO, ' opacity="0.55" class="intro-destello" style="--d:2"')
g_close()

# ============ COLINAS (tres planos para profundidad) ============
g_open("intro-colina-fondo")
poly([(0,96),(60,88),(140,98),(240,90),(240,116),(0,116)], COLINA_1)
g_close()

g_open("intro-colina-media")
poly([(0,110),(80,102),(180,112),(240,106),(240,132),(0,132)], COLINA_2)
g_close()

# ============ SAKURA (a la izquierda, primer plano) ============
# El tronco sube desde fuera del cuadro; la copa se cierne sobre
# el avatar. Copa hecha de racimos redondos, pixel-cozy.
g_open("intro-sakura")
# Tronco
r(30, 70, 8, 74, TRONCO)
r(30, 70, 3, 74, TRONCO_SH)
# Ramas
poly([(34,92),(18,78),(22,80),(36,96)], TRONCO)
poly([(36,86),(54,70),(50,74),(38,90)], TRONCO)
# Copa: racimos de flores
for (cx, cy, rad) in [(24,64,16),(44,58,18),(62,68,15),(38,72,17),(56,54,13),(20,78,12)]:
    circle(cx, cy, rad, SAKURA_2)
for (cx, cy, rad) in [(30,60,11),(50,60,12),(42,52,10),(58,64,9),(26,72,8)]:
    circle(cx, cy, rad, SAKURA_1)
for (cx, cy, rad) in [(38,58,6),(48,66,5),(32,66,5)]:
    circle(cx, cy, rad, SAKURA_3)
g_close()

# ============ COLINA DEL PRIMER PLANO (donde se sienta) ============
# Es la más grande; sostiene al avatar y al compañero. Se inyectan
# encima en runtime, así que acá va solo el suelo con textura.
g_open("intro-colina-frente")
poly([(0,124),(70,116),(160,126),(240,120),(240,160),(0,160)], COLINA_3)
# Manchones de pasto más claro, para que no sea plano.
for (x, y) in [(20,132),(56,138),(92,130),(128,140),(168,134),(206,142),(40,150),(150,152)]:
    r(x, y, 5, 3, PASTO_DET, ' opacity="0.6"')
# Briznas que se mueven con el viento (el CSS las mece).
for i, (x, y) in enumerate([(48,124),(100,122),(150,126),(198,122)]):
    poly([(x,y),(x+2,y-8),(x+4,y)], PASTO_DET, f' class="intro-brizna" style="--b:{i}"')
g_close()

out.append('</svg>')

svg = "\n".join(out)
with open("assets/intro.svg", "w") as f:
    f.write(svg)

print(f"assets/intro.svg generado ({len(svg)} bytes, {svg.count('<g ')} capas)")
