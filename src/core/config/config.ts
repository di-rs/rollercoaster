import Conf from 'conf'
import { Config } from '../../types/index.js'
import type { Schema } from 'conf'

interface ConfigSchema {
  defaultJSManager: string
  enableDefaultJSManager: boolean
  autoSelectClosest: boolean
}

const schema: Schema<ConfigSchema> = {
  defaultJSManager: {
    type: 'string',
    default: 'npm',
  },
  enableDefaultJSManager: {
    type: 'boolean',
    default: false,
  },
  autoSelectClosest: {
    type: 'boolean',
    default: true,
  },
}

export class ConfigManager {
  private conf: Conf<ConfigSchema>

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: 'rollercoaster',
      schema,
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
