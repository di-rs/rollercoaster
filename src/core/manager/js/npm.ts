import type { JsWorkspace } from "../../../types/index.js";
import { executeCommand } from "./utils.js";

export class NpmWorkspace implements JsWorkspace {
	constructor(private cwd?: string) {}

	name(): string {
		return "npm";
	}

	execName(): string {
		return "npx";
	}

	async runScript(scriptName: string, args: string[] = []): Promise<void> {
		await executeCommand("npm", ["run", scriptName, "--", ...args], this.cwd);
	}

	async installDeps(): Promise<void> {
		await executeCommand("npm", ["install"], this.cwd);
	}

	async addPackage(pkg: string, dev: boolean = false): Promise<void> {
		const args = ["install", pkg];
		if (dev) {
			args.push("--save-dev");
		}
		await executeCommand("npm", args, this.cwd);
	}

	async removePackage(pkg: string): Promise<void> {
		await executeCommand("npm", ["uninstall", pkg], this.cwd);
	}

	async executeCommand(command: string, args: string[] = []): Promise<void> {
		await executeCommand("npx", [command, ...args], this.cwd);
	}
}
