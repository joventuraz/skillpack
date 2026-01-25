import { describe, expect, it } from "vitest";
import { SkillpackConfigSchema } from "../src/lib/types.js";

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

	it("rejects config without agents", () => {
		const config = {
			skills: {
				"org/repo": ["skill1"],
			},
		};

		expect(() => SkillpackConfigSchema.parse(config)).toThrow();
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

	it("rejects config without skills", () => {
		const config = {
			agents: ["claude-code"],
		};

		expect(() => SkillpackConfigSchema.parse(config)).toThrow();
	});
});
