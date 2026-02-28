#!/usr/bin/env bash
# Compress JPEGs in public/images to ~quality 85 using ffmpeg.
# Only replaces a file if the result is meaningfully smaller (>5% savings).
# Skips PNGs (line art / icons are already optimal at their current sizes).
#
# Usage:
#   npm run images                    — compress everything in public/images
#   npm run images public/images/foo  — compress a specific file or directory

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v ffmpeg &>/dev/null; then
  echo "⚠️  ffmpeg not found — install it with: brew install ffmpeg"
  exit 1
fi

TARGET="${1:-$ROOT/public/images}"

compressed=0
skipped=0
saved=0

while IFS= read -r -d '' f; do
  before=$(wc -c < "$f" | tr -d '[:space:]')
  tmp="${f}.tmp.jpg"

  if ! ffmpeg -y -i "$f" -q:v 4 "$tmp" -loglevel quiet 2>/dev/null; then
    rm -f "$tmp"
    continue
  fi

  after=$(wc -c < "$tmp" | tr -d '[:space:]')
  diff=$(( before - after ))
  # Only replace if savings are >5% — avoids micro-reencoding already-optimal images
  pct=$(( diff * 100 / before ))

  if [ "$pct" -ge 5 ]; then
    mv "$tmp" "$f"
    saved=$(( saved + diff ))
    compressed=$(( compressed + 1 ))
    printf "  ✓ %-55s %dK → %dK (-%dK)\n" \
      "${f#$ROOT/}" $(( before / 1024 )) $(( after / 1024 )) $(( diff / 1024 ))
  else
    rm -f "$tmp"
    skipped=$(( skipped + 1 ))
  fi
done < <(find "$TARGET" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0)

echo ""
if [ "$compressed" -gt 0 ]; then
  echo "✓ Compressed $compressed image(s), saved $(( saved / 1024 ))KB"
fi
if [ "$skipped" -gt 0 ]; then
  echo "  $skipped image(s) already at target quality, skipped"
fi
if [ "$compressed" -eq 0 ] && [ "$skipped" -eq 0 ]; then
  echo "  No images found"
fi
