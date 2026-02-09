import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { PackageJson, WorkspaceProject } from "../../types/index.js";
import { Logger } from "../logger/logger.js";
import { fileExists, parseJSON } from "../manager/config-file/config-file.js";

const execAsync = promisify(exec);

export interface WorkspaceInfo {
	isWorkspace: boolean;
	rootDir: string;
	packageManager: "npm" | "pnpm" | "yarn" | null;
	projects: WorkspaceProject[];
}

/**
 * Detects if the current directory is a Node.js workspace and lists all projects
 */
export async function detectWorkspace(dir: string): Promise<WorkspaceInfo> {
	const packageJsonPath = join(dir, "package.json");

	// Check if package.json exists
	if (!(await fileExists(packageJsonPath))) {
		return {
			isWorkspace: false,
			rootDir: dir,
			packageManager: null,
			projects: [],
		};
	}

	// Detect package manager
	const packageManager = await detectPackageManager(dir);

	if (!packageManager) {
		return {
			isWorkspace: false,
			rootDir: dir,
			packageManager: null,
			projects: [],
		};
	}

	Logger.debug(`Detected package manager: ${packageManager}`);

	// Check if it's a workspace
	const isWorkspace = await checkIsWorkspace(dir, packageManager);

	if (!isWorkspace) {
		return {
			isWorkspace: false,
			rootDir: dir,
			packageManager,
			projects: [],
		};
	}

	Logger.debug("Detected workspace configuration");

	// List all projects in workspace
	const projects = await listWorkspaceProjects(dir, packageManager);

	return {
		isWorkspace: true,
		rootDir: dir,
		packageManager,
		projects,
	};
}

/**
 * Detects which package manager is being used
 */
async function detectPackageManager(
	dir: string,
): Promise<"npm" | "pnpm" | "yarn" | null> {
	const pnpmLockPath = join(dir, "pnpm-lock.yaml");
	const yarnLockPath = join(dir, "yarn.lock");
	const npmLockPath = join(dir, "package-lock.json");

	if (await fileExists(pnpmLockPath)) {
		return "pnpm";
	} else if (await fileExists(yarnLockPath)) {
		return "yarn";
	} else if (await fileExists(npmLockPath)) {
		return "npm";
	}

	return null;
}

/**
 * Checks if the directory is a workspace
 */
async function checkIsWorkspace(
	dir: string,
	packageManager: "npm" | "pnpm" | "yarn",
): Promise<boolean> {
	if (packageManager === "pnpm") {
		// Check for pnpm-workspace.yaml
		const pnpmWorkspacePath = join(dir, "pnpm-workspace.yaml");
		return await fileExists(pnpmWorkspacePath);
	}

	if (packageManager === "npm" || packageManager === "yarn") {
		// Check for workspaces field in package.json
		const packageJsonPath = join(dir, "package.json");
		try {
			const packageJson = await parseJSON<
				PackageJson & { workspaces?: string[] | { packages?: string[] } }
			>(packageJsonPath);

			if (!packageJson.workspaces) {
				return false;
			}

			// Workspaces can be an array or an object with packages field
			if (Array.isArray(packageJson.workspaces)) {
				return packageJson.workspaces.length > 0;
			}

			if (
				typeof packageJson.workspaces === "object" &&
				packageJson.workspaces.packages
			) {
				return packageJson.workspaces.packages.length > 0;
			}

			return false;
		} catch {
			return false;
		}
	}

	return false;
}

/**
 * Lists all projects in the workspace using package manager commands
 */
