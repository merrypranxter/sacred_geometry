#version 300 es
// ============================================================
// FLOWER OF LIFE — Fragment Shader
// sacred_geometry/shaders/fragment/flower_of_life.frag
//
// Renders an animated Flower of Life using hexagonal geometry.
// Compatible with: Three.js, GLSL sandbox, Shadertoy (minor edits)
//
// Uniforms:
//   u_time    — time in seconds
//   u_resolution — canvas resolution (vec2)
//   u_rings   — number of hex rings (int, 1-4)
//   u_radius  — circle radius (float, 0.05-0.2)
//   u_speed   — animation speed multiplier (float)
// ============================================================

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform int u_rings;
uniform float u_radius;
uniform float u_speed;

out vec4 fragColor;

// Constants
#define PI 3.14159265358979
#define TAU 6.28318530717959
#define PHI 1.61803398874989
#define SQRT3 1.73205080756888

// ─── hex grid ────────────────────────────────────────────────
// Convert cartesian to axial hex coordinates
vec2 cartToHex(vec2 p, float r) {
  float q = (2.0/3.0 * p.x) / r;
  float qf = (-1.0/3.0 * p.x + SQRT3/3.0 * p.y) / r;
  return vec2(q, qf);
}

// Round axial hex coords to nearest hex center
vec2 hexRound(vec2 hex) {
  float q = hex.x, r = hex.y, s = -hex.x - hex.y;
  float rq = round(q), rr = round(r), rs = round(s);
  float dq = abs(rq - q), dr = abs(rr - r), ds = abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return vec2(rq, rr);
}

// Get center position of a hex cell (axial coords → cartesian)
vec2 hexToCart(vec2 h, float r) {
  return vec2(r * 3.0/2.0 * h.x, r * SQRT3 * (h.y + h.x / 2.0));
  // Flat-top hex: use (SQRT3*h.x + SQRT3/2.0*h.y, 3.0/2.0*h.y) * r for pointy-top
}

// ─── circle SDF ───────────────────────────────────────────────
float circleSDF(vec2 p, vec2 center, float r) {
  return length(p - center) - r;
}

// ─── color utilities ──────────────────────────────────────────
vec3 hsb2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0,4,2), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

// Glow from SDF distance
float glow(float d, float radius, float softness) {
  return exp(-max(d, 0.0) / softness);
}

// ─── main ─────────────────────────────────────────────────────
void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_speed;

  float r = u_radius;   // circle radius in UV space
  float spacing = r;    // center-to-center = 1 radius (correct for FOL)

  // Total color accumulator
  vec3 col = vec3(0.0);
  float totalGlow = 0.0;

  // Iterate over nearby hex cells
  int RANGE = 4; // How many hex cells to check around current position
  for (int qi = -RANGE; qi <= RANGE; qi++) {
    for (int ri = -RANGE; ri <= RANGE; ri++) {
      vec2 hexCoord = vec2(float(qi), float(ri));

      // Hex distance from origin
      float hexDist = max(abs(hexCoord.x), max(abs(hexCoord.y), abs(hexCoord.x + hexCoord.y)));

      // Skip if outside ring count
      if (hexDist > float(u_rings) + 0.1) continue;

      // Get center in cartesian space
      vec2 center = vec2(
        spacing * 2.0 * (float(qi) + float(ri) * 0.5),
        spacing * SQRT3 * float(ri)
      );

      // Compute SDF to this circle
      float d = circleSDF(uv, center, r);

      // Breathing animation: modulate radius
      float breathe = sin(t * 1.5 + hexDist * 0.8) * 0.008;
      d -= breathe;

      // Color: hue based on angle to center + time + ring distance
      float angle = atan(center.y, center.x);
      float hue = mod(angle / TAU + t * 0.1 + hexDist * 0.12, 1.0);
      float saturation = 0.8 + 0.2 * sin(t + hexDist);
      float brightness = 0.7 + 0.3 * sin(t * 1.3 + angle * 3.0);

      vec3 circleColor = hsb2rgb(vec3(hue, saturation, brightness));

      // Edge glow (tight around circle perimeter)
      float edgeGlow = glow(abs(d), r, 0.002);
      // Fill glow (soft interior)
      float fillGlow = glow(max(d, 0.0), r, 0.015) * 0.2;
      // Intersection highlight: points where multiple circles overlap
      // (approximated by high glow accumulation)

      col += circleColor * (edgeGlow + fillGlow);
      totalGlow += edgeGlow;
    }
  }

  // Intersection zones: where multiple circles overlap, add extra white
  float intersectionBoost = smoothstep(1.5, 3.0, totalGlow) * 0.5;
  col += vec3(intersectionBoost);

  // Vignette
  float vignette = 1.0 - smoothstep(0.4, 0.9, length(uv));
  col *= vignette;

  // Tone map + gamma
  col = col / (col + 0.5);  // Reinhard
  col = pow(col, vec3(1.0 / 2.2));  // gamma

  fragColor = vec4(col, 1.0);
}
