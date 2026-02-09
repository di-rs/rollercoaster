# 🎢 Rollercoaster - Enhanced UI Features

## Overview

Rollercoaster now features a beautiful, modern TUI (Terminal User Interface) with advanced search capabilities, task preview, and extensive keyboard shortcuts for maximum productivity.

## ✨ Key Features

### 🎨 Beautiful Visual Design

- **Bordered Panels**: Rounded borders with color coding
  - Cyan header with title and current manager info
  - Green border around task list
  - Magenta border for task preview panel
  - Blue status bar at the bottom
  - Yellow filter input when searching

- **Color-Coded Elements**:
  - Selected task: Cyan with blue background
  - Manager indicators: Gray
  - Task descriptions: Dim gray
  - Active filter: Green checkmark
  - Warnings: Yellow

- **Emoji Indicators**:
  - 🎢 App title
  - ❯ Selected task indicator
  - 📋 Task details panel
  - 🔍 Filter/search mode
  - ⚠ No tasks warning
  - ✓ Active filter indicator

### 🔍 Advanced Search & Filtering

- **Live Filter**: Press `/` to start typing and filter tasks in real-time
- **Search Highlighting**: Matched text is highlighted with yellow background
- **Filter Indicator**: Shows active filter with option to clear
- **Clear Filter**: Press `c` to quickly clear the active filter
- **Auto-scroll**: Automatically resets to first page when filter changes

### 📋 Task Preview Panel

The right panel shows detailed information about the currently selected task:

- **Task Name**: Full task name
- **Description**: Complete task description (wrapped if long)
- **Directory**: Location where the task will run
- **Manager**: Which package manager or task runner will execute it

### 📄 Smart Pagination

- **Page Indicators**: Shows current page / total pages
- **Task Count**: Displays filtered tasks / total tasks
- **Auto-pagination**: 10 tasks per page for better readability
- **Smooth Navigation**: Seamlessly move between pages

### ⌨️ Comprehensive Keyboard Shortcuts

#### Navigation
- `↑` or `k` - Move up (vim-style)
- `↓` or `j` - Move down (vim-style)
- `←` or `h` - Previous page (vim-style)
- `→` or `l` - Next page (vim-style)
- `g` - Jump to first task
- `G` - Jump to last task (Shift+g)

#### Search & Filter
- `/` - Start filtering (like vim search)
- `ESC` - Exit filter mode / Clear filter
- `c` - Clear active filter
- `Enter` - Confirm filter / Execute task
- Type while filtering to search

#### Actions
- `Enter` - Execute selected task
- `v` - Toggle view mode (list/grouped)
- `?` or `F1` - Toggle help panel
- `q` or `ESC` - Quit application

### 📚 Interactive Help Panel

Press `?` or `F1` to see a comprehensive help panel with:

- All keyboard shortcuts organized by category
- Navigation shortcuts
- Search & filter shortcuts
- Action shortcuts
- Press any key to close

### 🎯 Manager Indicators

- Shows `[npm]`, `[pnpm]`, `[yarn]`, or `[Task]` next to each task
- Only displayed when multiple managers are present
- Helps identify which tool will execute the task

### 🚀 Performance Features

- **Pagination**: Only renders 10 tasks at a time for better performance
- **Efficient Filtering**: Fast in-memory filtering
- **Smooth Scrolling**: Natural navigation between pages
- **Responsive**: Updates instantly on filter changes

## 📸 UI Preview

