import chalk from "chalk";
import { Box, render, Text, useApp, useInput } from "ink";
import { useEffect, useState } from "react";
import type { ManagerTask } from "../../../types/index.js";
import { Logger } from "../../logger/logger.js";
import { executeSingleTask } from "../../manager/manager.js";

interface Props {
	tasks: ManagerTask[];
	initialFilter?: string;
}

const ITEMS_PER_PAGE = 10;

function TasksList({ tasks, initialFilter = "" }: Props) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [filter, setFilter] = useState(initialFilter);
	const [isFiltering, setIsFiltering] = useState(!!initialFilter);
	const [showHelp, setShowHelp] = useState(false);
	const [currentPage, setCurrentPage] = useState(0);
	const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
	const { exit } = useApp();

	const filteredTasks = filter
		? tasks.filter((t) =>
				t.task.name.toLowerCase().includes(filter.toLowerCase()),
			)
		: tasks;

	const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
	const startIndex = currentPage * ITEMS_PER_PAGE;
	const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredTasks.length);
	const visibleTasks = filteredTasks.slice(startIndex, endIndex);

	useEffect(() => {
		// Reset to first page when filter changes
		setCurrentPage(0);
		setSelectedIndex(0);
	}, []);

	useEffect(() => {
		// Adjust selection if it goes out of bounds
		if (selectedIndex >= visibleTasks.length && visibleTasks.length > 0) {
			setSelectedIndex(visibleTasks.length - 1);
		}
	}, [selectedIndex, visibleTasks.length]);

	useInput((input, key) => {
		// Help toggle
		if (input === "?") {
			setShowHelp(!showHelp);
			return;
		}

		if (showHelp) {
			setShowHelp(false);
			return;
		}

		// Handle filtering mode
		if (isFiltering) {
			if (key.escape) {
				setIsFiltering(false);
				setFilter("");
				return;
			}

			if (key.return) {
				setIsFiltering(false);
				return;
			}

			if (key.backspace || key.delete) {
				setFilter(filter.slice(0, -1));
				return;
			}

			if (!key.ctrl && !key.meta && !key.shift && input) {
				setFilter(filter + input);
				return;
			}

			return;
		}

		// Handle navigation mode
		if (key.escape || input === "q") {
			exit();
			return;
		}

		if (key.upArrow || input === "k") {
			if (selectedIndex > 0) {
				setSelectedIndex(selectedIndex - 1);
			} else if (currentPage > 0) {
				setCurrentPage(currentPage - 1);
				setSelectedIndex(ITEMS_PER_PAGE - 1);
			}
			return;
		}

		if (key.downArrow || input === "j") {
			if (selectedIndex < visibleTasks.length - 1) {
				setSelectedIndex(selectedIndex + 1);
			} else if (currentPage < totalPages - 1) {
				setCurrentPage(currentPage + 1);
				setSelectedIndex(0);
			}
			return;
		}

		// Page navigation
		if (key.leftArrow || input === "h") {
			if (currentPage > 0) {
				setCurrentPage(currentPage - 1);
				setSelectedIndex(0);
			}
			return;
		}

		if (key.rightArrow || input === "l") {
			if (currentPage < totalPages - 1) {
				setCurrentPage(currentPage + 1);
				setSelectedIndex(0);
			}
			return;
		}

		// Jump to first/last
		if (input === "g") {
			setCurrentPage(0);
			setSelectedIndex(0);
			return;
		}

		if (input === "G") {
			setCurrentPage(totalPages - 1);
			setSelectedIndex(
				Math.min(ITEMS_PER_PAGE - 1, filteredTasks.length - startIndex - 1),
			);
			return;
		}

		// View mode toggle
		if (input === "v") {
			setViewMode(viewMode === "list" ? "grouped" : "list");
			return;
		}

		if (key.return) {
			const selected = visibleTasks[selectedIndex];
			if (selected) {
				exit();
				setImmediate(async () => {
					try {
						await executeSingleTask(selected);
					} catch (error) {
						Logger.error("Failed to execute task", error as Error);
						process.exit(1);
					}
				});
			}
			return;
		}

		if (input === "/") {
			setIsFiltering(true);
			return;
		}

		// Clear filter
		if (input === "c" && filter) {
			setFilter("");
			return;
		}
	});

	// Determine if we should show manager indicators
	const uniqueManagers = new Set(tasks.map((t) => t.manager.getTitle().name));
	const showManagerIndicator = uniqueManagers.size > 1;

	if (showHelp) {
		return <HelpPanel onClose={() => setShowHelp(false)} />;
	}

	const currentTask = visibleTasks[selectedIndex];

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header with title */}
			<Box marginBottom={1} borderStyle="round" borderColor="cyan" padding={1}>
				<Box flexDirection="column" width="100%">
					<Text bold color="cyan">
						🎢 Rollercoaster Task Runner
					</Text>
					{currentTask && (
						<Box marginTop={1}>
							<Text dimColor>Manager: </Text>
							<Text bold color="yellow">
								{currentTask.manager.getTitle().name}
							</Text>
							<Text dimColor> • </Text>
							<Text color="gray">
								{currentTask.manager.getTitle().description}
							</Text>
						</Box>
					)}
				</Box>
			</Box>

			{/* Main content area */}
			<Box>
				{/* Task list */}
				<Box flexDirection="column" flexGrow={1} marginRight={2}>
					{filteredTasks.length === 0 ? (
						<Box
							borderStyle="round"
							borderColor="yellow"
							padding={1}
							justifyContent="center"
						>
							<Text color="yellow">⚠ No tasks found</Text>
						</Box>
					) : (
						<>
							<Box
								flexDirection="column"
								borderStyle="round"
								borderColor="green"
								paddingX={1}
							>
								{visibleTasks.map((task, i) => {
									const isSelected = i === selectedIndex;
									const taskName = highlightMatch(task.task.name, filter);
									const managerName = showManagerIndicator
										? `[${task.manager.getTitle().name}]`
										: "";

									return (
										<Box key={`${task.task.name}-${i}`} paddingY={0}>
											<Text
												color={isSelected ? "cyan" : "white"}
												bold={isSelected}
												backgroundColor={isSelected ? "blue" : undefined}
											>
												{isSelected ? "❯ " : "  "}
												{taskName}
												{managerName && (
													<Text color={isSelected ? "white" : "gray"}>
														{" "}
														{managerName}
													</Text>
												)}
											</Text>
										</Box>
									);
								})}
							</Box>

							{/* Pagination info */}
							{totalPages > 1 && (
								<Box marginTop={1} justifyContent="center">
									<Text color="gray">
										Page {currentPage + 1}/{totalPages} • {filteredTasks.length}{" "}
										tasks
									</Text>
								</Box>
							)}
						</>
					)}
				</Box>

				{/* Preview panel */}
				{currentTask && (
					<Box
						flexDirection="column"
						borderStyle="round"
						borderColor="magenta"
						paddingX={1}
						width={40}
					>
						<Text bold color="magenta">
							📋 Task Details
						</Text>
						<Box marginTop={1} flexDirection="column">
							<Box>
								<Text bold color="cyan">
									Name:{" "}
								</Text>
								<Text>{currentTask.task.name}</Text>
							</Box>

							{currentTask.task.description && (
								<Box marginTop={1} flexDirection="column">
									<Text bold color="cyan">
										Description:
									</Text>
									<Text color="gray" wrap="wrap">
										{currentTask.task.description}
									</Text>
								</Box>
							)}

							{currentTask.task.directory && (
								<Box marginTop={1} flexDirection="column">
									<Text bold color="cyan">
										Directory:
									</Text>
									<Text color="gray" dimColor>
										{currentTask.task.directory}
									</Text>
								</Box>
							)}

							<Box marginTop={1}>
								<Text bold color="cyan">
									Manager:{" "}
								</Text>
								<Text color="yellow">
									{currentTask.manager.getTitle().name}
								</Text>
							</Box>
						</Box>
					</Box>
				)}
			</Box>

			{/* Filter input */}
			{isFiltering && (
				<Box
					marginTop={1}
					borderStyle="round"
					borderColor="yellow"
					paddingX={1}
				>
					<Text color="yellow">🔍 Filter: </Text>
					<Text>{filter}</Text>
					<Text color="yellow">█</Text>
				</Box>
			)}

			{/* Active filter indicator */}
			{!isFiltering && filter && (
				<Box marginTop={1} paddingX={1}>
					<Text color="green">✓ Filter active: </Text>
					<Text bold color="white">
						{filter}
					</Text>
					<Text dimColor> (press 'c' to clear)</Text>
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
				<Text color="blue">
					{filteredTasks.length} / {tasks.length} tasks
				</Text>
				<Text color="gray" dimColor>
					Press ? for help
				</Text>
			</Box>
		</Box>
	);
}

