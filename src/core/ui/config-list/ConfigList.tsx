import React, { useState } from 'react'
import { render, Box, Text, useInput, useApp } from 'ink'
import { configManager } from '../../config/config.js'
import { Config } from '../../../types/index.js'

interface ConfigOption {
  key: keyof Config
  label: string
  description: string
  type: 'boolean' | 'select'
  options?: string[]
}

const configOptions: ConfigOption[] = [
  {
    key: 'autoSelectClosest',
    label: 'Auto Select Closest Match',
    description: 'Automatically select the closest matching task',
    type: 'boolean',
  },
  {
    key: 'enableDefaultJSManager',
    label: 'Enable Default JS Manager',
    description: 'Use default JS manager when multiple are found',
    type: 'boolean',
  },
  {
    key: 'defaultJSManager',
    label: 'Default JS Manager',
    description: 'Default JavaScript package manager to use',
    type: 'select',
    options: ['npm', 'yarn', 'pnpm', 'bun'],
  },
]

function ConfigList() {
  const [config, setConfig] = useState<Config>(configManager.get())
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { exit } = useApp()

  useInput((input, key) => {
    // Help toggle
    if (input === '?') {
      setShowHelp(!showHelp)
      return
    }

    if (showHelp) {
      setShowHelp(false)
      return
    }

    // Navigation mode
    if (!isEditing) {
      if (key.escape || input === 'q') {
        exit()
        return
      }

      if (key.upArrow || input === 'k') {
        setSelectedIndex(Math.max(0, selectedIndex - 1))
        return
      }

      if (key.downArrow || input === 'j') {
        setSelectedIndex(Math.min(configOptions.length - 1, selectedIndex + 1))
        return
      }

      if (key.return || input === ' ') {
        const option = configOptions[selectedIndex]
        if (option.type === 'boolean') {
          // Toggle boolean value
          const newConfig = {
            ...config,
            [option.key]: !config[option.key],
          }
          setConfig(newConfig)
          configManager.set({ [option.key]: !config[option.key] })
        } else if (option.type === 'select') {
          // Enter edit mode for select
          setIsEditing(true)
        }
        return
      }

      if (input === 'r') {
        // Reset to defaults
        configManager.reset()
        setConfig(configManager.get())
        return
      }
    } else {
      // Editing mode (for select options)
      const option = configOptions[selectedIndex]

      if (key.escape) {
        setIsEditing(false)
        return
      }

      if (option.type === 'select' && option.options) {
        const currentValue = config[option.key] as string
        const currentIndex = option.options.indexOf(currentValue)

        if (key.upArrow || input === 'k') {
          const newIndex = Math.max(0, currentIndex - 1)
          const newValue = option.options[newIndex]
          const newConfig = {
            ...config,
            [option.key]: newValue,
          }
          setConfig(newConfig)
          configManager.set({ [option.key]: newValue })
          return
        }

        if (key.downArrow || input === 'j') {
          const newIndex = Math.min(option.options.length - 1, currentIndex + 1)
          const newValue = option.options[newIndex]
          const newConfig = {
            ...config,
            [option.key]: newValue,
          }
          setConfig(newConfig)
          configManager.set({ [option.key]: newValue })
          return
        }

        if (key.return) {
          setIsEditing(false)
          return
        }
      }
    }
  })

  if (showHelp) {
    return <HelpPanel onClose={() => setShowHelp(false)} />
  }

  const currentOption = configOptions[selectedIndex]
  const configPath = configManager.getPath()

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1} borderStyle="round" borderColor="cyan" padding={1}>
        <Box flexDirection="column" width="100%">
          <Text bold color="cyan">
            🎢 Rollercoaster Configuration
          </Text>
          <Box marginTop={1}>
            <Text dimColor>Config file: </Text>
            <Text color="gray">{configPath}</Text>
          </Box>
        </Box>
      </Box>

      {/* Main content area */}
      <Box>
        {/* Options list */}
        <Box flexDirection="column" flexGrow={1} marginRight={2}>
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="green"
            paddingX={1}
          >
            {configOptions.map((option, i) => {
              const isSelected = i === selectedIndex
              const value = config[option.key]
              let displayValue: string

              if (option.type === 'boolean') {
                displayValue = value ? '✓ enabled' : '✗ disabled'
              } else {
                displayValue = String(value)
              }

              return (
                <Box key={option.key} paddingY={0}>
                  <Text
                    color={isSelected ? 'cyan' : 'white'}
                    bold={isSelected}
                    backgroundColor={isSelected ? 'blue' : undefined}
                  >
                    {isSelected ? '❯ ' : '  '}
                    {option.label}
                    <Text color={isSelected ? 'white' : 'gray'}>
                      {' '}
                      [{displayValue}]
                    </Text>
                    {isEditing && isSelected && (
                      <Text color="yellow"> (editing)</Text>
                    )}
                  </Text>
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* Details panel */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="magenta"
          paddingX={1}
          width={45}
        >
          <Text bold color="magenta">
            📋 Option Details
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Box>
              <Text bold color="cyan">
                Name:{' '}
              </Text>
              <Text>{currentOption.label}</Text>
            </Box>

            <Box marginTop={1} flexDirection="column">
              <Text bold color="cyan">
                Description:
              </Text>
              <Text color="gray" wrap="wrap">
                {currentOption.description}
              </Text>
            </Box>

            <Box marginTop={1}>
              <Text bold color="cyan">
                Type:{' '}
              </Text>
              <Text color="yellow">{currentOption.type}</Text>
            </Box>

            <Box marginTop={1} flexDirection="column">
              <Text bold color="cyan">
                Current Value:
              </Text>
              <Text bold color="green">
                {String(config[currentOption.key])}
              </Text>
            </Box>

            {currentOption.type === 'select' && currentOption.options && (
              <Box marginTop={1} flexDirection="column">
                <Text bold color="cyan">
                  Available Options:
                </Text>
                <Box paddingLeft={2} flexDirection="column">
                  {currentOption.options.map((opt) => (
                    <Text key={opt} color="gray">
                      • {opt}
                      {opt === config[currentOption.key] && (
                        <Text color="green"> (current)</Text>
                      )}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Editing indicator */}
      {isEditing && (
        <Box marginTop={1} borderStyle="round" borderColor="yellow" paddingX={1}>
          <Text color="yellow">
            ✏ Use ↑/↓ to change value, Enter to confirm, ESC to cancel
          </Text>
        </Box>
      )}

      {/* Status bar */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="blue"
        paddingX={1}
        justifyContent="space-between"
      >
        <Text color="blue">{configOptions.length} settings</Text>
        <Text color="gray" dimColor>
          Press ? for help • r to reset
        </Text>
      </Box>
    </Box>
  )
}

function HelpPanel({ onClose: _onClose }: { onClose: () => void }) {
  return (
    <Box flexDirection="column" padding={2}>
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
      >
        <Text bold color="cyan" underline>
          🎢 Rollercoaster Configuration - Keyboard Shortcuts
        </Text>

        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">
            Navigation:
          </Text>
          <Box paddingLeft={2} flexDirection="column">
            <Text>
              <Text color="green">↑/k</Text> - Move up
            </Text>
            <Text>
              <Text color="green">↓/j</Text> - Move down
            </Text>
          </Box>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">
            Actions:
          </Text>
          <Box paddingLeft={2} flexDirection="column">
            <Text>
              <Text color="green">Enter/Space</Text> - Toggle boolean / Edit
              select
            </Text>
            <Text>
              <Text color="green">r</Text> - Reset all to defaults
            </Text>
            <Text>
              <Text color="green">?</Text> - Toggle this help
            </Text>
            <Text>
              <Text color="green">q/ESC</Text> - Quit
            </Text>
          </Box>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">
            Editing (Select Options):
          </Text>
          <Box paddingLeft={2} flexDirection="column">
            <Text>
              <Text color="green">↑/↓</Text> - Change value
            </Text>
            <Text>
              <Text color="green">Enter</Text> - Confirm
            </Text>
            <Text>
              <Text color="green">ESC</Text> - Cancel
            </Text>
          </Box>
        </Box>

        <Box marginTop={2} justifyContent="center">
          <Text dimColor>Press any key to close</Text>
        </Box>
      </Box>
    </Box>
  )
}

export async function renderConfigList(): Promise<void> {
  return new Promise((resolve) => {
    const { unmount, waitUntilExit } = render(<ConfigList />)

    waitUntilExit().then(() => {
      unmount()
      resolve()
    })
  })
}
