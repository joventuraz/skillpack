import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { ZodError } from "zod";
import {
	type SkillEntry,
	type SkillpackConfig,
	SkillpackConfigSchema,
	type SkillToInstall,
} from "./types.js";

const CONFIG_FILENAME = "skillpack.yaml";

/**
 * Find skillpack.yaml by walking up from cwd
 */
export function findConfigPath(
	startDir: string = process.cwd(),
): string | null {
	let dir = resolve(startDir);
	const root = dirname(dir);

	while (dir !== root) {
		const configPath = join(dir, CONFIG_FILENAME);
		if (existsSync(configPath)) {
			return configPath;
		}
		dir = dirname(dir);
	}

	// Check root as well
	const rootConfig = join(root, CONFIG_FILENAME);
	if (existsSync(rootConfig)) {
		return rootConfig;
	}

	return null;
}

/**
 * Parse and validate skillpack.yaml
 */
export async function loadConfig(configPath: string): Promise<SkillpackConfig> {
	const content = await readFile(configPath, "utf-8");

	let parsed: unknown;
	try {
		parsed = parseYaml(content);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		throw new Error(`Failed to parse YAML: ${msg}`);
	}

	try {
		return SkillpackConfigSchema.parse(parsed);
	} catch (err) {
		if (err instanceof ZodError) {
			const issues = err.issues.map((issue) => {
				const path = issue.path.join(".");
				return `  - ${path}: ${issue.message}`;
			});
			throw new Error(`Invalid skillpack.yaml:\n${issues.join("\n")}`);
		}
		throw err;
	}
}

/**
 * Transform config into normalized list of skills to install
 */
export function parseSkillsToInstall(
	config: SkillpackConfig,
): SkillToInstall[] {
	const result: SkillToInstall[] = [];

	for (const [repo, entry] of Object.entries(config.skills)) {
		const item: SkillToInstall = {
			repo,
			skills: resolveSkillsList(entry),
			agents: config.agents,
		};

		// Extract ref if present
		if (typeof entry === "object" && entry !== null && "ref" in entry) {
			item.ref = entry.ref;
		}

		result.push(item);
	}

	return result;
}

function resolveSkillsList(entry: SkillEntry): string[] | "all" {
	if (entry === "all") {
		return "all";
	}
	return entry.skills;
}

/**
 * Validate repo format (owner/repo)
 */
export function isValidRepoFormat(repo: string): boolean {
	return /^[\w-]+\/[\w-]+$/.test(repo);
}
