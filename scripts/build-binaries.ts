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

console.log("All binaries built successfully");
