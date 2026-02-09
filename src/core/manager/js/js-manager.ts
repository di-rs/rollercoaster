import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
	JsWorkspace,
	Manager,
	ManagerTitle,
	PackageJson,
	Task,
} from "../../../types/index.js";
import { Logger } from "../../logger/logger.js";
import { createTask } from "../../task/task.js";
import { fileExists, parseJSON } from "../config-file/config-file.js";
import { BunWorkspace } from "./bun.js";
import { NpmWorkspace } from "./npm.js";
import { PnpmWorkspace } from "./pnpm.js";
import { YarnWorkspace } from "./yarn.js";

export class JsManager implements Manager {
	private workspace: JsWorkspace;
	private packageJsonPath: string;

	constructor(
		private directory: string,
		defaultManager: string = "npm",
	) {
		this.packageJsonPath = join(directory, "package.json");
		this.workspace = this.detectWorkspace(defaultManager);
	}

	private detectWorkspace(defaultManager: string): JsWorkspace {
		const bunLockPath = join(this.directory, "bun.lockb");
		const pnpmLockPath = join(this.directory, "pnpm-lock.yaml");
		const yarnLockPath = join(this.directory, "yarn.lock");
		const npmLockPath = join(this.directory, "package-lock.json");

		// Synchronous check for simplicity in constructor
		try {
			if (existsSync(bunLockPath)) {
				return new BunWorkspace(this.directory);
			} else if (existsSync(pnpmLockPath)) {
				// Try to detect pnpm version from lockfile
				return new PnpmWorkspace("9+", this.directory);
			} else if (existsSync(yarnLockPath)) {
				return new YarnWorkspace("1", this.directory);
			} else if (existsSync(npmLockPath)) {
				return new NpmWorkspace(this.directory);
			}
		} catch {
			// Fall through to default
		}

		// No lock file, use default
		switch (defaultManager) {
			case "bun":
				return new BunWorkspace(this.directory);
			case "pnpm":
				return new PnpmWorkspace("9+", this.directory);
			case "yarn":
				return new YarnWorkspace("1", this.directory);
			default:
				return new NpmWorkspace(this.directory);
		}
	}

	getTitle(): ManagerTitle {
		return {
			name: this.workspace.name(),
			description: this.directory,
		};
	}

	async listTasks(): Promise<Task[]> {
		try {
			if (!(await fileExists(this.packageJsonPath))) {
				return [];
			}

			const packageJson = await parseJSON<PackageJson>(this.packageJsonPath);

			if (!packageJson.scripts) {
				return [];
			}

			const tasks: Task[] = [];
			for (const [name, script] of Object.entries(packageJson.scripts)) {
				tasks.push(createTask(name, script, this.directory));
			}

			return tasks;
		} catch (error) {
			Logger.error(
				`Failed to parse package.json at ${this.packageJsonPath}`,
				error as Error,
			);
			return [];
		}
	}

	async executeTask(task: Task, args: string[] = []): Promise<void> {
		await this.workspace.runScript(task.name, args);
	}

	getWorkspace(): JsWorkspace {
		return this.workspace;
	}
}
