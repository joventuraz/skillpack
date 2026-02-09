import chalk from "chalk";
import ora, { type Ora } from "ora";

export const logger = {
	info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
	success: (msg: string) => console.log(chalk.green("✓"), msg),
	warn: (msg: string) => console.log(chalk.yellow("⚠"), msg),
	error: (msg: string) => console.error(chalk.red("✗"), msg),
	debug: (msg: string, verbose: boolean) => {
		if (verbose) console.log(chalk.gray("  →"), chalk.gray(msg));
	},

	// Styled text helpers
	bold: (text: string) => chalk.bold(text),
	dim: (text: string) => chalk.dim(text),
	cyan: (text: string) => chalk.cyan(text),
	green: (text: string) => chalk.green(text),
	yellow: (text: string) => chalk.yellow(text),
	red: (text: string) => chalk.red(text),

	// Summary formatting
	summary: (installed: number, skipped: number, failed: number) => {
		const parts: string[] = [];
		if (installed > 0) parts.push(chalk.green(`${installed} installed`));
		if (skipped > 0) parts.push(chalk.yellow(`${skipped} skipped`));
		if (failed > 0) parts.push(chalk.red(`${failed} failed`));
		if (parts.length === 0) parts.push(chalk.gray("nothing to install"));
		console.log(`\n${chalk.bold("Summary:")}`, parts.join(", "));
	},

	// Blank line
	blank: () => console.log(),
};

// Spinner factory
export function createSpinner(text: string): Ora {
	return ora({ text, color: "cyan" });
}
