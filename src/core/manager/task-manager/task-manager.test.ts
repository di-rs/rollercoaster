import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { TaskManager } from './task-manager.js'
import { TaskfileV3 } from '../../../types/index.js'

describe('TaskManager', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `task-manager-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore errors
    }
  })

  describe('getTitle', () => {
    it('should return Task as manager name', () => {
      const manager = new TaskManager(testDir)
      const title = manager.getTitle()

      expect(title.name).toBe('Task')
      expect(title.description).toBe(testDir)
    })
  })

  describe('listTasks', () => {
    it('should list tasks from Taskfile.yml', async () => {
      const _taskfile: TaskfileV3 = {
        version: '3',
        tasks: {
          build: {
            desc: 'Build the project',
            cmds: ['go build'],
          },
          test: {
            desc: 'Run tests',
            cmds: ['go test'],
          },
        },
      }

      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  build:
    desc: Build the project
    cmds:
      - go build
  test:
    desc: Run tests
    cmds:
      - go test`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(2)
      const taskNames = tasks.map((t) => t.name)
      expect(taskNames).toContain('build')
      expect(taskNames).toContain('test')
    })

    it('should use desc as task description', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  build:
    desc: Build the project
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks[0].description).toBe('Build the project')
    })

    it('should use summary as fallback description', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  build:
    summary: This builds the project
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks[0].description).toBe('This builds the project')
    })

    it('should prefer desc over summary', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  build:
    desc: Build description
    summary: Build summary
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks[0].description).toBe('Build description')
    })

    it('should handle tasks without description', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  build:
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks[0].description).toBeUndefined()
    })

    it('should include directory in task', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  build:
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks[0].directory).toBe(testDir)
    })

    it('should find taskfile.yml (lowercase)', async () => {
      await writeFile(
        join(testDir, 'taskfile.yml'),
        `version: '3'
tasks:
  build:
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(1)
    })

    it('should find Taskfile.yaml', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yaml'),
        `version: '3'
tasks:
  build:
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(1)
    })

    it('should find taskfile.yaml', async () => {
      await writeFile(
        join(testDir, 'taskfile.yaml'),
        `version: '3'
tasks:
  build:
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(1)
    })

    it('should find Taskfile.dist.yml', async () => {
      await writeFile(
        join(testDir, 'Taskfile.dist.yml'),
        `version: '3'
tasks:
  build:
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(1)
    })

    it('should return empty array if no Taskfile found', async () => {
      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toEqual([])
    })

    it('should return empty array for unsupported version', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '2'
tasks:
  build:
    cmds:
      - go build`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toEqual([])
    })

    it('should return empty array if tasks field is missing', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
includes:
  other: ./other.yml`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toEqual([])
    })

    it('should handle malformed YAML', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  invalid: yaml: content: :`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toEqual([])
    })

    it('should handle complex task definitions', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  build:
    desc: Build the project
    deps:
      - lint
      - test
    cmds:
      - cmd: go build -o app
        silent: true
      - echo "Build complete"
    silent: false

  test:
    desc: Run tests
    cmds:
      - go test ./...`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(2)
      const buildTask = tasks.find((t) => t.name === 'build')
      const testTask = tasks.find((t) => t.name === 'test')

      expect(buildTask?.description).toBe('Build the project')
      expect(testTask?.description).toBe('Run tests')
    })

    it('should handle tasks with special characters in name', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  'build:prod':
    desc: Production build
    cmds:
      - go build
  'test:unit':
    desc: Unit tests
    cmds:
      - go test`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(2)
      const taskNames = tasks.map((t) => t.name)
      expect(taskNames).toContain('build:prod')
      expect(taskNames).toContain('test:unit')
    })
  })

  describe('taskfile priority', () => {
    it('should prefer Taskfile.yml over other variations', async () => {
      await writeFile(
        join(testDir, 'Taskfile.yml'),
        `version: '3'
tasks:
  first:
    cmds:
      - echo first`
      )

      await writeFile(
        join(testDir, 'taskfile.yml'),
        `version: '3'
tasks:
  second:
    cmds:
      - echo second`
      )

      const manager = new TaskManager(testDir)
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(1)
      expect(tasks[0].name).toBe('first')
    })
  })
})
