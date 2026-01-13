# Mnemonic Ladder

A web-based visual memory encoding tool that merges the ancient **Loci Method (Memory Palace)** with modern **Graph Theory** and **Linked Data** principles.

## 🧠 The Concept

**Mnemonic Ladder** is a grid-based workspace where you "interlock" words like a crossword. The goal isn't to solve a puzzle, but to create a physical "shape" (engram) for memory encoding. It transforms abstract information into a spatial, navigable structure.

### 🧱 The Backbone (The Crossword)
Instead of memorizing a flat list of words, you "interlock" them. The spatial relationship (where Word A is horizontal and Word B branches off one of A's letter's vertically) creates a unique visual **engram**. Your brain encodes the shape of the grid just as strongly as the words themselves.

### 🧵 The Hamiltonian Path
The tool enforces a "single path" rule (a Directed Acyclic Graph or linear traversal). Every word must touch the one placed immediately before it. This turns a messy pile of information into a **directed data stream** or a narrative arc. Even if the visual layout looks complex, the underlying story follows one specific, unbreakable line.

### 🪜 Infinite Nesting (Ladders)
This is the implementation of **Linked Data**. Any word in a grid can act as a "Ladder" (a pointer) to a completely new sub-layer. This mirrors how file systems or hyperlinked thoughts (like Obsidian or Roam Research) work, but visualized as a 2D recursive grid. You can start with a 30,000-foot view of a subject and "drill down" into infinite detail.

---

## 👶 ELI5: Why this works

### 1. The "Sticky" Factor (Engrams)
Standard lists are boring; your brain hates them. But your brain loves spatial layouts and weird shapes. By forcing words to interlock, you aren't just remembering "Apple, Dog, House", you're remembering a unique visual "staircase" or L-shape made of those words. This visual trace is called an **engram**, and it's much harder to forget than flat text.

### 2. The "Breadcrumb" Rule (The Single Path)
This rule turns information into a movie script. Because every word must touch the one before it, you create a "narrative arc." If you remember the first word, your brain naturally "follows the track" to the next one because they are physically welded together in the grid. You can't get lost because there’s only one road.

### 3. The "Inception" Effect (Nesting)
Imagine one word in your grid is "Calculus." You double-click it, and it opens a whole new grid just for Calculus terms. You’re building a **Fractal Mind Map**. You can organize infinite information without feeling overwhelmed by zooming in and out of nested layers.

---

## 🛠️ Technical Stack

- **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with persistence and undo/redo support)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Brutalist aesthetic)
- **Viewport/UX**: [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch) for the infinite canvas experience
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utilities**: `clsx`, `tailwind-merge`

---

## 🚀 Key Features

- **Infinite 2D Grid**: A canvas with fluid pan and zoom.
- **Single Path Validator**: Real-time feedback on your engram's connectivity.
- **Stability Scoring**: A "gamified" indicator of how well-interlocked and deep your memory structure is.
- **Dictionary Integration**: Bonuses for real-word interlocks.
- **Visual Synapses**: Animated path overlays showing the linear progression of thoughts.
- **Layer Memos**: Add "post-it" style notes to any layer to provide context for your engrams.
- **Export/Import**: Save your entire multi-layered memory structure as a single JSON file.
