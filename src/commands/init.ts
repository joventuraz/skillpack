import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { InitOptions } from "../lib/types.js";
import { logger } from "../utils/logger.js";

const CONFIG_FILENAME = "skillpack.yaml";

// Get template path relative to this file
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, "../../templates/skillpack.yaml");

export async function initCommand(options: InitOptions): Promise<void> {
	const targetPath = join(process.cwd(), CONFIG_FILENAME);

	// Check if file already exists
	if (existsSync(targetPath) && !options.force) {
		logger.warn(`${CONFIG_FILENAME} already exists. Use --force to overwrite.`);
		process.exit(1);
	}

	// Read template and write to cwd
	let template: string;
	try {
		template = await readFile(TEMPLATE_PATH, "utf-8");
	} catch {
		// Fallback to inline template if file not found (e.g., during development)
		template = getDefaultTemplate();
	}

	await writeFile(targetPath, template, "utf-8");
	logger.success(`Created ${CONFIG_FILENAME}`);
	logger.info("Edit the file to add your skills, then run: skillpack install");
}

function getDefaultTemplate(): string {
	return `# skillpack.yaml - Package manager for skills.sh
# Run \`skillpack install\` to install all skills below

# Target agents to install skills to
# Supported: amp, antigravity, claude-code, clawdbot, cline, codex, command-code,
#            cursor, droid, gemini-cli, github-copilot, goose, kilo, kiro-cli,
#            mcpjam, neovate, opencode, openhands, pi, qoder, qwen-code, roo,
#            trae, windsurf, zencoder
agents:
  - claude-code
  # - amp
  # - antigravity
  # - clawdbot
  # - cline
  # - codex
  # - command-code
  # - cursor
  # - droid
  # - gemini-cli
  # - github-copilot
  # - goose
  # - kilo
  # - kiro-cli
  # - mcpjam
  # - neovate
  # - opencode
  # - openhands
  # - pi
  # - qoder
  # - qwen-code
  # - roo
  # - trae
  # - windsurf
  # - zencoder

# Skills to install (owner/repo format)
skills:
  # Install specific skills from a repo
  vercel-labs/agent-skills:
    - vercel-react-best-practices
    - web-design-guidelines

  # Install all skills from a repo
  # another-org/repo: all

  # Pin to a specific git ref (tag, branch, or commit)
  # pinned-org/skill-repo:
  #   ref: v1.0.0
  #   skills:
  #     - specific-skill
`;
}
