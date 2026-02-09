#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { installCommand } from "./commands/install.js";
import type { InitOptions, InstallOptions } from "./lib/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
	readFileSync(join(__dirname, "../package.json"), "utf-8"),
);

const program = new Command();

program
	.name("skillpack")
	.description(
		"Package manager for skills.sh - batch install skills to AI agents",
	)
	.version(pkg.version);

program
	.command("install")
	.description("Install all skills from skillpack.yaml")
	.option("--dry-run", "Show what would be installed without installing", false)
	.option("--force", "Reinstall even if already present", false)
	.option("--verbose", "Detailed output", false)
	.option("--config <path>", "Custom config file path")
	.option("--no-lock", "Ignore lockfile and install latest")
	.option("-g, --global", "Install skills to global folders", false)
	.action(async (opts) => {
		const options: InstallOptions = {
			dryRun: opts.dryRun,
			force: opts.force,
			verbose: opts.verbose,
			config: opts.config,
			noLock: !opts.lock, // commander converts --no-lock to lock: false
			global: opts.global,
		};
		await installCommand(options);
	});

program
	.command("init")
	.description("Create a skillpack.yaml template")
	.option("--force", "Overwrite existing skillpack.yaml", false)
	.action(async (opts) => {
		const options: InitOptions = {
			force: opts.force,
		};
		await initCommand(options);
	});

// Default to install if no command specified
program.action(async () => {
	// Show help if no arguments
	program.help();
});

program.parse();
