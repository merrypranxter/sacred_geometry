# AI Prompting Guide — Sacred Geometry

How to use this repo's data for AI art generation (Midjourney, SDXL, Flux, DALL-E, etc.) and GLSL shader generation (Claude, ChatGPT, shader tools).

---

## Quick Formula

```
[FORM NAME] + [STYLE] + [COLOR PALETTE] + [RENDER STYLE] + [QUALITY BOOSTERS]
```

### Example

```
Flower of Life mandala, neon psychedelic maximalist, electric cyan and magenta 
on black void, bioluminescent glow, infinite zoom, photorealistic sacred geometry, 
8K, ultra-detail, professional digital art
```

---

## Style Tags by Aesthetic

### Psychedelic / Maximalist
```
neon psychedelic, Lisa Frank sacred geometry, maximalist mandala, 
bioluminescent, electric plasma glow, iridescent interference patterns,
chromatic aberration overlay, DMT geometry, hyperspace tunnel, 
trippy mathematical art, visionary art style
```

### Cyber / Brutalist
```
neon cyber-brutalist, wireframe sacred geometry, holographic blueprint,
electric grid, dark void background, glitch art sacred, 
terminal green sacred, cyan on black, cosmic horror geometry
```

### Classical / Traditional
```
sacred geometry illuminated manuscript, gold leaf on lapis, 
medieval geometric, Sufi geometric tilework, Gothic architectural geometry,
Islamic arabesque sacred, Byzantine mosaic sacred, 
ancient Egyptian mathematical diagram
```

### Crystalline / Mineral
```
crystalline sacred geometry, geometric mineral formation, 
quartz crystal growth pattern, bismuth-like sacred structure,
iridescent mineral sacred, geode geometry, fluorite octahedral
```

### 3D / Volumetric
```
3D sacred geometry render, volumetric light sacred geometry,
ray-traced mathematical solid, floating geometric form,
cinematic sacred geometry, studio light sacred form
```

---

## Form-Specific Prompts

### Flower of Life
```
Flower of Life hexagonal mandala, 19 overlapping circles, 
[COLOR], glowing intersection nodes, infinite recursion, [STYLE]
```

### Metatron's Cube
```
Metatron's Cube sacred geometry, 78 connecting lines, all five Platonic 
solids embedded, [COLOR], cosmic blueprint on void, [STYLE]
```

### Sri Yantra
```
Sri Yantra tantric mandala, nine interlocking triangles, 43 sub-triangles,
lotus petals, bhupura square border, bindu center point glowing,
[COLOR], [STYLE]
```

### Golden Spiral
```
Golden ratio logarithmic spiral, φ = 1.618, self-similar infinite zoom,
Fibonacci rectangles visible, [COLOR], [STYLE]
```

### Merkaba / Star Tetrahedron
```
Merkaba star tetrahedron, two counter-rotating tetrahedra, 
light body activation geometry, [COLOR], [STYLE]
```

### Torus
```
Torus sacred geometry, vortex mathematics, self-referential donut topology,
field lines visible, [COLOR], [STYLE]
```

---

## GLSL Shader Prompts (for Claude / ChatGPT)

Use this template when asking AI to generate shaders:

```
Write a GLSL ES 3.0 fragment shader for [FORM NAME].

Requirements:
- Uniform inputs: u_time (float), u_resolution (vec2)
- Animated: [describe animation]
- Color scheme: [describe colors / hue approach]
- Use SDFs (signed distance functions) for geometry
- Add glow/bloom using exponential falloff
- Normalize UV to (-1, 1) range with aspect correction

Key math:
[paste relevant math from the YAML file]

Style notes:
[paste art_direction.glsl_notes from the YAML file]
```

### Example GLSL Request
```
Write a GLSL ES 3.0 fragment shader for the Flower of Life.

Requirements:
- Uniform inputs: u_time (float), u_resolution (vec2)
- Animated: circles breathe (radius pulses with sin(time))
- Color scheme: hue rotation based on atan2(y,x) + time, full saturation
- Use hexagonal grid to place circle centers efficiently
- Center-to-center distance = radius (exact Flower of Life proportions)
- Add glow using exp(-d/softness) falloff at circle edges
- Highlight intersection zones with additive white

Key math:
- Hexagonal grid: offset rows by 0.5 × spacing
- Spacing = r * SQRT3 for flat-top hexagons
- Or spacing = 2r for the circle-packing arrangement

Style notes:
Use hexagonal SDF for base grid. Animate by modulating circle radius r 
with sin(time + dist_from_center × 0.3). For color: use hue rotation 
based on angle to center (atan2) + time. Bloom/glow: add exponential 
falloff from circle edges.
```

---

## p5.js Sketch Request Template

```
Write a p5.js sketch that draws [FORM NAME].

Setup:
- Canvas: 700×700, black background
- Color mode: HSB
- No fill, strokes only (or specify fill behavior)

Geometry:
[paste construction steps from YAML]

Animation:
- [describe animation]
- Animate with frameCount or a time variable

Controls (optional):
- Keyboard 'p' to pause/play
- Slider for [parameter]

Style:
[paste aesthetic_tags from art_direction]
Palette: [paste hex values from color_palettes.psychedelic[0]]
```

---

## Stable Diffusion / Flux Negative Prompts

Add these to avoid common issues:

```
blurry, low quality, photographic, realistic human, text, watermark, 
asymmetric when symmetry expected, distorted circles, broken lines,
JPEG artifacts, oversaturated without detail, cartoonish
```

---

## Useful LoRA / Style Combos (Midjourney / SDXL)

These styles pair well with sacred geometry:

| Style | Effect |
|-------|--------|
| `--style raw` (MJ) | Less AI-default, more literal |
| Alex Grey aesthetic | Psychedelic anatomical sacred |
| Android Jones | Maximalist digital sacred |
| Beksinski | Dark cosmic sacred horror |
| M.C. Escher | Impossible geometric tiling |
| Ernst Haeckel | Natural scientific sacred geometry |
| Hilma af Klint | Abstract spiritual pastel geometry |

---

## Batch Prompt Generator

Use `utils/export/prompt_builder.js` to auto-generate prompts from YAML:

```bash
node utils/export/prompt_builder.js --form flower_of_life --style psychedelic
```

Outputs ready-to-paste prompts for multiple platforms.
