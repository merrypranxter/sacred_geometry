# GLSL Sacred Geometry Shader Cookbook
# sacred_geometry/docs/shader_notes.md
#
# SDF recipes, animation patterns, color techniques, and
# complete shader templates for sacred geometry forms.

---

## Setup: Standard UV Normalization

```glsl
// Always do this first — normalized, aspect-corrected, centered UV
void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  // uv is now:
  //   centered at (0,0)
  //   range [-0.5, 0.5] on the shorter axis
  //   range [-aspect/2, aspect/2] on the longer axis
  //   circles are circles (not ellipses)
}
```

---

## Core SDF Primitives

### Circle
```glsl
float sdCircle(vec2 p, vec2 center, float r) {
  return length(p - center) - r;
}
// d < 0 → inside, d == 0 → on edge, d > 0 → outside
```

### Line Segment (Capsule)
```glsl
float sdSegment(vec2 p, vec2 a, vec2 b, float thickness) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - thickness;
}
```

### Equilateral Triangle (sacred — base for tetrahedron, Sri Yantra)
```glsl
float sdEquilateralTriangle(vec2 p, float r) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
```

### Regular N-gon
```glsl
float sdPolygon(vec2 p, float r, int n) {
  float an = 3.14159 / float(n);
  float he = r * tan(an);
  // Rotate to symmetry
  float bn = mod(atan(p.y, p.x), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  // Distance to edge
  p -= vec2(r, 0.0);
  return length(p - vec2(min(p.x, 0.0), clamp(p.y, -he, he))) * sign(p.x);
}
```

### Pentagon
```glsl
float sdPentagon(vec2 p, float r) {
  return sdPolygon(p, r, 5);
}
```

### Hexagon
```glsl
float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.5773503);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}
```

### Annular Ring (circle band)
```glsl
float sdRing(vec2 p, vec2 center, float r, float thickness) {
  float d = length(p - center) - r;
  return abs(d) - thickness;
}
```

---

## 3D SDF Primitives (for Platonic solids)

### Sphere
```glsl
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}
```

### Tetrahedron
```glsl
float sdTetrahedron(vec3 p, float r) {
  float md = max(max(-p.x-p.y-p.z, p.x+p.y-p.z),
                 max(-p.x+p.y+p.z, p.x-p.y+p.z));
  return (md - r) / sqrt(3.0);
}
```

### Cube / Box
```glsl
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
```

### Octahedron
```glsl
float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}
```

### Torus
```glsl
float sdTorus(vec3 p, float R, float r) {
  vec2 q = vec2(length(p.xz) - R, p.y);
  return length(q) - r;
}
```

### Dodecahedron
```glsl
#define PHI 1.6180339887
float sdDodecahedron(vec3 p, float r) {
  p = abs(p);
  float a = dot(p, normalize(vec3(PHI, 1.0, 0.0)));
  float b = dot(p, normalize(vec3(0.0, PHI, 1.0)));
  float c = dot(p, normalize(vec3(1.0, 0.0, PHI)));
  return max(max(a, b), c) - r;
}
```

### Icosahedron
```glsl
float sdIcosahedron(vec3 p, float r) {
  p = abs(p);
  float PHI = 1.6180339887;
  vec3 n = normalize(vec3(PHI, 1.0, 0.0));
  float a = dot(p, n);
  n = normalize(vec3(0.0, PHI, 1.0));
  float b = dot(p, n);
  n = normalize(vec3(1.0, 0.0, PHI));
  float c = dot(p, n);
  float d = max(p.x, max(p.y, p.z));
  return max(max(max(a, b), c), d) - r;
}
```

---

## SDF Combination Operators

```glsl
// Union (either)
float opUnion(float a, float b) { return min(a, b); }

// Intersection (both)
float opIntersect(float a, float b) { return max(a, b); }

// Subtraction (a minus b)
float opSubtract(float a, float b) { return max(a, -b); }

// Smooth union (blended/melted)
float opSmoothUnion(float a, float b, float k) {
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

// Smooth subtraction
float opSmoothSubtract(float a, float b, float k) {
  float h = clamp(0.5 - 0.5*(a+b)/k, 0.0, 1.0);
  return mix(a, -b, h) + k*h*(1.0-h);
}
```

---

## Glow and Rendering Techniques

### Exponential Glow (from SDF)
```glsl
// Tight glow around edge
float glow(float d, float softness) {
  return exp(-abs(d) / softness);
}

// Outer glow only (no fill)
float glowOuter(float d, float softness) {
  return exp(-max(d, 0.0) / softness);
}

// Usage:
float d = sdCircle(uv, vec2(0.0), 0.3);
float edge = glow(d, 0.005);       // tight edge ring
float halo = glowOuter(d, 0.05);   // soft outer glow
vec3 col = circleColor * (edge + halo * 0.3);
```

