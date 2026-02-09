# Migration Guide: Go to Node.js/TypeScript with tsdown and Ink

## Overview
This guide outlines the complete migration from Go to Node.js/TypeScript using:
- **TypeScript**: Type-safe JavaScript
- **tsdown**: Zero-config TypeScript bundler and runner
- **Ink**: React framework for CLI apps
- **Node.js**: Runtime environment

## Technology Stack Comparison

| Component | Go | Node.js/TypeScript |
|-----------|----|--------------------|
| Language | Go | TypeScript |
| CLI Framework | Cobra | Commander/CAC |
| TUI Framework | Bubble Tea | Ink (React for CLI) |
| Styling | Lipgloss | Chalk/Ink components |
| Config | Viper | cosmiconfig/conf |
| YAML Parsing | go-yaml | js-yaml |
| Fuzzy Search | sahilm/fuzzy | fuse.js/fuzzy |
| Testing | testify | Vitest/Jest |
| Build Tool | go build | tsdown |

## Migration Strategy

### Phase 1: Project Setup
1. Initialize Node.js/TypeScript project
2. Configure tsdown for building
3. Set up directory structure
4. Install dependencies

### Phase 2: Core Infrastructure
1. Implement configuration system
2. Create logger utility
3. Build task data structures
4. Set up file parsing utilities

### Phase 3: Manager System
1. Implement Manager interface
2. Build JavaScript workspace managers (npm, pnpm, yarn)
3. Build Task runner manager
4. Create manager parser/detector

### Phase 4: CLI & Business Logic
1. Implement fuzzy search
2. Build main CLI command structure
3. Create task execution flow
4. Implement task discovery logic

### Phase 5: UI Layer
1. Build Ink-based TUI components
2. Create task list interface
3. Implement keyboard navigation
4. Add filtering and pagination

### Phase 6: Testing & Polish
1. Port tests to Vitest
2. Add integration tests
3. Set up build and release process
4. Documentation

## Detailed Step-by-Step Action Plan

### Step 1: Initialize Node.js Project
```bash
# Create package.json
npm init -y

# Install TypeScript and tsdown
npm install -D typescript tsdown

# Install core dependencies
npm install ink react commander conf
npm install chalk js-yaml fuse.js

# Install dev dependencies
npm install -D @types/node @types/react vitest
npm install -D @types/js-yaml

# Initialize TypeScript config
npx tsc --init
```

### Step 2: Configure tsdown
Create `tsdown.config.ts`:
```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  shims: true,
  platform: 'node',
})
```

### Step 3: Set Up Directory Structure
```
src/
├── index.ts                    # Entry point (replaces main.go)
├── cli/
│   ├── root.ts                # Main CLI command (replaces cmd/root.go)
│   └── config.ts              # Config command
├── core/
│   ├── config/                # Config management
│   │   └── config.ts
│   ├── logger/                # Logger utility
│   │   └── logger.ts
│   ├── task/                  # Task types and utilities
│   │   └── task.ts
│   ├── manager/               # Manager system
│   │   ├── manager.ts         # Manager interface
│   │   ├── fuzzy.ts           # Fuzzy search
│   │   ├── parser/
│   │   │   └── parser.ts
│   │   ├── config-file/
│   │   │   └── config-file.ts
│   │   ├── task-manager/
│   │   │   └── task-manager.ts
│   │   └── js/
│   │       ├── js.ts
│   │       ├── workspace.ts
│   │       ├── workspace-manager.ts
│   │       ├── npm.ts
│   │       ├── pnpm.ts
│   │       └── yarn.ts
│   └── ui/
│       └── tasks-list/
│           ├── TasksList.tsx  # Main TUI component
│           ├── TaskItem.tsx   # Task item component
│           └── utils.ts
└── types/                     # TypeScript type definitions
    └── index.ts
```

### Step 4: Implement Core Types
**File: `src/types/index.ts`**
```typescript
export interface Task {
  name: string
  description?: string
  directory?: string
}

export interface ManagerTitle {
  name: string
  description: string
}

export interface Manager {
  getTitle(): ManagerTitle
  listTasks(): Promise<Task[]>
  executeTask(task: Task, args?: string[]): Promise<void>
}

export interface ManagerTask {
  task: Task
  manager: Manager
}

export interface Config {
  defaultJSManager: string
  enableDefaultJSManager: boolean
  autoSelectClosest: boolean
}
```

