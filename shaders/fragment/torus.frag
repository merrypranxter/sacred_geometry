#version 300 es
// ============================================================
// TORUS — Fragment Shader (Raymarched 3D)
// sacred_geometry/shaders/fragment/torus.frag
//
// Full 3D raymarched torus with:
// - Poloidal/toroidal field lines
// - Iridescent surface
// - Vortex animation
// - Sacred geometry overlays
// ============================================================
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_speed;
uniform float u_major_r;  // major radius (default 0.35)
uniform float u_minor_r;  // minor radius (default 0.13)

out vec4 fragColor;

#define PI  3.14159265358979
#define TAU 6.28318530717959
#define PHI 1.61803398874989
#define MAX_STEPS 80
#define MAX_DIST  5.0
#define MIN_DIST  0.001

// ─── Utilities ────────────────────────────────────────────────
vec3 hsb2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

mat3 rotX(float a) { float s=sin(a),c=cos(a); return mat3(1,0,0, 0,c,-s, 0,s,c); }
mat3 rotY(float a) { float s=sin(a),c=cos(a); return mat3(c,0,s, 0,1,0, -s,0,c); }
mat3 rotZ(float a) { float s=sin(a),c=cos(a); return mat3(c,-s,0, s,c,0, 0,0,1); }

// ─── Torus SDF ────────────────────────────────────────────────
float sdTorus(vec3 p, float R, float r) {
  vec2 q = vec2(length(p.xz) - R, p.y);
  return length(q) - r;
}

// Torus with twist (toroidal twisting deformation)
float sdTorusTwist(vec3 p, float R, float r, float twist) {
  float theta = atan(p.z, p.x);  // toroidal angle
  // Twist: rotate the poloidal position by angle proportional to theta
  float twistA = theta * twist;
  float ct = cos(twistA), st = sin(twistA);
  vec3 q = vec3(p.x, p.y * ct - p.z * st, p.y * st + p.z * ct);
  return sdTorus(q, R, r);
}

// ─── Scene SDF ────────────────────────────────────────────────
float scene(vec3 p, float t, float R, float r) {
  float twist = 0.3 * sin(t * 0.5);
  return sdTorusTwist(p, R, r, twist);
}

// ─── Surface properties at a point on the torus ───────────────
struct Surface {
  float toroidalAngle;   // around the ring
  float poloidalAngle;   // around the tube
  float dist;
};

Surface torusAngles(vec3 p, float R) {
  float toroidal = atan(p.z, p.x);
  vec3 torusCenter = vec3(cos(toroidal), 0.0, sin(toroidal)) * R;
  vec3 toTube = p - torusCenter;
  float poloidal = atan(toTube.y, length(toTube.xz) - R);
  return Surface(toroidal, poloidal, length(toTube));
}

// ─── Normal via finite differences ────────────────────────────
vec3 normal(vec3 p, float t, float R, float r) {
  float e = 0.001;
  return normalize(vec3(
    scene(p + vec3(e,0,0), t, R, r) - scene(p - vec3(e,0,0), t, R, r),
    scene(p + vec3(0,e,0), t, R, r) - scene(p - vec3(0,e,0), t, R, r),
    scene(p + vec3(0,0,e), t, R, r) - scene(p - vec3(0,0,e), t, R, r)
  ));
}

// ─── Iridescent / interference color ──────────────────────────
vec3 iridescent(vec3 n, vec3 viewDir, float t, Surface surf) {
  // Fresnel-like angle factor
  float fresnel = pow(1.0 - abs(dot(n, -viewDir)), 2.5);

  // Color bands from poloidal + toroidal angles + time
  float h1 = mod(surf.toroidalAngle / TAU + t * 0.1, 1.0);
  float h2 = mod(surf.poloidalAngle / TAU * 3.0 + t * 0.2, 1.0);

  // Interference: two hue sources
  float hue = mix(h1, h2, 0.5 + 0.5 * sin(t + surf.toroidalAngle * 3.0));
  float sat = 0.7 + 0.3 * fresnel;
  float bri = 0.4 + 0.6 * (0.5 + 0.5 * sin(surf.poloidalAngle * 5.0 + t));

  vec3 base = hsb2rgb(vec3(hue, sat, bri));

  // Iridescent sheen: adds complementary hue at grazing angles
  vec3 sheen = hsb2rgb(vec3(mod(hue + 0.5, 1.0), 0.9, 0.9));
  return mix(base, sheen, fresnel * 0.7);
}

