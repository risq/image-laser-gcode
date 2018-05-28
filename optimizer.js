//noprotect

const parsePosition = gcodeLine => {
  const res = gcodeLine.match(/^G[01]\sX([\d\.]*)\sY([\d\.]*)/);

  if (!res) throw new Error("Cannot parse position", gcodeLine);

  return { x: res[1], y: res[2] };
};

const distanceToSquared = (p0, p1) => {
  const dx = p0.x - p1.x;
  const dy = p0.y - p1.y;
  return dx * dx + dy * dy;
};

const getPaths = gcode => {
  const gcodeLines = gcode
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "");

  const paths = [
    {
      lines: [],
      origin: { x: 0, y: 0 },
      end: { x: 0, y: 0 }
    }
  ];

  let started = false;

  for (let i = 0, length = gcodeLines.length; i < length; i++) {
    const gcodeLine = gcodeLines[i];
    if (gcodeLine.startsWith("G0")) {
      if (!started) {
        started = true;
        if (i > 0) {
          paths[paths.length - 1].lines.push(gcodeLine);
          paths[paths.length - 1].origin = parsePosition(gcodeLine);
        } else {
          paths.push({
            lines: [gcodeLine],
            origin: parsePosition(gcodeLine)
          });
        }
      } else {
        paths.push({
          lines: [gcodeLine],
          origin: parsePosition(gcodeLine)
        });
      }
    } else if (gcodeLine.startsWith("G1")) {
      paths[paths.length - 1].lines.push(gcodeLine);
      paths[paths.length - 1].end = parsePosition(gcodeLine);
    } else {
      paths[paths.length - 1].lines.push(gcodeLine);
    }
  }

  return paths;
};

const orderPaths = paths => {
  const orderedPaths = [];

  let i = 0;

  while (true) {
    const lastPath = orderedPaths[orderedPaths.length - 1];

    if (!lastPath) {
      orderedPaths.push(paths[0]);
      paths[0].sorted = true;
      continue;
    }

    const closestPath = paths.reduce(
      (closestPath, pathCandidate, i) => {
        if (pathCandidate.sorted) return closestPath;
        const distance = distanceToSquared(lastPath.end, pathCandidate.origin);
        if (distance < closestPath.distance) {
          return { path: pathCandidate, distance };
        }
        return closestPath;
      },
      { path: null, distance: Infinity }
    );

    if (!closestPath.path) {
      break;
    }

    closestPath.path.sorted = true;
    orderedPaths.push(closestPath.path);
  }

  if (orderedPaths.length !== paths.length) {
    throw new Error("Error ordering paths");
  }

  return orderedPaths;
};

const computeTravelDistance = paths => {
  return Math.sqrt(
    paths.reduce((distance, path, i, paths) => {
      if (i === 0) {
        return distance;
      }
      return distance + distanceToSquared(paths[i - 1].end, path.origin);
    }, 0)
  );
};

const optimizeGcode = (gcode, log = true) => {
  const paths = getPaths(gcode);
  const orderedPaths = orderPaths(paths);
  const orderedGcode = orderedPaths
    .reduce(
      (orderedGcode, orderedPath) => [...orderedGcode, ...orderedPath.lines],
      []
    )
    .join("\n");

  const unorderedDistance = computeTravelDistance(paths);
  const orderedDistance = computeTravelDistance(orderedPaths);

  if (log) {
    console.log("( optimisation stats: )");
    console.log("( " + paths.length + " paths )");
    console.log("( before: " + Math.round(unorderedDistance) + "mm )");
    console.log("( after: " + Math.round(orderedDistance) + "mm )");
    console.log(
      "( reduced by " +
        Math.round((1 - orderedDistance / unorderedDistance) * 100) +
        "% )"
    );
  }

  return orderedGcode;
}

module.exports = { optimizeGcode };
