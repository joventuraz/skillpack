import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	findConfigPath,
	isValidRepoFormat,
	parseSkillsToInstall,
} from "../src/lib/config.js";
import { SkillpackConfigSchema, SUPPORTED_AGENTS } from "../src/lib/types.js";

describe("SkillpackConfigSchema", () => {
	it("parses valid config with array of skills", () => {
		const config = {
			agents: ["claude-code"],
			skills: {
				"vercel-labs/agent-skills": ["skill1", "skill2"],
			},
		};

		const result = SkillpackConfigSchema.parse(config);
		expect(result.agents).toEqual(["claude-code"]);
		expect(result.skills["vercel-labs/agent-skills"]).toEqual({
			skills: ["skill1", "skill2"],
		});
	});

	it("parses config with 'all' keyword", () => {
		const config = {
			agents: ["cursor"],
			skills: {
				"org/repo": "all",
			},
		};

		const result = SkillpackConfigSchema.parse(config);
		expect(result.skills["org/repo"]).toBe("all");
	});

	it("parses config with ref and skills", () => {
		const config = {
			agents: ["claude-code"],
			skills: {
				"pinned/repo": {
					ref: "v1.0.0",
					skills: ["specific-skill"],
				},
			},
		};

		const result = SkillpackConfigSchema.parse(config);
		expect(result.skills["pinned/repo"]).toEqual({
			ref: "v1.0.0",
			skills: ["specific-skill"],
		});
	});

	it("rejects config when agents is omitted", () => {
		const config = {
			skills: {
				"org/repo": ["skill1"],
			},
		};

		expect(() => SkillpackConfigSchema.parse(config)).toThrow(
			"agents",
		);
	});

	it("rejects config with empty agents array", () => {
		const config = {
			agents: [],
			skills: {
				"org/repo": ["skill1"],
			},
		};

		expect(() => SkillpackConfigSchema.parse(config)).toThrow();
	});

	it("defaults global to false when omitted", () => {
		const config = {
			agents: ["claude-code"],
			skills: {
				"org/repo": ["skill1"],
			},
		};

		const result = SkillpackConfigSchema.parse(config);
		expect(result.global).toBe(false);
	});

	it("parses global: true from config", () => {
		const config = {
			agents: ["claude-code"],
			global: true,
			skills: {
				"org/repo": ["skill1"],
			},
		};

		const result = SkillpackConfigSchema.parse(config);
		expect(result.global).toBe(true);
	});

	it("rejects config without skills", () => {
		const config = {
			agents: ["claude-code"],
		};

		expect(() => SkillpackConfigSchema.parse(config)).toThrow();
	});
});

describe("parseSkillsToInstall", () => {
	it("expands '*' agents to all supported agents", () => {
		const config = SkillpackConfigSchema.parse({
			agents: ["*"],
			skills: {
				"org/repo": "all",
			},
		});

		const { skills } = parseSkillsToInstall(config);
		expect(skills[0].agents).toEqual([...SUPPORTED_AGENTS]);
	});

	it("preserves explicitly listed agents", () => {
		const config = SkillpackConfigSchema.parse({
			agents: ["claude-code", "cursor"],
			skills: {
				"org/repo": "all",
			},
		});

		const { skills } = parseSkillsToInstall(config);
		expect(skills[0].agents).toEqual(["claude-code", "cursor"]);
	});

	it("skips invalid repos and reports them", () => {
		const config = SkillpackConfigSchema.parse({
			agents: ["claude-code"],
			skills: {
				"valid/repo": ["skill1"],
				"invalid!!repo": ["skill2"],
				"also-valid/repo2": ["skill3"],
			},
		});

		const { skills, invalidRepos } = parseSkillsToInstall(config);
		expect(skills).toHaveLength(2);
		expect(skills[0].repo).toBe("valid/repo");
		expect(skills[1].repo).toBe("also-valid/repo2");
		expect(invalidRepos).toEqual(["invalid!!repo"]);
	});

	it("returns empty invalidRepos when all repos are valid", () => {
		const config = SkillpackConfigSchema.parse({
			agents: ["claude-code"],
			skills: {
				"org/repo": ["skill1"],
			},
		});

		const { invalidRepos } = parseSkillsToInstall(config);
		expect(invalidRepos).toEqual([]);
	});

	it("extracts ref from pinned skill entries", () => {
		const config = SkillpackConfigSchema.parse({
			agents: ["claude-code"],
			skills: {
				"pinned/repo": {
					ref: "v2.0.0",
					skills: ["my-skill"],
				},
			},
		});

		const { skills } = parseSkillsToInstall(config);
		expect(skills[0].ref).toBe("v2.0.0");
		expect(skills[0].skills).toEqual(["my-skill"]);
	});

	it("does not set ref when not specified", () => {
		const config = SkillpackConfigSchema.parse({
			agents: ["claude-code"],
			skills: {
				"org/repo": ["skill1"],
			},
		});

		const { skills } = parseSkillsToInstall(config);
		expect(skills[0].ref).toBeUndefined();
	});
});

describe("isValidRepoFormat", () => {
	it("accepts valid owner/repo format", () => {
		expect(isValidRepoFormat("org/repo")).toBe(true);
	});

	it("accepts hyphens in owner and repo", () => {
		expect(isValidRepoFormat("my-org/my-repo")).toBe(true);
	});

	it("accepts underscores in owner and repo", () => {
		expect(isValidRepoFormat("my_org/my_repo")).toBe(true);
	});

	it("rejects repo without owner", () => {
		expect(isValidRepoFormat("repo")).toBe(false);
	});

	it("rejects repo with special characters", () => {
		expect(isValidRepoFormat("org!/repo")).toBe(false);
		expect(isValidRepoFormat("org/repo!")).toBe(false);
	});

	it("rejects empty string", () => {
		expect(isValidRepoFormat("")).toBe(false);
	});

	it("rejects repo with multiple slashes", () => {
		expect(isValidRepoFormat("org/sub/repo")).toBe(false);
	});
});

describe("findConfigPath", () => {
	const tmpBase = join(process.cwd(), "tmp-test-findconfig");
	const deepDir = join(tmpBase, "a", "b", "c");

	beforeEach(() => {
		mkdirSync(deepDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(tmpBase, { recursive: true, force: true });
	});

	it("finds config in the starting directory", () => {
		writeFileSync(join(deepDir, "skillpack.yaml"), "skills: {}");
		const result = findConfigPath(deepDir);
		expect(result).toBe(join(deepDir, "skillpack.yaml"));
	});

	it("walks up multiple directories to find config", () => {
		writeFileSync(join(tmpBase, "skillpack.yaml"), "skills: {}");
		const result = findConfigPath(deepDir);
		expect(result).toBe(join(tmpBase, "skillpack.yaml"));
	});

	it("finds config in an intermediate parent directory", () => {
		const midDir = join(tmpBase, "a");
		writeFileSync(join(midDir, "skillpack.yaml"), "skills: {}");
		const result = findConfigPath(deepDir);
		expect(result).toBe(join(midDir, "skillpack.yaml"));
	});

	it("returns null when no config exists", () => {
		const result = findConfigPath(deepDir);
		expect(result).toBeNull();
	});

	it("returns closest config when multiple exist", () => {
		writeFileSync(join(tmpBase, "skillpack.yaml"), "skills: {}");
		writeFileSync(join(tmpBase, "a", "b", "skillpack.yaml"), "skills: {}");
		const result = findConfigPath(deepDir);
		expect(result).toBe(join(tmpBase, "a", "b", "skillpack.yaml"));
	});
});
