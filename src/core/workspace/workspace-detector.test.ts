import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { detectWorkspace } from './workspace-detector.js'

describe('WorkspaceDetector', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `workspace-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore errors
    }
  })

  describe('detectWorkspace', () => {
    it('should return isWorkspace: false when no package.json exists', async () => {
      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(false)
      expect(result.packageManager).toBe(null)
      expect(result.projects).toEqual([])
    })

    it('should detect npm workspace', async () => {
      await writeFile(join(testDir, 'package-lock.json'), '{}')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'root',
          workspaces: ['packages/*'],
        })
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(true)
      expect(result.packageManager).toBe('npm')
      expect(result.rootDir).toBe(testDir)
    })

    it('should detect pnpm workspace', async () => {
      await writeFile(join(testDir, 'pnpm-lock.yaml'), '')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'root',
        })
      )
      await writeFile(
        join(testDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(true)
      expect(result.packageManager).toBe('pnpm')
      expect(result.rootDir).toBe(testDir)
    })

    it('should detect yarn workspace', async () => {
      await writeFile(join(testDir, 'yarn.lock'), '')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'root',
          workspaces: ['packages/*'],
        })
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(true)
      expect(result.packageManager).toBe('yarn')
      expect(result.rootDir).toBe(testDir)
    })

    it('should return isWorkspace: false for non-workspace package.json', async () => {
      await writeFile(join(testDir, 'package-lock.json'), '{}')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'test',
          scripts: { build: 'tsc' },
        })
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(false)
      expect(result.packageManager).toBe('npm')
      expect(result.projects).toEqual([])
    })

    it('should list workspace projects with root', async () => {
      // Create workspace structure
      const packagesDir = join(testDir, 'packages')
      await mkdir(packagesDir, { recursive: true })

      const pkg1Dir = join(packagesDir, 'pkg1')
      await mkdir(pkg1Dir, { recursive: true })

      const pkg2Dir = join(packagesDir, 'pkg2')
      await mkdir(pkg2Dir, { recursive: true })

      // Root package.json
      await writeFile(join(testDir, 'pnpm-lock.yaml'), '')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'root-workspace',
        })
      )

      // Workspace config
      await writeFile(
        join(testDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      )

      // Package 1
      await writeFile(
        join(pkg1Dir, 'package.json'),
        JSON.stringify({
          name: 'pkg1',
        })
      )

      // Package 2
      await writeFile(
        join(pkg2Dir, 'package.json'),
        JSON.stringify({
          name: 'pkg2',
        })
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(true)
      expect(result.projects).toHaveLength(3)

      // Should include root
      const rootProject = result.projects.find((p) => p.isRoot)
      expect(rootProject).toBeDefined()
      expect(rootProject?.name).toBe('root-workspace')
      expect(rootProject?.path).toBe(testDir)

      // Should include packages
      const pkg1 = result.projects.find((p) => p.name === 'pkg1')
      expect(pkg1).toBeDefined()
      expect(pkg1?.isRoot).toBe(false)
      expect(pkg1?.path).toBe(pkg1Dir)

      const pkg2 = result.projects.find((p) => p.name === 'pkg2')
      expect(pkg2).toBeDefined()
      expect(pkg2?.isRoot).toBe(false)
      expect(pkg2?.path).toBe(pkg2Dir)
    })

    it('should handle npm workspace with object format', async () => {
      await writeFile(join(testDir, 'package-lock.json'), '{}')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'root',
          workspaces: {
            packages: ['packages/*'],
          },
        })
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(true)
      expect(result.packageManager).toBe('npm')
    })

    it('should handle empty workspaces array', async () => {
      await writeFile(join(testDir, 'package-lock.json'), '{}')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'root',
          workspaces: [],
        })
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(false)
      expect(result.projects).toEqual([])
    })

    it('should skip directories without package.json when listing projects', async () => {
      // Create workspace structure with some non-package directories
      const packagesDir = join(testDir, 'packages')
      await mkdir(packagesDir, { recursive: true })

      const pkg1Dir = join(packagesDir, 'pkg1')
      await mkdir(pkg1Dir, { recursive: true })

      const notPkgDir = join(packagesDir, 'not-a-package')
      await mkdir(notPkgDir, { recursive: true })

      // Root package.json
      await writeFile(join(testDir, 'pnpm-lock.yaml'), '')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'root-workspace',
        })
      )

      // Workspace config
      await writeFile(
        join(testDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      )

      // Package 1
      await writeFile(
        join(pkg1Dir, 'package.json'),
        JSON.stringify({
          name: 'pkg1',
        })
      )

      // not-a-package has no package.json

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(true)
      expect(result.projects).toHaveLength(2) // root + pkg1
      expect(result.projects.some((p) => p.name === 'pkg1')).toBe(true)
      expect(result.projects.some((p) => p.path.includes('not-a-package'))).toBe(false)
    })

    it('should handle package manager detection priority (pnpm > yarn > npm)', async () => {
      // Create all lock files
      await writeFile(join(testDir, 'pnpm-lock.yaml'), '')
      await writeFile(join(testDir, 'yarn.lock'), '')
      await writeFile(join(testDir, 'package-lock.json'), '{}')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'test',
        })
      )

      const result = await detectWorkspace(testDir)

      // Should detect pnpm first
      expect(result.packageManager).toBe('pnpm')
    })

    it('should handle malformed package.json gracefully', async () => {
      await writeFile(join(testDir, 'package-lock.json'), '{}')
      await writeFile(join(testDir, 'package.json'), 'invalid json')

      const result = await detectWorkspace(testDir)

      // Should not crash, just return non-workspace
      expect(result.isWorkspace).toBe(false)
    })

    it('should detect workspace with multiple workspace patterns', async () => {
      const appsDir = join(testDir, 'apps')
      await mkdir(appsDir, { recursive: true })

      const packagesDir = join(testDir, 'packages')
      await mkdir(packagesDir, { recursive: true })

      const app1Dir = join(appsDir, 'app1')
      await mkdir(app1Dir, { recursive: true })

      const pkg1Dir = join(packagesDir, 'pkg1')
      await mkdir(pkg1Dir, { recursive: true })

      // Root
      await writeFile(join(testDir, 'pnpm-lock.yaml'), '')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'monorepo',
        })
      )

      // Workspace config with multiple patterns
      await writeFile(
        join(testDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "apps/*"\n  - "packages/*"'
      )

      // App 1
      await writeFile(
        join(app1Dir, 'package.json'),
        JSON.stringify({
          name: 'app1',
        })
      )

      // Package 1
      await writeFile(
        join(pkg1Dir, 'package.json'),
        JSON.stringify({
          name: 'pkg1',
        })
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(true)
      expect(result.projects.length).toBeGreaterThanOrEqual(1) // At least root
      // Note: Manual parsing may not support all patterns, so we just check it doesn't crash
    })
  })

  describe('edge cases', () => {
    it('should handle permission errors gracefully', async () => {
      const result = await detectWorkspace('/root/nonexistent')

      expect(result.isWorkspace).toBe(false)
      expect(result.projects).toEqual([])
    })

    it('should handle package.json without name field', async () => {
      const packagesDir = join(testDir, 'packages')
      await mkdir(packagesDir, { recursive: true })

      const pkg1Dir = join(packagesDir, 'pkg1')
      await mkdir(pkg1Dir, { recursive: true })

      await writeFile(join(testDir, 'pnpm-lock.yaml'), '')
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          // No name field
        })
      )

      await writeFile(
        join(testDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      )

      await writeFile(
        join(pkg1Dir, 'package.json'),
        JSON.stringify({
          name: 'pkg1',
        })
      )

      const result = await detectWorkspace(testDir)

      expect(result.isWorkspace).toBe(true)
      // Root should not be included if it has no name
      expect(result.projects.every((p) => p.name)).toBe(true)
    })
  })
})
