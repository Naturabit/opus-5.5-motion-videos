# CLAUDE.md

Remotion (React) project that renders Estado Puro ad videos for Amazon (Sponsored Brands video etc.). One JSON config per product feeds three variants (Editorial, Playful, Lifestyle) in three formats (16x9, 1x1, 2x3).

## Commands

- Install: `npm install`
- Preview: `npm run dev` (Remotion Studio)
- List composition ids: `npx remotion compositions src/index.ts` (ids are `<Variant>-<Product>-<Format>`)
- Render + validate: `bash scripts/render.sh <CompositionId> [...]` → `outputs/<id>.mp4`
- Stills for review: `bash scripts/stills.sh <CompositionId> <frame> [...]` → `outputs/stills/<id>/`
- Test (run before every commit): `npm test` (typecheck + `scripts/check-configs.mjs`)
- In a sandbox without Remotion's browser download, set `REMOTION_BROWSER=<path to chrome/headless_shell>` for render.sh and stills.sh.

## Layout

- `src/system/theme.ts`: colors, fonts (loaded from `assets/fonts`, never from the network), easings, FPS.
- `src/system/motion.ts`: `useUnit()` (1 = 1px at 1080p; square frames scale down 0.7) and `useLayout()` (`portrait` is true for square and vertical: they share stacked layouts).
- `src/system/Text.tsx`: `MaskWords` (word mask reveal; `*word*` = gold italic accent), `Eyebrow`, `Counter`.
- `src/system/Graphics.tsx`: signature elements from the motion brief: `GoldLine`, `Wipe` (full-frame panel at a scene cut), `GoldCircle`, `Capsule` (vector), `Bottle` (cutout with spring entrance and ground shadow), `Logo` (clip reveal), `KenBurns`, `Grain`.
- `src/videos/*.tsx`: each variant exports its component and `*_FRAMES`; scene start frames live in the `T` object at the top.
- `src/system/product.ts`: the `Product` type = the config schema. `scripts/check-configs.mjs` enforces it.
- `src/Root.tsx`: registers variant × product × format. Lifestyle only registers for products with `photos`, and only in 16x9.

## Rules

- Animate only from `useCurrentFrame()` (`interpolate`, `spring`, `random(seed)`). No CSS transitions, timers, or `Math.random()`.
- Amazon: product visible within 3 s, movement from frame 0, every message readable on mute, big type (hooks ≥ ~150px at 1080p).
- Copy: short. Use the brand's own listing wording for health statements; supplement claims must follow EU/EFSA rules, so flag any new claim for human review instead of inventing one.
- Adding a config field: update `Product`, every config, and `check-configs.mjs` together.
- Verify visual changes by rendering stills at several frames in every format you touched, not only by typechecking.
