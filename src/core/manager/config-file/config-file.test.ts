import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  fileExists,
  findFileInTree,
  findFilesInTree,
  parseJSON,
  parseYAML,
  findGitRoot,
} from './config-file.js'

describe('Config File Utilities', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `rollercoaster-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore errors
    }
  })

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(testDir, 'test.txt')
      await writeFile(filePath, 'test content')

      const exists = await fileExists(filePath)
      expect(exists).toBe(true)
    })

    it('should return false for non-existing file', async () => {
      const filePath = join(testDir, 'nonexistent.txt')
      const exists = await fileExists(filePath)
      expect(exists).toBe(false)
    })

    it('should return true for existing directory', async () => {
      const exists = await fileExists(testDir)
      expect(exists).toBe(true)
    })
  })

  describe('findFileInTree', () => {
    it('should find file in current directory', async () => {
      const fileName = 'package.json'
      const filePath = join(testDir, fileName)
      await writeFile(filePath, '{}')

      const found = await findFileInTree(fileName, testDir, testDir)
      expect(found).toBe(filePath)
    })

    it('should find file in parent directory', async () => {
      const subDir = join(testDir, 'sub', 'nested')
      await mkdir(subDir, { recursive: true })

      const fileName = 'config.json'
      const filePath = join(testDir, fileName)
      await writeFile(filePath, '{}')

      const found = await findFileInTree(fileName, subDir, testDir)
      expect(found).toBe(filePath)
    })

    it('should return null if file not found', async () => {
      const found = await findFileInTree('nonexistent.txt', testDir, testDir)
      expect(found).toBeNull()
    })

    it('should stop at root directory', async () => {
      const subDir = join(testDir, 'sub')
      await mkdir(subDir, { recursive: true })

      const fileName = 'config.json'
      // Create file outside root
      const outsideDir = join(tmpdir(), `outside-${Date.now()}`)
      await mkdir(outsideDir, { recursive: true })
      await writeFile(join(outsideDir, fileName), '{}')

      const found = await findFileInTree(fileName, subDir, subDir)
      expect(found).toBeNull()

      await rm(outsideDir, { recursive: true, force: true })
    })
  })

  describe('findFilesInTree', () => {
    it('should find multiple files in tree', async () => {
      await writeFile(join(testDir, 'file1.txt'), 'content1')

      const subDir = join(testDir, 'sub')
      await mkdir(subDir, { recursive: true })
      await writeFile(join(subDir, 'file2.txt'), 'content2')

      const found = await findFilesInTree(['file1.txt', 'file2.txt'], subDir, testDir)
      expect(found).toHaveLength(2)
      expect(found).toContain(join(testDir, 'file1.txt'))
      expect(found).toContain(join(subDir, 'file2.txt'))
    })

    it('should not include duplicates', async () => {
      const fileName = 'dup.txt'
      await writeFile(join(testDir, fileName), 'content')

      const subDir = join(testDir, 'sub')
      await mkdir(subDir, { recursive: true })

      const found = await findFilesInTree([fileName], subDir, testDir)
      expect(found).toHaveLength(1)
    })

    it('should return empty array if no files found', async () => {
      const found = await findFilesInTree(['nonexistent.txt'], testDir, testDir)
      expect(found).toEqual([])
    })
  })

  describe('parseJSON', () => {
    it('should parse valid JSON file', async () => {
      const filePath = join(testDir, 'data.json')
      const data = { name: 'test', version: '1.0.0' }
      await writeFile(filePath, JSON.stringify(data))

      const parsed = await parseJSON(filePath)
      expect(parsed).toEqual(data)
    })

    it('should throw error for invalid JSON', async () => {
      const filePath = join(testDir, 'invalid.json')
      await writeFile(filePath, '{ invalid json }')

      await expect(parseJSON(filePath)).rejects.toThrow()
    })

    it('should parse empty object', async () => {
      const filePath = join(testDir, 'empty.json')
      await writeFile(filePath, '{}')

      const parsed = await parseJSON(filePath)
      expect(parsed).toEqual({})
    })

    it('should parse arrays', async () => {
      const filePath = join(testDir, 'array.json')
      const data = [1, 2, 3]
      await writeFile(filePath, JSON.stringify(data))

      const parsed = await parseJSON(filePath)
      expect(parsed).toEqual(data)
    })
  })

  describe('parseYAML', () => {
    it('should parse valid YAML file', async () => {
      const filePath = join(testDir, 'data.yaml')
      const yamlContent = `
version: '3'
tasks:
  build:
    desc: Build the project
    cmds:
      - go build
`
      await writeFile(filePath, yamlContent)

      const parsed = await parseYAML(filePath)
      expect(parsed).toHaveProperty('version', '3')
      expect(parsed).toHaveProperty('tasks')
    })

    it('should parse simple YAML', async () => {
      const filePath = join(testDir, 'simple.yaml')
      const yamlContent = 'name: test\nversion: 1.0.0'
      await writeFile(filePath, yamlContent)

      const parsed = await parseYAML<{ name: string; version: string }>(filePath)
      expect(parsed).toEqual({ name: 'test', version: '1.0.0' })
    })

    it('should throw error for invalid YAML', async () => {
      const filePath = join(testDir, 'invalid.yaml')
      await writeFile(filePath, 'invalid: yaml: content: :')

      await expect(parseYAML(filePath)).rejects.toThrow()
    })
  })

  describe('findGitRoot', () => {
    it('should find .git directory in current directory', async () => {
      const gitDir = join(testDir, '.git')
      await mkdir(gitDir)

      const root = await findGitRoot(testDir)
      expect(root).toBe(testDir)
    })

    it('should find .git directory in parent', async () => {
      const gitDir = join(testDir, '.git')
      await mkdir(gitDir)

      const subDir = join(testDir, 'sub', 'nested')
      await mkdir(subDir, { recursive: true })

      const root = await findGitRoot(subDir)
      expect(root).toBe(testDir)
    })

    it('should return start directory if no .git found', async () => {
      const root = await findGitRoot(testDir)
      expect(root).toBe(testDir)
    })

    it('should handle nested git repositories', async () => {
      // Create outer .git
      const outerGit = join(testDir, '.git')
      await mkdir(outerGit)

      // Create inner repo
      const innerDir = join(testDir, 'inner')
      await mkdir(innerDir, { recursive: true })
      const innerGit = join(innerDir, '.git')
      await mkdir(innerGit)

      // Should find inner .git first
      const root = await findGitRoot(innerDir)
      expect(root).toBe(innerDir)
    })
  })
})
