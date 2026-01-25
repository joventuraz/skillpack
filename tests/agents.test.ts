import { describe, expect, it } from "vitest";
import { SUPPORTED_AGENTS } from "../src/lib/types.js";

describe("Supported Agents", () => {
	// Core agents that must always be supported
	const coreAgents = [
		"claude-code",
		"cursor",
		"antigravity",
		"github-copilot",
		"codex",
		"opencode",
		"windsurf",
		"cline",
		"goose",
	];

	it.each(coreAgents)("should include %s", (agent) => {
		expect(SUPPORTED_AGENTS).toContain(agent);
	});

	it("should have all 25 agents supported", () => {
		expect(SUPPORTED_AGENTS.length).toBe(25);
	});

	it("should have agents sorted alphabetically", () => {
		const sorted = [...SUPPORTED_AGENTS].sort();
		expect(SUPPORTED_AGENTS).toEqual(sorted);
	});
});
