import {
	findConfigPath,
	loadConfig,
	parseSkillsToInstall,
} from "../lib/config.js";
import {
	createLockfile,
	getLockfilePath,
	isAlreadyInstalled,
	readLockfile,
	updateLockfile,
	writeLockfile,
} from "../lib/lockfile.js";
import { getRepoCommit, installSkillEntry } from "../lib/skills-cli.js";
import type {
	InstallOptions,
	InstallResult,
	Lockfile,
	SkillpackConfig,
} from "../lib/types.js";
import { createSpinner, logger } from "../utils/logger.js";

export async function installCommand(options: InstallOptions): Promise<void> {
	// 1. Find config file
	const configPath = options.config || findConfigPath();
	if (!configPath) {
		logger.error("No skillpack.yaml found.");
		logger.info("Run 'skillpack init' to create one.");
		process.exit(1);
	}

	logger.debug(`Using config: ${configPath}`, options.verbose);

	// 2. Parse and validate config
	let config: SkillpackConfig;
	try {
		config = await loadConfig(configPath);
	} catch (err) {
		logger.error(err instanceof Error ? err.message : String(err));
		process.exit(1);
	}

	const skillsToInstall = parseSkillsToInstall(config);
	if (skillsToInstall.length === 0) {
		logger.warn("No skills defined in skillpack.yaml");
		return;
	}

	logger.info(
		`Found ${skillsToInstall.length} skill source(s) for agents: ${config.agents.join(", ")}`,
	);

	// 3. Load lockfile (unless --no-lock)
	const lockfilePath = getLockfilePath(configPath);
	let lockfile: Lockfile | null = null;
	if (!options.noLock) {
		lockfile = await readLockfile(lockfilePath);
		if (lockfile) {
			logger.debug("Using existing lockfile", options.verbose);
		}
	}

	// 4. Install each skill
	const allResults: InstallResult[] = [];
	let newLockfile = lockfile || createLockfile();

	for (const skill of skillsToInstall) {
		// Check if already installed (unless --force)
		if (
			!options.force &&
			isAlreadyInstalled(lockfile, skill.repo, skill.skills, skill.agents)
		) {
			const skillNames =
				skill.skills === "all" ? "all skills" : skill.skills.join(", ");
			logger.info(`Skipping ${skill.repo} (${skillNames}) - already installed`);
			allResults.push({
				repo: skill.repo,
				skill: skillNames,
				status: "skipped",
				message: "already in lockfile",
			});
			continue;
		}

		const skillNames =
			skill.skills === "all" ? "all skills" : skill.skills.join(", ");
		const spinner = createSpinner(`Installing ${skill.repo} (${skillNames})`);

		if (!options.dryRun) {
			spinner.start();
		}

		const results = await installSkillEntry(skill, {
			dryRun: options.dryRun,
			verbose: options.verbose,
		});

		allResults.push(...results);

		// Update spinner based on results
		const failed = results.filter((r) => r.status === "failed");
		const installed = results.filter((r) => r.status === "installed");

		if (!options.dryRun) {
			if (failed.length > 0) {
				spinner.fail(`Failed: ${skill.repo}`);
				for (const f of failed) {
					logger.error(`  ${f.skill}: ${f.message}`);
				}
			} else if (installed.length > 0) {
				spinner.succeed(`Installed ${skill.repo}`);
			} else {
				spinner.info(`Skipped ${skill.repo}`);
			}
		}

		// Update lockfile with successful installations
		if (!options.dryRun && installed.length > 0) {
			const commit = await getRepoCommit(skill.repo);
			newLockfile = updateLockfile(newLockfile, skill.repo, {
				commit,
				skills: skill.skills === "all" ? [] : skill.skills,
				agents: skill.agents,
				installedAt: new Date().toISOString(),
			});
		}
	}

	// 5. Write updated lockfile
	if (!options.dryRun && !options.noLock) {
		await writeLockfile(lockfilePath, newLockfile);
		logger.debug(`Updated ${lockfilePath}`, options.verbose);
	}

	// 6. Print summary
	const installed = allResults.filter((r) => r.status === "installed").length;
	const skipped = allResults.filter((r) => r.status === "skipped").length;
	const failed = allResults.filter((r) => r.status === "failed").length;

	logger.summary(installed, skipped, failed);

	// Exit with error if any failed
	if (failed > 0) {
		process.exit(1);
	}
}
