import chalk from "chalk";

export class Logger {
	static error(message: string, error?: Error): void {
		console.error(chalk.bgRed.white(" ERROR "), message);
		if (error) {
			console.error(error.message);
			if (process.env.NODE_ENV === "development" && error.stack) {
				console.error(error.stack);
			}
		}
	}

	static info(message: string): void {
		console.log(chalk.bgBlue.white(" INFO "), message);
	}

	static warn(message: string): void {
		console.warn(chalk.bgYellow.black(" WARN "), message);
	}

	static debug(message: string): void {
		if (process.env.NODE_ENV === "development" || process.env.DEBUG) {
			console.log(chalk.bgGreen.white(" DEBUG "), message);
		}
	}

	static success(message: string): void {
		console.log(chalk.bgGreen.white(" SUCCESS "), message);
	}
}