```
╭────────────────────────────────────────────────────────────╮
│                                                            │
│ 🎢 Rollercoaster Task Runner                               │
│                                                            │
│ Manager: npm • /home/user/project                          │
│                                                            │
╰────────────────────────────────────────────────────────────╯

╭──────────────────────────╮  ╭────────────────────────────╮
│ ❯ build [npm]            │  │ 📋 Task Details            │
│   test [npm]             │  │                            │
│   dev [npm]              │  │ Name: build                │
│   lint [Task]            │  │                            │
│                          │  │ Description:               │
╰──────────────────────────╯  │ Build the project with tsc │
                              │                            │
     Page 1/2 • 13 tasks      │ Directory:                 │
                              │ /home/user/project         │
                              │                            │
                              │ Manager: npm               │
                              ╰────────────────────────────╯

┌──────────────────────────────────────────────────────────┐
│ 13 / 13 tasks                    Press ? or F1 for help  │
└──────────────────────────────────────────────────────────┘
```

## 🎮 Usage Examples

### Basic Usage
```bash
# Show all tasks with enhanced UI
rollercoaster

# Filter tasks as you type
# 1. Press '/' to enter filter mode
# 2. Type 'build'
# 3. See matching tasks highlighted
# 4. Press Enter to confirm or ESC to cancel
```

### Fuzzy Search
```bash
# Search for tasks matching 'bld'
rollercoaster bld

# Results will show with highlighted matches:
# "build" with 'bld' highlighted in yellow
```

### Quick Navigation
```bash
# Jump to specific tasks quickly:
# 1. Run rollercoaster
# 2. Press 'g' to jump to first task
# 3. Press 'G' to jump to last task
# 4. Use j/k for vim-style navigation
```

### Filter and Execute
```bash
# 1. Run rollercoaster
# 2. Press '/' and type 'test'
# 3. Use ↑/↓ to select specific test task
# 4. Press Enter to execute
```

## 🎨 Color Scheme

- **Cyan**: Headers, selected items, labels
- **Green**: Borders, success indicators
- **Yellow**: Warnings, filter input, highlights
- **Magenta**: Preview panel
- **Blue**: Status bar, selected background
- **Gray**: Secondary text, descriptions
- **White**: Primary text

## 🔧 Technical Details

### Built With
- **Ink**: React for CLI interfaces
- **React**: Component-based UI
- **Chalk**: Terminal colors and styling
- **TypeScript**: Type-safe code

### Features Implementation
- **State Management**: React hooks (useState, useEffect)
- **Keyboard Input**: Ink's useInput hook
- **Layout**: Flexbox-based layout system
- **Borders**: Ink Box components with border styles
- **Text Highlighting**: Chalk background colors

## 🚀 Future Enhancements

Potential features for future releases:

- [ ] Task favorites/bookmarks
- [ ] Recent tasks history
- [ ] Task execution preview (dry-run mode)
- [ ] Grouped view by manager
- [ ] Custom color themes
- [ ] Search history with ↑/↓ in filter mode
- [ ] Multi-select for batch execution
- [ ] Task aliases/shortcuts
- [ ] Config file for custom keybindings

## 📝 Comparison with Original

| Feature | Original | Enhanced |
|---------|----------|----------|
| Visual Design | Basic text | Bordered panels with colors |
| Search | Basic filter | Highlighted search with live feedback |
| Task Info | Inline description | Dedicated preview panel |
| Pagination | All tasks shown | 10 per page with navigation |
| Keyboard Shortcuts | Basic (↑/↓/Enter) | Vim-style + extensive shortcuts |
| Help | One-line hint | Full interactive help panel |
| Manager Indicators | Simple text | Color-coded badges |
| Filter UX | Text input | Visual indicator + clear option |

## 🎯 Design Philosophy

The enhanced UI follows these principles:

1. **Vim-inspired**: Keyboard shortcuts follow vim conventions for power users
2. **Progressive Disclosure**: Show relevant information without overwhelming
3. **Visual Hierarchy**: Use colors and borders to guide attention
4. **Instant Feedback**: Live updates as you type and navigate
5. **Accessibility**: Clear indicators and comprehensive help
6. **Performance**: Efficient rendering with pagination
7. **Consistency**: Uniform styling and behavior throughout

---

Enjoy the enhanced Rollercoaster experience! 🎢
