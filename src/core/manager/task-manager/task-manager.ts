import { join } from "node:path";
import type {
	Manager,
	ManagerTitle,
	Task,
	TaskfileV3,
} from "../../../types/index.js";
import { Logger } from "../../logger/logger.js";
import { createTask } from "../../task/task.js";
import { fileExists, parseYAML } from "../config-file/config-file.js";
import { executeCommand } from "../js/utils.js";

export class TaskManager implements Manager {
	private taskfilePath: string | null = null;

	constructor(private directory: string) {}

	getTitle(): ManagerTitle {
		return {
			name: "Task",
			description: this.directory,
		};
	}

	private async findTaskfile(): Promise<string | null> {
		if (this.taskfilePath) {
			return this.taskfilePath;
		}

		const taskfileNames = [
			"Taskfile.yml",
			"taskfile.yml",
			"Taskfile.yaml",
			"taskfile.yaml",
			"Taskfile.dist.yml",
			"Taskfile.dist.yaml",
		];

		for (const name of taskfileNames) {
			const path = join(this.directory, name);
			if (await fileExists(path)) {
				this.taskfilePath = path;
				return path;
			}
		}

		return null;
	}

	async listTasks(): Promise<Task[]> {
		try {
			const taskfilePath = await this.findTaskfile();
			if (!taskfilePath) {
				return [];
			}

			const taskfile = await parseYAML<TaskfileV3>(taskfilePath);

			// Only support version 3
			if (taskfile.version !== "3") {
				Logger.warn(`Unsupported Taskfile version: ${taskfile.version}`);
				return [];
			}

			if (!taskfile.tasks) {
				return [];
			}

			const tasks: Task[] = [];
			for (const [name, taskDef] of Object.entries(taskfile.tasks)) {
				// Get description from desc or summary
				const description = taskDef.desc || taskDef.summary || undefined;
				tasks.push(createTask(name, description, this.directory));
			}

			return tasks;
		} catch (error) {
			Logger.error(
				`Failed to parse Taskfile at ${this.directory}`,
				error as Error,
			);
			return [];
		}
	}

	async executeTask(task: Task, args: string[] = []): Promise<void> {
		await executeCommand("task", [task.name, ...args], this.directory);
	}
}
