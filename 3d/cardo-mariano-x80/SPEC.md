# Cardo Mariano Estado Puro x80: 3D model spec

Amber glass jar, white ribbed cap, wrap-around label `M90_Label.jpg`, 80 capsules.
Every value below lists its source. **Assumed** values are not visible in any supplied reference;
replace them when a drawing or a real bottle is available (the scripts are parametric).

## Files

| File | What |
|---|---|
| `cardo-mariano-x80.glb` | Rotatable model: metres, Y-up, front of the label faces +Z, base centre at the origin. 2.2 MB |
| `viewer.html` | Opens the GLB in `<model-viewer>`; serve the folder over HTTP (`npx serve 3d/cardo-mariano-x80`) |
| `renders/<view>.png` | 3000 × 3000, transparent background with contact shadow |
| `renders/<view>-white.png` | Same on white |
| `renders/contact-sheet.png` | All views side by side |
| `textures/M90_Label.jpg` | Label artwork, byte-identical to `assets/products/M90_Label.jpg` |
| `source/cardo-mariano-x80.blend` | Blender 4.2 scene, textures packed |
| `source/fit_profile.py` | Fits the bottle profile to the packshot → `profile.json`, `fit-overlay.png`, `measured-side-profile.csv` |
| `source/build_bottle.py` | Builds the scene from `profile.json`, simulates the capsule fill, saves the .blend, exports the GLB |
| `source/render.py`, `source/finish_renders.py` | Studio renders; white versions and contact sheet |

Rebuild everything (Python 3.11 with `pip install bpy==4.2.0 numpy pillow scipy`):
```bash
cd 3d/cardo-mariano-x80/source
python fit_profile.py ../../..      # optional: only if the profile needs refitting
python build_bottle.py
python render.py --res 3000 --samples 128
python finish_renders.py
```

## Sources

1. **Client measurements:** 64 × 64 × 112 mm, amber glass. 112 mm is taken as overall height with the cap on; 64 mm as the body diameter over the label.
2. **Label artwork:** `assets/products/M90_Label.jpg`, 2000 × 706 px, no print resolution stored.
3. **Packshot:** `assets/products/cardo-es.png`, 536 × 1000 px, perspective view. Used for proportions only.
4. **Capsule photo:** `assets/products/capsule.png`, used for the powder colour.

## Dimensions (mm)

| Item | Value | Source |
|---|---|---|
| Overall height | 112.0 | Client |
| Body Ø over label | 64.0 | Client |
| Label | 201.06 × 70.98 | Artwork wrapped exactly once round Ø64 (client decision); height from the artwork's 2000:706 ratio |
| Label scale | 0.1005 mm/px | Derived. Check: the EAN-13 bars come out at 29.5 mm, 94% of nominal, a normal print size |
| Label bottom edge above base | 8.37 | Packshot fit, then reconciled (below) |
| Label seam | Back, where the "Consumir preferentemente / Lote" strip meets the barcode strip | Client decision |
| Label front | Artwork x = 977 px (centre of the logo panel) faces front | Artwork |
| Gold bands | 3.3 mm top and bottom (33 px each) | Artwork |
| Heel (rounded base edge) | Elliptical, 8.5 wide × 7.3 high | Packshot fit |
| Shoulder | Starts at the label's top edge (79.35), meets the neck at 86.36; superellipse exponent 1.71 | Packshot fit |
| Neck Ø (visible part) | 46.9 | Packshot fit |
| Cap | Bottom at 89.21, height 22.8 | Packshot fit, reconciled |
| Cap bottom band | Ø 50.66, 2.63 high | Packshot fit |
| Cap ribbed section | Ø 49.34 over the ribs, **55 ribs** | Diameter: packshot fit. Rib count: autocorrelation of the rib pattern (55.2) |
| Cap top rim | Ø 50.79, 3.33 high, 3.0 mm top edge radius | Packshot fit |

**How the packshot was used:**
- **Camera.** The camera was solved from the label alone (gold-band edges and straight sides, whose real sizes are known). Median error is 0.15 px. That solve shows the packshot image is stretched 4.2% vertically, and the stretch is removed.
- **Profile.** Each side-edge row of the silhouette was converted to a radius and height (`measured-side-profile.csv`), and the profile was fitted to that curve. The fitted outline matches the packshot silhouette to a median of 0.77 px, 95th percentile 2.5 px (`source/fit-overlay.png`).
- **Height reconcile.** With the label fixed, the packshot implies an overall height of 117.6 mm, 5% more than the measured 112 mm. The heights above and below the label (base, heel, shoulder, neck, cap) were scaled by 0.879 to match 112 mm. Radii were not changed. If the 112 mm excludes something, or the packshot was retouched, this factor is where it shows.

## Materials

| Material | Value | Source |
|---|---|---|
| Glass | Amber, IOR 1.52, clear surface. Transmittance per 3 mm: R 0.90, G 0.58, B 0.20 | Colour: client ("amber glass"). Value: **assumed**, set to match the packshot's look |
| Label | Artwork as base colour, used as-is; roughness 0.3, no metallic | **Assumed** semi-gloss. The gold bands are printed artwork (their foil look is in the JPEG), not a metallic finish |
| Label back | Off-white paper | **Assumed** |
| Cap | White plastic, sRGB 232/230/223, roughness 0.4 | Colour: packshot. Finish: **assumed** |
| Capsules | Powder sRGB 145/121/71 under a glossy clear coat | Colour: `capsule.png` |

## Assumed (not visible in any supplied reference)

- **Glass wall 3.0 mm, neck wall 2.4 mm, floor 5.0 mm.** Inner shape is offset from the outside.
- **Bottle base:** flat, no punt, no embossed codes. Never visible in the packshot.
- **Cap top:** flat with a 3 mm rounded edge. Only a sliver is visible in the packshot.
- **Rib groove depth:** 0.5 mm.
- **Neck finish/thread:** not modelled. It is under the cap.
- **Capsules:** size 00 (23.3 × 8.2/8.5 mm), inferred from 745 mg per capsule on the label.
- **Capsule fill:** 80 capsules settled by a rigid-body simulation; their tops sit at about 68 mm, below the top of the label. The packshot shows capsules up to the shoulder (about 85 mm). 80 size-00 capsules only reach that height at an implausibly loose packing, so the simulated level is kept. The packshot fill was probably staged or retouched.
- **Batch/expiry print:** the "Lote / Consumir preferentemente" area is left as printed on the artwork (blank).

## Known limits

- **Label resolution.** The artwork is 2000 px wide. In the 3000 px renders the front of the label is magnified about 2×, so the large type is sharp but the italic small print (warnings, address) is soft. It was not upscaled, to avoid altering any characters. A print-resolution PDF/PSD of the label would fix this with no other changes.
- **Real-time viewers.** Viewers such as model-viewer, three.js and Quick Look approximate the glass with `KHR_materials_transmission` + `KHR_materials_volume`. They show the amber tint but not the darker inside of the jar seen in the path-traced renders. The renders are the colour reference.
- **GLB size.** 44.6k triangles stored; 67k drawn, because the one capsule mesh is shared by 80 nodes. `gltf-validator` reports 0 errors and 0 warnings.