// ─── Field lines (poloidal + toroidal) ────────────────────────
float fieldLine(Surface surf, float density, float width) {
  float pol = mod(surf.poloidalAngle * density / TAU, 1.0);
  float tor = mod(surf.toroidalAngle * density / TAU, 1.0);
  float p = abs(pol - 0.5) * 2.0;
  float q = abs(tor - 0.5) * 2.0;
  return smoothstep(width, 0.0, min(p, q));
}

// ─── Raymarching ──────────────────────────────────────────────
void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_speed;

  float R = u_major_r > 0.0 ? u_major_r : 0.35;
  float r = u_minor_r > 0.0 ? u_minor_r : 0.13;

  // ── Camera ───────────────────────────────────────────────────
  vec3 camPos = vec3(0.0, 0.6, 1.4);
  vec3 target = vec3(0.0, 0.0, 0.0);
  vec3 fwd = normalize(target - camPos);
  vec3 right = normalize(cross(vec3(0,1,0), fwd));
  vec3 up = cross(fwd, right);

  float fov = 1.2;
  vec3 rd = normalize(uv.x * right * fov + uv.y * up * fov + fwd);

  // Rotate camera around Y axis
  float camAngle = t * 0.25;
  mat3 camRot = rotY(camAngle);
  vec3 ro = camRot * camPos;
  rd = camRot * rd;

  // Also tilt the torus slightly over time
  // (rotate the geometry instead of camera for variety)

  // ── Raymarch ─────────────────────────────────────────────────
  float dist = 0.0;
  float d = 0.0;
  bool hit = false;

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * dist;
    d = scene(p, t, R, r);
    if (d < MIN_DIST) { hit = true; break; }
    if (dist > MAX_DIST) break;
    dist += d;
  }

  vec3 col = vec3(0.0);

  if (hit) {
    vec3 p = ro + rd * dist;
    vec3 n = normal(p, t, R, r);

    // Surface properties
    Surface surf = torusAngles(p, R);

    // Iridescent color
    vec3 surfCol = iridescent(n, rd, t, surf);

    // Field lines
    float fields = fieldLine(surf, 8.0, 0.06);
    surfCol = mix(surfCol, vec3(1.0), fields * 0.5);

    // Simple diffuse lighting
    vec3 lightDir = normalize(vec3(sin(t*0.3)*2.0, 2.0, cos(t*0.3)*2.0));
    float diff = max(dot(n, lightDir), 0.0);
    float ambient = 0.15;
    float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);

    col = surfCol * (ambient + diff * 0.7) + vec3(1.0) * spec * 0.4;

    // Edge glow (fresnel)
    float fresnel = pow(1.0 - abs(dot(n, -rd)), 3.0);
    col += hsb2rgb(vec3(mod(surf.toroidalAngle / TAU + t * 0.15, 1.0), 0.9, 0.9)) * fresnel * 0.6;

    // Fog
    float fog = exp(-dist * 0.5);
    col *= fog;
  }

  // ── Background: subtle starfield grid ────────────────────────
  if (!hit) {
    // Faint hexagonal grid in the void
    vec2 bgUV = uv * 5.0;
    float grid = min(
      mod(bgUV.x, 1.0),
      mod(bgUV.y, 1.0)
    );
    col = vec3(0.01, 0.01, 0.03) + vec3(0.02) * smoothstep(0.9, 1.0, 1.0 - abs(grid - 0.5) * 2.0);

    // Distant glow from torus (halo)
    float haloR = length(vec2(length(uv * vec2(1.0, 0.5)) - R * 0.7, 0.0));
    col += hsb2rgb(vec3(mod(t * 0.1, 1.0), 0.8, 0.6)) * exp(-haloR * 3.0) * 0.15;
  }

  // ── Vignette ─────────────────────────────────────────────────
  col *= 1.0 - smoothstep(0.4, 0.9, length(uv));

  // ── Tone + gamma ─────────────────────────────────────────────
  col = col / (col + 0.4);
  col = pow(max(col, 0.0), vec3(1.0/2.2));

  fragColor = vec4(col, 1.0);
}
