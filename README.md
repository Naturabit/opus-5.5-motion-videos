# opus-5.5-motion-videos

Programmatic motion videos for Estado Puro on Amazon (Sponsored Brands video and other placements), built with [Remotion](https://www.remotion.dev): every scene is React code rendered straight to MP4.

One JSON file per product drives three creative variants in three formats.

## Variants

| Variant | Look | Needs |
|---|---|---|
| `Editorial` | Bold kinetic serif type, hard cuts, navy/gold wipes, capsule count grid | bottle cutout |
| `Playful` | Bouncy capsule character: bottle drop, capsule burst, a calendar that fills one capsule per day | bottle cutout |
| `Lifestyle` | Natural photography, split screens, softer pacing | bottle cutout + 4 photos (16:9 only for now) |

All videos are 15 s, silent-first (every claim is on screen), and show the product within the first 3 s.

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
assets/fonts/      Playfair Display + Manrope (OFL-1.1, bundled so renders work offline)
assets/products/   bottle cutouts (transparent PNG)
assets/lifestyle/  photos for the Lifestyle variant
configs/           one JSON per product (copy, numbers, ingredients, asset paths)
src/system/        design system: theme tokens, text reveals, gold line, wipes, gold circle, capsule, bottle
src/videos/        the three variants
scripts/           render, stills, output validation, config checks, bottle cutout
outputs/           renders (git-ignored)
```

## Adding a product

1. Cut out the bottle: `python3 scripts/cutout.py MAIN.jpg assets/products/<name>-bottle.png` (Amazon MAIN image on white).
2. Copy a file in `configs/` and edit the copy. Keep it short: hook (1-3 lines, `*word*` = gold italic accent), dose line, capsule and day counts, 3 ingredients, tagline.
3. Register it in `PRODUCTS` in `src/Root.tsx`.
4. `npm test`, then preview in `npm run dev` or render stills with `bash scripts/stills.sh <CompositionId> 30 120 250 350 440`.

## Output checks

`scripts/validate-output.sh` checks H.264, 6-45 s, under 500 MB, and an allowed resolution. Confirm limits against current Amazon Ads creative guidelines before uploading.

## Licensing

Remotion is free for individuals and companies with up to 3 employees; larger companies need a company license (https://www.remotion.dev/license). Fonts are SIL Open Font License 1.1.
