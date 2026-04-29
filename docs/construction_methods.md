# Sacred Geometry Construction Methods

## Two Fundamental Approaches

### 1. Compass and Straightedge
The classical method. Used since antiquity. Pure and constraint-based — you can only do what these two tools permit. Produces exact results.

**What you can do:**
- Draw a circle of any radius from any center
- Draw a line through any two points
- Find intersections of circles and lines

**What you CAN'T do (the impossible trio):**
- Square the circle (construct a square with area = πr²)
- Trisect an arbitrary angle
- Double the cube (construct ∛2 exactly)

These three are provably impossible — proven in the 19th century using Galois theory.

### 2. Algorithmic / Computational
Use coordinate geometry and parametric equations. Can do anything compass+straightedge can do, plus much more. But loses the "purity" constraint.

---

## Standard Construction Techniques

### Bisecting a Line Segment
1. Draw circle centered at each endpoint with radius > half the segment length
2. The two intersection points define the perpendicular bisector
3. The bisector crosses the segment at its midpoint

### Perpendicular from a Point to a Line
1. Draw a circle centered at the point, intersecting the line at two points
2. Bisect the segment between those two intersection points (see above)
3. The bisector is perpendicular to the original line

### Constructing √2
1. Draw a unit square (side = 1)
2. The diagonal = √2 (Pythagorean theorem: 1² + 1² = 2)

### Constructing √3
1. Draw a Vesica Piscis (two unit circles centered 1 unit apart)
2. The height of the lens shape = √3

### Constructing √5
1. Draw a 1×2 rectangle
2. The diagonal = √5

### Constructing φ (Golden Ratio)
1. Draw a unit square ABCD
2. Find the midpoint M of one side (e.g., AB)
3. Draw a circle centered at M with radius MC (= √(1/4 + 1) = √(5/4) = √5/2)
4. The circle intersects the extension of AB at point E
5. AE = (1 + √5)/2 = φ

### Regular Pentagon (using φ)
1. Construct φ using the above method
2. The diagonal of a regular pentagon is φ × its side length
3. Alternatively: inscribe in circle with 72° central angles (2π/5 radians)

### Hexagonal Grid (Flower of Life method)
1. Draw a circle
2. Mark any point on the circumference
3. Use that same radius to step around the circle — each step = one radius
4. After 6 steps, you return to the start (because hexagon inscribes exactly)
5. Connect the 6 points to get a regular hexagon
6. Draw circles at each of the 6 points (same radius) → Seed of Life

---

## Key Geometric Proofs

### Why 6 Circles Fit Around 1 (Flower of Life)
The equilateral triangle has 60° interior angles.
6 × 60° = 360°.
So 6 equilateral triangles share a vertex without gap or overlap.
The Vesica Piscis creates equilateral triangles.
Therefore: 6 circles of radius r fit exactly around 1 central circle of radius r.

### Why the Vesica Has √3 Ratio
Two circles, radius r, centers 1 unit apart.
The intersection points are at distance r from both centers.
They form equilateral triangles with the centers.
Height of equilateral triangle with side 1 = √3/2.
Both intersection points, so total height = √3.

### Why Regular Polygons Have These Interior Angles
Sum of interior angles of n-gon = (n-2) × 180°
Each angle of regular n-gon = (n-2) × 180° / n

```
n=3 (triangle):  60°
n=4 (square):    90°
n=5 (pentagon):  108°
n=6 (hexagon):   120°
n=7 (heptagon):  ≈128.57°
n=8 (octagon):   135°
n=∞ (circle):    180°
```

Only triangles, squares, and hexagons tile the plane.
Why? Their interior angles (60°, 90°, 120°) divide evenly into 360°.

---

## 3D Construction: Platonic Solids

### Tetrahedron from a Cube
Mark alternating vertices of a cube: (1,1,1), (1,-1,-1), (-1,1,-1), (-1,-1,1).
These 4 points are the vertices of a regular tetrahedron.
This also shows: two tetrahedra fill a cube (stella octangula).

### Octahedron from Cube Centers
Take the centers of each face of a cube.
6 faces → 6 center points → regular octahedron.
This is the dual relationship: octahedron and cube are dual Platonic solids.

### Icosahedron from 3 Golden Rectangles
Three mutually perpendicular golden rectangles, all sharing the same center.
Their 12 corners are the vertices of a regular icosahedron.
The golden rectangles have dimensions 1 × φ.

---

## Digital Construction Tips

### Snapping to Exact Values
When implementing in code, use exact fractions or symbolic values:
- √3: use `Math.sqrt(3)` or precompute to 15+ decimal places
- φ: use `(1 + Math.sqrt(5)) / 2`
- Never use approximations like `1.732` — accumulation error ruins precision

### Anti-aliasing Sacred Geometry
Signed Distance Functions (SDFs) give analytical anti-aliasing:
- SDF of circle: `length(p - center) - r`
- Smooth edge: `smoothstep(0, -AA_AMOUNT, SDF_value)`
- Where `AA_AMOUNT = 1.0 / min(resolution.x, resolution.y)` (one pixel)

### Coordinate Conventions
- Math convention: Y+ is up, angles counter-clockwise
- Screen/canvas convention: Y+ is down
- p5.js: Y+ is down — `angleMode(RADIANS)`, use `translate(cx, cy)` to center
- GLSL: Y+ is up — normalize UV with `(fragCoord - resolution/2) / min(resolution.xy)`
