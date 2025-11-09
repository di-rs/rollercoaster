import { Command } from 'commander'
import { configManager } from '../core/config/config.js'
import { parseManagers } from '../core/manager/parser/parser.js'
import {
  findAllClosestTasks,
  getAllManagerTasks,
  findClosestTaskFromList,
  executeSingleTask,
} from '../core/manager/manager.js'
import { Logger } from '../core/logger/logger.js'
import { renderTasksList } from '../core/ui/tasks-list/TasksList.js'
import { renderConfigList } from '../core/ui/config-list/ConfigList.js'
import { Manager, ManagerTask } from '../types/index.js'

export async function createRootCommand(): Promise<Command> {
  const program = new Command()

  program
    .name('rollercoaster')
    .description(
      'CLI tool for running tasks/scripts without knowing the manager'
    )
    .version('1.0.0')
    .argument('[task]', 'Task name or fuzzy query')
    .argument('[args...]', 'Arguments to pass to the task')
    .action(async (taskQuery?: string, taskArgs: string[] = []) => {
      try {
        await executeCommand(taskQuery, taskArgs)
      } catch (error) {
        Logger.error('Failed to execute command', error as Error)
        process.exit(1)
      }
    })

  // Add config subcommand
  program
    .command('config')
    .description('Open configuration interface')
    .action(async () => {
      try {
        await renderConfigList()
      } catch (error) {
        Logger.error('Failed to open config interface', error as Error)
        process.exit(1)
      }
    })

  return program
}

async function executeCommand(
  taskQuery?: string,
  taskArgs: string[] = []
): Promise<void> {
  const config = configManager.get()

  const managers = await parseManagers(process.cwd(), {
    defaultJSManager: config.defaultJSManager,
  })

  if (managers.length === 0) {
    Logger.info('No managers found in current directory')
    return
  }

  if (!taskQuery) {
    // No arguments - show all tasks in TUI
    await executeWithoutArgs(managers)
  } else {
    // With arguments - find matching tasks
    await executeWithArgs(managers, taskQuery, taskArgs, config.autoSelectClosest)
  }
}

async function executeWithoutArgs(managers: Manager[]): Promise<void> {
  const tasks = await getAllManagerTasks(managers)

  if (tasks.length === 0) {
    Logger.info('No tasks found')
    return
  }

  await renderTasksList(tasks, '')
}

async function executeWithArgs(
  managers: Manager[],
  taskQuery: string,
  taskArgs: string[],
  autoSelectClosest: boolean
): Promise<void> {
  let tasks: ManagerTask[]

  if (autoSelectClosest) {
    // Find the single closest match
    const closestTask = await findClosestTaskFromList(managers, taskQuery)
    if (closestTask) {
      tasks = [closestTask]
    } else {
      tasks = []
    }
  } else {
    // Find all matching tasks
    tasks = await findAllClosestTasks(managers, taskQuery)
  }

  if (tasks.length === 0) {
    Logger.info(`No tasks found matching '${taskQuery}'`)
    // Fall back to showing all tasks
    await executeWithoutArgs(managers)
    return
  }

  if (tasks.length === 1) {
    // Single match - execute directly
    await executeSingleTask(tasks[0], taskArgs)
  } else {
    // Multiple matches - show TUI selector
    await renderTasksList(tasks, taskQuery)
  }
}
