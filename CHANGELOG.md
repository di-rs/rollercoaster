# @di-rs/rollercoaster

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
