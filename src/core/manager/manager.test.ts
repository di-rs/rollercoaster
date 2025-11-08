import { describe, it, expect, vi } from 'vitest'
import {
  findClosestTask,
  findClosestTaskFromList,
  findAllClosestTasks,
  getAllManagerTasks,
  executeSingleTask,
} from './manager.js'
import { Manager, ManagerTask, Task } from '../../types/index.js'

// Mock manager implementation
class MockManager implements Manager {
  constructor(
    private name: string,
    private tasks: Task[]
  ) {}

  getTitle() {
    return { name: this.name, description: `${this.name} manager` }
  }

  async listTasks() {
    return this.tasks
  }

  async executeTask(task: Task, args?: string[]) {
    // Mock implementation
  }
}

describe('Manager System', () => {
  describe('findClosestTask', () => {
    it('should find exact match', async () => {
      const tasks: Task[] = [
        { name: 'build' },
        { name: 'test' },
        { name: 'dev' },
      ]
      const manager = new MockManager('npm', tasks)

      const result = await findClosestTask(manager, 'build')

      expect(result).not.toBeNull()
      expect(result?.task.name).toBe('build')
      expect(result?.manager).toBe(manager)
    })

    it('should find fuzzy match', async () => {
      const tasks: Task[] = [
        { name: 'build' },
        { name: 'test' },
        { name: 'lint' },
      ]
      const manager = new MockManager('npm', tasks)

      const result = await findClosestTask(manager, 'bld')

      expect(result).not.toBeNull()
      expect(result?.task.name).toBe('build')
    })

    it('should return null if no match found', async () => {
      const tasks: Task[] = [
        { name: 'build' },
        { name: 'test' },
      ]
      const manager = new MockManager('npm', tasks)

      const result = await findClosestTask(manager, 'xyz')

      expect(result).toBeNull()
    })

    it('should handle partial matches', async () => {
      const tasks: Task[] = [
        { name: 'build-dev' },
        { name: 'build-prod' },
        { name: 'test' },
      ]
      const manager = new MockManager('npm', tasks)

      const result = await findClosestTask(manager, 'build')

      expect(result).not.toBeNull()
      expect(result?.task.name).toContain('build')
    })

    it('should handle empty task list', async () => {
      const manager = new MockManager('npm', [])

      const result = await findClosestTask(manager, 'build')

      expect(result).toBeNull()
    })
  })

  describe('findClosestTaskFromList', () => {
    it('should find task from first manager with match', async () => {
      const manager1 = new MockManager('npm', [
        { name: 'test' },
        { name: 'lint' },
      ])
      const manager2 = new MockManager('task', [
        { name: 'build' },
        { name: 'deploy' },
      ])

      const result = await findClosestTaskFromList([manager1, manager2], 'build')

      expect(result).not.toBeNull()
      expect(result?.task.name).toBe('build')
      expect(result?.manager).toBe(manager2)
    })

    it('should return null if no manager has match', async () => {
      const manager1 = new MockManager('npm', [{ name: 'test' }])
      const manager2 = new MockManager('task', [{ name: 'build' }])

      const result = await findClosestTaskFromList([manager1, manager2], 'xyz')

      expect(result).toBeNull()
    })

    it('should handle empty manager list', async () => {
      const result = await findClosestTaskFromList([], 'build')

      expect(result).toBeNull()
    })
  })

  describe('findAllClosestTasks', () => {
    it('should find all matching tasks across managers', async () => {
      const manager1 = new MockManager('npm', [
        { name: 'build' },
        { name: 'test' },
      ])
      const manager2 = new MockManager('task', [
        { name: 'build' },
        { name: 'deploy' },
      ])

      const results = await findAllClosestTasks([manager1, manager2], 'build')

      expect(results).toHaveLength(2)
      expect(results.map((r) => r.task.name)).toContain('build')
    })

    it('should use fuzzy matching across all tasks', async () => {
      const manager1 = new MockManager('npm', [
        { name: 'build-dev' },
        { name: 'test' },
      ])
      const manager2 = new MockManager('task', [
        { name: 'build-prod' },
        { name: 'lint' },
      ])

      const results = await findAllClosestTasks([manager1, manager2], 'bld')

      expect(results.length).toBeGreaterThan(0)
      results.forEach((r) => {
        expect(r.task.name).toContain('build')
      })
    })

    it('should return empty array if no matches', async () => {
      const manager1 = new MockManager('npm', [{ name: 'test' }])
      const manager2 = new MockManager('task', [{ name: 'lint' }])

      const results = await findAllClosestTasks([manager1, manager2], 'xyz')

      expect(results).toEqual([])
    })

    it('should handle empty manager list', async () => {
      const results = await findAllClosestTasks([], 'build')

      expect(results).toEqual([])
    })
  })

  describe('getAllManagerTasks', () => {
    it('should collect all tasks from all managers', async () => {
      const manager1 = new MockManager('npm', [
        { name: 'build' },
        { name: 'test' },
      ])
      const manager2 = new MockManager('task', [
        { name: 'lint' },
        { name: 'deploy' },
      ])

      const results = await getAllManagerTasks([manager1, manager2])

      expect(results).toHaveLength(4)
      const taskNames = results.map((r) => r.task.name)
      expect(taskNames).toContain('build')
      expect(taskNames).toContain('test')
      expect(taskNames).toContain('lint')
      expect(taskNames).toContain('deploy')
    })

    it('should handle managers with no tasks', async () => {
      const manager1 = new MockManager('npm', [])
      const manager2 = new MockManager('task', [{ name: 'build' }])

      const results = await getAllManagerTasks([manager1, manager2])

      expect(results).toHaveLength(1)
      expect(results[0].task.name).toBe('build')
    })

    it('should continue if one manager fails', async () => {
      class FailingManager extends MockManager {
        async listTasks() {
          throw new Error('Failed to list tasks')
        }
      }

      const manager1 = new FailingManager('npm', [])
      const manager2 = new MockManager('task', [{ name: 'build' }])

      const results = await getAllManagerTasks([manager1, manager2])

      // Should still get tasks from manager2
      expect(results).toHaveLength(1)
      expect(results[0].task.name).toBe('build')
    })

    it('should sort tasks alphabetically', async () => {
      const manager = new MockManager('npm', [
        { name: 'test' },
        { name: 'build' },
        { name: 'dev' },
      ])

      const results = await getAllManagerTasks([manager])

      const taskNames = results.map((r) => r.task.name)
      expect(taskNames).toEqual(['build', 'dev', 'test'])
    })

    it('should handle empty manager list', async () => {
      const results = await getAllManagerTasks([])

      expect(results).toEqual([])
    })

    it('should associate tasks with correct managers', async () => {
      const manager1 = new MockManager('npm', [{ name: 'build' }])
      const manager2 = new MockManager('task', [{ name: 'test' }])

      const results = await getAllManagerTasks([manager1, manager2])

      const buildTask = results.find((r) => r.task.name === 'build')
      const testTask = results.find((r) => r.task.name === 'test')

      expect(buildTask?.manager).toBe(manager1)
      expect(testTask?.manager).toBe(manager2)
    })
  })

  describe('executeSingleTask', () => {
    it('should call manager executeTask with task', async () => {
      const executeMock = vi.fn()
      const manager = new MockManager('npm', [{ name: 'build' }])
      manager.executeTask = executeMock

      const managerTask: ManagerTask = {
        task: { name: 'build' },
        manager: manager,
      }

      await executeSingleTask(managerTask)

      expect(executeMock).toHaveBeenCalledWith({ name: 'build' }, undefined)
    })

    it('should pass arguments to executeTask', async () => {
      const executeMock = vi.fn()
      const manager = new MockManager('npm', [{ name: 'test' }])
      manager.executeTask = executeMock

      const managerTask: ManagerTask = {
        task: { name: 'test' },
        manager: manager,
      }

      await executeSingleTask(managerTask, ['--watch', '--coverage'])

      expect(executeMock).toHaveBeenCalledWith(
        { name: 'test' },
        ['--watch', '--coverage']
      )
    })
  })

  describe('fuzzy matching edge cases', () => {
    it('should handle tasks with special characters', async () => {
      const tasks: Task[] = [
        { name: 'build:prod' },
        { name: 'test:unit' },
      ]
      const manager = new MockManager('npm', tasks)

      const result = await findClosestTask(manager, 'build')

      expect(result).not.toBeNull()
      expect(result?.task.name).toBe('build:prod')
    })

    it('should handle case-insensitive matching', async () => {
      const tasks: Task[] = [
        { name: 'Build' },
        { name: 'TEST' },
      ]
      const manager = new MockManager('npm', tasks)

      const result = await findClosestTask(manager, 'build')

      expect(result).not.toBeNull()
      expect(result?.task.name).toBe('Build')
    })

    it('should prioritize closer matches', async () => {
      const tasks: Task[] = [
        { name: 'build' },
        { name: 'rebuild' },
        { name: 'build-all' },
      ]
      const manager = new MockManager('npm', tasks)

      const result = await findClosestTask(manager, 'build')

      expect(result).not.toBeNull()
      expect(result?.task.name).toBe('build')
    })
  })
})
