# JavaScript Visualization Plan: Fibonacci Heap Priority Queue

## 1) Goals
- Build an in-browser educational visualization of a Fibonacci Heap–backed priority queue.
- Use the USFCA visualization as inspiration while implementing our own code and interaction model.
- Support the full teaching flow for core operations:
  - `insert`
  - `findMin`
  - `extractMin`
  - `decreaseKey` (explicitly required)
  - `delete` (implemented as `decreaseKey(node, -Infinity)` then `extractMin`)
- Publish as a static site on GitHub Pages.

## 2) Scope and Non-Goals
### In scope
- Single-page application with controls, animated heap transitions, and operation log.
- Deterministic demo mode and step-by-step operation playback.
- Stable node identifiers so users can pick any node for `decreaseKey`.

### Out of scope (first milestone)
- No backend or server-side rendering.
- No external database persistence.
- No advanced accessibility beyond keyboard-capable controls and readable color contrast.

## 3) Proposed Tech Stack
- **Language:** Vanilla JavaScript (ES modules).
- **Rendering:** SVG (preferred) for clear edge/parent-link visualization.
- **Styling:** Minimal CSS + CSS custom properties.
- **Tooling:** No framework required. Keep deployment friction low for GitHub Pages.
- **Testing:**
  - Unit tests for heap logic with Vitest (or Jest).
  - Optional Playwright snapshot tests for rendering states.

## 4) Project Structure (suggested)
```
/docs/
  index.html
  styles.css
  app.js
  /src
    fibonacciHeap.js      // data structure and algorithmic invariants
    visualModel.js        // layout and render-ready graph transformation
    rendererSvg.js        // SVG scene drawing + transitions
    controller.js         // UI event handlers and orchestration
    operations.js         // replayable operation definitions
    fixtures.js           // deterministic demo datasets
  /tests
    fibonacciHeap.test.js
```

> GitHub Pages can serve directly from `/docs` on the main branch.

## 5) Data Model and Algorithm API
Represent each heap node as:
```js
{
  id: string,
  key: number,
  degree: number,
  marked: boolean,
  parent: Node | null,
  child: Node | null,
  left: Node,
  right: Node
}
```

Heap object:
- `min: Node | null`
- `n: number`
- circular doubly linked root list

API:
- `insert(key) -> nodeId`
- `findMin() -> { id, key } | null`
- `extractMin() -> { id, key } | null`
- `decreaseKey(nodeId, newKey) -> void`
- `delete(nodeId) -> void`
- `toSnapshot() -> SerializableState`

## 6) Decrease Key UX Plan
`decreaseKey` is usually the hardest operation to make intuitive. Proposed UX:
1. User selects a node by clicking it in the visualization (or selecting from a node list).
2. Control panel enables `newKey` input.
3. On submit:
   - Validate `newKey <= currentKey`.
   - Animate key update.
   - If heap-order violated with parent, animate:
     - cut (`x` removed from parent child-list to root list)
     - cascading cuts up ancestors while marked nodes are encountered.
   - Update and highlight new `min` if applicable.
4. Append detailed log entries such as:
   - `decreaseKey(node=17, old=42, new=5)`
   - `cut(node=17, parent=9)`
   - `cascadingCut(node=9)`

## 7) Visualization Strategy
- Root list displayed left-to-right with each tree laid out top-down.
- Child links as curved SVG paths.
- Node badges:
  - key
  - id
  - mark indicator (dot/ring)
- Color cues:
  - min node: accent color
  - recently touched nodes: temporary highlight
  - marked nodes: warning tone
- Animation phases per operation:
  1. pre-state highlight
  2. structural mutation
  3. post-state settle

## 8) Interaction Design
Control panel:
- Insert key
- Extract min
- Find min
- Decrease key (selected node + new key)
- Delete selected node
- Reset heap
- Load sample scenario
- Play/Pause step log
- Animation speed slider

Additional affordances:
- Hover tooltip with node metadata (`degree`, `marked`, `parentId`).
- Toggle “show pointers” mode for left/right sibling links (debug/teaching).

## 9) Correctness and Invariant Checks
Add invariant validator callable after each operation in dev mode:
- root list is circular and doubly linked correctly.
- each child list is circular and consistent.
- heap order property holds for parent-child pairs.
- `degree` equals child count.
- `min` truly points to minimum key.
- `n` equals traversed node count.

When violation occurs:
- pause animation,
- display explicit invariant failure message,
- print offending node IDs.

## 10) Milestone Plan
### Milestone 1: Core heap engine
- Implement Fibonacci heap operations + unit tests.
- Include operation trace hooks for animation.

### Milestone 2: Static rendering
- Render snapshot into SVG without animations.
- Node selection + operation controls wired.

### Milestone 3: Animation + DecreaseKey teaching flow
- Add cut/cascading-cut animations.
- Add operation log + step playback.

### Milestone 4: GitHub Pages polish
- Responsive layout, docs, and sample scenarios.
- CI check for tests and linting.

## 11) GitHub Pages Deployment Plan
1. Keep web app in `/docs`.
2. In repository settings:
   - Pages source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
3. Add npm scripts (if tooling adopted):
   - `test`
   - `lint`
   - `build` (optional if no bundler)
4. Add GitHub Actions workflow to run tests on pull requests.

## 12) Immediate Next Steps
1. Create minimal `docs/index.html` shell + control panel placeholders.
2. Implement `src/fibonacciHeap.js` with tests first.
3. Add snapshot serializer and initial SVG renderer.
4. Implement `decreaseKey` interaction + cut animations.
5. Publish first playable version to GitHub Pages.
