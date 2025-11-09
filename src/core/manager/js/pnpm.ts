import { JsWorkspace } from '../../../types/index.js'
import { executeCommand } from './utils.js'

export class PnpmWorkspace implements JsWorkspace {
  constructor(
    private version: string = '9+',
    private cwd?: string
  ) {}

  name(): string {
    return this.version === '9+' ? 'pnpm@9+' : `pnpm@${this.version}`
  }

  execName(): string {
    return this.version >= '9' ? 'pnpm exec' : 'pnpx'
  }

  async runScript(scriptName: string, args: string[] = []): Promise<void> {
    await executeCommand('pnpm', ['run', scriptName, ...args], this.cwd)
  }

  async installDeps(): Promise<void> {
    await executeCommand('pnpm', ['install'], this.cwd)
  }

  async addPackage(pkg: string, dev: boolean = false): Promise<void> {
    const args = ['add', pkg]
    if (dev) {
      args.push('-D')
    }
    await executeCommand('pnpm', args, this.cwd)
  }

  async removePackage(pkg: string): Promise<void> {
    await executeCommand('pnpm', ['remove', pkg], this.cwd)
  }

  async executeCommand(command: string, args: string[] = []): Promise<void> {
    if (this.version >= '9') {
      await executeCommand('pnpm', ['exec', command, ...args], this.cwd)
    } else {
      await executeCommand('pnpx', [command, ...args], this.cwd)
    }
  }
}
