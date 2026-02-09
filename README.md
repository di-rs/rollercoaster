# 🎢 Rollercoaster

> Run tasks/scripts without needing to know which package manager or task runner is being used. Roll through them like a rollercoaster!

[![npm version](https://img.shields.io/npm/v/@di-rs/rollercoaster.svg)](https://www.npmjs.com/package/@di-rs/rollercoaster)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A smart CLI tool that automatically detects and runs tasks from multiple sources (npm, pnpm, yarn, Taskfile) with a beautiful interactive interface, fuzzy search, and extensive keyboard shortcuts.

## ✨ Features

- 🔍 **Fuzzy Search** - Type partial names to find tasks (`bld` matches `build`)
- 🎨 **Beautiful TUI** - Modern terminal interface with colors and borders
- 📋 **Task Preview** - See task details before executing
- ⌨️ **Vim-style Navigation** - Efficient keyboard shortcuts (j/k, h/l, g/G)
- 🚀 **Auto-detection** - Automatically finds npm, pnpm, yarn, and Taskfile
- 📄 **Smart Pagination** - Clean interface even with many tasks
- 🔦 **Search Highlighting** - Visual feedback with highlighted matches
- 💡 **Interactive Help** - Press `?` or `F1` for full keyboard reference
- 🎯 **Zero Configuration** - Works out of the box

## 🎯 Supported Task Runners

- **npm** - package.json scripts
- **pnpm** - pnpm workspaces and scripts
- **yarn** - yarn v1.x scripts
- **bun** - bun package manager
- **Task** - Taskfile.yml (go-task/task v3)

## 📦 Installation

### Using Homebrew (macOS)

```sh
brew tap di-rs/tap
brew install rollercoaster
```

### Using npm

```sh
npm install -g @di-rs/rollercoaster
```

### Using pnpm

```sh
pnpm add -g @di-rs/rollercoaster
```

### Using yarn

```sh
yarn global add @di-rs/rollercoaster
```

### Using bun

```sh
bun add -g @di-rs/rollercoaster
```

### From source

```sh
# Clone the repository
git clone https://github.com/dmitriy-rs/rollercoaster
cd rollercoaster

# Install dependencies
bun install

# Build
bun run build

# Install globally
bun link
```

## 🚀 Usage

### Show all available tasks

```sh
rollercoaster
```

This displays an interactive list of all tasks from all detected managers.

### Fuzzy search and execute

```sh
# Matches "build"
rollercoaster bld

# Matches "test"
rollercoaster tst

# Matches "lint"
rollercoaster li
```

### With arguments

```sh
# Pass arguments to the task
rollercoaster test --watch --coverage
```

### Create an alias

For maximum convenience, create a short alias:

```sh
# ~/.zshrc or ~/.bashrc
alias r="rollercoaster"

# Now you can use:
r              # Show all tasks
r bld          # Build
r t            # Test
```

## ⌨️ Keyboard Shortcuts

### Navigation
- `↑` or `k` - Move up
- `↓` or `j` - Move down
- `←` or `h` - Previous page
- `→` or `l` - Next page
- `g` - Jump to first task
- `G` - Jump to last task (Shift+g)

### Search & Filter
- `/` - Start filtering
- `c` - Clear active filter
- `ESC` - Exit filter mode
- `Enter` - Confirm filter / Execute task

### Actions
- `Enter` - Execute selected task
- `v` - Toggle view mode
- `?` or `F1` - Show help
- `q` or `ESC` - Quit

## 🎨 UI Preview

```
╭────────────────────────────────────────────────────────╮
│                                                        │
│ 🎢 Rollercoaster Task Runner                           │
│                                                        │
│ Manager: npm • /home/user/project                      │
│                                                        │
╰────────────────────────────────────────────────────────╯

╭──────────────────╮  ╭────────────────────────────────╮
│ ❯ build [npm]    │  │ 📋 Task Details                │
│   test [npm]     │  │                                │
│   dev [npm]      │  │ Name: build                    │
│   lint [Task]    │  │                                │
│                  │  │ Description:                   │
╰──────────────────╯  │ Build the project with tsdown  │
                      │                                │
  Page 1/2 • 13 tasks │ Directory:                     │
                      │ /home/user/project             │
                      │                                │
                      │ Manager: npm                   │
                      ╰────────────────────────────────╯

┌──────────────────────────────────────────────────────┐
│ 13 / 13 tasks                Press ? or F1 for help  │
└──────────────────────────────────────────────────────┘
```

## 🔧 Configuration

Rollercoaster automatically creates a configuration file at `~/.rollercoaster/config.toml`:

```toml
# Default JavaScript package manager when none detected
DefaultJSManager = "npm"

# Enable using default manager when no lock file found
EnableDefaultJSManager = false

# Automatically select first match (false shows selection UI)
AutoSelectClosest = true
```

## 📚 How It Works

1. **Manager Detection**: Scans from current directory to git root
2. **Lock File Priority**: pnpm-lock.yaml > yarn.lock > package-lock.json
3. **Task Collection**: Gathers all tasks from detected managers
4. **Fuzzy Matching**: Uses fuse.js for intelligent task matching
5. **Interactive UI**: Displays tasks in a beautiful Ink-based interface

## 🛠️ Development

### Prerequisites

- Node.js 20+
- [Bun](https://bun.sh) (recommended) or npm/pnpm/yarn

### Setup

```sh
# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Build
bun run build

# Type check
bun run typecheck

# Lint
bun run lint

# Format
bun run format

# Check and fix (lint + format)
bun run check
```

> **Note**: This project uses Bun as the primary package manager. While npm/pnpm/yarn will work, Bun is recommended for the best experience.

### Project Structure

```
src/
├── cli/              # CLI command definitions
├── core/
│   ├── config/      # Configuration management
│   ├── logger/      # Styled logging
│   ├── task/        # Task utilities
│   ├── manager/     # Manager system
│   │   ├── js/      # JavaScript managers (npm, pnpm, yarn)
│   │   ├── task-manager/  # Task runner integration
│   │   ├── parser/  # Manager detection
│   │   └── config-file/   # File parsing
│   └── ui/
│       └── tasks-list/    # Ink-based TUI
├── types/           # TypeScript definitions
└── index.ts         # Entry point
```

## 🧪 Testing

The project includes comprehensive test coverage:

- Unit tests for all core components
- Integration tests for manager detection
- File system operation tests
- Fuzzy search algorithm tests

Run tests with:
```sh
npm test
```

## 📖 Documentation

- [UI Features](./docs/UI_FEATURES.md) - Detailed UI feature documentation
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Go to TypeScript migration guide
- [Current Functionality](./docs/CURRENT_FUNCTIONALITY.md) - Complete feature documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT © [Dmitriy](https://github.com/dmitriy-rs)

## 🙏 Acknowledgments

Built with:
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Fuse.js](https://fusejs.io/) - Fuzzy search
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [tsdown](https://tsdown.vercel.app/) - TypeScript bundler
- [Biome](https://biomejs.dev/) - Fast formatter and linter

## 🗺️ Roadmap

### Current Version ✅
- [x] Multi-manager support (npm, pnpm, yarn, Task)
- [x] Fuzzy search
- [x] Interactive TUI with pagination
- [x] Task preview panel
- [x] Vim-style keyboard shortcuts
- [x] Search highlighting
- [x] Interactive help
- [x] Configuration file

### Planned Features
- [ ] Task favorites/bookmarks
- [ ] Recent tasks history
- [ ] Custom color themes
- [ ] Task execution history
- [ ] Multi-select for batch execution
- [x] Bun support
- [ ] Deno support
- [ ] Makefile support
- [ ] Custom keybindings

### Future Ideas
- [ ] Shell integration (zsh, bash)
- [ ] Task aliases
- [ ] Workspace-aware task grouping
- [ ] Task dependencies visualization
- [ ] Performance metrics
- [ ] Task execution time tracking

## ❓ FAQ

**Q: How does Rollercoaster detect which package manager to use?**
A: It scans for lock files (pnpm-lock.yaml, yarn.lock, package-lock.json) and uses the corresponding manager.

**Q: Can I use it in a monorepo?**
A: Yes! It scans from the current directory up to the git root and detects all managers along the way.

**Q: Does it work with Yarn v2+?**
A: Currently only Yarn v1.x is supported. Yarn v2+ (Berry) support is planned.

**Q: What if I have multiple package.json files?**
A: Rollercoaster will find and list tasks from all of them, showing the directory for each.

**Q: How do I disable fuzzy search?**
A: Set `AutoSelectClosest = false` in `~/.rollercoaster/config.toml` to always show the selection UI.

## 🐛 Troubleshooting

**Tasks not showing up?**
- Make sure you're in a directory with a package.json or Taskfile.yml
- Check that your lock files are present
- Run with `NODE_ENV=development` to see debug logs

**Wrong manager detected?**
- Check lock files in your directory
- Set `DefaultJSManager` in config file
- Enable `EnableDefaultJSManager` if needed

**UI rendering issues?**
- Ensure your terminal supports colors
- Try a different terminal emulator
- Check terminal width (minimum 80 columns recommended)

---

Made with ❤️ by [Dmitriy](https://github.com/dmitriy-rs) • [Report Issues](https://github.com/dmitriy-rs/rollercoaster/issues)
