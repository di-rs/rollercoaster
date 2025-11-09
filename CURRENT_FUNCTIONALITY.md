# Rollercoaster - Current Functionality Documentation

## Overview
Rollercoaster is a CLI tool that allows developers to run tasks/scripts without needing to know which package manager or task runner is being used. It automatically detects and provides access to available tasks from multiple sources.

## Core Features

### 1. Multi-Manager Support
- **JavaScript Package Managers**: npm, yarn (v1.x), pnpm (all versions)
- **Task Runners**: Task (Taskfile.yml)
- **Auto-detection**: Scans directory tree from current location to git root

### 2. Task Discovery & Execution
- **Fuzzy Search**: Match tasks with partial/misspelled names using fuzzy matching algorithm
- **Interactive TUI**: Beautiful terminal interface for task selection with pagination
- **Direct Execution**: Auto-execute when single match found
- **Multi-match Selection**: Show TUI when multiple tasks match

### 3. Configuration System
- **Location**: `~/.rollercoaster/config.toml`
- **Auto-created** on first run
- **Settings**:
  - `DefaultJSManager`: Which JS manager to use when none detected (npm, yarn, pnpm)
  - `EnableDefaultJSManager`: Enable/disable default JS manager selection
  - `AutoSelectClosest`: Automatically select first fuzzy match (vs. showing UI)

## Technical Architecture

### Main Components

#### 1. Entry Point (`cmd/root.go`)
- Loads configuration
- Parses available managers
- Routes to appropriate handler based on arguments
- Handles task search and execution

**Key Functions**:
- `Execute()`: Main CLI entry point
- `execute()`: Load config, parse managers, route
- `executeWithoutArgs()`: Show all tasks in TUI
- `executeWithArgs()`: Fuzzy search and execute
- `executeSingleTask()`: Execute task via manager

#### 2. Manager System (`internal/manager/`)

**Manager Interface**:
```go
type Manager interface {
    GetTitle() Title
    ListTasks() ([]task.Task, error)
    ExecuteTask(task *task.Task, args ...string)
}
```

**Key Types**:
- `Manager`: Interface for all task managers
- `ManagerTask`: Task paired with its source manager
- `Title`: Manager name and description

**Key Functions**:
- `FindClosestTask()`: Fuzzy match single task
- `FindAllClosestTasksFromList()`: Fuzzy match across all managers
- `GetManagerTasksFromList()`: Get all tasks from all managers

#### 3. Parser (`internal/manager/parser/parser.go`)

**Responsibilities**:
- Auto-detect available task managers
- Scan from current directory to git root
- Return ordered list of managers

**Detection Logic**:
1. Find closest .git directory (project root)
2. Scan current directory up to root
3. Detect JavaScript workspaces:
   - pnpm: `pnpm-lock.yaml` (parses version from lockfile)
   - yarn: `yarn.lock` (v1.x only)
   - npm: `package-lock.json`
   - Default: If `package.json` exists but no lock file
4. Detect Task runner: `Taskfile.yml`, `Taskfile.yaml`, etc.

#### 4. JavaScript Managers (`internal/manager/js/`)

**JsWorkspace Interface**:
```go
type JsWorkspace interface {
    Name() string              // "npm", "pnpm@9+", etc.
    ExecName() string          // "npx", "pnpx", etc.
    Cmd() *exec.Cmd           // Run script command
    ExecuteCmd() *exec.Cmd    // Execute arbitrary command
    InstallCmd() *exec.Cmd    // Install dependencies
    AddCmd() *exec.Cmd        // Add a dependency
    RemoveCmd() *exec.Cmd     // Remove a dependency
}
```

**Implementations**:
- `npm.go`: npm manager (npm run, npx)
- `pnpm.go`: pnpm manager with version detection (pnpm@6-8, pnpm@9+)
- `yarn.go`: yarn v1.x manager (yarn run)

**Managers**:
- `JsManager`: Parses package.json scripts from directories
- `JsWorkspaceManager`: Provides workspace commands (install, add, remove, execute)

#### 5. Task Manager (`internal/manager/task-manager/`)

**Responsibilities**:
- Parse Taskfile.yml/yaml files
- Execute Task runner tasks

**Detection**:
- `Taskfile.yml`, `taskfile.yml`, `Taskfile.yaml`, `taskfile.yaml`
- `Taskfile.dist.yml` (distribution files)

**Execution**: Runs `task <taskname>` command

#### 6. UI System (`internal/ui/tasks-list/`)

**Built on**: Charmbracelet Bubble Tea (TUI framework)

**Components**:
- `tasks-list.go`: Main model and event handler
- `task-item.go`: Item rendering
- `manager_utils.go`: Manager indicator display logic

**Features**:
- Interactive task list with pagination
- Live filtering with `/` key
- Navigation: arrow keys, page navigation (left/right)
- Selection with Enter
- Quit with `q`, `ctrl+c`, `esc`
- Manager indicator (shown only when multiple managers present)
- Status bar showing task count

**Key Bindings**:
- `↑/↓`: Navigate tasks
- `←/→`: Page navigation
- `/`: Start filtering
- `Enter`: Select task
- `Esc`: Exit filtering/quit
- `q/Ctrl+C`: Quit

#### 7. Configuration (`internal/config/config.go`)

**Config Structure**:
```go
type Config struct {
    DefaultJSManager       string
    EnableDefaultJSManager bool
    AutoSelectClosest      bool
}
```

**Default Values**:
- `EnableDefaultJSManager`: false
- `DefaultJSManager`: "npm"
- `AutoSelectClosest`: true

#### 8. File Parsing (`internal/manager/config-file/`)

**Responsibilities**:
- Find files in directory trees
- Parse YAML (Taskfile.yml)
- Parse JSON (package.json)
- Traverse from current to root directory

