/**
 * sacred_math.js
 * sacred_geometry/utils/math/sacred_math.js
 *
 * Core mathematical utilities for sacred geometry construction.
 * All functions are pure — no side effects, no dependencies.
 *
 * Usage (Node.js): node utils/math/sacred_math.js
 * Usage (browser): <script src="utils/math/sacred_math.js"></script>
 */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

const CONSTANTS = {
  PHI:   1.6180339887498948482,  // Golden Ratio
  PHI_I: 0.6180339887498948482,  // 1/PHI = PHI - 1
  PI:    Math.PI,
  TAU:   Math.PI * 2,
  E:     Math.E,
  SQRT2: Math.SQRT2,
  SQRT3: Math.sqrt(3),
  SQRT5: Math.sqrt(5),
  LN_PHI: Math.log(1.6180339887498948482),

  // Spiral growth rate for golden spiral: r = a * e^(b * theta)
  GOLDEN_SPIRAL_B: Math.log(1.6180339887498948482) / (Math.PI / 2),

  // Golden angle (degrees between successive Fibonacci spiral arms)
  GOLDEN_ANGLE_DEG: 137.50776405003785,  // 360 / phi^2
  GOLDEN_ANGLE_RAD: 2.399963229728653,

  // Key angles in degrees
  ANGLES: {
    EQUILATERAL:   60,
    SQUARE:        90,
    PENTAGON:      108,
    HEXAGON:       120,
    HEPTAGON:      128.5714,
    OCTAGON:       135,
    PENTAGRAM_POINT: 36,
    VESICA_ARC:    120,   // Each arc of vesica subtends 120° at circle center
    PLATONIC_TETRAHEDRON_DIHEDRAL: 70.5288, // arccos(1/3)
    PLATONIC_CUBE_DIHEDRAL: 90,
    PLATONIC_OCTAHEDRON_DIHEDRAL: 109.4712, // arccos(-1/3)
    PLATONIC_DODECAHEDRON_DIHEDRAL: 116.565,
    PLATONIC_ICOSAHEDRON_DIHEDRAL: 138.190,
  }
};

// ─── Fibonacci ────────────────────────────────────────────────────────────────

/**
 * Returns the nth Fibonacci number (F(0) = 0, F(1) = 1)
 * Uses Binet's formula for large n (floating point limitations apply)
 */
