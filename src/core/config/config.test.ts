import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigManager } from './config.js'

describe('ConfigManager', () => {
  let configManager: ConfigManager

  beforeEach(() => {
    configManager = new ConfigManager()
    // Reset to defaults before each test
    configManager.reset()
  })

  describe('get', () => {
    it('should return default config values', () => {
      const config = configManager.get()

      expect(config).toEqual({
        defaultJSManager: 'npm',
        enableDefaultJSManager: false,
        autoSelectClosest: true,
      })
    })

    it('should return updated values after set', () => {
      configManager.set({
        defaultJSManager: 'pnpm',
      })

      const config = configManager.get()

      expect(config.defaultJSManager).toBe('pnpm')
      expect(config.enableDefaultJSManager).toBe(false) // unchanged
      expect(config.autoSelectClosest).toBe(true) // unchanged
    })
  })

  describe('set', () => {
    it('should update defaultJSManager', () => {
      configManager.set({
        defaultJSManager: 'pnpm',
      })

      const config = configManager.get()
      expect(config.defaultJSManager).toBe('pnpm')
    })

    it('should update enableDefaultJSManager', () => {
      configManager.set({
        enableDefaultJSManager: true,
      })

      const config = configManager.get()
      expect(config.enableDefaultJSManager).toBe(true)
    })

    it('should update autoSelectClosest', () => {
      configManager.set({
        autoSelectClosest: false,
      })

      const config = configManager.get()
      expect(config.autoSelectClosest).toBe(false)
    })

    it('should update multiple values at once', () => {
      configManager.set({
        defaultJSManager: 'yarn',
        enableDefaultJSManager: true,
        autoSelectClosest: false,
      })

      const config = configManager.get()
      expect(config).toEqual({
        defaultJSManager: 'yarn',
        enableDefaultJSManager: true,
        autoSelectClosest: false,
      })
    })

    it('should update only provided values', () => {
      configManager.set({
        defaultJSManager: 'pnpm',
      })

      const config = configManager.get()
      expect(config).toEqual({
        defaultJSManager: 'pnpm',
        enableDefaultJSManager: false,
        autoSelectClosest: true,
      })
    })

    it('should handle empty object', () => {
      configManager.set({})

      const config = configManager.get()
      expect(config).toEqual({
        defaultJSManager: 'npm',
        enableDefaultJSManager: false,
        autoSelectClosest: true,
      })
    })
  })

  describe('reset', () => {
    it('should reset to default values', () => {
      configManager.set({
        defaultJSManager: 'pnpm',
        enableDefaultJSManager: true,
        autoSelectClosest: false,
      })

      configManager.reset()

      const config = configManager.get()
      expect(config).toEqual({
        defaultJSManager: 'npm',
        enableDefaultJSManager: false,
        autoSelectClosest: true,
      })
    })
  })

  describe('getPath', () => {
    it('should return config file path', () => {
      const path = configManager.getPath()

      expect(path).toBeTruthy()
      expect(typeof path).toBe('string')
      expect(path).toContain('rollercoaster')
    })
  })

  describe('persistence', () => {
    it('should persist values across instances', () => {
      const manager1 = new ConfigManager()
      manager1.set({
        defaultJSManager: 'pnpm',
        autoSelectClosest: false,
      })

      const manager2 = new ConfigManager()
      const config = manager2.get()

      expect(config.defaultJSManager).toBe('pnpm')
      expect(config.autoSelectClosest).toBe(false)

      // Cleanup
      manager1.reset()
    })
  })

  describe('validation', () => {
    it('should accept valid package manager names', () => {
      const validManagers = ['npm', 'pnpm', 'yarn']

      validManagers.forEach((manager) => {
        configManager.set({ defaultJSManager: manager })
        expect(configManager.get().defaultJSManager).toBe(manager)
      })
    })

    it('should accept boolean values for flags', () => {
      configManager.set({
        enableDefaultJSManager: true,
        autoSelectClosest: false,
      })

      const config = configManager.get()
      expect(config.enableDefaultJSManager).toBe(true)
      expect(config.autoSelectClosest).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined values in partial update', () => {
      configManager.set({
        defaultJSManager: 'pnpm',
        enableDefaultJSManager: undefined,
      })

      const config = configManager.get()
      expect(config.defaultJSManager).toBe('pnpm')
      // enableDefaultJSManager should remain at default
      expect(config.enableDefaultJSManager).toBe(false)
    })

    it('should handle sequential updates', () => {
      configManager.set({ defaultJSManager: 'pnpm' })
      configManager.set({ enableDefaultJSManager: true })
      configManager.set({ autoSelectClosest: false })

      const config = configManager.get()
      expect(config).toEqual({
        defaultJSManager: 'pnpm',
        enableDefaultJSManager: true,
        autoSelectClosest: false,
      })
    })

    it('should handle alternating updates', () => {
      configManager.set({ defaultJSManager: 'pnpm' })
      configManager.set({ defaultJSManager: 'yarn' })
      configManager.set({ defaultJSManager: 'npm' })

      const config = configManager.get()
      expect(config.defaultJSManager).toBe('npm')
    })
  })
})
