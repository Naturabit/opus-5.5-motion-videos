"""Fit the bottle profile to the packshot assets/products/cardo-es.png.

The packshot is a perspective view, so its pixel ratios can't be read off directly.
Stage A solves the packshot camera from the label alone: the four gold-band edges and the
straight label sides, whose real sizes are known (64 mm body, 201.06 x 70.98 mm label).
Stage B keeps that camera and fits the profile (profile_model.PARAM_NAMES) by comparing the
silhouette row by row, with the overall height fixed at 112 mm.

A free vertical scale (y_stretch) absorbs any stretching of the packshot image itself; it is
reported, not hidden.

Writes profile.json and fit-overlay.png next to this file.
Run: python fit_profile.py <repo root>
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.optimize import least_squares
from scipy.spatial import cKDTree

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import profile_model as pm  # noqa: E402

REPO = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parents[2]
PACKSHOT = REPO / "assets/products/cardo-es.png"
PX_H = pm.LABEL_H / pm.LABEL_PX[1]          # mm per artwork pixel, vertically
BAND_Z = {                                   # heights above the label's bottom edge
    "label_bot": 0.0,
    "gold_bot_in": pm.GOLD_BOT_PX * PX_H,
    "gold_top_in": pm.LABEL_H - pm.GOLD_TOP_PX * PX_H,
    "label_top": pm.LABEL_H,
}

# ---------------------------------------------------------------- camera
CAM = ["cam_h", "cam_dist", "pitch_deg", "focal_px", "cx", "cy", "y_stretch"]
CAM_X0 = [75.0, 550.0, 0.0, 4200.0, 268.0, 620.0, 1.05]
CAM_LO = [0.0, 150.0, -30.0, 500.0, 200.0, 300.0, 0.8]
CAM_HI = [250.0, 5000.0, 30.0, 60000.0, 336.0, 900.0, 1.4]


def cam_frame(c):
    """Camera in label coordinates: z = 0 at the label's bottom edge."""
    C = np.array([0.0, -c["cam_dist"], c["cam_h"]])
    p = math.radians(c["pitch_deg"])
    f = np.array([0.0, math.cos(p), math.sin(p)])
    right = np.array([1.0, 0.0, 0.0])
    up = np.cross(right, f)
    return C, f, right, up


def project(P, c):
    C, f, right, up = cam_frame(c)
    D = P - C
    depth = D @ f
    X = c["cx"] + c["focal_px"] * (D @ right) / depth
    Y = c["cy"] - c["y_stretch"] * c["focal_px"] * (D @ up) / depth
    return X, Y


def ring(z, r, c, th):
    P = np.stack([r * np.cos(th), r * np.sin(th), np.full_like(th, z)], -1)
    return project(P, c)


# ---------------------------------------------------------------- observations
def load():
    im = np.asarray(Image.open(PACKSHOT).convert("RGBA")).astype(float)
    return im


def silhouette_rows(a):
    """Subpixel left/right alpha edge per row (nan where the row is empty)."""
    h, w = a.shape
    L = np.full(h, np.nan)
    R = np.full(h, np.nan)
    for y in range(h):
        row = a[y]
        idx = np.where(row > 127.5)[0]
        if len(idx) == 0:
            continue
        i = idx[0]
        L[y] = i - (row[i] - 127.5) / max(row[i] - row[i - 1], 1e-6) + 0.5 if i > 0 else i
        j = idx[-1]
        R[y] = j + (row[j] - 127.5) / max(row[j] - row[j + 1], 1e-6) + 0.5 if j < w - 1 else j + 1
    return L, R