function fibonacci(n) {
  if (n < 0) throw new RangeError('n must be >= 0');
  if (n === 0) return 0;
  if (n === 1) return 1;
  // Iterative for precision
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

/**
 * Returns the first n Fibonacci numbers as an array
 */
function fibonacciSequence(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq.slice(0, n);
}

/**
 * Ratio of consecutive Fibonacci numbers (converges to PHI)
 */
function fibRatio(n) {
  const fn = fibonacci(n);
  const fn1 = fibonacci(n + 1);
  return fn1 / fn;
}

// ─── Golden Ratio ─────────────────────────────────────────────────────────────

/**
 * Divide a line segment in golden ratio.
 * Returns { major, minor } where major/minor = PHI
 */
function goldenSection(length) {
  const major = length / CONSTANTS.PHI;
  const minor = length - major;
  return { major, minor, ratio: major / minor };
}

/**
 * Compute the golden rectangle dimensions for a given width
 */
function goldenRectangle(width) {
  return { width, height: width / CONSTANTS.PHI };
}

/**
 * Subdivide a golden rectangle into a square + smaller golden rectangle (recursive)
 */
function subdivideGoldenRectangle(rect, depth = 5) {
  if (depth === 0) return [rect];
  const { x = 0, y = 0, width, height, rotation = 0 } = rect;
  const isLandscape = width >= height;

  let square, remainder;
  if (isLandscape) {
    square = { x, y, width: height, height, rotation };
    remainder = { x: x + height, y, width: width - height, height, rotation: rotation + 90 };
  } else {
    square = { x, y, width, height: width, rotation };
    remainder = { x, y: y + width, width, height: height - width, rotation: rotation - 90 };
  }

  return [square, ...subdivideGoldenRectangle(remainder, depth - 1)];
}

// ─── Circle Geometry ──────────────────────────────────────────────────────────

/**
 * Vesica Piscis geometry for two circles of radius r with centers at distance r apart
 */
function vesicaPiscis(r) {
  return {
    radius: r,
    center1: { x: -r / 2, y: 0 },
    center2: { x: r / 2, y: 0 },
    intersectionTop: { x: 0, y: r * CONSTANTS.SQRT3 / 2 },
    intersectionBottom: { x: 0, y: -r * CONSTANTS.SQRT3 / 2 },
    width: r,
    height: r * CONSTANTS.SQRT3,
    heightToWidthRatio: CONSTANTS.SQRT3,
    area: r * r * (2 * Math.PI / 3 - CONSTANTS.SQRT3 / 2) * 2,
    perimeter: (4 * Math.PI / 3) * r,
    equilateralTriangleSide: r,
  };
}

/**
 * Flower of Life circle centers for n hexagonal rings
 * Returns array of {x, y} center points
 */
function flowerOfLifeCenters(r, rings) {
  const centers = [{ x: 0, y: 0 }];
  const seen = new Set(['0,0']);

  // Hex direction unit vectors (flat-top hexagon)
  const dirs = [
    { x: 2 * r, y: 0 },
    { x: r, y: r * CONSTANTS.SQRT3 },
    { x: -r, y: r * CONSTANTS.SQRT3 },
    { x: -2 * r, y: 0 },
    { x: -r, y: -r * CONSTANTS.SQRT3 },
    { x: r, y: -r * CONSTANTS.SQRT3 },
  ];

  let current = [{ x: 0, y: 0 }];

  for (let ring = 0; ring < rings; ring++) {
    const next = [];
    for (const center of current) {
      for (const dir of dirs) {
        const nx = Math.round((center.x + dir.x) * 1000) / 1000;
        const ny = Math.round((center.y + dir.y) * 1000) / 1000;
        const key = `${nx},${ny}`;
        if (!seen.has(key)) {
          seen.add(key);
          centers.push({ x: nx, y: ny });
          next.push({ x: nx, y: ny });
        }
      }
    }
    current = next;
  }

  return centers;
}

/**
 * Expected circle count for n rings: 3n² + 3n + 1
 */
function flowerOfLifeCount(rings) {
  return 3 * rings * rings + 3 * rings + 1;
}

// ─── Spiral Math ─────────────────────────────────────────────────────────────

/**
 * Golden spiral: r = a * e^(b * theta)
 * Returns radius at given theta
 */
function goldenSpiralR(a, theta) {
  return a * Math.exp(CONSTANTS.GOLDEN_SPIRAL_B * theta);
}

/**
 * Fibonacci spiral approximation points (from Fibonacci squares)
 */
function fibonacciSpiralPoints(n = 8, pointsPerQuarter = 20) {
  const fibs = fibonacciSequence(n + 2);
  const points = [];
  let angle = 0;

  for (let i = 0; i < n; i++) {
    const sideLen = fibs[i];
    const cx = 0; // simplified — center of each square
    const cy = 0;
    for (let j = 0; j <= pointsPerQuarter; j++) {
      const t = (j / pointsPerQuarter) * (Math.PI / 2);
      const a = angle + t;
      points.push({
        x: cx + sideLen * Math.cos(a),
        y: cy + sideLen * Math.sin(a),
        fib: sideLen,
        step: i,
      });
    }
    angle += Math.PI / 2;
  }

  return points;
}

/**
 * Sunflower / phyllotaxis point distribution
 * n seeds distributed by golden angle — produces Fibonacci spiral count
 */
function phyllotaxis(n, scale = 1, c = 1) {
  const points = [];
  for (let i = 0; i < n; i++) {
    const theta = i * CONSTANTS.GOLDEN_ANGLE_RAD;
    const r = c * Math.sqrt(i) * scale;
    points.push({
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
      r,
      theta,
      index: i,
    });
  }
  return points;
}

// ─── Polygon & Regular Forms ──────────────────────────────────────────────────

/**
 * Vertices of a regular n-gon inscribed in a circle of radius r
 * Centered at (cx, cy), rotated by offsetAngle radians
 */
function regularPolygon(n, r, cx = 0, cy = 0, offsetAngle = -Math.PI / 2) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.TAU + offsetAngle;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

// Fix: Math.TAU not always available
const _TAU = Math.PI * 2;

function regularPolygonVerts(n, r, cx = 0, cy = 0, offsetAngle = -Math.PI / 2) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * _TAU + offsetAngle;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

/**
 * Pentagram vertices (5-pointed star)
 * Returns 10 points (outer and inner pentagon vertices alternating)
 */
function pentagram(r, cx = 0, cy = 0) {
  const outerVerts = regularPolygonVerts(5, r, cx, cy);
  const innerR = r / (CONSTANTS.PHI * CONSTANTS.PHI); // inner pentagon radius
  const innerVerts = regularPolygonVerts(5, innerR, cx, cy, -Math.PI / 2 + Math.PI / 5);

  // Interleave outer and inner for star path
  const points = [];
  for (let i = 0; i < 5; i++) {
    points.push(outerVerts[i]);
    points.push(innerVerts[i]);
  }
  return { outer: outerVerts, inner: innerVerts, star: points };
}

// ─── Platonic Solid Math ──────────────────────────────────────────────────────

const PLATONIC_SOLIDS = {
  tetrahedron: {
    faces: 4, vertices: 4, edges: 6,
    faceType: 'triangle', facesPerVertex: 3,
    dualOf: 'tetrahedron',
    element: 'Fire',
    circumradius: (a) => a * Math.sqrt(3 / 8),
    inradius:     (a) => a / (2 * Math.sqrt(6)),
    surfaceArea:  (a) => a * a * Math.sqrt(3),
    volume:       (a) => a * a * a / (6 * Math.sqrt(2)),
    dihedralDeg:  70.5288,
  },
  cube: {
    faces: 6, vertices: 8, edges: 12,
    faceType: 'square', facesPerVertex: 3,
    dualOf: 'octahedron',
    element: 'Earth',
    circumradius: (a) => a * Math.sqrt(3) / 2,
    inradius:     (a) => a / 2,
    surfaceArea:  (a) => 6 * a * a,
    volume:       (a) => a * a * a,
    dihedralDeg:  90,
  },
  octahedron: {
    faces: 8, vertices: 6, edges: 12,
    faceType: 'triangle', facesPerVertex: 4,
    dualOf: 'cube',
    element: 'Air',
    circumradius: (a) => a / Math.sqrt(2),
    inradius:     (a) => a / Math.sqrt(6),
    surfaceArea:  (a) => 2 * Math.sqrt(3) * a * a,
    volume:       (a) => Math.sqrt(2) / 3 * a * a * a,
    dihedralDeg:  109.4712,
  },
  dodecahedron: {
    faces: 12, vertices: 20, edges: 30,
    faceType: 'pentagon', facesPerVertex: 3,
    dualOf: 'icosahedron',
    element: 'Aether / Cosmos',
    circumradius: (a) => a * Math.sqrt(3) * CONSTANTS.PHI,
    inradius:     (a) => a * CONSTANTS.PHI * CONSTANTS.PHI / (2 * Math.sqrt(3 - 1 / (CONSTANTS.PHI * CONSTANTS.PHI))),
    surfaceArea:  (a) => 3 * Math.sqrt(25 + 10 * Math.sqrt(5)) * a * a,
    volume:       (a) => (15 + 7 * Math.sqrt(5)) / 4 * a * a * a,
    dihedralDeg:  116.565,
  },
  icosahedron: {
    faces: 20, vertices: 12, edges: 30,
    faceType: 'triangle', facesPerVertex: 5,
    dualOf: 'dodecahedron',
    element: 'Water',
    circumradius: (a) => a * Math.sin(2 * Math.PI / 5),
    inradius:     (a) => a * CONSTANTS.PHI * CONSTANTS.PHI / (2 * Math.sqrt(3)),
    surfaceArea:  (a) => 5 * Math.sqrt(3) * a * a,
    volume:       (a) => 5 * (3 + Math.sqrt(5)) / 12 * a * a * a,
    dihedralDeg:  138.190,
  },
};

/**
 * Verify Euler's formula: V - E + F = 2
 */
function verifyEuler(solid) {
  const { vertices, edges, faces } = PLATONIC_SOLIDS[solid];
  return vertices - edges + faces; // Should be 2
}

// ─── Vector Utilities ─────────────────────────────────────────────────────────

const vec2 = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (v, s) => ({ x: v.x * s, y: v.y * s }),
  length: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v) => { const l = vec2.length(v); return { x: v.x / l, y: v.y / l }; },
  dot: (a, b) => a.x * b.x + a.y * b.y,
  rotate: (v, angle) => ({
    x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
    y: v.x * Math.sin(angle) + v.y * Math.cos(angle),
  }),
  lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
};

