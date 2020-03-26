#!/usr/bin/env bash

# Loop through all SVG files under the svg/ folder
for svg in $(find svg -name "*.svg")
do
  echo "$svg"
  # Compress PNG files
  pngquant --force --ext .png "${svg//svg/png}"
  # Compress the SVG. Enabling convertPathData may fail fabricjs to load SVGs.
  node_modules/.bin/svgo -q "$svg" --multipass --disable="convertPathData"
done