### Anti-aliased Edge
```glsl
float aaEdge(float d) {
  float aa = 1.5 / min(u_resolution.x, u_resolution.y);  // 1.5 pixels
  return 1.0 - smoothstep(-aa, aa, d);
}
```

### Neon / Bloom Composite
```glsl
// Additive layers: base + bright core + colored halo
float d = sdCircle(uv, center, r);
float aa = 1.5 / min(u_resolution.x, u_resolution.y);
float fill   = 1.0 - smoothstep(-aa, aa, d);       // solid fill
float edge   = glow(d, 0.003);                       // bright edge
float bloom  = exp(-max(d, 0.0) / 0.04) * 0.4;     // wide glow
vec3 col = baseColor * fill
         + vec3(1.0) * edge                          // white hot core
         + neonColor * bloom;                        // colored bloom
```

---

## Color Techniques

### HSB to RGB
```glsl
vec3 hsb2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0,4,2), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}
// c.x = hue [0,1], c.y = saturation [0,1], c.z = brightness [0,1]
```

### Hue-based on Angle (for mandalas)
```glsl
// Color varies with angle around center — natural for radially symmetric forms
float angle = atan(uv.y, uv.x);               // -π to π
float hue = mod(angle / (2.0 * PI) + u_time * 0.1, 1.0);
vec3 color = hsb2rgb(vec3(hue, 0.9, 0.8));
```

### Hue-based on Distance (for spirals, nested forms)
```glsl
float dist = length(uv);
float hue = mod(log(dist) * 2.0 + u_time * 0.2, 1.0);  // log → good for spirals
vec3 color = hsb2rgb(vec3(hue, 1.0, 0.8));
```

### Palette Function (cosine gradient — Inigo Quilez)
```glsl
// a + b * cos(2π(c*t + d))
// Tune a,b,c,d for any color range
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

// Psychedelic preset
vec3 psychedelic(float t) {
  return palette(t,
    vec3(0.5, 0.5, 0.5),   // a
    vec3(0.5, 0.5, 0.5),   // b
    vec3(1.0, 1.0, 1.0),   // c
    vec3(0.0, 0.33, 0.67)  // d
  );
}

// Neon cyan-magenta
vec3 neonCM(float t) {
  return palette(t,
    vec3(0.5, 0.5, 0.5),
    vec3(0.5, 0.5, 0.5),
    vec3(1.0, 1.0, 0.5),
    vec3(0.8, 0.9, 0.3)
  );
}
```

### Interference / Moiré (two rotating patterns)
```glsl
// Add two patterns offset by a phase — creates interference
float pattern1 = sin(atan(uv.y, uv.x) * 6.0 + u_time);
float pattern2 = sin(atan(uv.y, uv.x) * 6.0 - u_time * 1.3);
float interference = (pattern1 + pattern2) * 0.5;
```

---

## Animation Patterns

### Breathing (radius pulse)
```glsl
float breathe(float baseR, float t) {
  return baseR * (1.0 + 0.05 * sin(t * 2.0));
}
```

### Phi-wave (ripple from center using φ spacing)
```glsl
// Wave that expands at φ intervals — looks "sacred"
float phiWave(float dist, float t) {
  float PHI = 1.6180339887;
  float phase = log(dist) / log(PHI);  // phase in φ-units
  return 0.5 + 0.5 * sin(phase * 6.28318 - t * 3.0);
}
```

### Rotation
```glsl
mat2 rot2D(float angle) {
  float s = sin(angle), c = cos(angle);
  return mat2(c, -s, s, c);
}
// Usage:
vec2 rotatedUV = rot2D(u_time * 0.5) * uv;
```

### Spin + Counter-spin (Merkaba style)
```glsl
vec2 uv1 = rot2D(u_time * 0.3) * uv;   // first tetrahedron
vec2 uv2 = rot2D(-u_time * 0.3) * uv;  // counter-rotate
float tri1 = sdEquilateralTriangle(uv1, 0.3);
float tri2 = sdEquilateralTriangle(uv2 * vec2(1, -1), 0.3);  // flip for downward
float star = min(tri1, tri2);  // union = Star of David
```

### Draw-on Animation (for Metatron's Cube)
```glsl
// Reveal lines progressively — use line index or distance-from-origin
float drawProgress = u_time * 0.3;  // 0 to 1 to draw all lines
float lineIndex = float(i) / float(totalLines);  // normalized line index
float visible = step(lineIndex, drawProgress);  // 0 or 1
```

---

## Sacred Geometry–Specific Recipes

