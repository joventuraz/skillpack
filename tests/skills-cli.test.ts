import { describe, expect, it } from "vitest";
import { buildSkillsCommand } from "../src/lib/skills-cli.js";

describe("buildSkillsCommand", () => {
	it("builds command for single agent and specific skills", () => {
		const args = buildSkillsCommand({
			repo: "vercel-labs/agent-skills",
			skills: ["skill1", "skill2"],
			agents: ["claude-code"],
		});

		expect(args).toEqual([
			"skills",
			"add",
			"vercel-labs/agent-skills",
			"-y",
			"-a",
			"claude-code",
			"-s",
			"skill1",
			"-s",
			"skill2",
		]);
	});

	it("builds command for multiple agents", () => {
		const args = buildSkillsCommand({
			repo: "org/repo",
			skills: ["skill1"],
			agents: ["claude-code", "cursor"],
		});

		expect(args).toContain("-a");
		expect(args).toContain("claude-code");
		expect(args).toContain("cursor");
	});

	it("omits -s flag for 'all' skills", () => {
		const args = buildSkillsCommand({
			repo: "org/repo",
			skills: "all",
			agents: ["claude-code"],
		});

		expect(args).not.toContain("-s");
		expect(args).toEqual([
			"skills",
			"add",
			"org/repo",
			"-y",
			"-a",
			"claude-code",
		]);
	});

	it("always includes -y flag for non-interactive mode", () => {
		const args = buildSkillsCommand({
			repo: "org/repo",
			skills: ["skill1"],
			agents: ["claude-code"],
		});

		expect(args).toContain("-y");
	});

	it("includes -g flag when global option is true", () => {
		const args = buildSkillsCommand(
			{
				repo: "org/repo",
				skills: ["skill1"],
				agents: ["claude-code"],
			},
			{ global: true },
		);

		expect(args).toContain("-g");
	});

	it("does not include -g flag when global option is false", () => {
		const args = buildSkillsCommand(
			{
				repo: "org/repo",
				skills: ["skill1"],
				agents: ["claude-code"],
			},
			{ global: false },
		);

		expect(args).not.toContain("-g");
	});

	it("does not include -g flag when options are omitted", () => {
		const args = buildSkillsCommand({
			repo: "org/repo",
			skills: ["skill1"],
			agents: ["claude-code"],
		});

		expect(args).not.toContain("-g");
	});
});
