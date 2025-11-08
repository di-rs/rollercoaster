import Conf from 'conf'
import { Config } from '../../types/index.js'

interface ConfigSchema {
  defaultJSManager: string
  enableDefaultJSManager: boolean
  autoSelectClosest: boolean
}

const schema = {
  defaultJSManager: {
    type: 'string' as const,
    default: 'npm',
  },
  enableDefaultJSManager: {
    type: 'boolean' as const,
    default: false,
  },
  autoSelectClosest: {
    type: 'boolean' as const,
    default: true,
  },
}

export class ConfigManager {
  private conf: Conf<ConfigSchema>

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: 'rollercoaster',
      schema: schema as any,
    })
  }

  get(): Config {
    return {
      defaultJSManager: this.conf.get('defaultJSManager'),
      enableDefaultJSManager: this.conf.get('enableDefaultJSManager'),
      autoSelectClosest: this.conf.get('autoSelectClosest'),
    }
  }

  set(config: Partial<Config>): void {
    if (config.defaultJSManager !== undefined) {
      this.conf.set('defaultJSManager', config.defaultJSManager)
    }
    if (config.enableDefaultJSManager !== undefined) {
      this.conf.set('enableDefaultJSManager', config.enableDefaultJSManager)
    }
    if (config.autoSelectClosest !== undefined) {
      this.conf.set('autoSelectClosest', config.autoSelectClosest)
    }
  }

  reset(): void {
    this.conf.clear()
  }

  getPath(): string {
    return this.conf.path
  }
}

export const configManager = new ConfigManager()
