#!/usr/bin/env bash

# Loop through all SVG files under the svg/ folder
for svg in $(find svg -name "*.svg")
do
  echo "$svg"
  node_modules/.bin/svgo  "$svg" --multipass --disable="convertPathData"
done