### Hexagonal Grid for Flower of Life
```glsl
#define SQRT3 1.73205080756887

// Nearest hex cell center
vec2 hexCenter(vec2 p, float r) {
  // Axial coordinates
  float q = (2.0/3.0 * p.x) / r;
  float qf = (-1.0/3.0 * p.x + SQRT3/3.0 * p.y) / r;
  
  // Round to nearest hex
  float s = -q - qf;
  float rq = round(q), rr = round(qf), rs = round(s);
  float dq = abs(rq-q), dr = abs(rr-qf), ds = abs(rs-s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  
  // Convert back to cartesian
  return vec2(r * 3.0/2.0 * rq, r * SQRT3 * (rr + rq / 2.0));
}

// Distance to Flower of Life pattern
float flowerOfLife(vec2 uv, float r) {
  // Check all nearby hex cells
  float d = 1e9;
  for (int qi = -3; qi <= 3; qi++) {
    for (int ri = -3; ri <= 3; ri++) {
      // Hex distance (ring number)
      float hexDist = max(abs(qi), max(abs(ri), abs(qi+ri)));
      if (hexDist > 2.0) continue;  // 2 rings = 19 circles
      
      vec2 center = vec2(
        r * 2.0 * (float(qi) + float(ri) * 0.5),
        r * SQRT3 * float(ri)
      );
      d = min(d, abs(length(uv - center) - r));
    }
  }
  return d;
}
```

### Golden Spiral SDF
```glsl
#define LN_PHI 0.48121182505960345
#define B 0.30634896173178  // ln(phi)/(pi/2)

float goldenSpiral(vec2 p, float time, int arms) {
  float r = length(p);
  float theta = atan(p.y, p.x);
  if (r < 0.001) return 0.0;
  
  float logR = log(r);
  float minDist = 1000.0;
  
  for (int i = 0; i < 8; i++) {
    if (i >= arms) break;
    float armOffset = 6.28318 * float(i) / float(arms);
    float spiralTheta = logR / B;
    float dTheta = theta - spiralTheta - armOffset - time;
    dTheta = mod(dTheta + 3.14159, 6.28318) - 3.14159;
    minDist = min(minDist, abs(dTheta * r * B));
  }
  return minDist;
}
```

### Mandala (N-fold symmetry + layered rings)
```glsl
float mandala(vec2 uv, float t, int symmetry, int rings) {
  float r = length(uv);
  float theta = atan(uv.y, uv.x);
  
  // Apply N-fold symmetry
  float sector = 6.28318 / float(symmetry);
  theta = mod(theta, sector);
  // Mirror within sector
  if (theta > sector * 0.5) theta = sector - theta;
  
  // Reconstruct symmetric UV
  vec2 symUV = r * vec2(cos(theta), sin(theta));
  
  // Build layered rings
  float d = 1e9;
  for (int ring = 1; ring <= rings; ring++) {
    float ringR = float(ring) * 0.1;
    d = min(d, abs(r - ringR) - 0.005);
    // Petals on each ring
    int petals = ring * symmetry;
    for (int p = 0; p < petals * 2; p++) {
      // ... petal geometry
    }
  }
  return d;
}
```

---

## Full Shader Template

```glsl
#version 300 es
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
out vec4 fragColor;

#define PI  3.14159265358979
#define TAU 6.28318530717959
#define PHI 1.61803398874989

// ── Paste SDF functions here ──────────────────────────────────

vec3 hsb2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  float t = u_time;
  vec3 col = vec3(0.0);

  // ── Your geometry here ────────────────────────────────────

  // ── Tone map + gamma ─────────────────────────────────────
  col = col / (col + 0.5);              // Reinhard tone map
  col = pow(max(col, 0.0), vec3(1.0/2.2));  // gamma
  fragColor = vec4(col, 1.0);
}
```

---

## Common Bugs and Fixes

| Bug | Fix |
|-----|-----|
| Circles look like ellipses | Normalize UV by `min(res.x, res.y)` not just `res.x` |
| Pattern flickers at edges | Use `smoothstep` not `step` — add `aa = 1.5/resolution` |
| Colors look flat/banded | Use `pow(col, 1/2.2)` gamma at end |
| Colors blow out to white | Use Reinhard: `col/(col+0.5)` or `col/(col+1.0)` |
| Spiral doesn't converge | Check b = `ln(phi)/(pi/2)` ≈ 0.30635, not 0.3 |
| Hexagonal grid offset wrong | Even rows: `x += 0.5 * spacing` — not every row |
| SDF gives wrong shape | Remember: SDF = 0 is the surface, not the interior |
| Star tetrahedron wrong | One tetrahedron needs `p *= vec3(1,-1,1)` to flip |
