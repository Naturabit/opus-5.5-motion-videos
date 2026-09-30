"""Bottle profile shared by fit_profile.py (numpy) and build_bottle.py (Blender).

Units: millimetres, z up from the bottom of the glass, r = radius from the axis.
Fixed inputs (client): body diameter over the label 64 mm, overall height with cap 112 mm.
Label: 2000 x 706 px artwork wrapped exactly once round the 64 mm body.
"""
import math

BODY_D = 64.0            # mm, over the label (client measurement)
OVERALL_H = 112.0        # mm, glass base to cap top (client measurement)
LABEL_T = 0.1            # mm, label thickness (paper/film, assumed)
LABEL_R = BODY_D / 2     # outer label radius
GLASS_R = LABEL_R - LABEL_T
LABEL_PX = (2000, 706)
LABEL_LEN = math.pi * BODY_D                      # 201.06 mm
LABEL_H = LABEL_LEN * LABEL_PX[1] / LABEL_PX[0]   # 70.98 mm
LABEL_FRONT_U = 977 / 2000   # centre of the logo panel faces the viewer
GOLD_TOP_PX = 33             # gold band heights in the artwork (rows 0-32 and 673-705)
GOLD_BOT_PX = 33

# Order of the free profile parameters (fit_profile.py writes them to profile.json)
PARAM_NAMES = [
    "heel_r",        # heel (rounded base edge): horizontal size of its elliptical fillet
    "heel_h",        # heel: vertical size
    "label_z0",      # height of the label's bottom edge above the base
    "shoulder_z0",   # where the straight body ends
    "shoulder_z1",   # where the shoulder meets the neck
    "neck_r",        # neck outer radius
    "shoulder_p",    # superellipse exponent of the shoulder (2 = ellipse)
    "cap_z0",        # bottom of the cap
    "cap_band_r",    # radius of the smooth bottom band of the cap
    "cap_band_h",    # height of that band
    "cap_rib_r",     # outer radius over the ribs
    "cap_rim_r",     # radius of the smooth top rim
    "cap_rim_h",     # height of the top rim
    "cap_top_fillet",
]


def _arc(cx, cz, rad, a0, a1, n):
    return [(cx + rad * math.cos(a0 + (a1 - a0) * i / n), cz + rad * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def outer_profile(p, n=40):
    """Outer envelope (glass + cap) as a list of (r, z) from the base centre to the cap top centre.
    p: dict of PARAM_NAMES. Label is not included (it sits 0.1 mm proud of the glass)."""
    R = GLASS_R
    a, b = p["heel_r"], p["heel_h"]
    pts = [(0.0, 0.0)]
    pts += [(R - a + a * math.cos(t), b + b * math.sin(t))
            for t in (-math.pi / 2 + (math.pi / 2) * i / n for i in range(n + 1))]
    zs, zn, rn, e = p["shoulder_z0"], p["shoulder_z1"], p["neck_r"], p["shoulder_p"]
    for i in range(1, 4 * n + 1):
        phi = (math.pi / 2) * i / (4 * n)
        c, s = math.cos(phi), math.sin(phi)
        pts.append((rn + (R - rn) * c ** (2 / e), zs + (zn - zs) * s ** (2 / e)))
    zc = p["cap_z0"]
    pts.append((rn, zc))
    # cap: bottom band, ribbed section, top rim, rounded top edge
    eps = 0.15
    pts += [(p["cap_band_r"], zc + eps), (p["cap_band_r"], zc + p["cap_band_h"]),
            (p["cap_rib_r"], zc + p["cap_band_h"] + eps)]
    zt = p.get("overall_h", OVERALL_H)
    ft = p["cap_top_fillet"]
    pts += [(p["cap_rib_r"], zt - p["cap_rim_h"] - eps), (p["cap_rim_r"], zt - p["cap_rim_h"])]
    pts += _arc(p["cap_rim_r"] - ft, zt - ft, ft, 0.0, math.pi / 2, n)[:]
    pts.append((0.0, zt))
    return pts


def label_z_range(p):
    return p["label_z0"], p["label_z0"] + LABEL_H
