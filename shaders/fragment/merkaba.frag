#version 300 es
// ============================================================
// MERKABA / STAR TETRAHEDRON — Fragment Shader
// sacred_geometry/shaders/fragment/merkaba.frag
//
// 2D: Counter-rotating Star of David (Hexagram)
// + emanating phi-wave rings
// + triangle intersection zone highlighting
// Compatible with Three.js ShaderMaterial / GLSL sandbox
// ============================================================
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_speed;
uniform int   u_mode;  // 0=2D star, 1=sacred hexagram with rings, 2=full mandala

out vec4 fragColor;

#define PI  3.14159265358979
#define TAU 6.28318530717959
#define PHI 1.61803398874989
#define SQRT3 1.73205080756888

// ─── Utilities ────────────────────────────────────────────────
vec3 hsb2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

mat2 rot2(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

// ─── Equilateral Triangle SDF ─────────────────────────────────
float sdTriangle(vec2 p, float r) {
  const float k = SQRT3;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

// ─── Downward triangle: flip Y ────────────────────────────────
float sdTriangleDown(vec2 p, float r) {
  return sdTriangle(vec2(p.x, -p.y), r);
}

// ─── Segment SDF ──────────────────────────────────────────────
float sdSeg(vec2 p, vec2 a, vec2 b, float w) {
  vec2 pa = p-a, ba = b-a;
  float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
  return length(pa - ba*h) - w;
}

// ─── Six pointed star vertices ────────────────────────────────
// Returns the 6 outer points of the hexagram given radius r
vec2 starPoint(int i, float r, float rotation) {
  float a = float(i) * TAU / 6.0 + rotation;
  return vec2(cos(a), sin(a)) * r;
}

// Inner hexagon vertex between two star points
vec2 hexInner(int i, float r, float rotation) {
  float a = (float(i) + 0.5) * TAU / 6.0 + rotation;
  return vec2(cos(a), sin(a)) * r / SQRT3;
}

// ─── Draw a single triangle as 3 edge segments ───────────────
float triangleEdges(vec2 p, float r, float rotation, float w) {
  float d = 1e9;
  for (int i = 0; i < 3; i++) {
    // Vertices of equilateral triangle at 0°, 120°, 240° + rotation
    float a1 = float(i) * TAU / 3.0 + rotation;
    float a2 = float((i + 1) % 3) * TAU / 3.0 + rotation;
    vec2 v1 = vec2(cos(a1), sin(a1)) * r;
    vec2 v2 = vec2(cos(a2), sin(a2)) * r;
    d = min(d, sdSeg(p, v1, v2, w));
  }
  return d;
}

// ─── Main ─────────────────────────────────────────────────────
void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_speed;

  vec3 col = vec3(0.0);

  float r = 0.28;  // triangle circumradius
  float w = 0.004; // line thickness

  // ── Counter-rotating triangles ────────────────────────────────
  float rot1 =  t * 0.3;                 // upward triangle — electric/masculine
  float rot2 = -t * 0.3 + PI;            // downward triangle — magnetic/feminine (starts inverted)

  // Triangle SDFs (filled)
  float dUp   = sdTriangle(rot2(rot1) * uv, r);
  float dDown = sdTriangleDown(rot2(rot2) * uv, r);

  // Edge glow for each triangle
  float edgeUp   = exp(-abs(dUp)   / 0.006) * 1.5;
  float edgeDown = exp(-abs(dDown) / 0.006) * 1.5;

  // Inner fill (very dim)
  float fillUp   = max(-dUp,   0.0) > 0.0 ? 0.08 : 0.0;
  float fillDown = max(-dDown, 0.0) > 0.0 ? 0.08 : 0.0;

  // Colors: upward = electric blue (Shiva/masculine)
  //         downward = hot pink (Shakti/feminine)
  vec3 colUp   = hsb2rgb(vec3(0.6 + 0.03 * sin(t), 0.9, 0.9));   // electric blue
  vec3 colDown = hsb2rgb(vec3(0.95 + 0.03 * sin(t * 1.3), 0.9, 0.9));  // magenta

  col += colUp   * (edgeUp   + fillUp);
  col += colDown * (edgeDown + fillDown);

  // ── Intersection zone ─────────────────────────────────────────
  // Where both triangles overlap = sacred union = Star center
  bool inUp   = dUp   < 0.0;
  bool inDown = dDown < 0.0;
  if (inUp && inDown) {
    // Central hexagonal intersection — glow white/gold
    float intensity = 0.4 + 0.3 * sin(t * 3.0 + length(uv) * 10.0);
    col += mix(vec3(1.0, 0.8, 0.3), vec3(1.0), intensity) * 0.6;
  }

  // ── Phi-ratio ring emanations ─────────────────────────────────
  for (int ring = 0; ring < 6; ring++) {
    float ringR = r * pow(PHI, float(ring) - 1.0) * 0.3;
    float d = abs(length(uv) - ringR) - 0.002;
    float hue = mod(float(ring) / 6.0 + t * 0.1, 1.0);
    float glow = exp(-max(d, 0.0) / 0.012) * 0.25;
    col += hsb2rgb(vec3(hue, 0.7, 0.8)) * glow;
  }

  // ── 6 radial axes (spokes of star) ───────────────────────────
  for (int i = 0; i < 6; i++) {
    float a = float(i) * PI / 3.0;
    vec2 spoke = vec2(cos(a), sin(a));
    float proj = abs(dot(uv, vec2(-spoke.y, spoke.x)));  // perpendicular distance
    float along = dot(uv, spoke);
    if (along > 0.0 && along < r * 1.5) {
      float d = proj - 0.002;
      float g = exp(-max(d, 0.0) / 0.01) * 0.15;
      col += vec3(0.8, 0.9, 1.0) * g;
    }
  }

  // ── Center bindu ─────────────────────────────────────────────
  float bindu = exp(-length(uv) / 0.01) * 3.0;
  col += vec3(1.0) * bindu;

  // ── 6 outer star points (vertices) ───────────────────────────
  for (int i = 0; i < 6; i++) {
    vec2 pt = starPoint(i, r, rot1 * 0.5);  // slowly rotate
    float d = length(uv - pt);
    col += hsb2rgb(vec3(float(i)/6.0 + t*0.1, 0.9, 0.9)) * exp(-d / 0.015) * 0.8;
  }

  // ── Vignette ─────────────────────────────────────────────────
  col *= 1.0 - smoothstep(0.35, 0.7, length(uv));

  // ── Tone + gamma ─────────────────────────────────────────────
  col = col / (col + 0.6);
  col = pow(max(col, 0.0), vec3(1.0/2.2));

  fragColor = vec4(col, 1.0);
}
