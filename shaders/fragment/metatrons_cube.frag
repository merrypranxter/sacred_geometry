#version 300 es
// ============================================================
// METATRON'S CUBE — Fragment Shader
// sacred_geometry/shaders/fragment/metatrons_cube.frag
//
// 13 Fruit of Life circles + 78 connecting lines
// Color-coded by embedded Platonic solid
// Animated: progressive draw-in + glow
// ============================================================
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_speed;
uniform float u_draw_progress; // 0-1: how much to reveal (if 0, use time)
uniform int   u_show_circles;
uniform int   u_color_mode;    // 0=solid-coded, 1=hue-angle, 2=void

out vec4 fragColor;

#define PI  3.14159265358979
#define TAU 6.28318530717959
#define PHI 1.61803398874989
#define SQRT3 1.73205080756888

// ─── Fruit of Life: 13 circle centers ────────────────────────
// Center + 6 inner ring + 6 outer ring (alternating FOL circles)
// r = circle radius in UV space (set to 0.15)
const int N_CIRCLES = 13;
const int N_LINES   = 78;  // C(13,2) = 78

vec2 fruitCenters[13];
void initCenters(float r) {
  float s = 2.0 * r;  // spacing = 2r
  // Center
  fruitCenters[0] = vec2(0.0, 0.0);
  // Inner ring (6 at 0°, 60°, 120°, 180°, 240°, 300°)
  for (int i = 0; i < 6; i++) {
    float a = float(i) * PI / 3.0;
    fruitCenters[1 + i] = vec2(s * cos(a), s * sin(a));
  }
  // Outer ring (6 at 30°, 90°, 150°, 210°, 270°, 330° — radius 4r)
  for (int i = 0; i < 6; i++) {
    float a = float(i) * PI / 3.0 + PI / 6.0;
    fruitCenters[7 + i] = vec2(4.0 * r * cos(a), 4.0 * r * sin(a));
  }
}

// ─── Color by which Platonic solid the line length suggests ──
vec3 solidColor(float lineLength, float r) {
  float ratio = lineLength / (2.0 * r);
  if (ratio < 1.5) return vec3(1.0, 0.27, 0.27);  // tetrahedron  — red
  if (ratio < 2.5) return vec3(1.0, 0.72, 0.0);   // hexahedron   — gold
  if (ratio < 3.5) return vec3(0.0, 1.0, 0.8);    // octahedron   — cyan
  if (ratio < 4.5) return vec3(0.6, 0.2, 1.0);    // dodecahedron — violet
  return              vec3(0.0, 0.53, 1.0);        // icosahedron  — blue
}

// ─── HSB → RGB ────────────────────────────────────────────────
vec3 hsb2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

// ─── Line SDF (capsule) ───────────────────────────────────────
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// ─── Main ─────────────────────────────────────────────────────
void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_speed;

  float r = 0.075;  // circle radius in UV space
  initCenters(r);

  vec3 col = vec3(0.0);
  float THICKNESS = 0.003;
  float LINE_GLOW  = 0.015;
  float CIRC_GLOW  = 0.008;

  // ── Draw progress ────────────────────────────────────────────
  float progress = u_draw_progress > 0.0
    ? u_draw_progress
    : clamp(t * 0.15, 0.0, 1.0);  // animate to full in ~7 seconds

  // ── Lines (78 connections) ───────────────────────────────────
  int lineCount = 0;
  for (int i = 0; i < 13; i++) {
    for (int j = i + 1; j < 13; j++) {
      lineCount++;

      // Progressive reveal
      float revealThreshold = float(lineCount) / float(N_LINES);
      if (revealThreshold > progress) continue;

      vec2 a = fruitCenters[i];
      vec2 b = fruitCenters[j];

      float lineLen = length(b - a);
      float d = sdSegment(uv, a, b) - THICKNESS;

      // Solid color
      vec3 lineCol;
      if (u_color_mode == 1) {
        // Hue by angle of line
        vec2 midpt = (a + b) * 0.5;
        float angle = atan(midpt.y, midpt.x);
        lineCol = hsb2rgb(vec3(mod(angle / TAU + t * 0.05, 1.0), 0.9, 0.85));
      } else if (u_color_mode == 2) {
        lineCol = vec3(0.2, 0.8, 1.0);  // void mode: uniform cyan
      } else {
        lineCol = solidColor(lineLen, r);
      }

      // Edge + glow
      float edge = exp(-max(d, 0.0) / THICKNESS);
      float halo = exp(-max(d, 0.0) / LINE_GLOW) * 0.4;
      float fade = smoothstep(0.0, 0.02, progress - revealThreshold);
      col += lineCol * (edge + halo) * fade;
    }
  }

  // ── Circles (13 Fruit of Life) ───────────────────────────────
  if (u_show_circles == 1) {
    for (int i = 0; i < 13; i++) {
      vec2 c = fruitCenters[i];
      float dist = length(c);

      // Breathing pulse
      float pulse = 1.0 + 0.04 * sin(t * 2.5 + dist * 4.0);
      float d = abs(length(uv - c) - r * pulse);

      float hue = mod(atan(c.y, c.x) / TAU + t * 0.08, 1.0);
      vec3 circCol = hsb2rgb(vec3(hue, 0.7, 0.9));

      float edge = exp(-d / CIRC_GLOW) * 0.35;
      col += circCol * edge;
    }
  }

  // ── Center dots (13 glowing nodes) ───────────────────────────
  for (int i = 0; i < 13; i++) {
    float d = length(uv - fruitCenters[i]);
    float dot_ = exp(-d / 0.006) * 1.5;
    col += vec3(1.0) * dot_;
  }

  // ── Vignette ─────────────────────────────────────────────────
  col *= 1.0 - smoothstep(0.35, 0.65, length(uv));

  // ── Tone + gamma ─────────────────────────────────────────────
  col = col / (col + 0.5);
  col = pow(max(col, 0.0), vec3(1.0/2.2));

  fragColor = vec4(col, 1.0);
}
