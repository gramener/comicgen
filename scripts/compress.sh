#!/usr/bin/env bash

# Loop through all SVG files under the svg/ folder
for svg in $(find svg -name "*.svg")
do
  # Compress PNG files
  if ([[ $svg == svg/chini* ]] || [[ $svg == svg/panda* ]] || [[ $svg == svg/zoozoo* ]])
  then
    continue
  fi
  echo "$svg"
  # pngquant --force --ext .png "${svg//svg/png}"
  # # Compress the SVG. Enabling convertPathData may fail fabricjs to load SVGs.
  node_modules/.bin/svgo -q --multipass "$svg"
done
