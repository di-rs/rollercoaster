import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import yaml from "js-yaml";

export async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

export async function findFileInTree(
	filename: string,
	startDir: string,
	rootDir: string,
): Promise<string | null> {
	let currentDir = startDir;

	while (currentDir.startsWith(rootDir) || currentDir === rootDir) {
		const filePath = join(currentDir, filename);
		if (await fileExists(filePath)) {
			return filePath;
		}

		const parentDir = dirname(currentDir);
		if (parentDir === currentDir) break;
		currentDir = parentDir;
	}

	return null;
}

export async function findFilesInTree(
	filenames: string[],
	startDir: string,
	rootDir: string,
): Promise<string[]> {
	const found: string[] = [];
	let currentDir = startDir;

	while (currentDir.startsWith(rootDir) || currentDir === rootDir) {
		for (const filename of filenames) {
			const filePath = join(currentDir, filename);
			if ((await fileExists(filePath)) && !found.includes(filePath)) {
				found.push(filePath);
			}
		}

		const parentDir = dirname(currentDir);
		if (parentDir === currentDir) break;
		currentDir = parentDir;
	}

	return found;
}

export async function parseJSON<T>(path: string): Promise<T> {
	const content = await readFile(path, "utf-8");
	return JSON.parse(content) as T;
}

export async function parseYAML<T>(path: string): Promise<T> {
	const content = await readFile(path, "utf-8");
	return yaml.load(content) as T;
}

export async function findGitRoot(startDir: string): Promise<string> {
	let currentDir = startDir;

	while (true) {
		const gitPath = join(currentDir, ".git");
		if (await fileExists(gitPath)) {
			return currentDir;
		}

		const parentDir = dirname(currentDir);
		if (parentDir === currentDir) {
			// Reached root, return start dir
			return startDir;
		}
		currentDir = parentDir;
	}
}
