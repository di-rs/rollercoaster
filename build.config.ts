import type { BuildConfig } from "bun";

const baseConfig = {
	entrypoints: ["./src/index.ts"],
	minify: true,
	define: {
		"process.env.NODE_ENV": '"production"',
	},
} satisfies BuildConfig;

export const npmConfig = {
	...baseConfig,
	outdir: "./dist",
	target: "node",
	naming: "index.js",
} satisfies BuildConfig;

export const binaryConfigs = {
	"macos-arm64": {
		...baseConfig,
		compile: {
			target: "bun-darwin-arm64",
			outfile: "./dist/rollercoaster-macos-arm64",
		},
	},
	"macos-x64": {
		...baseConfig,
		compile: {
			target: "bun-darwin-x64",
			outfile: "./dist/rollercoaster-macos-x64",
		},
	},
	"linux-x64": {
		...baseConfig,
		compile: {
			target: "bun-linux-x64",
			outfile: "./dist/rollercoaster-linux-x64",
		},
	},
} as const;

export default baseConfig;
