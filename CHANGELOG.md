# @di-rs/rollercoaster

## 1.4.1

### Patch Changes

- 990eca1: Fix filter mode UX: arrow navigation, enter-to-execute, and accent color

  - Arrow keys (↑/↓) now work while the filter is active
  - Enter in filter mode executes the highlighted task directly instead of just closing the filter
  - Added steel blue accent color (#4A86C8) for header, filter bar, selected item, and status bar

## 1.4.0

### Minor Changes

- e6ce8b3: UI improvements, bun.lock detection fix, and test fixes

  - Auto-open filter when `rollercoaster` is launched with no arguments
  - Minimal color scheme: replaced colorful palette with white/bold/dimColor
  - Clear terminal after TUI exit (tasks-list, projects-list, config-list)
  - Fix package manager detection: support `bun.lock` text format (Bun 1.1+) in addition to `bun.lockb`
  - Fix flaky test: replace case-sensitive Taskfile priority test with cross-platform safe variant

## 1.3.1

### Patch Changes

- d024db3: Fix release workflow to create tag only after successful GitHub release

## 1.3.0

### Minor Changes

- 58e2b89: Fixed build

## 1.2.1

### Patch Changes

- ede7a36: Fix release workflow to only version and commit after successful npm publish. Prevents version bumps when publish fails.

## 1.2.0

### Minor Changes

- 5e514f2: Migrate to standalone executables with bun build --compile. Package now ships as JS bundle for npm install, plus standalone executables for GitHub releases and Homebrew (no Node.js required).

## 1.1.0

### Minor Changes

- 8f94ea0: Add Homebrew publishing support for macOS users. The package can now be installed via `brew tap di-rs/tap && brew install rollercoaster`.

## 1.0.0

### Major Changes

- cc358ea: Initial release of Rollercoaster CLI

  Complete TypeScript rewrite of the task runner with the following features:

  - 🔍 **Fuzzy Search** - Type partial names to find tasks
  - 🎨 **Beautiful TUI** - Modern terminal interface with colors and borders
  - 📋 **Task Preview** - See task details before executing
  - ⌨️ **Vim-style Navigation** - Efficient keyboard shortcuts (j/k, h/l, g/G)
  - 🚀 **Auto-detection** - Automatically finds npm, pnpm, yarn, and Taskfile
  - 📄 **Smart Pagination** - Clean interface even with many tasks
  - 🔦 **Search Highlighting** - Visual feedback with highlighted matches
  - 💡 **Interactive Help** - Press `?` for full keyboard reference
  - 🎯 **Zero Configuration** - Works out of the box

  **Supported Task Runners:**

  - npm - package.json scripts
  - pnpm - pnpm workspaces and scripts
  - yarn - yarn v1.x scripts
  - Task - Taskfile.yml (go-task/task v3)

  **Technical Stack:**

  - TypeScript with strict mode
  - Ink v5 for React-based CLI UI
  - Commander.js for CLI framework
  - Fuse.js for fuzzy search
  - Vitest for testing (124 tests)
  - ESLint for code quality
  - Node.js 20+ required

### Minor Changes

- ef5249d: Add Bun support and update all dependencies to latest versions
