# opus-5.5-motion-videos

Programmatic motion videos for Amazon Sponsored Brands video and other ad placements, built with [Remotion](https://www.remotion.dev) (videos written as React components, rendered to MP4).

Each video is driven by a JSON config in `configs/`, so one template produces a video per product.

## Requirements

- Node.js 18+ (20 or 22 recommended)
- npm

Remotion downloads its own headless Chrome and ffmpeg on first render.

## Quick start

```bash
npm install
npm run dev                  # open Remotion Studio to preview and tweak
npm run render               # render configs/sample-product.json -> outputs/
npm test                     # typecheck + config validation
```

## Folder structure

```
assets/        product images, logos, music (served via staticFile())
configs/       one JSON file per video (brand, headline, benefits, CTA, colors)
outputs/       rendered videos (git-ignored)
scripts/       render, output validation, config checks
src/           Remotion compositions (React)
```

## Making a new video

1. Put the product image in `assets/`, e.g. `assets/my-product.png`.
2. Copy `configs/sample-product.json` to `configs/my-product.json` and edit it. Set `"productImage": "my-product.png"`.
3. Run `bash scripts/render.sh configs/my-product.json` (landscape) or
   `bash scripts/render.sh configs/my-product.json VerticalStory` (9:16).
4. The render script validates the MP4 against Sponsored Brands limits and prints PASS/FAIL per check.

## Compositions

| ID | Size | Use |
|---|---|---|
| `SponsoredBrandsLandscape` | 1920x1080, 30 fps | Sponsored Brands video (16:9) |
| `VerticalStory` | 1080x1920, 30 fps | Vertical placements, social |

## Output checks

`scripts/validate-output.sh` checks: H.264 codec, 6-45 s duration, file size under 500 MB, and an allowed resolution. Confirm these limits against the current Amazon Ads creative guidelines before uploading.

## Licensing

Remotion is free for individuals and companies with up to 3 employees; larger companies need a company license. See https://www.remotion.dev/license.
