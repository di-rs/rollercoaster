import React, { useState, useEffect } from 'react'
import { render, Box, Text, useInput, useApp } from 'ink'
import { ManagerTask } from '../../../types/index.js'
import { executeSingleTask } from '../../manager/manager.js'
import chalk from 'chalk'

interface Props {
  tasks: ManagerTask[]
  initialFilter?: string
}

function TasksList({ tasks, initialFilter = '' }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filter, setFilter] = useState(initialFilter)
  const [isFiltering, setIsFiltering] = useState(false)
  const { exit } = useApp()

  const filteredTasks = filter
    ? tasks.filter((t) =>
        t.task.name.toLowerCase().includes(filter.toLowerCase())
      )
    : tasks

  useEffect(() => {
    // Reset selection if filtered tasks change
    if (selectedIndex >= filteredTasks.length) {
      setSelectedIndex(Math.max(0, filteredTasks.length - 1))
    }
  }, [filteredTasks.length, selectedIndex])

  useInput((input, key) => {
    // Handle filtering mode
    if (isFiltering) {
      if (key.escape) {
        setIsFiltering(false)
        setFilter('')
        return
      }

      if (key.return) {
        setIsFiltering(false)
        return
      }

      if (key.backspace || key.delete) {
        setFilter(filter.slice(0, -1))
        return
      }

      if (!key.ctrl && !key.meta && !key.shift && input) {
        setFilter(filter + input)
        return
      }

      return
    }

    // Handle navigation mode
    if (key.escape || input === 'q') {
      exit()
      return
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex(Math.max(0, selectedIndex - 1))
      return
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex(Math.min(filteredTasks.length - 1, selectedIndex + 1))
      return
    }

    if (key.return) {
      const selected = filteredTasks[selectedIndex]
      if (selected) {
        exit()
        // Execute task after exit
        setImmediate(async () => {
          try {
            await executeSingleTask(selected)
          } catch (error) {
            console.error('Failed to execute task:', error)
            process.exit(1)
          }
        })
      }
      return
    }

    if (input === '/') {
      setIsFiltering(true)
      return
    }
  })

  // Determine if we should show manager indicators
  const uniqueManagers = new Set(
    tasks.map((t) => t.manager.getTitle().name)
  )
  const showManagerIndicator = uniqueManagers.size > 1

  return (
    <Box flexDirection="column">
      {/* Header */}
      {filteredTasks.length > 0 && (
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {filteredTasks[selectedIndex]?.manager.getTitle().name}
          </Text>
          <Text color="gray"> {filteredTasks[selectedIndex]?.manager.getTitle().description}</Text>
        </Box>
      )}

      {/* Task list */}
      <Box flexDirection="column">
        {filteredTasks.length === 0 ? (
          <Text color="yellow">No tasks found</Text>
        ) : (
          filteredTasks.map((task, i) => {
            const isSelected = i === selectedIndex
            const prefix = isSelected ? '❯ ' : '  '
            const taskName = task.task.name
            const taskDesc = task.task.description || ''
            const managerName = showManagerIndicator
              ? `[${task.manager.getTitle().name}]`
              : ''

            return (
              <Box key={i}>
                <Text
                  color={isSelected ? 'cyan' : 'white'}
                  bold={isSelected}
                >
                  {prefix}
                  {taskName}
                  {managerName && (
                    <Text color="gray"> {managerName}</Text>
                  )}
                  {taskDesc && (
                    <Text color="gray" dimColor>
                      {' '}
                      - {taskDesc.substring(0, 50)}
                      {taskDesc.length > 50 ? '...' : ''}
                    </Text>
                  )}
                </Text>
              </Box>
            )
          })
        )}
      </Box>

      {/* Status bar */}
      <Box marginTop={1}>
        <Text color="gray">
          tasks: {filteredTasks.length} / {tasks.length}
        </Text>
      </Box>

      {/* Filter input */}
      {isFiltering && (
        <Box marginTop={1}>
          <Text color="cyan">Filter: </Text>
          <Text>{filter}</Text>
          <Text color="cyan">█</Text>
        </Box>
      )}

      {/* Help */}
      {!isFiltering && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            ↑/↓: navigate • /: filter • enter: execute • q/esc: quit
          </Text>
        </Box>
      )}
    </Box>
  )
}

export async function renderTasksList(
  tasks: ManagerTask[],
  initialFilter: string = ''
): Promise<void> {
  return new Promise((resolve) => {
    const { unmount, waitUntilExit } = render(
      <TasksList tasks={tasks} initialFilter={initialFilter} />
    )

    waitUntilExit().then(() => {
      unmount()
      resolve()
    })
  })
}