function highlightMatch(text: string, filter: string): string {
	if (!filter) return text;

	const lowerText = text.toLowerCase();
	const lowerFilter = filter.toLowerCase();
	const index = lowerText.indexOf(lowerFilter);

	if (index === -1) return text;

	const before = text.substring(0, index);
	const match = text.substring(index, index + filter.length);
	const after = text.substring(index + filter.length);

	return `${before}${chalk.bgYellow.black(match)}${after}`;
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
					🎢 Rollercoaster - Keyboard Shortcuts
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
						<Text>
							<Text color="green">←/h</Text> - Previous page
						</Text>
						<Text>
							<Text color="green">→/l</Text> - Next page
						</Text>
						<Text>
							<Text color="green">g</Text> - Jump to first task
						</Text>
						<Text>
							<Text color="green">G</Text> - Jump to last task
						</Text>
					</Box>
				</Box>

				<Box marginTop={1} flexDirection="column">
					<Text bold color="yellow">
						Search & Filter:
					</Text>
					<Box paddingLeft={2} flexDirection="column">
						<Text>
							<Text color="green">/</Text> - Start filtering
						</Text>
						<Text>
							<Text color="green">ESC</Text> - Exit filter mode / Clear filter
						</Text>
						<Text>
							<Text color="green">c</Text> - Clear active filter
						</Text>
						<Text>
							<Text color="green">Enter</Text> - Confirm filter / Execute task
						</Text>
					</Box>
				</Box>

				<Box marginTop={1} flexDirection="column">
					<Text bold color="yellow">
						Actions:
					</Text>
					<Box paddingLeft={2} flexDirection="column">
						<Text>
							<Text color="green">Enter</Text> - Execute selected task
						</Text>
						<Text>
							<Text color="green">v</Text> - Toggle view mode
						</Text>
						<Text>
							<Text color="green">?</Text> - Toggle this help
						</Text>
						<Text>
							<Text color="green">q/ESC</Text> - Quit
						</Text>
					</Box>
				</Box>

				<Box marginTop={2} justifyContent="center">
					<Text dimColor>Press any key to close</Text>
				</Box>
			</Box>
		</Box>
	);
}

export async function renderTasksList(
	tasks: ManagerTask[],
	initialFilter: string = "",
): Promise<void> {
	return new Promise((resolve) => {
		const { unmount, waitUntilExit } = render(
			<TasksList tasks={tasks} initialFilter={initialFilter} />,
		);

		waitUntilExit().then(() => {
			unmount();
			resolve();
		});
	});
}
