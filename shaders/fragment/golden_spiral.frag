#version 300 es
// ============================================================
// GOLDEN SPIRAL — Fragment Shader
// sacred_geometry/shaders/fragment/golden_spiral.frag
//
// Renders animated golden / logarithmic spirals.
// r = a * e^(b * theta)  where b = ln(phi) / (pi/2)
//
// Uniforms:
//   u_time       — time in seconds
//   u_resolution — canvas resolution
//   u_speed      — animation speed
//   u_count      — number of spiral arms (1-8)
//   u_thickness  — spiral band thickness (0.01-0.1)
// ============================================================

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform int u_count;
uniform float u_thickness;

out vec4 fragColor;

#define PI 3.14159265358979
#define TAU 6.28318530717959
#define PHI 1.61803398874989
#define LN_PHI 0.48121182505960  // ln(phi)
// b = ln(phi) / (pi/2) = LN_PHI / (PI/2)
#define B 0.30634896173178  // ln(phi)/(pi/2)

vec3 hsb2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0,4,2), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

// Signed distance to the golden spiral band
// Returns min distance to ANY spiral arm (count arms evenly spaced)
float spiralDist(vec2 p, float time, int arms) {
  float r = length(p);
  float theta = atan(p.y, p.x);

  if (r < 0.001) return 0.0;

  // log-spiral: ln(r) = ln(a) + b*theta
  // theta for a given r: theta = (ln(r) - ln(a)) / b
  // "Phase" of the spiral: how far along modulo one turn
  float logR = log(r);

  float minDist = 1000.0;

  for (int i = 0; i < 8; i++) {
    if (i >= arms) break;

    // Phase offset for this arm
    float armOffset = TAU * float(i) / float(arms);

    // Where along the spiral this radius corresponds to
    float spiralTheta = logR / B;

    // Difference between actual angle and spiral angle
    // mod by TAU to find nearest spiral band
    float dTheta = theta - spiralTheta - armOffset - time;
    dTheta = mod(dTheta + PI, TAU) - PI;  // wrap to [-PI, PI]

    // Convert angular distance to radial distance
    // Arc length approximation: ds ≈ r * dTheta
    float d = abs(dTheta * r * B);  // approximation of distance to spiral

    minDist = min(minDist, d);
  }

  return minDist;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_speed;

  // Multiple zoom levels for fractal effect
  vec3 col = vec3(0.0);

  // Draw spiral at 3 zoom levels
  for (int zoom = 0; zoom < 3; zoom++) {
    float scale = pow(PHI, float(zoom) * 2.0);
    vec2 p = uv * scale;

    float r = length(p);
    float theta = atan(p.y, p.x);

    // Distance to spiral
    float d = spiralDist(p, t * 0.3, u_count);

    // Thin, glowing band
    float band = smoothstep(u_thickness, 0.0, d);
    float glow = exp(-d / (u_thickness * 3.0));

    // Color: hue varies with radius (zoom-dependent) and time
    float logR = log(max(r, 0.001));
    float hue = mod(logR * 0.5 / LN_PHI + t * 0.15 + float(zoom) * 0.333, 1.0);
    float sat = 0.8;
    float val = 0.5 + 0.5 * band;

    vec3 spiralColor = hsb2rgb(vec3(hue, sat, val));

    // Fade by zoom level (deeper = more transparent)
    float zoomFade = 1.0 - float(zoom) * 0.35;
    col += spiralColor * (band + glow * 0.4) * zoomFade;
  }

  // Golden rectangle grid overlay (optional — dim)
  float rectGlow = 0.0;
  {
    // Draw the golden rectangle spiral boxes
    vec2 p = uv;
    float boxSize = 0.4;
    for (int step = 0; step < 8; step++) {
      // This is a simplified overlay — just draw bounding boxes
      float d = max(abs(p.x) - boxSize, abs(p.y) - boxSize * 0.5);
      rectGlow += exp(-abs(d) / 0.005) * 0.05;
      // Scale down by phi for next rectangle
      p *= 1.0 / PHI;
      // Rotate 90 degrees each step
      p = vec2(-p.y, p.x);
    }
  }
  col += vec3(1.0, 0.8, 0.2) * rectGlow;  // gold tint for rectangles

  // Center bindu point
  float bindu = exp(-length(uv) / 0.01) * 2.0;
  col += vec3(1.0) * bindu;

  // Vignette
  float vig = 1.0 - smoothstep(0.3, 1.0, length(uv));
  col *= vig;

  // Tone map
  col = col / (col + 0.5);
  col = pow(max(col, 0.0), vec3(1.0/2.2));

  fragColor = vec4(col, 1.0);
}