def band_edges(im):
    a = im[..., 3]
    Rr, G, B = im[..., 0], im[..., 1], im[..., 2]
    gold = (Rr > 150) & (G > 112) & (B > 70) & (Rr - B > 40) & (Rr - B < 120) & (a > 200)
    xs = np.where(a[600] > 127)[0]
    xl, xr = xs[0], xs[-1]
    out = {k: [] for k in BAND_Z}
    for x in range(int(xl + 0.08 * (xr - xl)), int(xr - 0.08 * (xr - xl)), 3):
        g = gold[:, x]
        top = np.where(g[300:420])[0] + 300
        bot = np.where(g[840:960])[0] + 840
        # a clean band is one run about 25-35 px tall
        if 20 <= len(top) <= 40 and top[-1] - top[0] < 40:
            out["label_top"].append((x + 0.5, top[0]))
            out["gold_top_in"].append((x + 0.5, top[-1] + 1))
        if 20 <= len(bot) <= 40 and bot[-1] - bot[0] < 40:
            out["gold_bot_in"].append((x + 0.5, bot[0]))
            out["label_bot"].append((x + 0.5, bot[-1] + 1))
    return {k: np.array(v) for k, v in out.items()}


# ---------------------------------------------------------------- stage A
def stage_a(bands, L, R):
    rows = np.arange(360, 860)   # straight label sides
    th = np.linspace(-math.pi, 0.0, 1441)

    def res(x):
        c = dict(zip(CAM, x))
        out = []
        for k, obs in bands.items():
            X, Y = ring(BAND_Z[k], pm.LABEL_R, c, th)
            o = np.argsort(X)
            out.append(np.interp(obs[:, 0], X[o], Y[o]) - obs[:, 1])
        # cylinder sides: tangent points of the label cylinder seen from the camera
        zz = np.linspace(-5, pm.LABEL_H + 5, 400)
        for sign, obs in ((-1, L), (1, R)):
            thc = math.asin(-pm.LABEL_R / c["cam_dist"])
            thc = thc if sign > 0 else math.pi - thc
            P = np.stack([np.full_like(zz, pm.LABEL_R * math.cos(thc)),
                          np.full_like(zz, pm.LABEL_R * math.sin(thc)), zz], -1)
            X, Y = project(P, c)
            o = np.argsort(Y)
            out.append(np.interp(rows, Y[o], X[o]) - obs[rows])
        return np.concatenate(out)

    fit = least_squares(res, CAM_X0, bounds=(CAM_LO, CAM_HI), loss="soft_l1", f_scale=1.5,
                        x_scale=[10, 100, 1, 500, 1, 10, 0.01], max_nfev=5000)
    r = res(fit.x)
    return dict(zip(CAM, fit.x)), r, fit


# ---------------------------------------------------------------- stage B
# Free shape parameters. Heights are stacked from the base so their order can't break;
# the overall height is left free here and reconciled with the client's 112 mm afterwards.
# Starting values come from the measured side curve (measured-side-profile.csv).
SHAPE = ["label_z0", "heel_r", "heel_h", "gap_above_label", "shoulder_h", "neck_r", "shoulder_p",
         "neck_h", "cap_h", "cap_band_r", "cap_band_h", "cap_rib_r", "cap_rim_r", "cap_rim_h",
         "cap_top_fillet"]
SHAPE_X0 = [10.5, 8.0, 10.0, 0.2, 8.5, 23.4, 2.0, 2.0, 25.5, 25.35, 2.9, 24.67, 25.4, 3.0, 1.0]
SHAPE_LO = [2.0, 0.5, 0.5, 0.0, 3.0, 20.0, 1.1, 0.3, 15.0, 23.0, 0.5, 23.0, 23.0, 0.5, 0.2]
SHAPE_HI = [20.0, 16.0, 20.0, 4.0, 16.0, 26.0, 5.0, 5.0, 32.0, 28.0, 6.0, 28.0, 28.0, 7.0, 3.0]
VERTICAL = ["label_z0", "heel_h", "gap_above_label", "shoulder_h", "neck_h", "cap_h", "cap_band_h",
            "cap_rim_h"]


