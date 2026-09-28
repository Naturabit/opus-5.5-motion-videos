# CLAUDE.md

Remotion (React) project that renders ad videos for Amazon Sponsored Brands and similar placements. One template, many JSON configs.

## Commands

- Install: `npm install`
- Preview in browser: `npm run dev` (Remotion Studio)
- Render: `bash scripts/render.sh [configs/<name>.json] [CompositionId]`
  - Defaults: `configs/sample-product.json`, `SponsoredBrandsLandscape`
  - Output: `outputs/<config>-<CompositionId>.mp4`, then auto-validated
- Single frame: `npx remotion still src/index.ts SponsoredBrandsLandscape outputs/frame.png --frame=60 --props=configs/sample-product.json`
- Validate an MP4: `bash scripts/validate-output.sh <file.mp4>`
- Test (run before every commit): `npm test` (typecheck + `scripts/check-configs.mjs`)

## Layout

- `src/Root.tsx`: registers compositions. Duration comes from `durationSeconds` in props via `calculateMetadata`.
- `src/compositions/ProductSpot.tsx`: the template. Scenes: intro (0-35%), benefits (35-75%), end card with CTA (75-100%). Props type `ProductSpotProps` is the config schema.
- `configs/*.json`: one per video. Must match `ProductSpotProps`; `check-configs.mjs` enforces required fields, 1-4 benefits, 6-45 s duration, hex colors, and that `productImage` exists in `assets/`.
- `assets/`: Remotion public dir (set in `remotion.config.ts`). Reference files with `staticFile("name.png")`.
- `outputs/`: render output, git-ignored.

## Rules

- All animation must be driven by `useCurrentFrame()` (`interpolate`, `spring`). No CSS transitions, `setTimeout`, or `Date.now()`; they break deterministic rendering.
- When adding a config field, update `ProductSpotProps`, `configs/sample-product.json`, and `scripts/check-configs.mjs` together.
- Keep Sponsored Brands output at H.264, 6-45 s, under 500 MB, 1920x1080 (or 1280x720 / 3840x2160).
- Verify visual changes by rendering stills at a few frames, not only by typechecking.
