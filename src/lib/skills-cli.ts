import { type Options as ExecaOptions, execa } from "execa";
import { logger } from "../utils/logger.js";
import type { InstallResult, SkillToInstall } from "./types.js";

const MAX_RETRIES = 1;

interface SkillsAddOptions {
	dryRun: boolean;
	verbose: boolean;
	global: boolean;
}

/**
 * Build the npx skills add command arguments
 */
export function buildSkillsCommand(
	skill: SkillToInstall,
	options?: { global?: boolean },
): string[] {
	const args = ["skills", "add", skill.repo, "-y"];

	// Add global flag
	if (options?.global) {
		args.push("-g");
	}

	// Add agents
	for (const agent of skill.agents) {
		args.push("-a", agent);
	}

	// Add specific skills (omit for "all")
	if (skill.skills !== "all") {
		for (const s of skill.skills) {
			args.push("-s", s);
		}
	}

	return args;
}

/**
 * Execute a single skill installation
 */
export async function installSkill(
	skill: SkillToInstall,
	specificSkill: string | null, // null means install all from the skill.skills list
	options: SkillsAddOptions,
): Promise<InstallResult> {
	const skillName =
		specificSkill ?? (skill.skills === "all" ? "all" : skill.skills.join(", "));
	const repo = skill.repo;

	// Build command for this specific skill or all
	const baseArgs = ["skills", "add", repo, "-y"];

	// Add global flag
	if (options.global) {
		baseArgs.push("-g");
	}

	// Add agents
	for (const agent of skill.agents) {
		baseArgs.push("-a", agent);
	}

	// Add specific skill if provided
	if (specificSkill) {
		baseArgs.push("-s", specificSkill);
	} else if (skill.skills !== "all") {
		// Multiple skills at once
		for (const s of skill.skills) {
			baseArgs.push("-s", s);
		}
	}

	if (options.dryRun) {
		logger.info(`Would run: npx ${baseArgs.join(" ")}`);
		return { repo, skill: skillName, status: "skipped", message: "dry run" };
	}

	logger.debug(`Running: npx ${baseArgs.join(" ")}`, options.verbose);

	// Execute with retry
	let lastError: string | undefined;
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const execaOpts: ExecaOptions = {
				reject: false,
				timeout: 120_000, // 2 minute timeout
			};

			const result = await execa("npx", baseArgs, execaOpts);

			if (result.exitCode === 0) {
				return { repo, skill: skillName, status: "installed" };
			}

			// Check for "already installed" pattern
			const stdout = String(result.stdout ?? "");
			const stderr = String(result.stderr ?? "");
			const output = stdout + stderr;
			if (
				output.includes("already installed") ||
				output.includes("Already installed")
			) {
				return {
					repo,
					skill: skillName,
					status: "skipped",
					message: "already installed",
				};
			}

			lastError = stderr || stdout || `Exit code ${result.exitCode}`;
		} catch (err) {
			lastError = err instanceof Error ? err.message : String(err);
		}

		// Retry on network errors
		if (attempt < MAX_RETRIES && isRetryableError(lastError)) {
			logger.debug(
				`Retrying ${skillName} (attempt ${attempt + 2})...`,
				options.verbose,
			);
			await sleep(1000);
		}
	}

	return { repo, skill: skillName, status: "failed", message: lastError };
}

/**
 * Install all skills from a skill entry
 */
export async function installSkillEntry(
	skill: SkillToInstall,
	options: SkillsAddOptions,
): Promise<InstallResult[]> {
	// For "all" or when installing multiple skills at once,
	// we run a single command and track it as one result
	if (skill.skills === "all") {
		const result = await installSkill(skill, null, options);
		return [result];
	}

	// For multiple specific skills, we can run them together in one command
	const result = await installSkill(skill, null, options);

	// Return one result per skill for better granularity in the summary
	return skill.skills.map((s) => ({
		...result,
		skill: s,
	}));
}

function isRetryableError(error: string | undefined): boolean {
	if (!error) return false;
	const retryablePatterns = [
		"ECONNRESET",
		"ETIMEDOUT",
		"ENOTFOUND",
		"network",
		"timeout",
		"fetch failed",
	];
	return retryablePatterns.some((p) =>
		error.toLowerCase().includes(p.toLowerCase()),
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get the current commit of a cloned repo (for lockfile)
 * This would require fetching repo info; for now return a placeholder
 */
export async function getRepoCommit(_repo: string): Promise<string> {
	// TODO: In a full implementation, we'd fetch the actual commit SHA
	// For now, use a timestamp-based identifier
	return `installed-${Date.now()}`;
}
