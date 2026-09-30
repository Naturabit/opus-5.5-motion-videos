"""Build the Cardo Mariano Estado Puro x80 bottle in Blender and export it.

Reads profile.json (from fit_profile.py) and textures/M90_Label.jpg.
Writes cardo-mariano-x80.blend (source/) and cardo-mariano-x80.glb (package root).

Run with Blender's Python (bpy 4.2):  python build_bottle.py
Scene units are metres (glTF convention); geometry is authored in mm and scaled by 0.001.
Front of the bottle = -Y in Blender (= +Z in the glTF file).
"""
import json
import math
import random
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Matrix

HERE = Path(__file__).resolve().parent
PKG = HERE.parent
sys.path.insert(0, str(HERE))
import profile_model as pm  # noqa: E402

PROFILE = json.loads((HERE / "profile.json").read_text())["profile"]
LABEL_IMG = PKG / "textures" / "M90_Label.jpg"
MM = 0.001

# Assumed (not visible in any reference; see SPEC.md)
GLASS_WALL = 3.0        # body wall thickness
NECK_WALL = 2.4
BASE_THICK = 5.0        # glass floor
CAP_WALL = 1.2
RIB_COUNT = 55          # measured from the packshot (autocorrelation of the rib pattern)
RIB_DEPTH = 0.5         # groove depth
CAPSULE = {"len": 23.3, "body_d": 8.18, "cap_d": 8.53, "cap_len": 11.7}   # size 00 (assumed)
N_CAPSULES = 80         # label: "80 cápsulas vegetales"

# Colours (sRGB 0-255) sampled from the client's images
CAP_SRGB = (232, 230, 223)       # cardo-es.png, lit side of the cap
POWDER_SRGB = (145, 121, 71)     # capsule.png, powder through the clear shell
# Amber glass: transmittance per 3 mm (R, G, B). Tuned against the packshot in render.py checks.
AMBER_T_3MM = (0.90, 0.58, 0.20)


def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lin(rgb):
    return tuple(srgb_to_lin(v) for v in rgb) + (1.0,)


# ------------------------------------------------------------------ geometry helpers
def revolve(strips, nseg, radius_fn=None, phase=0.0):
    """Revolve (r, z) polylines around Z. Each strip is meshed on its own (hard edge between
    strips). radius_fn(strip_index, r, phi) can modulate the radius (cap ribs).
    Profiles must be traversed counter-clockwise in the (r, z) plane for outward normals."""
    verts, faces = [], []
    for si, strip in enumerate(strips):
        rings = []
        for r, z in strip:
            if r < 1e-9:
                rings.append([len(verts)])
                verts.append((0.0, 0.0, z))
                continue
            ring = []
            for i in range(nseg):
                phi = phase + 2 * math.pi * i / nseg
                rr = radius_fn(si, r, phi) if radius_fn else r
                ring.append(len(verts))
                verts.append((rr * math.cos(phi), rr * math.sin(phi), z))
            rings.append(ring)
        for a, b in zip(rings[:-1], rings[1:]):
            if len(a) == 1 and len(b) == 1:
                continue
            for i in range(nseg):
                j = (i + 1) % nseg
                if len(a) == 1:
                    faces.append((a[0], b[j], b[i]))
                elif len(b) == 1:
                    faces.append((a[i], a[j], b[0]))
                else:
                    faces.append((a[i], a[j], b[j], b[i]))
    return verts, faces


