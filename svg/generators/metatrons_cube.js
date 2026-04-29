/**
 * metatrons_cube.js
 * sacred_geometry/svg/generators/metatrons_cube.js
 *
 * Generates a complete SVG of Metatron's Cube:
 * - 13 circles (Fruit of Life)
 * - 78 connecting lines (all center-to-center connections)
 * - Optional color-coding of embedded Platonic solid projections
 *
 * Usage: node svg/generators/metatrons_cube.js > output/metatrons_cube.svg
 */

'use strict';

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  size: 800,           // SVG width and height (px)
  radius: 60,          // individual circle radius
  showCircles: true,   // show the 13 Fruit of Life circles
  showLines: true,     // show the 78 connecting lines
  showDots: true,      // show center dots
  colorLines: true,    // color-code by embedded solid
  bgColor: '#000000',
  circleStroke: '#00FFCC',
  circleStrokeWidth: 0.8,
  circleOpacity: 0.25,
  lineStrokeWidth: 0.6,
  lineOpacity: 0.7,
  dotRadius: 3,
  dotColor: '#FFFFFF',
};

// ─── Geometry ─────────────────────────────────────────────────────────────────

const SQRT3 = Math.sqrt(3);
const PI = Math.PI;

/**
 * Compute the 13 circle centers of the Fruit of Life.
 * 
 * Layout: center + 6 inner ring + 6 outer ring (every other outer FOL circle).
 * Spacing = 2r (center-to-center in Flower of Life)
 */
function fruitOfLifeCenters(r) {
  const spacing = 2 * r;
  const centers = [];
  
  // Center
  centers.push({ x: 0, y: 0, ring: 0, index: 0 });
  
  // Inner ring: 6 circles at distance 2r from center, at 0°, 60°, 120°, 180°, 240°, 300°
  for (let i = 0; i < 6; i++) {
    const angle = (i * PI) / 3; // 0, 60, 120, 180, 240, 300 degrees
    centers.push({
      x: spacing * Math.cos(angle),
      y: spacing * Math.sin(angle),
      ring: 1,
      index: i + 1,
    });
  }
  
  // Outer ring of Fruit of Life: 6 circles at distance 4r from center
  // These are every OTHER circle in the Flower of Life outer ring
  // At angles: 30°, 90°, 150°, 210°, 270°, 330° (offset by 30°)
  for (let i = 0; i < 6; i++) {
    const angle = (i * PI) / 3 + PI / 6; // 30, 90, 150, 210, 270, 330 degrees
    centers.push({
      x: spacing * 2 * Math.cos(angle),
      y: spacing * 2 * Math.sin(angle),
      ring: 2,
      index: i + 7,
    });
  }
  
  return centers;
}

/**
 * Compute all 78 connections: C(13, 2) = 78 unique pairs
 */
function allConnections(centers) {
  const lines = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      lines.push({ a: centers[i], b: centers[j] });
    }
  }
  return lines; // 13*12/2 = 78
}

/**
 * Classify connections by which embedded solid they most represent
 * (heuristic color-coding based on line length and direction)
 */
function classifyLine(line, r) {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const spacing = 2 * r;

  // Approximate classification by length
  const ratio = len / spacing;

  if (ratio < 1.1)       return 'tetrahedron';  // short
  if (ratio < 2.1)       return 'hexahedron';   // medium
  if (ratio < 3.1)       return 'octahedron';   // medium-long
  if (ratio < 4.1)       return 'dodecahedron'; // long
  return 'icosahedron';                          // longest
}

// ─── Color Palette ────────────────────────────────────────────────────────────

const SOLID_COLORS = {
  tetrahedron:  '#FF4444',  // Fire — red
  hexahedron:   '#FFB800',  // Earth — gold
  octahedron:   '#00FFCC',  // Air — cyan
  dodecahedron: '#AA44FF',  // Aether — violet
  icosahedron:  '#0088FF',  // Water — blue
};

// ─── SVG Builder ─────────────────────────────────────────────────────────────

