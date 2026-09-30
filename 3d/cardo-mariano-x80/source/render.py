"""Photoreal renders of cardo-mariano-x80.blend (Cycles).

Studio setup built here (no downloaded HDRI): white surround, a large key softbox, two rim
strips, black flags at the sides so the glass edges read, and a shadow-catcher floor.
View transform "Standard" so the label artwork's colours map straight through.

Outputs per view: renders/<view>.png (transparent, with contact shadow) and
renders/<view>-white.png (composited on white), plus renders/contact-sheet.png.

Run: python render.py [--res 3000] [--samples 256] [--views front,back,left,right,three-quarter]
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
PKG = HERE.parent
OUT = PKG / "renders"

# name: (azimuth deg, elevation deg). Azimuth 0 = front (camera on -Y); +90 = bottle's right (+X).
VIEWS = {
    "front": (0.0, 5.0),
    "right": (90.0, 5.0),
    "back": (180.0, 5.0),
    "left": (270.0, 5.0),
    "three-quarter": (35.0, 10.0),
}
TARGET = Vector((0.0, 0.0, 0.056))
FOCAL = 85.0
DIST = 0.36


def args():
    a = argparse.ArgumentParser()
    a.add_argument("--res", type=int, default=3000)
    a.add_argument("--samples", type=int, default=256)
    a.add_argument("--views", default=",".join(VIEWS))
    a.add_argument("--suffix", default="")
    return a.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])


def emissive_plane(name, size, loc, look_at, strength, color=(1, 1, 1), camera=False):
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size[0], size[1], 1)
    d = Vector(look_at) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes["Principled BSDF"])
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
    ob.data.materials.append(m)
    ob.visible_camera = camera
    ob.visible_shadow = False
    return ob


def setup(res, samples):
    bpy.ops.wm.open_mainfile(filepath=str(HERE / "cardo-mariano-x80.blend"))
    scn = bpy.context.scene
    scn.render.engine = "CYCLES"
    cy = scn.cycles
    cy.device = "CPU"
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.01
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.max_bounces = 24
    cy.transmission_bounces = 24
    cy.transparent_max_bounces = 16
    cy.glossy_bounces = 8
    cy.diffuse_bounces = 4
    cy.volume_bounces = 2
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.sample_clamp_indirect = 10.0
    scn.render.resolution_x = scn.render.resolution_y = res
    scn.render.film_transparent = True
    scn.render.image_settings.file_format = "PNG"
    scn.render.image_settings.color_mode = "RGBA"
    scn.render.image_settings.color_depth = "8"
    scn.view_settings.view_transform = "Standard"
    scn.view_settings.look = "None"
    scn.view_settings.exposure = 0.25

    # white surround (also what is seen through the glass)
    w = bpy.data.worlds.new("Studio")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (1, 1, 1, 1)
    bg.inputs["Strength"].default_value = 0.72
    scn.world = w

    # shadow-catcher floor
    bpy.ops.mesh.primitive_plane_add(size=2.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor.is_shadow_catcher = True
    floor.visible_glossy = False
    fm = bpy.data.materials.new("Floor")
    fm.use_nodes = True
    fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.9, 0.9, 0.9, 1)
    fm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.6
    floor.data.materials.append(fm)

    rig = bpy.data.objects.new("LightRig", None)
    scn.collection.objects.link(rig)
    parts = [
        emissive_plane("Key softbox", (0.35, 0.45), (-0.30, -0.32, 0.26), (0, 0, 0.05), 1.6),
        emissive_plane("Fill", (0.40, 0.40), (0.38, -0.20, 0.14), (0, 0, 0.05), 0.55),
        emissive_plane("Rim L", (0.06, 0.40), (-0.24, 0.20, 0.10), (0, 0, 0.05), 3.0),
        emissive_plane("Rim R", (0.06, 0.40), (0.24, 0.20, 0.10), (0, 0, 0.05), 3.0),
        emissive_plane("Top", (0.30, 0.30), (0.0, 0.0, 0.42), (0, 0, 0.05), 0.9),
        emissive_plane("Flag L", (0.10, 0.45), (-0.16, -0.05, 0.08), (0, 0, 0.06), 0.0, (0, 0, 0)),
        emissive_plane("Flag R", (0.10, 0.45), (0.16, -0.05, 0.08), (0, 0, 0.06), 0.0, (0, 0, 0)),
    ]
    for p in parts:
        p.parent = rig
    return scn, rig


def camera_for(scn, az, el):
    cam = bpy.data.objects.get("Camera") or bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    if cam.name not in scn.collection.objects:
        scn.collection.objects.link(cam)
    cam.data.lens = FOCAL
    cam.data.sensor_fit = "VERTICAL"
    cam.data.sensor_height = 36.0
    cam.data.clip_start = 0.01
    a, e = math.radians(az), math.radians(el)
    # azimuth measured from -Y towards +X
    loc = TARGET + DIST * Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    cam.location = loc
    cam.rotation_euler = (TARGET - loc).to_track_quat("-Z", "Y").to_euler()
    scn.camera = cam
    return cam


def main():
    o = args()
    scn, rig = setup(o.res, o.samples)
    OUT.mkdir(exist_ok=True)
    for name in o.views.split(","):
        az, el = VIEWS[name]
        camera_for(scn, az, el)
        rig.rotation_euler = (0, 0, math.radians(az))   # lights stay in the same place relative to the camera
        scn.render.filepath = str(OUT / f"{name}{o.suffix}.png")
        bpy.ops.render.render(write_still=True)
        print("rendered", name, flush=True)


if __name__ == "__main__":
    main()