def make_object(name, verts, faces, scale=MM, smooth=True, collection=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([(x * scale, y * scale, z * scale) for x, y, z in verts], [], faces)
    me.validate()
    me.update()
    for p in me.polygons:
        p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(ob)
    return ob


def arc(cx, cz, a, b, t0, t1, n):
    return [(cx + a * math.cos(t0 + (t1 - t0) * i / n), cz + b * math.sin(t0 + (t1 - t0) * i / n)) for i in range(n + 1)]


# ------------------------------------------------------------------ profiles (mm)
P = PROFILE
R = pm.GLASS_R
H = P["overall_h"]
RIM_Z = H - CAP_WALL - 1.3          # glass lip, hidden inside the cap
NECK_IN = P["neck_r"] - NECK_WALL
R_IN = R - GLASS_WALL


def shoulder(r0, z0, r1, z1, e, n, reverse=False):
    pts = []
    for i in range(n + 1):
        phi = (math.pi / 2) * i / n
        pts.append((r1 + (r0 - r1) * math.cos(phi) ** (2 / e), z0 + (z1 - z0) * math.sin(phi) ** (2 / e)))
    return pts[::-1] if reverse else pts


def glass_strips():
    a, b = P["heel_r"], P["heel_h"]
    outer = [(0.0, 0.0), (R - a, 0.0)]
    outer += arc(R - a, b, a, b, -math.pi / 2, 0.0, 16)[1:]
    outer += [(R, P["shoulder_z0"])]
    outer += shoulder(R, P["shoulder_z0"], P["neck_r"], P["shoulder_z1"], P["shoulder_p"], 20)[1:]
    outer += [(P["neck_r"], P["cap_z0"]), (P["neck_r"], RIM_Z - 0.8)]
    outer += arc(P["neck_r"] - 0.8, RIM_Z - 0.8, 0.8, 0.8, 0.0, math.pi / 2, 4)[1:]
    rim = [(P["neck_r"] - 0.8, RIM_Z), (NECK_IN + 0.8, RIM_Z)]
    ai, bi = max(a - GLASS_WALL * 0.6, 1.5), max(b - BASE_THICK * 0.6, 1.5)
    inner = arc(NECK_IN + 0.8, RIM_Z - 0.8, 0.8, 0.8, math.pi / 2, math.pi, 4)
    inner += [(NECK_IN, P["shoulder_z1"] + 1.5)]
    inner += shoulder(R_IN, P["shoulder_z0"] - 0.5, NECK_IN, P["shoulder_z1"] + 1.5, P["shoulder_p"], 20, reverse=True)[1:]
    inner += [(R_IN, BASE_THICK + bi)]
    inner += arc(R_IN - ai, BASE_THICK + bi, ai, bi, 0.0, -math.pi / 2, 12)[1:]
    inner += [(0.0, BASE_THICK)]
    return [outer, rim, inner]


def cap_strips():
    zc, zt = P["cap_z0"], H
    rin = P["neck_r"] + 0.2
    zb = zc + P["cap_band_h"]
    zr = zt - P["cap_rim_h"]
    ft = min(P["cap_top_fillet"], P["cap_rim_h"] - 0.1)
    rim_r = P["cap_rim_r"]
    strips = [
        [(rin, zc), (P["cap_band_r"], zc)],                                     # underside
        [(P["cap_band_r"], zc), (P["cap_band_r"], zb)],                         # bottom band
        [(P["cap_band_r"], zb), (P["cap_rib_r"], zb)],                          # ledge
        [(P["cap_rib_r"], zb + i * (zr - zb) / 8) for i in range(9)],           # ribs (modulated)
        [(P["cap_rib_r"], zr), (rim_r, zr)],                                    # ledge
        [(rim_r, zr), (rim_r, zt - ft)] + arc(rim_r - ft, zt - ft, ft, ft, 0.0, math.pi / 2, 10)[1:] + [(0.0, zt)],
        [(0.0, zt - CAP_WALL), (rin, zt - CAP_WALL), (rin, zc)],                # inside (hidden)
    ]
    return strips, 3


def rib_radius(rib_strip):
    period = 2 * math.pi / RIB_COUNT
    half = 0.2   # groove half-width as a fraction of the rib pitch

    def fn(si, r, phi):
        # the ribbed strip, and the ledge vertices that meet it, follow the grooves
        if si != rib_strip and abs(r - P["cap_rib_r"]) > 1e-9:
            return r
        t = (phi / period) % 1.0
        t = min(t, 1.0 - t)
        g = 0.5 * (1 + math.cos(math.pi * t / half)) if t < half else 0.0
        return r - RIB_DEPTH * g
    return fn


def capsule_strips():
    L, rb, rc, lc = CAPSULE["len"], CAPSULE["body_d"] / 2, CAPSULE["cap_d"] / 2, CAPSULE["cap_len"]
    zb0, zt0 = -L / 2, L / 2
    zcap = zt0 - lc
    body = arc(0.0, zb0 + rb, rb, rb, -math.pi / 2, 0.0, 5) + [(rb, zcap)]
    ledge = [(rb, zcap), (rc, zcap)]
    cap = [(rc, zcap), (rc, zt0 - rc)] + arc(0.0, zt0 - rc, rc, rc, 0.0, math.pi / 2, 5)[1:]
    return [body, ledge, cap]


# ------------------------------------------------------------------ capsule fill (rigid bodies)
def settle_capsules(seed=7):
    """Drop the 80 capsules into the real inner cavity (mm units, own scene) and return their
    resting transforms. The cavity is extended upwards by a straight tube so they can be fed
    in through the neck."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    inner = glass_strips()[2][::-1]                   # bottom centre -> up to the lip
    inner = [(r, z) for r, z in inner] + [(NECK_IN, 450.0)]
    v, f = revolve([inner], 64)
    col = make_object("collider", v, f, scale=1.0)
    cv, cf = revolve(capsule_strips(), 16)
    cmesh = make_object("capsule_src", cv, cf, scale=1.0).data

    bpy.ops.rigidbody.world_add()
    rw = scn.rigidbody_world
    rw.substeps_per_frame = 20
    rw.solver_iterations = 30
    scn.gravity = (0.0, 0.0, -2000.0)
    rw.point_cache.frame_end = 600
    with bpy.context.temp_override(object=col, active_object=col, selected_objects=[col]):
        bpy.ops.rigidbody.object_add(type="PASSIVE")
    col.rigid_body.collision_shape = "MESH"
    col.rigid_body.collision_margin = 0.05
    col.rigid_body.friction = 0.4

    rnd = random.Random(seed)
    caps = []
    z = BASE_THICK + 6.0
    layer = 0
    while len(caps) < N_CAPSULES:
        wide = z < P["shoulder_z0"] - 8
        offsets = (-9.0, 0.0, 9.0) if wide else (-4.8, 4.8)
        yaw = rnd.uniform(0, math.pi)
        for off in offsets:
            if len(caps) >= N_CAPSULES:
                break
            ob = bpy.data.objects.new(f"cap{len(caps):02d}", cmesh)
            scn.collection.objects.link(ob)
            rot = Matrix.Rotation(yaw, 4, "Z") @ Matrix.Rotation(math.pi / 2 + rnd.uniform(-0.15, 0.15), 4, "X")
            ob.matrix_world = Matrix.Translation((off * math.cos(yaw), off * math.sin(yaw), z)) @ rot
            with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
                bpy.ops.rigidbody.object_add(type="ACTIVE")
            rb = ob.rigid_body
            rb.collision_shape = "CAPSULE"
            rb.collision_margin = 0.02
            rb.mass = 0.745
            rb.friction = 0.45
            rb.restitution = 0.05
            rb.linear_damping = 0.2
            rb.angular_damping = 0.3
            caps.append(ob)
        z += 9.6
        layer += 1

    for fr in range(1, rw.point_cache.frame_end + 1):
        scn.frame_set(fr)
    dg = bpy.context.evaluated_depsgraph_get()
    return [ob.evaluated_get(dg).matrix_world.copy() for ob in caps]


# ------------------------------------------------------------------ materials
def principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.use_backface_culling = True      # closed surfaces: glTF doubleSided = false
    bsdf = m.node_tree.nodes["Principled BSDF"]
    return m, bsdf


def mat_glass():
    m, b = principled("Amber glass")
    b.inputs["Base Color"].default_value = (1, 1, 1, 1)
    b.inputs["Roughness"].default_value = 0.0
    b.inputs["IOR"].default_value = 1.52
    b.inputs["Transmission Weight"].default_value = 1.0
    nt = m.node_tree
    vol = nt.nodes.new("ShaderNodeVolumeAbsorption")
    # Cycles: sigma_a = density * (1 - color); pick density so 3 mm gives AMBER_T_3MM
    d = 0.003
    sig = [-math.log(t) / d for t in AMBER_T_3MM]
    dens = max(sig) * 1.05
    vol.inputs["Color"].default_value = tuple(1 - s / dens for s in sig) + (1.0,)
    vol.inputs["Density"].default_value = dens
    nt.links.new(vol.outputs["Volume"], nt.nodes["Material Output"].inputs["Volume"])
    return m


def mat_label():
    m, b = principled("Label M90")
    img = bpy.data.images.load(str(LABEL_IMG))
    img.colorspace_settings.name = "sRGB"
    tex = m.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Cubic"
    tex.extension = "EXTEND"
    m.node_tree.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.3
    return m


def mat_simple(name, srgb, rough, coat=0.0):
    m, b = principled(name)
    b.inputs["Base Color"].default_value = lin(srgb)
    b.inputs["Roughness"].default_value = rough
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.05
    return m


# ------------------------------------------------------------------ label
def label_object(mat_front, mat_back, nseg=128):
    z0 = P["label_z0"]
    z1 = z0 + pm.LABEL_H
    u0 = pm.LABEL_FRONT_U
    ro, ri = pm.LABEL_R, pm.LABEL_R - pm.LABEL_T / 2
    verts, faces, uvs = [], [], []

    def theta(u):
        return -math.pi / 2 + (u - u0) * 2 * math.pi

    # outer printed face (seam column duplicated for the UVs)
    for i in range(nseg + 1):
        u = i / nseg
        t = theta(u)
        verts += [(ro * math.cos(t), ro * math.sin(t), z0), (ro * math.cos(t), ro * math.sin(t), z1)]
    for i in range(nseg):
        a, b = 2 * i, 2 * (i + 1)
        faces.append((a, b, b + 1, a + 1))
        uvs.append([(i / nseg, 0.0), ((i + 1) / nseg, 0.0), ((i + 1) / nseg, 1.0), (i / nseg, 1.0)])
    n_front = len(faces)
    base = len(verts)
    for i in range(nseg + 1):
        t = theta(i / nseg)
        verts += [(ri * math.cos(t), ri * math.sin(t), z0), (ri * math.cos(t), ri * math.sin(t), z1)]
    for i in range(nseg):
        a, b = base + 2 * i, base + 2 * (i + 1)
        faces.append((a, a + 1, b + 1, b))          # facing the glass
        uvs.append([(0.5, 0.5)] * 4)
        # top and bottom edges of the paper
        faces.append((2 * i + 1, 2 * (i + 1) + 1, b + 1, a + 1))
        uvs.append([(0.5, 0.5)] * 4)
        faces.append((2 * i, a, b, 2 * (i + 1)))
        uvs.append([(0.5, 0.5)] * 4)
    ob = make_object("Label", verts, faces)
    me = ob.data
    uv = me.uv_layers.new(name="UVMap")
    for pi, poly in enumerate(me.polygons):
        for k, loop in enumerate(poly.loop_indices):
            uv.data[loop].uv = uvs[pi][k]
        poly.material_index = 0 if pi < n_front else 1
    me.materials.append(mat_front)
    me.materials.append(mat_back)
    return ob


# ------------------------------------------------------------------ main
def build():
    transforms = settle_capsules()
    fill_top = max(m.translation.z for m in transforms)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.unit_settings.system = "METRIC"
    scn.unit_settings.length_unit = "MILLIMETERS"
    root = bpy.data.collections.new("CardoMariano_x80")
    scn.collection.children.link(root)

    glass = make_object("Glass", *revolve(glass_strips(), 128), collection=root)
    glass.data.materials.append(mat_glass())

    strips, rib_i = cap_strips()
    cap = make_object("Cap", *revolve(strips, RIB_COUNT * 8, radius_fn=rib_radius(rib_i)), collection=root)
    cap.data.materials.append(mat_simple("Cap white PP", CAP_SRGB, 0.4))

    lab = label_object(mat_label(), mat_simple("Label paper back", (236, 233, 224), 0.9))
    for c in lab.users_collection:
        c.objects.unlink(lab)
    root.objects.link(lab)

    cv, cf = revolve(capsule_strips(), 12)
    cme = make_object("capsule_mesh", cv, cf, collection=root)
    cme.data.materials.append(mat_simple("Capsule (HPMC + powder)", POWDER_SRGB, 0.35, coat=0.6))
    cmesh = cme.data
    bpy.data.objects.remove(cme)
    caps = bpy.data.collections.new("Capsules")
    root.children.link(caps)
    for i, m in enumerate(transforms):
        ob = bpy.data.objects.new(f"Capsule_{i:02d}", cmesh)
        caps.objects.link(ob)
        loc, rot, _ = m.decompose()
        ob.matrix_world = Matrix.Translation(loc * MM) @ rot.to_matrix().to_4x4()

    # report
    tris = 0
    dg = bpy.context.evaluated_depsgraph_get()
    for ob in root.all_objects:
        if ob.type == "MESH":
            me = ob.evaluated_get(dg).to_mesh()
            me.calc_loop_triangles()
            tris += len(me.loop_triangles)
            ob.evaluated_get(dg).to_mesh_clear()
    report = {
        "triangles": tris, "capsules": len(transforms),
        "capsule_centres_top_mm": round(fill_top, 2),
        "label_mm": [round(pm.LABEL_LEN, 3), round(pm.LABEL_H, 3)],
        "overall_h_mm": H, "body_d_mm": pm.BODY_D,
    }
    (HERE / "build-report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))

    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "cardo-mariano-x80.blend"), compress=True)

    bpy.ops.export_scene.gltf(
        filepath=str(PKG / "cardo-mariano-x80.glb"), export_format="GLB", export_yup=True,
        export_apply=True, export_image_format="AUTO", export_cameras=False, export_lights=False,
        export_extras=False)
    glb_add_volume(PKG / "cardo-mariano-x80.glb")


def glb_add_volume(path):
    """Blender's exporter doesn't write KHR_materials_volume from a Volume Absorption node, so
    add it to the glass: glTF attenuation T(d) = attenuationColor ** (d / attenuationDistance)."""
    data = Path(path).read_bytes()
    jlen = struct.unpack("<I", data[12:16])[0]
    doc = json.loads(data[20:20 + jlen])
    rest = data[20 + jlen:]
    for m in doc["materials"]:
        if m["name"] == "Amber glass":
            m.setdefault("extensions", {})["KHR_materials_volume"] = {
                # a line of sight through the hollow bottle crosses two walls
                "thicknessFactor": 2 * GLASS_WALL * MM,
                "attenuationDistance": 0.003,
                "attenuationColor": list(AMBER_T_3MM),
            }
    used = doc.setdefault("extensionsUsed", [])
    if "KHR_materials_volume" not in used:
        used.append("KHR_materials_volume")
    js = json.dumps(doc, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    body = struct.pack("<I4s", len(js), b"JSON") + js + rest
    Path(path).write_bytes(struct.pack("<4sII", b"glTF", 2, 12 + len(body)) + body)


if __name__ == "__main__":
    build()