// ─── Angle Utilities ─────────────────────────────────────────────────────────

function degToRad(deg) { return deg * Math.PI / 180; }
function radToDeg(rad) { return rad * 180 / Math.PI; }

/**
 * Regular polygon interior angle in degrees
 */
function polygonInteriorAngle(n) { return (n - 2) * 180 / n; }

/**
 * Regular polygon exterior angle in degrees
 */
function polygonExteriorAngle(n) { return 360 / n; }

// ─── Exports ─────────────────────────────────────────────────────────────────

const SacredMath = {
  CONSTANTS,
  fibonacci,
  fibonacciSequence,
  fibRatio,
  goldenSection,
  goldenRectangle,
  subdivideGoldenRectangle,
  vesicaPiscis,
  flowerOfLifeCenters,
  flowerOfLifeCount,
  goldenSpiralR,
  fibonacciSpiralPoints,
  phyllotaxis,
  regularPolygonVerts,
  pentagram,
  PLATONIC_SOLIDS,
  verifyEuler,
  vec2,
  degToRad,
  radToDeg,
  polygonInteriorAngle,
  polygonExteriorAngle,
};

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SacredMath;
}

// ─── Self-test (run with: node sacred_math.js) ────────────────────────────────

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('sacred_math.js')) {
  console.log('\n🔯 SACRED MATH — Self Test\n');
  console.log(`PHI = ${CONSTANTS.PHI}`);
  console.log(`1/PHI = ${CONSTANTS.PHI_I} (= PHI - 1: ${CONSTANTS.PHI - 1})`);
  console.log(`Golden spiral b = ${CONSTANTS.GOLDEN_SPIRAL_B}`);
  console.log(`Golden angle = ${CONSTANTS.GOLDEN_ANGLE_DEG}°`);
  console.log('');

  console.log('Fibonacci (first 15):', fibonacciSequence(15).join(', '));
  console.log(`F(20)/F(19) = ${fibRatio(19)} (→ PHI)`);
  console.log('');

  console.log('Vesica Piscis (r=1):');
  const vp = vesicaPiscis(1);
  console.log(`  height = ${vp.height.toFixed(6)} (= √3 = ${CONSTANTS.SQRT3.toFixed(6)})`);
  console.log(`  area   = ${vp.area.toFixed(6)}`);
  console.log('');

  console.log('Flower of Life centers (2 rings):');
  const fol = flowerOfLifeCenters(50, 2);
  console.log(`  Expected: ${flowerOfLifeCount(2)}, Got: ${fol.length}`);
  console.log('');

  console.log('Platonic Solid Euler Check (V - E + F = 2):');
  for (const [name] of Object.entries(PLATONIC_SOLIDS)) {
    const euler = verifyEuler(name);
    console.log(`  ${name}: ${euler} ${euler === 2 ? '✓' : '✗'}`);
  }
  console.log('');

  console.log('Platonic Solid Volumes (edge=1):');
  for (const [name, solid] of Object.entries(PLATONIC_SOLIDS)) {
    console.log(`  ${name}: V=${solid.volume(1).toFixed(4)}, A=${solid.surfaceArea(1).toFixed(4)}, element=${solid.element}`);
  }
  console.log('\n✓ Done.\n');
}
