#!/usr/bin/env bash
# Usage: scripts/render.sh [props.json] [composition-id]
set -euo pipefail

PROPS="${1:-configs/sample-product.json}"
COMP="${2:-SponsoredBrandsLandscape}"
NAME="$(basename "$PROPS" .json)-${COMP}"
OUT="outputs/${NAME}.mp4"

mkdir -p outputs
npx remotion render src/index.ts "$COMP" "$OUT" \
  --props="$PROPS" \
  --codec=h264 \
  --enforce-audio-track \
  --crf=18

echo "Rendered $OUT"
bash scripts/validate-output.sh "$OUT"
