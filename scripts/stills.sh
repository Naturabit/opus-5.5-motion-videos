#!/usr/bin/env bash
# Usage: scripts/stills.sh <CompositionId> <frame> [<frame> ...]
# Renders one PNG per frame into outputs/stills/<CompositionId>/ and a contact sheet.
set -euo pipefail

COMP="${1:?Usage: scripts/stills.sh <CompositionId> <frame>...}"
shift
DIR="outputs/stills/${COMP}"
mkdir -p "$DIR"
BROWSER_ARGS=()
[ -n "${REMOTION_BROWSER:-}" ] && BROWSER_ARGS=(--browser-executable="$REMOTION_BROWSER")

for f in "$@"; do
  npx remotion still src/index.ts "$COMP" "$DIR/f$(printf '%04d' "$f").png" --frame="$f" --log=error "${BROWSER_ARGS[@]}"
done
echo "Stills in $DIR"