function buildSVG(config) {
  const { size, radius } = config;
  const cx = size / 2;
  const cy = size / 2;

  const centers = fruitOfLifeCenters(radius);
  const connections = allConnections(centers);

  const lines = [];

  // Background
  lines.push(`<rect width="${size}" height="${size}" fill="${config.bgColor}"/>`);

  // Subtle outer circle guide
  lines.push(`<circle cx="${cx}" cy="${cy}" r="${radius * 4.5}" fill="none" stroke="#ffffff10" stroke-width="0.5"/>`);

  // ── Lines ──
  if (config.showLines) {
    lines.push('<g id="connections">');
    for (const conn of connections) {
      const color = config.colorLines
        ? SOLID_COLORS[classifyLine(conn, radius)]
        : '#00FFCC';

      lines.push(
        `  <line ` +
        `x1="${(cx + conn.a.x).toFixed(2)}" y1="${(cy + conn.a.y).toFixed(2)}" ` +
        `x2="${(cx + conn.b.x).toFixed(2)}" y2="${(cy + conn.b.y).toFixed(2)}" ` +
        `stroke="${color}" stroke-width="${config.lineStrokeWidth}" opacity="${config.lineOpacity}"/>`
      );
    }
    lines.push('</g>');
  }

  // ── Circles ──
  if (config.showCircles) {
    lines.push('<g id="circles">');
    for (const c of centers) {
      lines.push(
        `  <circle ` +
        `cx="${(cx + c.x).toFixed(2)}" cy="${(cy + c.y).toFixed(2)}" ` +
        `r="${radius}" ` +
        `fill="none" ` +
        `stroke="${config.circleStroke}" ` +
        `stroke-width="${config.circleStrokeWidth}" ` +
        `opacity="${config.circleOpacity}"/>`
      );
    }
    lines.push('</g>');
  }

  // ── Center Dots ──
  if (config.showDots) {
    lines.push('<g id="dots">');
    for (const c of centers) {
      lines.push(
        `  <circle ` +
        `cx="${(cx + c.x).toFixed(2)}" cy="${(cy + c.y).toFixed(2)}" ` +
        `r="${config.dotRadius}" ` +
        `fill="${config.dotColor}" opacity="0.9"/>`
      );
    }
    lines.push('</g>');
  }

  // Legend
  if (config.colorLines) {
    const legendItems = Object.entries(SOLID_COLORS);
    const legendY = size - 80;
    const legendX = 20;
    lines.push('<g id="legend" font-family="monospace" font-size="11" fill="white" opacity="0.6">');
    lines.push(`  <text x="${legendX}" y="${legendY - 15}" font-size="9" opacity="0.4">LINE COLOR → PLATONIC SOLID</text>`);
    legendItems.forEach(([name, color], i) => {
      const lx = legendX + (i * 140);
      lines.push(`  <rect x="${lx}" y="${legendY}" width="12" height="12" fill="${color}"/>`);
      lines.push(`  <text x="${lx + 16}" y="${legendY + 10}" fill="${color}">${name.toUpperCase()}</text>`);
    });
    lines.push('</g>');
  }

  // Title
  lines.push(
    `<text x="${size / 2}" y="24" text-anchor="middle" ` +
    `font-family="monospace" font-size="13" fill="#00FFCC" opacity="0.5" letter-spacing="3">` +
    `METATRON'S CUBE</text>`
  );
  lines.push(
    `<text x="${size / 2}" y="40" text-anchor="middle" ` +
    `font-family="monospace" font-size="9" fill="#ffffff" opacity="0.3" letter-spacing="2">` +
    `13 CIRCLES — 78 CONNECTIONS — ALL 5 PLATONIC SOLIDS</text>`
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `  <title>Metatron's Cube — sacred_geometry</title>`,
    `  <desc>Generated by sacred_geometry/svg/generators/metatrons_cube.js</desc>`,
    ...lines.map(l => `  ${l}`),
    `</svg>`,
  ].join('\n');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

const svg = buildSVG(CONFIG);

// Output to stdout (pipe to .svg file)
if (typeof process !== 'undefined') {
  process.stdout.write(svg);

  // Stats to stderr
  const centers = fruitOfLifeCenters(CONFIG.radius);
  const connections = allConnections(centers);
  process.stderr.write(`\n✓ Metatron's Cube SVG generated\n`);
  process.stderr.write(`  Circles: ${centers.length}\n`);
  process.stderr.write(`  Connections: ${connections.length} (C(13,2) = 78)\n`);
  process.stderr.write(`  Size: ${CONFIG.size}×${CONFIG.size}\n`);
  process.stderr.write(`\nPipe output to file: node svg/generators/metatrons_cube.js > svg/output/metatrons_cube.svg\n\n`);
}

if (typeof module !== 'undefined') {
  module.exports = { fruitOfLifeCenters, allConnections, buildSVG, CONFIG };
}
