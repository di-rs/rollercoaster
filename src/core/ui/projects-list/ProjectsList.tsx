import chalk from "chalk";
import { Box, render, Text, useApp, useInput } from "ink";
import { useEffect, useState } from "react";
import type { WorkspaceProject } from "../../../types/index.js";

interface Props {
	projects: WorkspaceProject[];
	onSelect: (project: WorkspaceProject) => void;
}

const ITEMS_PER_PAGE = 10;

function ProjectsList({ projects, onSelect }: Props) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [filter, setFilter] = useState("");
	const [isFiltering, setIsFiltering] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [currentPage, setCurrentPage] = useState(0);
	const { exit } = useApp();

	const filteredProjects = filter
		? projects.filter((p) =>
				p.name.toLowerCase().includes(filter.toLowerCase()),
			)
		: projects;

	const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
	const startIndex = currentPage * ITEMS_PER_PAGE;
	const endIndex = Math.min(
		startIndex + ITEMS_PER_PAGE,
		filteredProjects.length,
	);
	const visibleProjects = filteredProjects.slice(startIndex, endIndex);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally want to reset page when filter changes
	useEffect(() => {
		// Reset to first page when filter changes
		setCurrentPage(0);
		setSelectedIndex(0);
	}, [filter]);

	useEffect(() => {
		// Adjust selection if it goes out of bounds
		if (selectedIndex >= visibleProjects.length && visibleProjects.length > 0) {
			setSelectedIndex(visibleProjects.length - 1);
		}
	}, [selectedIndex, visibleProjects.length]);

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
			if (selectedIndex < visibleProjects.length - 1) {
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
				Math.min(ITEMS_PER_PAGE - 1, filteredProjects.length - startIndex - 1),
			);
			return;
		}

		if (key.return) {
			const selected = visibleProjects[selectedIndex];
			if (selected) {
				exit();
				setImmediate(() => {
					onSelect(selected);
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

	if (showHelp) {
		return <HelpPanel onClose={() => setShowHelp(false)} />;
	}

	const currentProject = visibleProjects[selectedIndex];

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header with title */}
			<Box marginBottom={1} borderStyle="round" borderColor="cyan" padding={1}>
				<Box flexDirection="column" width="100%">
					<Text bold color="cyan">
						🎢 Rollercoaster - Select Project
					</Text>
					<Box marginTop={1}>
						<Text dimColor>Workspace Projects: </Text>
						<Text bold color="yellow">
							{projects.length}
						</Text>
					</Box>
				</Box>
			</Box>

			{/* Main content area */}
			<Box>
				{/* Project list */}
				<Box flexDirection="column" flexGrow={1} marginRight={2}>
					{filteredProjects.length === 0 ? (
						<Box
							borderStyle="round"
							borderColor="yellow"
							padding={1}
							justifyContent="center"
						>
							<Text color="yellow">⚠ No projects found</Text>
						</Box>
					) : (
						<>
							<Box
								flexDirection="column"
								borderStyle="round"
								borderColor="green"
								paddingX={1}
							>
								{visibleProjects.map((project, i) => {
									const isSelected = i === selectedIndex;
									const projectName = highlightMatch(project.name, filter);
									const badge = project.isRoot ? " [ROOT]" : "";

									return (
										<Box key={`${project.name}-${i}`} paddingY={0}>
											<Text
												color={isSelected ? "cyan" : "white"}
												bold={isSelected}
												backgroundColor={isSelected ? "blue" : undefined}
											>
												{isSelected ? "❯ " : "  "}
												{projectName}
												{badge && (
													<Text color={project.isRoot ? "magenta" : "gray"}>
														{badge}
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
										Page {currentPage + 1}/{totalPages} •{" "}
										{filteredProjects.length} projects
									</Text>
								</Box>
							)}
						</>
					)}
				</Box>

				{/* Preview panel */}
				{currentProject && (
					<Box
						flexDirection="column"
						borderStyle="round"
						borderColor="magenta"
						paddingX={1}
						width={40}
					>
						<Text bold color="magenta">
							📦 Project Details
						</Text>
						<Box marginTop={1} flexDirection="column">
							<Box>
								<Text bold color="cyan">
									Name:{" "}
								</Text>
								<Text>{currentProject.name}</Text>
							</Box>

							<Box marginTop={1} flexDirection="column">
								<Text bold color="cyan">
									Path:
								</Text>
								<Text color="gray" dimColor wrap="wrap">
									{currentProject.path}
								</Text>
							</Box>

							<Box marginTop={1}>
								<Text bold color="cyan">
									Type:{" "}
								</Text>
								<Text color={currentProject.isRoot ? "magenta" : "yellow"}>
									{currentProject.isRoot ? "Root Workspace" : "Package"}
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
					{filteredProjects.length} / {projects.length} projects
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
					🎢 Rollercoaster - Project Selection Help
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
							<Text color="green">g</Text> - Jump to first project
						</Text>
						<Text>
							<Text color="green">G</Text> - Jump to last project
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
							<Text color="green">Enter</Text> - Confirm filter / Select project
						</Text>
					</Box>
				</Box>

				<Box marginTop={1} flexDirection="column">
					<Text bold color="yellow">
						Actions:
					</Text>
					<Box paddingLeft={2} flexDirection="column">
						<Text>
							<Text color="green">Enter</Text> - Select project
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

export async function renderProjectsList(
	projects: WorkspaceProject[],
): Promise<WorkspaceProject | null> {
	return new Promise((resolve) => {
		let selectedProject: WorkspaceProject | null = null;

		const { unmount, waitUntilExit } = render(
			<ProjectsList
				projects={projects}
				onSelect={(project) => {
					selectedProject = project;
				}}
			/>,
		);

		waitUntilExit().then(() => {
			unmount();
			resolve(selectedProject);
		});
	});
}
