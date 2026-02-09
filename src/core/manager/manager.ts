import Fuse from "fuse.js";
import type { Manager, ManagerTask } from "../../types/index.js";
import { Logger } from "../logger/logger.js";
import { sortTasks } from "../task/task.js";

export async function findClosestTask(
	manager: Manager,
	query: string,
): Promise<ManagerTask | null> {
	try {
		const tasks = await manager.listTasks();
		Logger.debug(`Found ${tasks.length} tasks from ${manager.getTitle().name}`);

		const fuse = new Fuse(tasks, {
			keys: ["name"],
			threshold: 0.4,
			includeScore: true,
		});

		const results = fuse.search(query);
		Logger.debug(`Fuzzy matches for '${query}': ${results.length}`);

		if (results.length > 0) {
			return {
				task: results[0].item,
				manager,
			};
		}
	} catch (error) {
		Logger.error(
			`Failed to list tasks from ${manager.getTitle().name}`,
			error as Error,
		);
	}

	return null;
}

export async function findClosestTaskFromList(
	managers: Manager[],
	query: string,
): Promise<ManagerTask | null> {
	for (const manager of managers) {
		const task = await findClosestTask(manager, query);
		if (task !== null) {
			return task;
		}
	}
	return null;
}

export async function findAllClosestTasks(
	managers: Manager[],
	query: string,
): Promise<ManagerTask[]> {
	const allTasks = await getAllManagerTasks(managers);

	const fuse = new Fuse(allTasks, {
		keys: ["task.name"],
		threshold: 0.4,
		includeScore: true,
	});

	const results = fuse.search(query);
	Logger.debug(`Fuzzy matches for '${query}': ${results.length}`);

	return results.map((r) => r.item);
}

export async function getAllManagerTasks(
	managers: Manager[],
): Promise<ManagerTask[]> {
	const allTasks: ManagerTask[] = [];

	for (const manager of managers) {
		try {
			const tasks = await manager.listTasks();
			const sorted = sortTasks(tasks);

			sorted.forEach((task) => {
				allTasks.push({ task, manager });
			});
		} catch (_error) {
			Logger.warn(`Failed to get tasks from ${manager.getTitle().name}`);
		}
	}

	return allTasks;
}

export async function executeSingleTask(
	managerTask: ManagerTask,
	args?: string[],
): Promise<void> {
	await managerTask.manager.executeTask(managerTask.task, args);
}
