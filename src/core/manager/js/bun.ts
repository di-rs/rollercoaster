import type { JsWorkspace } from "../../../types/index.js";
import { executeCommand } from "./utils.js";

export class BunWorkspace implements JsWorkspace {
	constructor(private cwd?: string) {}

	name(): string {
		return "bun";
	}

	execName(): string {
		return "bunx";
	}

	async runScript(scriptName: string, args: string[] = []): Promise<void> {
		await executeCommand("bun", ["run", scriptName, ...args], this.cwd);
	}

	async installDeps(): Promise<void> {
		await executeCommand("bun", ["install"], this.cwd);
	}

	async addPackage(pkg: string, dev: boolean = false): Promise<void> {
		const args = ["add", pkg];
		if (dev) {
			args.push("--dev");
		}
		await executeCommand("bun", args, this.cwd);
	}

	async removePackage(pkg: string): Promise<void> {
		await executeCommand("bun", ["remove", pkg], this.cwd);
	}

	async executeCommand(command: string, args: string[] = []): Promise<void> {
		await executeCommand("bunx", [command, ...args], this.cwd);
	}
}
