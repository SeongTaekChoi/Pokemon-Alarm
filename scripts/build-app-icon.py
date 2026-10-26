# Draws the app icon (a Poké Ball alarm clock) as icon.svg plus the adaptive icon vector drawables.
# Usage: python3 scripts/build-app-icon.py <out-dir>, then copy the two XML files to res/drawable.
import math, sys, os
out = sys.argv[1]
def f(v): return f"{v:.2f}".rstrip('0').rstrip('.')
def circle(cx, cy, r):
    return f"M{f(cx-r)},{f(cy)} A{f(r)},{f(r)} 0 1,1 {f(cx+r)},{f(cy)} A{f(r)},{f(r)} 0 1,1 {f(cx-r)},{f(cy)} Z"
def rot(pts, cx, cy, deg):
    a = math.radians(deg)
    return [(cx + x*math.cos(a) - y*math.sin(a), cy + x*math.sin(a) + y*math.cos(a)) for x, y in pts]
def bell(cx, cy, deg, r=7.5):
    (l, rr, b1, b2) = rot([(-r, 0), (r, 0), (-r-1.5, 1.2), (r+1.5, 1.2)], cx, cy, deg)
    dome = f"M{f(l[0])},{f(l[1])} A{f(r)},{f(r)} 0 0,1 {f(rr[0])},{f(rr[1])} Z"
    (k,) = rot([(0, -r-1.6)], cx, cy, deg)
    return dome, f"M{f(b1[0])},{f(b1[1])} L{f(b2[0])},{f(b2[1])}", circle(k[0], k[1], 2)

CX, CY, R = 54, 56, 23
RED, WHITE, BLACK, GOLD = '#E3350D', '#FFFFFF', '#222831', '#F8C93C'
fills = []   # (path, fill)
strokes = [] # (path, color, width)
bg = [("M0,0 L108,0 L108,108 L0,108 Z", '#8FD3F4'), ("M0,82 Q54,66 108,82 L108,108 L0,108 Z", '#7BC96F')]
for cx, cy, d in [(36, 36, -38), (72, 36, 38)]:
    dome, base, knob = bell(cx, cy, d)
    fills += [(dome, GOLD), (knob, GOLD)]
    strokes += [(dome, BLACK, 2.2), (base, BLACK, 2.6)]
strokes += [(f"M{CX-12},{CY+18} L{CX-17},{CY+26}", BLACK, 3.6), (f"M{CX+12},{CY+18} L{CX+17},{CY+26}", BLACK, 3.6)]
top = f"M{CX-R},{CY} A{R},{R} 0 0,1 {CX+R},{CY} Z"
bottom = f"M{CX-R},{CY} A{R},{R} 0 0,0 {CX+R},{CY} Z"
fills += [(top, RED), (bottom, WHITE), (f"M{CX-R},{CY-2.2} L{CX+R},{CY-2.2} L{CX+R},{CY+2.2} L{CX-R},{CY+2.2} Z", BLACK)]
# highlight on the red half
fills += [(f"M{CX-15},{CY-10} A16,16 0 0,1 {CX-4},{CY-19} A2,2 0 0,1 {CX-4},{CY-15.5} A12,12 0 0,0 {CX-12},{CY-8.5} A2,2 0 0,1 {CX-15},{CY-10} Z", '#FF8A6B')]
strokes += [(circle(CX, CY, R), BLACK, 3)]
fills += [(circle(CX, CY, 9), WHITE)]
strokes += [(circle(CX, CY, 9), BLACK, 3), (f"M{CX},{CY} L{CX},{CY-5.5}", BLACK, 1.8), (f"M{CX},{CY} L{CX+4},{CY+1.5}", BLACK, 1.8)]

def svg(layers):
    body = ''.join(f'<path d="{p}" fill="{c}"/>' for p, c in layers[0]) + \
        ''.join(f'<path d="{p}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>' for p, c, w in layers[1])
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">{body}</svg>'
# Interleave: bells/legs under ball. Keep drawing order: fills of bells, bell strokes, legs, ball...
order = []
order += [('f',) + fills[0], ('f',) + fills[1], ('s',) + strokes[0], ('s',) + strokes[1]]
order += [('f',) + fills[2], ('f',) + fills[3], ('s',) + strokes[2], ('s',) + strokes[3]]
order += [('s',) + strokes[4], ('s',) + strokes[5]]
order += [('f',) + x for x in fills[4:8]] + [('s',) + strokes[6], ('f',) + fills[8]] + [('s',) + x for x in strokes[7:]]
def svg_items(items):
    s = ''
    for it in items:
        if it[0] == 'f':
            s += f'<path d="{it[1]}" fill="{it[2]}"/>'
        else:
            s += f'<path d="{it[1]}" fill="none" stroke="{it[2]}" stroke-width="{it[3]}" stroke-linecap="round" stroke-linejoin="round"/>'
    return s
def vec_items(items):
    s = ''
    for it in items:
        if it[0] == 'f':
            s += f'\n  <path android:fillColor="{it[2]}" android:pathData="{it[1]}" />'
        else:
            s += f'\n  <path android:strokeColor="{it[2]}" android:strokeWidth="{it[3]}" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="{it[1]}" />'
    return s
bgi = [('f', p, c) for p, c in bg]
open(f'{out}/icon.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="432" height="432"><defs><clipPath id="c"><circle cx="54" cy="54" r="48"/></clipPath></defs><g clip-path="url(#c)">{svg_items(bgi)}<g transform="translate(54 54) scale(1.25) translate(-54 -54)">{svg_items(order)}</g></g></svg>')
head = '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n  android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">'
open(f'{out}/ic_launcher_foreground.xml', 'w').write(head + vec_items(order) + '\n</vector>\n')
open(f'{out}/ic_launcher_background.xml', 'w').write(head + vec_items(bgi) + '\n</vector>\n')
