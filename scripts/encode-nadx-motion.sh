#!/usr/bin/env bash
set -euo pipefail

# Encode the rendered 24 fps identity loop and its static, high-resolution fallback.
nadx_frames="${1:-/tmp/nadx-motion-final}"
nadx_poster="${2:-/tmp/nadx-motion-poster/0001.png}"
nadx_output="public/media/nadx"
test -f "$nadx_frames/0096.png"
test -f "$nadx_poster"
mkdir -p "$nadx_output"

# Keep the white-point filter on one thread: sliced RGBA filtering can offset
# image rows in some FFmpeg builds, even when the resulting file decodes.
ffmpeg -hide_banner -loglevel error -y -filter_threads 1 -framerate 24 -i "$nadx_frames/%04d.png" \
  -vf 'colorlevels=rimax=0.996078:gimax=0.996078:bimax=0.996078,scale=800:700:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,hqdn3d=1.2:1.0:2.0:1.8' \
  -frames:v 96 -c:v libx264 -preset slow -crf 19 -profile:v high -level 3.1 \
  -colorspace bt709 -color_trc bt709 -color_primaries bt709 -movflags +faststart -an \
  "$nadx_output/identity-motion-v1.mp4"
ffmpeg -hide_banner -loglevel error -y -filter_threads 1 -framerate 24 -i "$nadx_frames/%04d.png" \
  -vf 'colorlevels=rimax=0.996078:gimax=0.996078:bimax=0.996078,scale=640:560:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,hqdn3d=1.2:1.0:2.0:1.8' \
  -frames:v 96 -c:v libx264 -preset slow -crf 21 -profile:v high -level 3.1 \
  -colorspace bt709 -color_trc bt709 -color_primaries bt709 -movflags +faststart -an \
  "$nadx_output/identity-motion-v1-mobile.mp4"
ffmpeg -hide_banner -loglevel error -y -filter_threads 1 -i "$nadx_poster" -vf 'colorlevels=rimax=0.996078:gimax=0.996078:bimax=0.996078' -frames:v 1 -c:v libwebp -threads 1 -quality 94 \
  "$nadx_output/identity-motion-v1-poster.webp"
ffmpeg -hide_banner -loglevel error -y -filter_threads 1 -i "$nadx_poster" -vf 'colorlevels=rimax=0.996078:gimax=0.996078:bimax=0.996078,scale=768:672:flags=lanczos' \
  -frames:v 1 -c:v libwebp -threads 1 -quality 92 "$nadx_output/identity-motion-v1-poster-768.webp"

for nadx_file in "$nadx_output/identity-motion-v1.mp4" "$nadx_output/identity-motion-v1-mobile.mp4"; do
  nadx_count="$(ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of default=noprint_wrappers=1:nokey=1 "$nadx_file")"
  test "$nadx_count" = 96
done
printf '%s\n' 'NADX identity loop encoded: desktop, mobile, and static posters.'
