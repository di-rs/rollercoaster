import { readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { binaryConfigs } from "../build.config";

for (const [platform, config] of Object.entries(binaryConfigs)) {
	console.log(`Building binary for ${platform}...`);
	const result = await Bun.build(config);

	if (!result.success) {
		console.error(`Build failed for ${platform}`);
		for (const log of result.logs) {
			console.error(log);
		}
		process.exit(1);
	}

	console.log(`Binary for ${platform} completed successfully`);
}

// Clean up temporary .bun-build files
const files = readdirSync(".");
for (const file of files) {
	if (file.endsWith(".bun-build")) {
		unlinkSync(join(".", file));
		console.log(`Cleaned up temporary file: ${file}`);
	}
}

console.log("All binaries built successfully");