async function listWorkspaceProjects(
	dir: string,
	packageManager: "npm" | "pnpm" | "yarn",
): Promise<WorkspaceProject[]> {
	try {
		// First try using package manager commands
		const projects = await listProjectsUsingCommand(dir, packageManager);
		if (projects.length > 0) {
			return projects;
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		Logger.debug(
			`Failed to list projects using ${packageManager} command: ${errorMessage}, falling back to manual parsing`,
		);
	}

	// Fallback to manual parsing
	return await listProjectsManually(dir, packageManager);
}

/**
 * Lists projects using package manager CLI commands
 */
async function listProjectsUsingCommand(
	dir: string,
	packageManager: "npm" | "pnpm" | "yarn",
): Promise<WorkspaceProject[]> {
	const projects: WorkspaceProject[] = [];

	try {
		if (packageManager === "npm") {
			// npm query .workspace returns workspace packages
			const { stdout } = await execAsync("npm query .workspace", {
				cwd: dir,
				timeout: 10000,
			});
			const result = JSON.parse(stdout);

			if (Array.isArray(result)) {
				for (const pkg of result) {
					if (pkg.location && pkg.name) {
						const projectPath = join(dir, pkg.location);
						projects.push({
							name: pkg.name,
							path: projectPath,
							isRoot: pkg.location === ".",
						});
					}
				}
			}

			// Add root project if not already included
			const hasRoot = projects.some((p) => p.isRoot);
			if (!hasRoot) {
				const rootPackageJson = await parseJSON<PackageJson>(
					join(dir, "package.json"),
				);
				if (rootPackageJson.name) {
					projects.unshift({
						name: rootPackageJson.name,
						path: dir,
						isRoot: true,
					});
				}
			}
		} else if (packageManager === "pnpm") {
			// pnpm list -r --depth -1 --json lists all workspace packages
			const { stdout } = await execAsync("pnpm list -r --depth -1 --json", {
				cwd: dir,
				timeout: 10000,
			});
			const result = JSON.parse(stdout);

			if (Array.isArray(result)) {
				for (const pkg of result) {
					if (pkg.path && pkg.name) {
						projects.push({
							name: pkg.name,
							path: pkg.path,
							isRoot: pkg.path === dir,
						});
					}
				}
			}

			// Add root project if not already included
			const hasRoot = projects.some((p) => p.isRoot);
			if (!hasRoot) {
				const rootPackageJson = await parseJSON<PackageJson>(
					join(dir, "package.json"),
				);
				if (rootPackageJson.name) {
					projects.unshift({
						name: rootPackageJson.name,
						path: dir,
						isRoot: true,
					});
				}
			}
		} else if (packageManager === "yarn") {
			// yarn workspaces list --json lists all workspaces
			const { stdout } = await execAsync("yarn workspaces list --json", {
				cwd: dir,
				timeout: 10000,
			});
			const lines = stdout.trim().split("\n");

			for (const line of lines) {
				try {
					const pkg = JSON.parse(line);
					if (pkg.location && pkg.name) {
						const projectPath = join(dir, pkg.location);
						projects.push({
							name: pkg.name,
							path: projectPath,
							isRoot: pkg.location === ".",
						});
					}
				} catch {
					// Skip invalid JSON lines
				}
			}

			// Add root project if not already included
			const hasRoot = projects.some((p) => p.isRoot);
			if (!hasRoot) {
				const rootPackageJson = await parseJSON<PackageJson>(
					join(dir, "package.json"),
				);
				if (rootPackageJson.name) {
					projects.unshift({
						name: rootPackageJson.name,
						path: dir,
						isRoot: true,
					});
				}
			}
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		Logger.debug(`Error executing ${packageManager} command: ${errorMessage}`);
		throw error;
	}

	return projects;
}

/**
 * Manually parses workspace configuration and finds projects
 */
async function listProjectsManually(
	dir: string,
	packageManager: "npm" | "pnpm" | "yarn",
): Promise<WorkspaceProject[]> {
	const projects: WorkspaceProject[] = [];

	// Add root project first
	const rootPackageJson = await parseJSON<PackageJson>(
		join(dir, "package.json"),
	);
	if (rootPackageJson.name) {
		projects.push({
			name: rootPackageJson.name,
			path: dir,
			isRoot: true,
		});
	}

	if (packageManager === "pnpm") {
		// Parse pnpm-workspace.yaml
		const workspacePath = join(dir, "pnpm-workspace.yaml");
		try {
			const content = await readFile(workspacePath, "utf-8");
			const yaml = await import("js-yaml");
			const config = yaml.load(content) as { packages?: string[] };

			if (config.packages) {
				for (const pattern of config.packages) {
					const foundProjects = await findProjectsByPattern(dir, pattern);
					projects.push(...foundProjects);
				}
			}
		} catch (error) {
			Logger.error(
				`Failed to parse pnpm-workspace.yaml`,
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	} else {
		// Parse workspaces from package.json
		const packageJson = await parseJSON<
			PackageJson & { workspaces?: string[] | { packages?: string[] } }
		>(join(dir, "package.json"));

		let patterns: string[] = [];

		if (Array.isArray(packageJson.workspaces)) {
			patterns = packageJson.workspaces;
		} else if (
			packageJson.workspaces &&
			typeof packageJson.workspaces === "object"
		) {
			patterns = packageJson.workspaces.packages || [];
		}

		for (const pattern of patterns) {
			const foundProjects = await findProjectsByPattern(dir, pattern);
			projects.push(...foundProjects);
		}
	}

	return projects;
}

/**
 * Finds projects matching a glob pattern
 */
async function findProjectsByPattern(
	rootDir: string,
	pattern: string,
): Promise<WorkspaceProject[]> {
	const projects: WorkspaceProject[] = [];

	// Simple glob pattern matching for common cases like "packages/*" or "apps/**"
	// For a production implementation, you might want to use a proper glob library

	// Remove leading ./ if present
	pattern = pattern.replace(/^\.\//, "");

	// For now, support simple patterns like "packages/*" or "apps/*"
	if (pattern.endsWith("/*")) {
		const baseDir = join(rootDir, pattern.slice(0, -2));

		if (!existsSync(baseDir)) {
			return projects;
		}

		const { readdir } = await import("node:fs/promises");
		const entries = await readdir(baseDir, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const projectPath = join(baseDir, entry.name);
				const packageJsonPath = join(projectPath, "package.json");

				if (await fileExists(packageJsonPath)) {
					try {
						const packageJson = await parseJSON<PackageJson>(packageJsonPath);
						if (packageJson.name) {
							projects.push({
								name: packageJson.name,
								path: projectPath,
								isRoot: false,
							});
						}
					} catch (error) {
						const errorMessage =
							error instanceof Error ? error.message : String(error);
						Logger.debug(`Failed to parse ${packageJsonPath}: ${errorMessage}`);
					}
				}
			}
		}
	}

	return projects;
}
