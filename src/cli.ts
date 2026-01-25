#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { installCommand } from "./commands/install.js";
import type { InitOptions, InstallOptions } from "./lib/types.js";

const program = new Command();

program
	.name("skillpack")
	.description(
		"Package manager for skills.sh - batch install skills to AI agents",
	)
	.version("0.1.0");

program
	.command("install")
	.description("Install all skills from skillpack.yaml")
	.option("--dry-run", "Show what would be installed without installing", false)
	.option("--force", "Reinstall even if already present", false)
	.option("--verbose", "Detailed output", false)
	.option("--config <path>", "Custom config file path")
	.option("--no-lock", "Ignore lockfile and install latest")
	.action(async (opts) => {
		const options: InstallOptions = {
			dryRun: opts.dryRun,
			force: opts.force,
			verbose: opts.verbose,
			config: opts.config,
			noLock: !opts.lock, // commander converts --no-lock to lock: false
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