#### 9. Logger (`internal/logger/logger.go`)

**Styled Output** using Charmbracelet Lipgloss:
- ERROR: Red background
- INFO: Blue background
- WARN: Yellow background
- DEBUG: Green background (dev/test only)

**Build Modes**:
- Controlled by ldflags: `-X github.com/dmitriy-rs/rollercoaster/internal/logger.MODE=DEV`

## Application Flows

### Flow 1: Show All Tasks
```
$ rollercoaster
├─ Load config from ~/.rollercoaster/config.toml
├─ Parse managers in current directory
├─ Collect all tasks from all managers
└─ Render interactive TUI
    └─ User selects task → Execute via manager
```

### Flow 2: Execute with Fuzzy Match
```
$ rollercoaster lint
├─ Load config
├─ Parse managers
├─ Find fuzzy matches across all tasks
├─ Single match? → Execute immediately
└─ Multiple matches? → Show TUI selector
```

### Flow 3: Auto Select (AutoSelectClosest=true)
```
$ rollercoaster li
├─ Load config (AutoSelectClosest=true)
├─ Parse managers
├─ Fuzzy search finds "lint" (best match)
└─ Execute immediately (no UI)
```

## External Dependencies

| Dependency | Purpose |
|-----------|---------|
| **spf13/cobra** | CLI command framework |
| **charmbracelet/bubbletea** | Terminal UI framework |
| **charmbracelet/bubbles** | UI components (list) |
| **charmbracelet/lipgloss** | Terminal styling |
| **goccy/go-yaml** | YAML parsing |
| **sahilm/fuzzy** | Fuzzy matching algorithm |
| **spf13/viper** | Configuration file handling |

## Build & Release

### Taskfile.yml Tasks
- `lint`: Run golangci-lint
- `format`: Format codebase
- `test`: Run tests with race detector and coverage
- `build-dev`: Build with DEV logger mode
- `build`: Build production binary
- `install`: Install binary with DEV mode

### Build Flags
- Version injection: `-X github.com/dmitriy-rs/rollercoaster/cmd.VERSION=<version>`
- Logger mode: `-X github.com/dmitriy-rs/rollercoaster/internal/logger.MODE=<DEV|TEST>`

## Testing

### Test Framework
- **testify**: Assertions and mocking

### Test Coverage
- Parser logic
- Fuzzy matching
- File parsing (YAML/JSON)
- Manager implementations
- UI components

### Race Detection
- Enabled in test suite: `go test -race`

## Key Design Patterns

1. **Manager Interface Pattern**: Abstracts different task runners
2. **Auto-detection Pattern**: Discovers managers without user input
3. **Workspace Detection**: Supports monorepo structures
4. **Fuzzy Matching**: Tolerates typos and partial names
5. **Configuration-Driven**: User preferences override defaults
6. **TUI-First**: Beautiful interactive experience

## Usage Examples

### Basic Usage
```bash
# Show all available tasks
rollercoaster

# Run a task (fuzzy match)
rollercoaster dev
rollercoaster tes  # matches "test"

# With auto-select disabled, shows TUI for multiple matches
rollercoaster li   # could match "lint", "link", "list"
```

### Configuration
```bash
# Configuration is stored at ~/.rollercoaster/config.toml
# Edit to customize behavior
```

## Edge Cases Handled

1. **No Manager Found**: Returns gracefully
2. **No Tasks Match**: Shows all tasks in TUI
3. **Multiple Managers**: Shows combined task list with indicators
4. **Config Load Failure**: Uses defaults
5. **Git Root Not Found**: Uses current directory as limit
6. **Lock File Detection**: Falls back to default manager if configured

## File Structure Summary

```
rollercoaster/
├── main.go                           # Entry point
├── cmd/
│   ├── root.go                      # Main CLI logic
│   └── config.go                    # Config command
├── internal/
│   ├── config/                      # User config management
│   │   └── config.go
│   ├── logger/                      # Styled logging
│   │   ├── logger.go
│   │   └── logger_test.go
│   ├── task/                        # Task data structure
│   │   ├── task.go
│   │   └── task_test.go
│   ├── manager/                     # Core manager system
│   │   ├── manager.go               # Manager interface & fuzzy search
│   │   ├── manager_test.go
│   │   ├── utils.go                 # Command execution utils
│   │   ├── utils_test.go
│   │   ├── parser/                  # Manager detection
│   │   │   ├── parser.go
│   │   │   └── parser_test.go
│   │   ├── config-file/             # File parsing
│   │   │   ├── config-file.go
│   │   │   └── config-file_test.go
│   │   ├── task-manager/            # Task runner integration
│   │   │   ├── task-manager.go
│   │   │   └── task-manager_test.go
│   │   └── js/                      # JavaScript managers
│   │       ├── js.go                # JsManager
│   │       ├── js_test.go
│   │       ├── js-workspace.go      # JsWorkspace interface
│   │       ├── js-workspace_test.go
│   │       ├── js-workspace-manager.go
│   │       ├── js-workspace-manager_test.go
│   │       ├── npm.go               # npm implementation
│   │       ├── npm_test.go
│   │       ├── pnpm.go              # pnpm implementation
│   │       ├── pnpm_test.go
│   │       ├── yarn.go              # yarn implementation
│   │       └── yarn_test.go
│   └── ui/
│       └── tasks-list/              # Interactive TUI
│           ├── tasks-list.go        # Main TUI logic
│           ├── tasks-list_test.go
│           ├── task-item.go         # Item rendering
│           ├── task-item_test.go
│           ├── manager_utils.go     # Manager indicator logic
│           └── tasks-title.go       # Title styling
├── go.mod                           # Go dependencies
├── go.sum
└── Taskfile.yml                     # Build tasks
```
