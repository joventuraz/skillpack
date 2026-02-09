import { describe, expect, it } from "vitest";
import { parseSkillsToInstall } from "../src/lib/config.js";
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

	it("defaults agents to ['*'] when omitted", () => {
		const config = {
			skills: {
				"org/repo": ["skill1"],
			},
		};

		const result = SkillpackConfigSchema.parse(config);
		expect(result.agents).toEqual(["*"]);
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
});
