---
"@di-rs/rollercoaster": minor
---

UI improvements, bun.lock detection fix, and test fixes

- Auto-open filter when `rollercoaster` is launched with no arguments
- Minimal color scheme: replaced colorful palette with white/bold/dimColor
- Clear terminal after TUI exit (tasks-list, projects-list, config-list)
- Fix package manager detection: support `bun.lock` text format (Bun 1.1+) in addition to `bun.lockb`
- Fix flaky test: replace case-sensitive Taskfile priority test with cross-platform safe variant
