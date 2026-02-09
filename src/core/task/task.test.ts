import { describe, expect, it } from "vitest";
import type { Task } from "../../types/index.js";
import { createTask, filterUniqueTasks, sortTasks } from "./task.js";

describe("Task Utilities", () => {
	describe("createTask", () => {
		it("should create a task with name only", () => {
			const task = createTask("build");
			expect(task).toEqual({
				name: "build",
				description: undefined,
				directory: undefined,
			});
		});

		it("should create a task with name and description", () => {
			const task = createTask("build", "Build the project");
			expect(task).toEqual({
				name: "build",
				description: "Build the project",
				directory: undefined,
			});
		});

		it("should create a task with all properties", () => {
			const task = createTask(
				"build",
				"Build the project",
				"/home/user/project",
			);
			expect(task).toEqual({
				name: "build",
				description: "Build the project",
				directory: "/home/user/project",
			});
		});
	});

	describe("sortTasks", () => {
		it("should sort tasks alphabetically by name", () => {
			const tasks: Task[] = [
				{ name: "test" },
				{ name: "build" },
				{ name: "dev" },
				{ name: "lint" },
			];

			const sorted = sortTasks(tasks);

			expect(sorted.map((t) => t.name)).toEqual([
				"build",
				"dev",
				"lint",
				"test",
			]);
		});

		it("should not modify the original array", () => {
			const tasks: Task[] = [{ name: "test" }, { name: "build" }];

			const original = [...tasks];
			sortTasks(tasks);

			expect(tasks).toEqual(original);
		});

		it("should handle empty array", () => {
			const tasks: Task[] = [];
			const sorted = sortTasks(tasks);
			expect(sorted).toEqual([]);
		});

		it("should handle single task", () => {
			const tasks: Task[] = [{ name: "build" }];
			const sorted = sortTasks(tasks);
			expect(sorted).toEqual([{ name: "build" }]);
		});

		it("should sort case-insensitively", () => {
			const tasks: Task[] = [
				{ name: "Test" },
				{ name: "build" },
				{ name: "Dev" },
			];

			const sorted = sortTasks(tasks);
			expect(sorted.map((t) => t.name)).toEqual(["build", "Dev", "Test"]);
		});
	});

	describe("filterUniqueTasks", () => {
		it("should remove duplicate tasks with same name", () => {
			const tasks: Task[] = [
				{ name: "build" },
				{ name: "test" },
				{ name: "build" },
			];

			const unique = filterUniqueTasks(tasks);
			expect(unique).toHaveLength(2);
			expect(unique.map((t) => t.name)).toEqual(["build", "test"]);
		});

		it("should keep tasks with same name but different directories", () => {
			const tasks: Task[] = [
				{ name: "build", directory: "/home/user/project1" },
				{ name: "build", directory: "/home/user/project2" },
			];

			const unique = filterUniqueTasks(tasks);
			expect(unique).toHaveLength(2);
		});

		it("should remove exact duplicates", () => {
			const tasks: Task[] = [
				{ name: "build", directory: "/home/user/project" },
				{ name: "build", directory: "/home/user/project" },
				{ name: "test", directory: "/home/user/project" },
			];

			const unique = filterUniqueTasks(tasks);
			expect(unique).toHaveLength(2);
		});

		it("should handle empty array", () => {
			const tasks: Task[] = [];
			const unique = filterUniqueTasks(tasks);
			expect(unique).toEqual([]);
		});

		it("should handle tasks with no directory", () => {
			const tasks: Task[] = [
				{ name: "build" },
				{ name: "build" },
				{ name: "test" },
			];

			const unique = filterUniqueTasks(tasks);
			expect(unique).toHaveLength(2);
			expect(unique.map((t) => t.name)).toEqual(["build", "test"]);
		});

		it("should preserve task order for first occurrence", () => {
			const tasks: Task[] = [
				{ name: "test" },
				{ name: "build" },
				{ name: "test" },
				{ name: "dev" },
			];

			const unique = filterUniqueTasks(tasks);
			expect(unique.map((t) => t.name)).toEqual(["test", "build", "dev"]);
		});
	});

	describe("integration", () => {
		it("should work together to sort and filter tasks", () => {
			const tasks: Task[] = [
				{ name: "test" },
				{ name: "build" },
				{ name: "test" },
				{ name: "dev" },
				{ name: "build" },
			];

			const unique = filterUniqueTasks(tasks);
			const sorted = sortTasks(unique);

			expect(sorted.map((t) => t.name)).toEqual(["build", "dev", "test"]);
		});
	});
});
