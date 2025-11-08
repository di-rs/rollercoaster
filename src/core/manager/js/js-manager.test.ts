import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { JsManager } from './js-manager.js'
import { PackageJson } from '../../../types/index.js'

describe('JsManager', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `js-manager-test-${Date.now()}`)
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
    it('should return npm as default manager', async () => {
      const manager = new JsManager(testDir, 'npm')
      const title = manager.getTitle()

      expect(title.name).toBe('npm')
      expect(title.description).toBe(testDir)
    })

    it('should detect pnpm from lock file', async () => {
      await writeFile(join(testDir, 'pnpm-lock.yaml'), '')
      const manager = new JsManager(testDir, 'npm')
      const title = manager.getTitle()

      expect(title.name).toBe('pnpm@9+')
    })

    it('should detect yarn from lock file', async () => {
      await writeFile(join(testDir, 'yarn.lock'), '')
      const manager = new JsManager(testDir, 'npm')
      const title = manager.getTitle()

      expect(title.name).toBe('yarn@1')
    })

    it('should detect npm from lock file', async () => {
      await writeFile(join(testDir, 'package-lock.json'), '{}')
      const manager = new JsManager(testDir, 'pnpm')
      const title = manager.getTitle()

      expect(title.name).toBe('npm')
    })

    it('should use default manager when no lock file', async () => {
      const manager = new JsManager(testDir, 'pnpm')
      const title = manager.getTitle()

      expect(title.name).toBe('pnpm@9+')
    })
  })

  describe('listTasks', () => {
    it('should list tasks from package.json scripts', async () => {
      const packageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        scripts: {
          build: 'tsc',
          test: 'vitest',
          dev: 'vite',
        },
      }

      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      )

      const manager = new JsManager(testDir, 'npm')
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(3)
      const taskNames = tasks.map((t) => t.name)
      expect(taskNames).toContain('build')
      expect(taskNames).toContain('test')
      expect(taskNames).toContain('dev')
    })

    it('should include script content as description', async () => {
      const packageJson: PackageJson = {
        scripts: {
          build: 'tsc',
        },
      }

      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      )

      const manager = new JsManager(testDir, 'npm')
      const tasks = await manager.listTasks()

      expect(tasks[0].description).toBe('tsc')
    })

    it('should include directory in task', async () => {
      const packageJson: PackageJson = {
        scripts: {
          build: 'tsc',
        },
      }

      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      )

      const manager = new JsManager(testDir, 'npm')
      const tasks = await manager.listTasks()

      expect(tasks[0].directory).toBe(testDir)
    })

    it('should return empty array if package.json does not exist', async () => {
      const manager = new JsManager(testDir, 'npm')
      const tasks = await manager.listTasks()

      expect(tasks).toEqual([])
    })

    it('should return empty array if scripts is undefined', async () => {
      const packageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
      }

      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      )

      const manager = new JsManager(testDir, 'npm')
      const tasks = await manager.listTasks()

      expect(tasks).toEqual([])
    })

    it('should return empty array if scripts is empty', async () => {
      const packageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        scripts: {},
      }

      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      )

      const manager = new JsManager(testDir, 'npm')
      const tasks = await manager.listTasks()

      expect(tasks).toEqual([])
    })

    it('should handle malformed package.json', async () => {
      await writeFile(join(testDir, 'package.json'), '{ invalid json }')

      const manager = new JsManager(testDir, 'npm')
      const tasks = await manager.listTasks()

      expect(tasks).toEqual([])
    })

    it('should handle package.json with complex scripts', async () => {
      const packageJson: PackageJson = {
        scripts: {
          'build:prod': 'NODE_ENV=production tsc',
          'test:watch': 'vitest --watch',
          'pre-commit': 'lint-staged',
        },
      }

      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      )

      const manager = new JsManager(testDir, 'npm')
      const tasks = await manager.listTasks()

      expect(tasks).toHaveLength(3)
      const taskNames = tasks.map((t) => t.name)
      expect(taskNames).toContain('build:prod')
      expect(taskNames).toContain('test:watch')
      expect(taskNames).toContain('pre-commit')
    })
  })

  describe('workspace detection priority', () => {
    it('should prefer pnpm-lock.yaml over other lock files', async () => {
      await writeFile(join(testDir, 'pnpm-lock.yaml'), '')
      await writeFile(join(testDir, 'yarn.lock'), '')
      await writeFile(join(testDir, 'package-lock.json'), '{}')

      const manager = new JsManager(testDir, 'npm')
      const title = manager.getTitle()

      expect(title.name).toBe('pnpm@9+')
    })

    it('should prefer yarn.lock over package-lock.json', async () => {
      await writeFile(join(testDir, 'yarn.lock'), '')
      await writeFile(join(testDir, 'package-lock.json'), '{}')

      const manager = new JsManager(testDir, 'npm')
      const title = manager.getTitle()

      expect(title.name).toBe('yarn@1')
    })
  })

  describe('getWorkspace', () => {
    it('should return the workspace instance', async () => {
      const manager = new JsManager(testDir, 'npm')
      const workspace = manager.getWorkspace()

      expect(workspace).toBeDefined()
      expect(workspace.name()).toBe('npm')
    })
  })
})
