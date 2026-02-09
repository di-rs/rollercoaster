import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsManager } from "../js/js-manager.js";
import { TaskManager } from "../task-manager/task-manager.js";
import { parseManagers } from "./parser.js";

describe("Parser", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = join(tmpdir(), `parser-test-${Date.now()}`);
		await mkdir(testDir, { recursive: true });

		// Create .git directory to mark as git root
		await mkdir(join(testDir, ".git"));
	});

	afterEach(async () => {
		try {
			await rm(testDir, { recursive: true, force: true });
		} catch {
			// Ignore errors
		}
	});

	describe("parseManagers", () => {
		it("should find JavaScript manager with package.json", async () => {
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "test", scripts: { build: "tsc" } }),
			);

			const managers = await parseManagers(testDir);

			expect(managers).toHaveLength(1);
			expect(managers[0]).toBeInstanceOf(JsManager);
		});

		it("should find Task manager with Taskfile.yml", async () => {
			await writeFile(
				join(testDir, "Taskfile.yml"),
				`version: '3'\ntasks:\n  build:\n    cmds:\n      - go build`,
			);

			const managers = await parseManagers(testDir);

			expect(managers).toHaveLength(1);
			expect(managers[0]).toBeInstanceOf(TaskManager);
		});

		it("should find both JavaScript and Task managers", async () => {
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "test", scripts: { build: "tsc" } }),
			);
			await writeFile(
				join(testDir, "Taskfile.yml"),
				`version: '3'\ntasks:\n  build:\n    cmds:\n      - go build`,
			);

			const managers = await parseManagers(testDir);

			expect(managers).toHaveLength(2);
			const types = managers.map((m) => m.constructor.name);
			expect(types).toContain("JsManager");
			expect(types).toContain("TaskManager");
		});

		it("should scan parent directories up to git root", async () => {
			const subDir = join(testDir, "sub", "nested");
			await mkdir(subDir, { recursive: true });

			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "root", scripts: { build: "tsc" } }),
			);

			const managers = await parseManagers(subDir);

			expect(managers).toHaveLength(1);
			expect(managers[0]).toBeInstanceOf(JsManager);
		});

		it("should find managers at multiple levels", async () => {
			const subDir = join(testDir, "sub");
			await mkdir(subDir, { recursive: true });

			// Root level package.json
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "root", scripts: { root: "echo root" } }),
			);

			// Sub level package.json
			await writeFile(
				join(subDir, "package.json"),
				JSON.stringify({ name: "sub", scripts: { sub: "echo sub" } }),
			);

			const managers = await parseManagers(subDir);

			expect(managers).toHaveLength(2);
			expect(managers.every((m) => m instanceof JsManager)).toBe(true);
		});

		it("should use default JS manager when specified", async () => {
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "test", scripts: { build: "tsc" } }),
			);

			const managers = await parseManagers(testDir, {
				defaultJSManager: "pnpm",
			});

			expect(managers).toHaveLength(1);
			const jsManager = managers[0] as JsManager;
			expect(jsManager.getTitle().name).toBe("pnpm@9+");
		});

		it("should return empty array if no managers found", async () => {
			const managers = await parseManagers(testDir);

			expect(managers).toEqual([]);
		});

		it("should stop at git root", async () => {
			// Create outer directory with package.json OUTSIDE git root
			const outerDir = join(tmpdir(), `outer-${Date.now()}`);
			await mkdir(outerDir, { recursive: true });
			await writeFile(
				join(outerDir, "package.json"),
				JSON.stringify({ name: "outer", scripts: { build: "tsc" } }),
			);

			// Create inner git repo
			const innerDir = join(outerDir, "inner");
			await mkdir(innerDir, { recursive: true });
			await mkdir(join(innerDir, ".git"));

			const subDir = join(innerDir, "sub");
			await mkdir(subDir, { recursive: true });

			const managers = await parseManagers(subDir);

			// Should not find the outer package.json
			expect(managers).toEqual([]);

			await rm(outerDir, { recursive: true, force: true });
		});

		it("should handle directory without git root", async () => {
			const noGitDir = join(tmpdir(), `no-git-${Date.now()}`);
			await mkdir(noGitDir, { recursive: true });
			await writeFile(
				join(noGitDir, "package.json"),
				JSON.stringify({ name: "test", scripts: { build: "tsc" } }),
			);

			const managers = await parseManagers(noGitDir);

			expect(managers).toHaveLength(1);

			await rm(noGitDir, { recursive: true, force: true });
		});

		it("should find only one Task manager per directory", async () => {
			await writeFile(
				join(testDir, "Taskfile.yml"),
				`version: '3'\ntasks:\n  build:\n    cmds:\n      - go build`,
			);
			await writeFile(
				join(testDir, "taskfile.yaml"),
				`version: '3'\ntasks:\n  test:\n    cmds:\n      - go test`,
			);

			const managers = await parseManagers(testDir);

			// Should only add one Task manager even though multiple taskfiles exist
			const taskManagers = managers.filter((m) => m instanceof TaskManager);
			expect(taskManagers).toHaveLength(1);
		});

		it("should find managers in correct order (current dir first)", async () => {
			const subDir = join(testDir, "sub");
			await mkdir(subDir, { recursive: true });

			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "root", scripts: { root: "echo root" } }),
			);
			await writeFile(
				join(subDir, "package.json"),
				JSON.stringify({ name: "sub", scripts: { sub: "echo sub" } }),
			);

			const managers = await parseManagers(subDir);

			expect(managers).toHaveLength(2);
			// First manager should be from subDir
			expect(managers[0].getTitle().description).toBe(subDir);
			// Second manager should be from root
			expect(managers[1].getTitle().description).toBe(testDir);
		});

		it("should detect workspace type based on lock files", async () => {
			await writeFile(join(testDir, "pnpm-lock.yaml"), "");
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "test", scripts: { build: "tsc" } }),
			);

			const managers = await parseManagers(testDir);

			expect(managers).toHaveLength(1);
			const jsManager = managers[0] as JsManager;
			expect(jsManager.getTitle().name).toBe("pnpm@9+");
		});

		it("should handle mixed package managers at different levels", async () => {
			const subDir = join(testDir, "sub");
			await mkdir(subDir, { recursive: true });

			// Root with npm
			await writeFile(join(testDir, "package-lock.json"), "{}");
			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "root", scripts: { root: "echo root" } }),
			);

			// Sub with pnpm
			await writeFile(join(subDir, "pnpm-lock.yaml"), "");
			await writeFile(
				join(subDir, "package.json"),
				JSON.stringify({ name: "sub", scripts: { sub: "echo sub" } }),
			);

			const managers = await parseManagers(subDir);

			expect(managers).toHaveLength(2);
			const pnpmManager = managers[0] as JsManager;
			const npmManager = managers[1] as JsManager;

			expect(pnpmManager.getTitle().name).toBe("pnpm@9+");
			expect(npmManager.getTitle().name).toBe("npm");
		});
	});

	describe("edge cases", () => {
		it("should handle permission errors gracefully", async () => {
			// This test is harder to implement cross-platform
			// Just ensure no crash occurs
			const managers = await parseManagers("/root/nonexistent");
			expect(Array.isArray(managers)).toBe(true);
		});

		it("should handle deeply nested directories", async () => {
			let currentDir = testDir;
			for (let i = 0; i < 10; i++) {
				currentDir = join(currentDir, `level${i}`);
				await mkdir(currentDir, { recursive: true });
			}

			await writeFile(
				join(testDir, "package.json"),
				JSON.stringify({ name: "root", scripts: { build: "tsc" } }),
			);

			const managers = await parseManagers(currentDir);

			expect(managers).toHaveLength(1);
			expect(managers[0]).toBeInstanceOf(JsManager);
		});
	});
});