def profile_from(s):
    """Shape parameters -> profile_model parameters (overall height = sum of the stack)."""
    label_top = s["label_z0"] + pm.LABEL_H
    shoulder_z0 = label_top + s["gap_above_label"]
    shoulder_z1 = shoulder_z0 + s["shoulder_h"]
    cap_z0 = shoulder_z1 + s["neck_h"]
    return {
        "heel_r": s["heel_r"], "heel_h": min(s["heel_h"], s["label_z0"]), "label_z0": s["label_z0"],
        "shoulder_z0": shoulder_z0, "shoulder_z1": shoulder_z1, "neck_r": s["neck_r"],
        "shoulder_p": s["shoulder_p"], "cap_z0": cap_z0, "cap_band_r": s["cap_band_r"],
        "cap_band_h": s["cap_band_h"], "cap_rib_r": s["cap_rib_r"], "cap_rim_r": s["cap_rim_r"],
        "cap_rim_h": s["cap_rim_h"], "cap_top_fillet": s["cap_top_fillet"],
        "overall_h": cap_z0 + s["cap_h"],
    }


def resample(pts, step):
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.arange(0, s[-1] + step * 0.5, step)
    return np.stack([np.interp(t, s, pts[:, 0]), np.interp(t, s, pts[:, 1])], -1)


def _crossings(a0, a1, b0, b1, n):
    """Segments (a, b) crossing the pixel centres a = k + 0.5: returns (k, b at the crossing)."""
    cen = np.floor(np.maximum(a0, a1) - 0.5) + 0.5
    hit = ((a0 - cen) * (a1 - cen) <= 0) & (cen >= 0.5) & (cen < n) & (np.abs(a1 - a0) > 1e-9)
    t = (cen[hit] - a0[hit]) / (a1[hit] - a0[hit])
    return (cen[hit] - 0.5).astype(int), b0[hit] + t * (b1[hit] - b0[hit])


def model_extents(prof, c, shape, nth=1440):
    """Row (left/right) and column (top/bottom) extents of the projected solid, computed as
    the union of the discs that make up a solid of revolution."""
    h, w = shape
    pr = resample(pm.outer_profile(prof), 0.1)
    pr = pr[pr[:, 0] > 0.05]
    th = np.linspace(-math.pi, math.pi, nth + 1)
    r = pr[:, 0:1]
    z = pr[:, 1:2] - prof["label_z0"]            # label coordinates
    P = np.stack([r * np.cos(th), r * np.sin(th), np.broadcast_to(z, (len(pr), nth + 1))], -1)
    X, Y = project(P.reshape(-1, 3), c)
    X = X.reshape(len(pr), -1)
    Y = Y.reshape(len(pr), -1)
    x0, x1, y0, y1 = X[:, :-1].ravel(), X[:, 1:].ravel(), Y[:, :-1].ravel(), Y[:, 1:].ravel()
    out = []
    for a0, a1, b0, b1, n in ((y0, y1, x0, x1, h), (x0, x1, y0, y1, w)):
        k, b = _crossings(a0, a1, b0, b1, n)
        lo = np.full(n, np.inf)
        hi = np.full(n, -np.inf)
        np.minimum.at(lo, k, b)
        np.maximum.at(hi, k, b)
        out += [lo, hi]
    return out   # left, right (per row), top, bottom (per column)


