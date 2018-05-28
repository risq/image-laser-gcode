const potrace = require("potrace");
const canvg = require("canvg");
const GCanvas = require("gcanvas");
const GcodeDriver = require("gcanvas/lib/drivers/gcode");

const { optimizeGcode } = require("./optimizer");

const feed = 550;
const toolDiameter = 0.35;
const targetHeight = 80;
const passes = 1;

potrace.trace("./torus_inverted.png", function(err, svg) {
  if (err) throw err;

  const stream = {
    gcode: "",
    write(data) {
      this.gcode = this.gcode + data + "\n";
    },
  };

  const gcanvas = new GCanvas(new GcodeDriver(stream));

  gcanvas.toolDiameter = toolDiameter;
  gcanvas.feed = feed;
  canvg(gcanvas.canvas, svg, {
    scaleHeight: targetHeight,
  });

  const optimized = optimizeGcode(stream.gcode)

  for (let i = 0; i < passes; i++) {
    console.log(optimized);
  }
});
