import { join, dirname } from 'path'
import { Manager, ParseManagerConfig } from '../../../types/index.js'
import { fileExists, findGitRoot } from '../config-file/config-file.js'
import { JsManager } from '../js/js-manager.js'
import { TaskManager } from '../task-manager/task-manager.js'
import { Logger } from '../../logger/logger.js'

export async function parseManagers(
  dir: string,
  config: ParseManagerConfig = {}
): Promise<Manager[]> {
  const managers: Manager[] = []
  const gitRoot = await findGitRoot(dir)

  Logger.debug(`Scanning for managers from ${dir} to ${gitRoot}`)

  let currentDir = dir

  // Scan from current directory up to git root
  while (currentDir.startsWith(gitRoot) || currentDir === gitRoot) {
    // Check for package.json (JavaScript manager)
    const packageJsonPath = join(currentDir, 'package.json')
    if (await fileExists(packageJsonPath)) {
      Logger.debug(`Found package.json at ${currentDir}`)
      const jsManager = new JsManager(currentDir, config.defaultJSManager)
      managers.push(jsManager)
    }

    // Check for Taskfile.yml (Task runner)
    const taskfilePatterns = [
      'Taskfile.yml',
      'taskfile.yml',
      'Taskfile.yaml',
      'taskfile.yaml',
    ]

    for (const pattern of taskfilePatterns) {
      const taskfilePath = join(currentDir, pattern)
      if (await fileExists(taskfilePath)) {
        Logger.debug(`Found ${pattern} at ${currentDir}`)
        const taskManager = new TaskManager(currentDir)
        managers.push(taskManager)
        break // Only add one Task manager per directory
      }
    }

    // Move up to parent directory
    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      // Reached filesystem root
      break
    }
    currentDir = parentDir
  }

  Logger.debug(`Found ${managers.length} manager(s)`)

  return managers
}
