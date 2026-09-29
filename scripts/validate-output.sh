#!/usr/bin/env bash
# Checks a rendered MP4 against Amazon Sponsored Brands video limits.
# Verify limits against current Amazon Ads creative guidelines before relying on them.
set -euo pipefail

FILE="${1:?Usage: scripts/validate-output.sh <video.mp4>}"
MAX_BYTES=$((500 * 1024 * 1024))
MIN_SEC=6
MAX_SEC=45

probe() { npx remotion ffprobe -v error "$@" -of default=noprint_wrappers=1:nokey=1 "$FILE" | head -n1 | tr -d ' ,\r'; }

codec=$(probe -select_streams v:0 -show_entries stream=codec_name)
width=$(probe -select_streams v:0 -show_entries stream=width)
height=$(probe -select_streams v:0 -show_entries stream=height)
duration=$(probe -show_entries format=duration)
size=$(wc -c < "$FILE" | tr -d ' ')

fail=0
check() { if eval "$2"; then echo "PASS  $1"; else echo "FAIL  $1"; fail=1; fi; }

echo "File: $FILE (${width}x${height}, ${codec}, ${duration}s, ${size} bytes)"
check "codec is h264" '[ "$codec" = "h264" ]'
check "duration ${MIN_SEC}-${MAX_SEC}s" "awk 'BEGIN{exit !($duration >= $MIN_SEC && $duration <= $MAX_SEC)}'"
check "size <= 500MB" '[ "$size" -le "$MAX_BYTES" ]'
check "resolution is 16:9 (1920x1080/1280x720/3840x2160), 1:1 (1080x1080) or 2:3 (1080x1620)" \
  'case "${width}x${height}" in 1920x1080|1280x720|3840x2160|1080x1080|1080x1620) true;; *) false;; esac'

exit $fail