### Step 5: Implement Configuration System
**File: `src/core/config/config.ts`**
```typescript
import Conf from 'conf'

export interface RollercoasterConfig {
  defaultJSManager: string
  enableDefaultJSManager: boolean
  autoSelectClosest: boolean
}

const schema = {
  defaultJSManager: {
    type: 'string',
    default: 'npm',
  },
  enableDefaultJSManager: {
    type: 'boolean',
    default: false,
  },
  autoSelectClosest: {
    type: 'boolean',
    default: true,
  },
}

export class ConfigManager {
  private conf: Conf<RollercoasterConfig>

  constructor() {
    this.conf = new Conf<RollercoasterConfig>({
      projectName: 'rollercoaster',
      schema,
    })
  }

  get(): RollercoasterConfig {
    return {
      defaultJSManager: this.conf.get('defaultJSManager'),
      enableDefaultJSManager: this.conf.get('enableDefaultJSManager'),
      autoSelectClosest: this.conf.get('autoSelectClosest'),
    }
  }

  set(config: Partial<RollercoasterConfig>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.conf.set(key as keyof RollercoasterConfig, value)
    })
  }
}
```

### Step 6: Implement Logger
**File: `src/core/logger/logger.ts`**
```typescript
import chalk from 'chalk'

export class Logger {
  static error(message: string, error?: Error): void {
    console.error(chalk.bgRed.white(' ERROR '), message)
    if (error) {
      console.error(error)
    }
  }

  static info(message: string): void {
    console.log(chalk.bgBlue.white(' INFO '), message)
  }

  static warn(message: string): void {
    console.log(chalk.bgYellow.black(' WARN '), message)
  }

  static debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.bgGreen.white(' DEBUG '), message)
    }
  }
}
```

### Step 7: Implement Task Utilities
**File: `src/core/task/task.ts`**
```typescript
export interface Task {
  name: string
  description?: string
  directory?: string
}

export function sortTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => a.name.localeCompare(b.name))
}

export function filterUniqueTasks(tasks: Task[]): Task[] {
  const seen = new Set<string>()
  return tasks.filter(task => {
    const key = `${task.name}-${task.directory}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
```

### Step 8: Implement Manager Interface and Fuzzy Search
**File: `src/core/manager/manager.ts`**
```typescript
import Fuse from 'fuse.js'
import { Task } from '../task/task'

export interface ManagerTitle {
  name: string
  description: string
}

export interface Manager {
  getTitle(): ManagerTitle
  listTasks(): Promise<Task[]>
  executeTask(task: Task, args?: string[]): Promise<void>
}

export interface ManagerTask {
  task: Task
  manager: Manager
}

export async function findClosestTask(
  manager: Manager,
  query: string
): Promise<ManagerTask | null> {
  const tasks = await manager.listTasks()
  const fuse = new Fuse(tasks, {
    keys: ['name'],
    threshold: 0.4,
  })
  const results = fuse.search(query)

  if (results.length > 0) {
    return {
      task: results[0].item,
      manager,
    }
  }
  return null
}

export async function findAllClosestTasks(
  managers: Manager[],
  query: string
): Promise<ManagerTask[]> {
  const allTasks: ManagerTask[] = []

  for (const manager of managers) {
    const tasks = await manager.listTasks()
    tasks.forEach(task => {
      allTasks.push({ task, manager })
    })
  }

  const fuse = new Fuse(allTasks, {
    keys: ['task.name'],
    threshold: 0.4,
  })

  const results = fuse.search(query)
  return results.map(r => r.item)
}

export async function getAllManagerTasks(
  managers: Manager[]
): Promise<ManagerTask[]> {
  const allTasks: ManagerTask[] = []

  for (const manager of managers) {
    try {
      const tasks = await manager.listTasks()
      tasks.forEach(task => {
        allTasks.push({ task, manager })
      })
    } catch (error) {
      console.warn(`Failed to get tasks from ${manager.getTitle().name}`)
    }
  }

  return allTasks
}
```

### Step 9: Implement File Parsing Utilities
**File: `src/core/manager/config-file/config-file.ts`**
```typescript
import { readFile, access } from 'fs/promises'
import { join, dirname } from 'path'
import yaml from 'js-yaml'

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function findFileInTree(
  filename: string,
  startDir: string,
  rootDir: string
): Promise<string | null> {
  let currentDir = startDir

  while (currentDir.startsWith(rootDir)) {
    const filePath = join(currentDir, filename)
    if (await fileExists(filePath)) {
      return filePath
    }

    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) break
    currentDir = parentDir
  }

  return null
}

export async function parseJSON<T>(path: string): Promise<T> {
  const content = await readFile(path, 'utf-8')
  return JSON.parse(content)
}

export async function parseYAML<T>(path: string): Promise<T> {
  const content = await readFile(path, 'utf-8')
  return yaml.load(content) as T
}
```

### Step 10: Implement JavaScript Workspace Managers
**File: `src/core/manager/js/npm.ts`** (example)
```typescript
import { spawn } from 'child_process'

