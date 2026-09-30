# CLAUDE.md

Remotion (React) project that renders Estado Puro ad videos for Amazon (Sponsored Brands video etc.). All copy is Spanish. One JSON config per product feeds four variants (Editorial = the client favourite, Horizon, Playful, Lifestyle) in 16x9 (1x1 and 2x3 compositions exist but are not delivered).

## Commands

- Install: `npm install`
- Preview: `npm run dev` (Remotion Studio)
- List composition ids: `npx remotion compositions src/index.ts` (ids are `<Variant>-<Product>-<Format>`)
- Render + validate: `bash scripts/render.sh <CompositionId> [...]` → `outputs/<id>.mp4`
- Stills for review: `bash scripts/stills.sh <CompositionId> <frame> [...]` → `outputs/stills/<id>/`
- Test (run before every commit): `npm test` (typecheck + `scripts/check-configs.mjs`)
- In a sandbox without Remotion's browser download, set `REMOTION_BROWSER=<path to chrome/headless_shell>` for render.sh and stills.sh.

## Layout

- `src/system/theme.ts`: colors, fonts (Marcellus serif + Jost sans, loaded from `assets/fonts`, never from the network), easings, FPS.
- `src/system/motion.ts`: `useUnit()` (1 = 1px at 1080p; square frames scale down 0.7) and `useLayout()` (`portrait` is true for square and vertical: they share stacked layouts).
- `src/system/Text.tsx`: `MaskWords` (word mask reveal; `*word*` = gold accent, upright), `Eyebrow`, `Counter`.
- `src/system/Graphics.tsx`: signature elements from the motion brief: `GoldLine`, `Wipe` (full-frame panel at a scene cut), `GoldCircle`, `Capsule` (vector), `Bottle` (cutout with spring entrance and ground shadow), `Logo` (clip reveal), `KenBurns`, `Grain`.
- `src/videos/*.tsx`: each variant exports its component and `*_FRAMES`; scene start frames live in the `T` object at the top.
- `src/system/product.ts`: the `Product` type = the config schema. `scripts/check-configs.mjs` enforces it.
- `src/Root.tsx`: registers variant × product × format. Lifestyle only registers for products with `photos` (16x9 only); Horizon only for products with `horizon` textures.
- `src/videos/Horizon.tsx`: timeline in `T`, horizon height per section in `LEVEL_KEYS`/`LEVELS`; `surfaceAt()` decides which texture sits under the horizon. The film finish (grade, weave, light leaks, `FilmGrain`) lives at the bottom of the component.
- Bottles are `assets/products/*-es.png` (Spanish labels, supplied by the client). `CapsulePhoto` uses the real capsule photo.

## Rules

- Animate only from `useCurrentFrame()` (`interpolate`, `spring`, `random(seed)`). No CSS transitions, timers, or `Math.random()`.
- Amazon: product visible within 3 s, movement from frame 0, every message readable on mute, big type (hooks ≥ ~150px at 1080p).
- Textures and music: public domain only (CC0/PDM via Openverse; music from Freesound CC0); record each in `assets/textures/CREDITS.md` or `assets/music/CREDITS.md`. `Music` (Graphics.tsx) plays a track with fades; `skipSeconds` skips the quiet intro.
- Pacing: videos are 20 s (600 frames); each text beat stays on screen at least ~1 s so it can be read.
- Copy: short, Spanish. No section titles like "Lo que hay dentro"; let ingredients carry the scene. No "Sin OGM" badge. No italics (the client dislikes them). No small uppercase eyebrow above product names. End card: logo centered over a one-line tagline, then badges "Formulado por expertos · Fabricación 100% española". Use the brand's own listing wording for health statements; supplement claims must follow EU/EFSA rules, so flag any new claim for human review instead of inventing one.
- Adding a config field: update `Product`, every config, and `check-configs.mjs` together.
- Verify visual changes by rendering stills at several frames in every format you touched, not only by typechecking.
