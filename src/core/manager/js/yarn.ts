import type { JsWorkspace } from "../../../types/index.js";
import { executeCommand } from "./utils.js";

export class YarnWorkspace implements JsWorkspace {
	constructor(
		private version: string = "1",
		private cwd?: string,
	) {}

	name(): string {
		return `yarn@${this.version}`;
	}

	execName(): string {
		return "yarn";
	}

	async runScript(scriptName: string, args: string[] = []): Promise<void> {
		await executeCommand("yarn", ["run", scriptName, ...args], this.cwd);
	}

	async installDeps(): Promise<void> {
		await executeCommand("yarn", ["install"], this.cwd);
	}

	async addPackage(pkg: string, dev: boolean = false): Promise<void> {
		const args = ["add", pkg];
		if (dev) {
			args.push("--dev");
		}
		await executeCommand("yarn", args, this.cwd);
	}

	async removePackage(pkg: string): Promise<void> {
		await executeCommand("yarn", ["remove", pkg], this.cwd);
	}

	async executeCommand(command: string, args: string[] = []): Promise<void> {
		await executeCommand("yarn", [command, ...args], this.cwd);
	}
}
