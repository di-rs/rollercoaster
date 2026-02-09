export interface Task {
	name: string;
	description?: string;
	directory?: string;
}

export interface ManagerTitle {
	name: string;
	description: string;
}

export interface Manager {
	getTitle(): ManagerTitle;
	listTasks(): Promise<Task[]>;
	executeTask(task: Task, args?: string[]): Promise<void>;
}

export interface ManagerTask {
	task: Task;
	manager: Manager;
}

export interface Config {
	defaultJSManager: string;
	enableDefaultJSManager: boolean;
	autoSelectClosest: boolean;
}

export interface ParseManagerConfig {
	defaultJSManager?: string;
}

export interface JsWorkspace {
	name(): string;
	execName(): string;
	runScript(scriptName: string, args?: string[]): Promise<void>;
	installDeps(): Promise<void>;
	addPackage(pkg: string, dev?: boolean): Promise<void>;
	removePackage(pkg: string): Promise<void>;
	executeCommand(command: string, args?: string[]): Promise<void>;
}

export interface PackageJson {
	name?: string;
	version?: string;
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

export interface TaskfileV3 {
	version: string;
	tasks?: Record<string, TaskDefinition>;
	includes?: Record<string, string | TaskfileInclude>;
}

export interface TaskDefinition {
	desc?: string;
	summary?: string;
	cmds?: Array<string | TaskCommand>;
	deps?: string[];
	silent?: boolean;
}

export interface TaskCommand {
	cmd?: string;
	task?: string;
	silent?: boolean;
}

export interface TaskfileInclude {
	taskfile: string;
	dir?: string;
	optional?: boolean;
}
