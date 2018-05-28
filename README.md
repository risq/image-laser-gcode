image-laser-gcode
===

Convert an image into gcode for laser engraving


### Features

*  bitmap vectorization using `potrace`
*  svg to canvas conversion using `canvg`
*  canvas to gcode using a patched version of `gcanvas` which features:
   *  fixed `clipper` inset for paths with holes
   *  updated gcode commands to replace Z-axis movement with laser on/off commands
   *  path simplification/cleaning
   *  use standard units per minutes instead of inverse time mode
*  final gcode path optimisation using a simple algorithm to minimise travel
   between points (can decrease travel time up to 90%)


### Usage

simulation:
```
node index.js | gsim
```

export:
```
node index.js > image.gcode
```

### Todo
*  code cleaning
*  create a cli tool
*  handle more options
*  better control on converted gcode scale
