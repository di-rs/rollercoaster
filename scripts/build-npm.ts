import { npmConfig } from "../build.config";

const result = await Bun.build(npmConfig);

if (!result.success) {
	console.error("Build failed");
	for (const log of result.logs) {
		console.error(log);
	}
	process.exit(1);
}

console.log("NPM build completed successfully");