export interface JsWorkspace {
  name(): string
  execName(): string
  runScript(scriptName: string, args?: string[]): Promise<void>
  installDeps(): Promise<void>
  addPackage(pkg: string): Promise<void>
  removePackage(pkg: string): Promise<void>
}

export class NpmWorkspace implements JsWorkspace {
  name(): string {
    return 'npm'
  }

  execName(): string {
    return 'npx'
  }

  async runScript(scriptName: string, args: string[] = []): Promise<void> {
    return this.execute('npm', ['run', scriptName, ...args])
  }

  async installDeps(): Promise<void> {
    return this.execute('npm', ['install'])
  }

  async addPackage(pkg: string): Promise<void> {
    return this.execute('npm', ['install', pkg])
  }

  async removePackage(pkg: string): Promise<void> {
    return this.execute('npm', ['uninstall', pkg])
  }

  private async execute(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Process exited with code ${code}`))
        }
      })
    })
  }
}
```

### Step 11: Implement Parser
**File: `src/core/manager/parser/parser.ts`**
```typescript
import { execSync } from 'child_process'
import { join } from 'path'
import { Manager } from '../manager'
import { JsManager } from '../js/js'
import { TaskManager } from '../task-manager/task-manager'
import { fileExists } from '../config-file/config-file'

export interface ParseManagerConfig {
  defaultJSManager?: string
}

export async function parseManagers(
  dir: string,
  config: ParseManagerConfig = {}
): Promise<Manager[]> {
  const managers: Manager[] = []

  // Find git root
  let gitRoot: string
  try {
    gitRoot = execSync('git rev-parse --show-toplevel', {
      cwd: dir,
      encoding: 'utf-8',
    }).trim()
  } catch {
    gitRoot = dir
  }

  // Scan from current dir to git root
  let currentDir = dir
  while (currentDir.startsWith(gitRoot)) {
    // Check for package.json (JS manager)
    const packageJsonPath = join(currentDir, 'package.json')
    if (await fileExists(packageJsonPath)) {
      const jsManager = new JsManager(currentDir, config.defaultJSManager)
      managers.push(jsManager)
    }

    // Check for Taskfile.yml (Task manager)
    const taskfilePath = join(currentDir, 'Taskfile.yml')
    if (await fileExists(taskfilePath)) {
      const taskManager = new TaskManager(currentDir)
      managers.push(taskManager)
    }

    // Move up
    const parent = join(currentDir, '..')
    if (parent === currentDir) break
    currentDir = parent
  }

  return managers
}
```

### Step 12: Implement CLI with Commander
**File: `src/cli/root.ts`**
```typescript
import { Command } from 'commander'
import { ConfigManager } from '../core/config/config'
import { parseManagers } from '../core/manager/parser/parser'
import { findAllClosestTasks, getAllManagerTasks } from '../core/manager/manager'
import { renderTasksList } from '../core/ui/tasks-list/TasksList'

export async function createCLI(): Promise<Command> {
  const program = new Command()

  program
    .name('rollercoaster')
    .description('CLI tool for running tasks without knowing the manager')
    .version('1.0.0')
    .argument('[task]', 'Task name or query')
    .action(async (taskQuery?: string) => {
      const config = new ConfigManager()
      const cfg = config.get()

      const managers = await parseManagers(process.cwd(), {
        defaultJSManager: cfg.defaultJSManager,
      })

      if (managers.length === 0) {
        console.log('No managers found')
        return
      }

      if (!taskQuery) {
        // Show all tasks
        const tasks = await getAllManagerTasks(managers)
        await renderTasksList(tasks)
      } else {
        // Find matching tasks
        const tasks = await findAllClosestTasks(managers, taskQuery)

        if (tasks.length === 0) {
          console.log('No matching tasks found')
          return
        }

        if (tasks.length === 1 && cfg.autoSelectClosest) {
          // Execute directly
          await tasks[0].manager.executeTask(tasks[0].task)
        } else {
          // Show UI
          await renderTasksList(tasks, taskQuery)
        }
      }
    })

  return program
}
```

### Step 13: Implement Ink UI Component
**File: `src/core/ui/tasks-list/TasksList.tsx`**
```typescript
import React, { useState } from 'react'
import { render, Box, Text, useInput } from 'ink'
import { ManagerTask } from '../../manager/manager'

interface Props {
  tasks: ManagerTask[]
  initialFilter?: string
}

function TasksList({ tasks, initialFilter = '' }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filter, setFilter] = useState(initialFilter)
  const [isFiltering, setIsFiltering] = useState(false)

  const filteredTasks = filter
    ? tasks.filter(t => t.task.name.toLowerCase().includes(filter.toLowerCase()))
    : tasks

  useInput((input, key) => {
    if (key.escape) {
      process.exit(0)
    }

    if (input === 'q') {
      process.exit(0)
    }

    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1))
    }

    if (key.downArrow) {
      setSelectedIndex(Math.min(filteredTasks.length - 1, selectedIndex + 1))
    }

    if (key.return) {
      const selected = filteredTasks[selectedIndex]
      if (selected) {
        selected.manager.executeTask(selected.task)
      }
    }

    if (input === '/') {
      setIsFiltering(true)
    }

    if (isFiltering) {
      if (key.backspace) {
        setFilter(filter.slice(0, -1))
      } else if (!key.ctrl && !key.meta && input) {
        setFilter(filter + input)
      }
    }
  })

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>Tasks ({filteredTasks.length})</Text>
      </Box>
      {filteredTasks.map((task, i) => (
        <Box key={i}>
          <Text color={i === selectedIndex ? 'blue' : 'white'}>
            {i === selectedIndex ? '> ' : '  '}
            {task.task.name}
            {task.task.description && ` - ${task.task.description}`}
          </Text>
        </Box>
      ))}
      {isFiltering && (
        <Box>
          <Text>Filter: {filter}</Text>
        </Box>
      )}
    </Box>
  )
}

export async function renderTasksList(
  tasks: ManagerTask[],
  initialFilter?: string
): Promise<void> {
  render(<TasksList tasks={tasks} initialFilter={initialFilter} />)
}
```

### Step 14: Entry Point
**File: `src/index.ts`**
```typescript
#!/usr/bin/env node
import { createCLI } from './cli/root'

async function main() {
  const program = await createCLI()
  await program.parseAsync(process.argv)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

### Step 15: Configure package.json
```json
{
  "name": "rollercoaster",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "rollercoaster": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsdown --watch",
    "build": "tsdown",
    "test": "vitest",
    "lint": "eslint src",
    "format": "prettier --write src"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "conf": "^12.0.0",
    "fuse.js": "^7.0.0",
    "ink": "^5.0.0",
    "js-yaml": "^4.1.0",
    "react": "^18.3.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20.11.0",
    "@types/react": "^18.3.0",
    "tsdown": "^0.2.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  }
}
```

### Step 16: TypeScript Configuration
**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "jsx": "react",
    "jsxImportSource": "react"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Migration Execution Order

1. ✅ **Setup** (Step 1-3): Initialize project, install deps, configure
2. ✅ **Types & Utils** (Step 4-7): Core types, config, logger, task utils
3. ✅ **Manager System** (Step 8-11): Manager interface, fuzzy search, parsers
4. ✅ **CLI** (Step 12): Command-line interface
5. ✅ **UI** (Step 13): Ink TUI components
6. ✅ **Integration** (Step 14-16): Entry point, package config, tsconfig
7. ✅ **Testing**: Port tests to Vitest
8. ✅ **Documentation**: Update README and docs

## Testing Strategy

### Unit Tests
- Use Vitest for fast, modern testing
- Port existing Go tests to TypeScript
- Add new tests for TypeScript-specific features

### Integration Tests
- Test manager detection
- Test task execution flows
- Test UI interactions

### Example Test
```typescript
import { describe, it, expect } from 'vitest'
import { sortTasks } from '../src/core/task/task'

describe('Task Utils', () => {
  it('should sort tasks alphabetically', () => {
    const tasks = [
      { name: 'build' },
      { name: 'test' },
      { name: 'dev' },
    ]
    const sorted = sortTasks(tasks)
    expect(sorted[0].name).toBe('build')
    expect(sorted[1].name).toBe('dev')
    expect(sorted[2].name).toBe('test')
  })
})
```

## Key Differences & Considerations

### 1. Async/Await vs Go Routines
- Go uses goroutines; Node.js uses async/await
- All I/O operations should be async in Node.js

### 2. Error Handling
- Go: explicit error returns
- TypeScript: try/catch blocks with async/await

### 3. Type System
- Go: static, compiled
- TypeScript: static with type erasure at runtime

### 4. Package Management
- Go: go.mod
- Node.js: package.json with npm/pnpm/yarn

### 5. Build Process
- Go: `go build` produces single binary
- Node.js: tsdown bundles to JavaScript, requires Node runtime

### 6. Distribution
- Go: Binary distribution
- Node.js: npm package or bundled with pkg/nexe

## Post-Migration Checklist

- [ ] All features from Go version working
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Build process configured
- [ ] CI/CD pipeline set up
- [ ] Performance benchmarking
- [ ] Cross-platform testing (Linux, macOS, Windows)
- [ ] Publish to npm

## Resources

- [tsdown Documentation](https://tsdown.vercel.app/)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Commander.js](https://github.com/tj/commander.js)
- [Fuse.js](https://fusejs.io/)
- [Vitest](https://vitest.dev/)
