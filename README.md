# 🔯 sacred_geometry

> *"Geometry is knowledge of the eternally existent."* — Plato

A structured reference database + generative art toolkit for sacred geometry. Mathematical constructions, YAML data files, p5.js sketches, GLSL shaders, and algorithmic generation tools — all annotated for AI art prompting and generative code.

---

## 🌀 What's In Here

| Directory | Contents |
|-----------|----------|
| `data/forms/` | YAML data for each sacred form: math, proportions, symbolism, art direction |
| `data/constants/` | Universal constants: φ, π, √2, √3, √5, Fibonacci |
| `data/traditions/` | Cultural/esoteric context per tradition |
| `data/color_palettes/` | Psychedelic + traditional color palettes per form |
| `data/platonic_solids/` | All 5 Platonic solids with full geometric data |
| `sketches/p5js/` | p5.js implementations (interactive, animated) |
| `sketches/vanilla/` | Vanilla JS canvas implementations |
| `shaders/fragment/` | GLSL fragment shaders |
| `shaders/vertex/` | GLSL vertex shaders |
| `svg/generators/` | SVG generation scripts |
| `utils/math/` | Construction algorithms and math utilities |
| `docs/` | Deep dives on construction methods |

---

## 📐 Forms Included

### Foundational
- **Vesica Piscis** — the primordial intersection, root of √3
- **Seed of Life** — 7 circles, first breath of creation
- **Flower of Life** — 19-circle matrix, Metatron's template
- **Fruit of Life** — 13 circles extracted from Flower
- **Tree of Life (Kabbalah)** — 10 sefirot, 22 paths

### Complex Forms
- **Metatron's Cube** — all 5 Platonic solids embedded
- **Sri Yantra** — 9 interlocking triangles, 43 sub-triangles
- **Merkaba (Star Tetrahedron)** — counter-rotating tetrahedra
- **Torus** — self-referential vortex form
- **64 Tetrahedron Grid** — vector equilibrium expansion

### Spirals & Ratios
- **Golden Spiral / Fibonacci Spiral**
- **Logarithmic Spiral**
- **Archimedean Spiral**

### Platonic Solids
- Tetrahedron (Fire), Cube/Hexahedron (Earth), Octahedron (Air), Dodecahedron (Aether), Icosahedron (Water)

---

## ⚡ Quick Start

```bash
git clone https://github.com/merrypranxter/sacred_geometry.git
cd sacred_geometry

# Run a p5.js sketch (open in browser)
open sketches/p5js/flower_of_life.html

# Generate an SVG
node svg/generators/metatrons_cube.js

# Run construction math utilities
node utils/math/sacred_math.js
```

---

## 🎨 YAML Data Structure

Every form in `data/forms/` follows this schema:

```yaml
name: "Form Name"
aliases: []
category: foundational | complex | spiral | platonic
construction:
  method: compass_and_straightedge | algorithmic | both
  steps: []
  key_angles: []
  key_ratios: []
mathematics:
  core_constant: phi | sqrt2 | sqrt3 | pi
  formulas: {}
  properties: []
symbolism:
  traditions: {}
  themes: []
color_palettes:
  psychedelic: []
  traditional: []
art_direction:
  aesthetic_tags: []
  prompt_fragments: []
  glsl_notes: ""
generative:
  p5js_sketch: ""
  shader_file: ""
  svg_generator: ""
```

---

## 🔬 Mathematical Constants

All constants are in `data/constants/universal_constants.yaml`:

- **φ (Phi / Golden Ratio)**: 1.6180339887...
- **π (Pi)**: 3.14159265358...
- **√2**: 1.41421356...
- **√3**: 1.73205080...
- **√5**: 2.23606797...
- **e (Euler's Number)**: 2.71828182...
- **Fibonacci Sequence**: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89...

---

## 🧠 AI Art Prompting

Each YAML file has an `art_direction` block with:
- `aesthetic_tags` — visual descriptors for diffusion models
- `prompt_fragments` — copy-paste prompt pieces
- `glsl_notes` — parameter hints for shader generation

Use `utils/export/prompt_builder.js` to concatenate fields into a full prompt.

---

## 🛠 Tech Stack

- **Data**: YAML
- **Sketches**: p5.js v1.9+, vanilla JS / Canvas API
- **Shaders**: GLSL ES 3.0
- **SVG**: Plain JavaScript (no dependencies)
- **Utilities**: Node.js 18+

---

## 📚 Docs

- [Construction Methods](docs/construction_methods.md)
- [Mathematical Relationships](docs/mathematical_relationships.md)
- [Shader Implementation Notes](docs/shader_notes.md)
- [AI Prompting Guide](docs/ai_prompting_guide.md)

---

## 🌐 Related Repos

- [astral-os](https://github.com/merrypranxter/astral-os) — occult OS cosmology database
- [emerald_os](https://github.com/merrypranxter/emerald_os) — Emerald Tablets cosmology
- [dream_physics](https://github.com/merrypranxter/dream_physics) — dream physics taxonomy

---

## License

MIT — use it, remix it, transmute it.