def invert_sides(c, L, R, rows):
    """Measured profile: each side-edge row -> (r, z) of the ring whose tangent point makes it.
    z is in label coordinates. Two passes so the wall slope enters the tangent condition."""
    Dh, Ch = c["cam_dist"], c["cam_h"]
    out = []
    slope = None
    for _ in range(2):
        pts = []
        for y in rows:
            for side, X in ((1, R[y]), (-1, L[y])):
                if not np.isfinite(X):
                    continue

                def f(v):
                    r, z = v
                    rp = np.interp(z, slope[:, 1], slope[:, 0]) if slope is not None else 0.0
                    sn = np.clip(((z - Ch) * rp - r) / Dh, -1, 1)
                    th = math.asin(sn) if side > 0 else math.pi - math.asin(sn)
                    Xp, Yp = project(np.array([[r * math.cos(th), r * math.sin(th), z]]), c)
                    return [Xp[0] - X, Yp[0] - (y + 0.5)]

                z0 = (c["cy"] - (y + 0.5)) / (c["y_stretch"] * c["focal_px"] / c["cam_dist"]) + 35.0
                sol = least_squares(f, [25.0, z0], bounds=([0.0, -60.0], [40.0, 160.0]))
                if np.max(np.abs(sol.fun)) < 0.05:
                    pts.append((sol.x[0], sol.x[1], side, y))
        pts = np.array(pts)
        # dr/dz of the measured curve (averaged sides) for the second pass
        o = np.argsort(pts[:, 1])
        zz = pts[o, 1]
        rr = pts[o, 0]
        grid = np.linspace(zz.min(), zz.max(), 400)
        rg = np.interp(grid, zz, rr)
        k = 9
        rg = np.convolve(np.pad(rg, k // 2, mode="edge"), np.ones(k) / k, mode="valid")
        slope = np.stack([np.gradient(rg, grid), grid], -1)
        out = pts
    return out


def profile_polyline(prof):
    return resample(pm.outer_profile(prof), 0.05)


def stage_b(c, obs):
    """Fit the parametric profile to the measured side curve, then place the cap top and the
    base with the near-flat middle columns of the silhouette."""
    L, R, T, B = obs["L"], obs["R"], obs["T"], obs["B"]
    h, w = obs["shape"]
    valid = np.where(np.isfinite(L) & np.isfinite(R))[0]
    # the side contour stops being a side near the very top and bottom (front/back arcs take over)
    rows = np.arange(valid.min() + 22, valid.max() - 22)
    side = invert_sides(c, L, R, rows)
    xs = np.where(np.isfinite(T))[0]
    mid = xs[np.abs(xs + 0.5 - c["cx"]) < 0.35 * (xs.max() - xs.min())]
    ppm = c["focal_px"] / c["cam_dist"]

    def res(x):
        sd = dict(zip(SHAPE, x))
        prof = profile_from(sd)
        poly = profile_polyline(prof)
        poly[:, 1] -= prof["label_z0"]                        # label coordinates
        d, _ = cKDTree(poly).query(side[:, :2])
        _, _, mT, mB = model_extents(prof, c, (h, w), nth=720)
        rt = np.nan_to_num(mT[mid] - T[mid], nan=10.0, posinf=10.0, neginf=10.0)
        rbm = np.nan_to_num(mB[mid] - B[mid], nan=10.0, posinf=10.0, neginf=10.0)
        return np.concatenate([d * ppm, rt, rbm])

    fit = least_squares(res, SHAPE_X0, bounds=(SHAPE_LO, SHAPE_HI), loss="soft_l1", f_scale=1.0,
                        diff_step=1e-3, x_scale=0.5, max_nfev=3000)
    return dict(zip(SHAPE, fit.x)), side, fit


def reconcile(s):
    """Scale the vertical sizes outside the label so the stack totals the client's 112 mm.
    Radii and the label (fixed by the artwork) are left alone."""
    total = sum(s[k] for k in ("label_z0", "gap_above_label", "shoulder_h", "neck_h", "cap_h")) + pm.LABEL_H
    k = (pm.OVERALL_H - pm.LABEL_H) / (total - pm.LABEL_H)
    t = dict(s)
    for key in VERTICAL:
        t[key] = s[key] * k
    return t, k, total


# ---------------------------------------------------------------- output
def overlay(prof, c, bands, path):
    im = Image.open(PACKSHOT).convert("RGBA")
    S = 3
    bg = Image.new("RGBA", im.size, (235, 235, 235, 255))
    bg.alpha_composite(im)
    bg = bg.resize((im.width * S, im.height * S), Image.LANCZOS)
    dr = ImageDraw.Draw(bg)
    mL, mR, mT, mB = model_extents(prof, c, (im.height, im.width))
    for y in range(im.height):
        for x in (mL[y], mR[y]):
            if np.isfinite(x):
                dr.ellipse((x * S - 2, (y + 0.5) * S - 2, x * S + 2, (y + 0.5) * S + 2), fill=(255, 0, 255, 255))
    for x in range(im.width):
        for y in (mT[x], mB[x]):
            if np.isfinite(y):
                dr.ellipse(((x + 0.5) * S - 2, y * S - 2, (x + 0.5) * S + 2, y * S + 2), fill=(255, 0, 255, 255))
    th = np.linspace(-math.pi, 0.0, 721)
    for k, obs in bands.items():
        X, Y = ring(BAND_Z[k], pm.LABEL_R, c, th)
        dr.line(list(zip(X * S, Y * S)), fill=(0, 200, 0, 255), width=2)
        for x, y in obs:
            dr.ellipse((x * S - 2, y * S - 2, x * S + 2, y * S + 2), fill=(255, 190, 0, 255))
    bg.convert("RGB").save(path)


def stats(v):
    v = np.abs(v)
    return {"median_px": round(float(np.median(v)), 2), "p95_px": round(float(np.percentile(v, 95)), 2),
            "max_px": round(float(v.max()), 2)}


def edge_points(L, R, T, B):
    rows = np.arange(len(L)) + 0.5
    cols = np.arange(len(T)) + 0.5
    pts = [np.stack([L, rows], -1), np.stack([R, rows], -1), np.stack([cols, T], -1), np.stack([cols, B], -1)]
    pts = np.concatenate(pts)
    return pts[np.isfinite(pts).all(1)]


def outline_distance(prof, c, obs):
    """Perpendicular distance (px) from every packshot edge point to the model outline."""
    m = model_extents(prof, c, obs["shape"])
    mp = edge_points(*m)
    op = edge_points(obs["L"], obs["R"], obs["T"], obs["B"])
    d, _ = cKDTree(mp).query(op)
    return d


def column_edges(a):
    h, w = a.shape
    T = np.full(w, np.nan)
    B = np.full(w, np.nan)
    for x in range(w):
        col = a[:, x]
        idx = np.where(col > 127.5)[0]
        if len(idx) == 0:
            continue
        i, j = idx[0], idx[-1]
        T[x] = i - (col[i] - 127.5) / max(col[i] - col[i - 1], 1e-6) + 0.5 if i > 0 else i
        B[x] = j + (col[j] - 127.5) / max(col[j] - col[j + 1], 1e-6) + 0.5 if j < h - 1 else j + 1
    return T, B


def main():
    im = load()
    a = im[..., 3]
    L, R = silhouette_rows(a)
    T, B = column_edges(a)
    bands = band_edges(im)
    c, ra, fa = stage_a(bands, L, R)
    obs = {"L": L, "R": R, "T": T, "B": B, "shape": a.shape}
    s_fit, side, fb = stage_b(c, obs)
    np.savetxt(HERE / "measured-side-profile.csv", side[:, :2], fmt="%.3f", delimiter=",",
               header="r_mm,z_mm_above_label_bottom (packshot side edges, inverted through the fitted camera)")
    rb = outline_distance(profile_from(s_fit), c, obs)
    s_final, k, h_packshot = reconcile(s_fit)
    prof = profile_from(s_final)
    out = {
        "units": "mm",
        "fixed": {"body_d_over_label": pm.BODY_D, "overall_h": pm.OVERALL_H,
                  "label_len": round(pm.LABEL_LEN, 3), "label_h": round(pm.LABEL_H, 3),
                  "label_t": pm.LABEL_T, "label_front_u": pm.LABEL_FRONT_U},
        "profile": {k2: round(v, 3) for k2, v in prof.items()},
        "packshot_fit_before_reconcile": {k2: round(v, 3) for k2, v in s_fit.items()},
        "reconcile": {"packshot_implied_overall_h": round(h_packshot, 2),
                      "vertical_scale_outside_label": round(k, 4),
                      "note": "sizes above/below the label scaled so the stack is the client's 112 mm"},
        "packshot_camera": {**{k2: round(v, 4) for k2, v in c.items()},
                            "note": "cam_h is measured from the label's bottom edge; y_stretch = vertical stretch of the packshot image"},
        "fit": {"stage_a_label_bands_and_sides": stats(ra),
                "stage_b_outline_distance": stats(rb),
                "px_per_mm_at_axis": round(c["focal_px"] / c["cam_dist"], 3)},
        "optimizer": {"stage_a": fa.message, "stage_b": fb.message, "nfev": [int(fa.nfev), int(fb.nfev)]},
    }
    (HERE / "profile.json").write_text(json.dumps(out, indent=2) + "\n")
    overlay(profile_from(s_fit), c, bands, HERE / "fit-overlay.png")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
