#!/usr/bin/env bash
# Usage: scripts/render.sh <CompositionId> [<CompositionId> ...]
#   e.g. scripts/render.sh Editorial-Ashwagandha-16x9 Playful-CardoMariano-2x3
# List all ids with: npx remotion compositions src/index.ts
# Set REMOTION_BROWSER to a Chrome/Chromium path to skip Remotion's own browser download.
set -euo pipefail

[ $# -ge 1 ] || { echo "Usage: scripts/render.sh <CompositionId>..." >&2; exit 1; }
BROWSER_ARGS=()
[ -n "${REMOTION_BROWSER:-}" ] && BROWSER_ARGS=(--browser-executable="$REMOTION_BROWSER")

mkdir -p outputs
for COMP in "$@"; do
  OUT="outputs/${COMP}.mp4"
  npx remotion render src/index.ts "$COMP" "$OUT" \
    --codec=h264 \
    --enforce-audio-track \
    --crf=18 \
    "${BROWSER_ARGS[@]}"
  echo "Rendered $OUT"
  bash scripts/validate-output.sh "$OUT"
done
