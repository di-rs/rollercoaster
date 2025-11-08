import { Task } from '../../types/index.js'

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.name.localeCompare(b.name))
}

export function filterUniqueTasks(tasks: Task[]): Task[] {
  const seen = new Set<string>()
  return tasks.filter((task) => {
    const key = `${task.name}-${task.directory || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function createTask(
  name: string,
  description?: string,
  directory?: string
): Task {
  return {
    name,
    description,
    directory,
  }
}
