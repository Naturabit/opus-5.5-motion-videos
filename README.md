# opus-5.5-motion-videos

Programmatic motion videos for Estado Puro on Amazon (Sponsored Brands video and other placements), built with [Remotion](https://www.remotion.dev): every scene is React code rendered straight to MP4.

One JSON file per product drives four creative variants. All copy is Spanish. Delivery format is 16:9; 1:1 and 2:3 compositions exist but are not used for now.

## Variants

| Variant | Look | Needs |
|---|---|---|
| `Editorial` | Bold kinetic serif type, hard cuts, navy/gold wipes, capsule count grid (the favourite) | bottle cutout |
| `Horizon` | Indie-film match cuts: close-up nature textures fill most of the frame under a soft curved horizon, hard cuts every 0.5 s, one line of type above, animated grain and warm grade; the bottle rises like a sun | bottle cutout + `horizon` textures in the config |
| `Playful` | Bouncy capsule character: bottle drop, capsule burst, a calendar that fills one capsule per day | bottle cutout |
| `Lifestyle` | Natural photography, split screens, softer pacing | bottle cutout + 4 photos (16:9 only for now) |

All videos are 20 s with CC0 background music (Editorial: "chill vibe" by heymanzzzz, Horizon: "Summer21"), still readable on mute (every claim is on screen), and show the product within the first 3-4 s.

## Formats

`16x9` (1920x1080), `1x1` (1080x1080), `2x3` (1080x1620). Composition ids are `<Variant>-<Product>-<Format>`, e.g. `Playful-CardoMariano-2x3`.

## Quick start

```bash
npm install
npm run dev                                     # Remotion Studio: preview every composition
bash scripts/render.sh Editorial-Ashwagandha-16x9   # render + validate -> outputs/
npm test                                        # typecheck + config validation
```

## Folder structure

```
assets/brand/      logo in navy / ivory / gold (transparent PNG)
assets/fonts/      Marcellus + Jost (OFL-1.1, bundled so renders work offline)
assets/products/   bottle cutouts (transparent PNG)
assets/lifestyle/  photos for the Lifestyle variant
assets/textures/   public-domain textures for the Horizon variant (sources in CREDITS.md)
assets/music/      CC0 background tracks from Freesound (sources in CREDITS.md)
assets/references/ reference videos used for creative direction
configs/           one JSON per product (Spanish copy, numbers, ingredients, asset paths)
src/system/        design system: theme tokens, text reveals, gold line, wipes, gold circle, capsule, bottle
src/videos/        the four variants
scripts/           render, stills, output validation, config checks, bottle cutout
outputs/           renders (git-ignored)
```

## Adding a product

1. Add the bottle as a transparent PNG in `assets/products/` (or cut one out of an Amazon MAIN image: `python3 scripts/cutout.py MAIN.jpg assets/products/<name>.png`).
2. Copy a file in `configs/` and edit the copy. Keep it short: hook (1-3 lines, `*word*` = gold accent, never italic), dose line, capsule and day counts, 3 ingredients, tagline. For the Horizon variant add `horizon` textures (6 hook, 1 product, 3 ingredients); new textures should be CC0/public domain (Openverse) and listed in `assets/textures/CREDITS.md`.
3. Register it in `PRODUCTS` in `src/Root.tsx`.
4. `npm test`, then preview in `npm run dev` or render stills with `bash scripts/stills.sh <CompositionId> 30 120 250 350 440`.

## Output checks

`scripts/validate-output.sh` checks H.264, 6-45 s, under 500 MB, and an allowed resolution. Confirm limits against current Amazon Ads creative guidelines before uploading.

## Licensing

Remotion is free for individuals and companies with up to 3 employees; larger companies need a company license (https://www.remotion.dev/license). Fonts are SIL Open Font License 1.1.
