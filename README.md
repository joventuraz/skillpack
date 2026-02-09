# skillpack

A package manager for [skills.sh](https://skills.sh) that reads from a `skillpack.yaml` file and batch-installs skills to AI agents.

## Installation

```bash
npm install -g skillpack
```

Or run directly with npx:

```bash
npx skillpack install
```

## Quick Start

1. Create a `skillpack.yaml` in your project:

```bash
skillpack init
```

2. Edit the file to add your skills:

```yaml
agents:
  - claude-code
  - antigravity
  - cursor

skills:
  vercel-labs/agent-skills:
    - vercel-react-best-practices
    - web-design-guidelines
```

3. Install all skills:

```bash
skillpack install
```

## Configuration

### skillpack.yaml

```yaml
# Install skills to global folders (default: false)
# global: true

# Target agents to install skills to (defaults to all agents if omitted)
# agents:
#   - claude-code
#   - github-copilot
#   - cursor

# Skills to install (owner/repo format)
skills:
  # Install specific skills from a repo
  vercel-labs/agent-skills:
    - vercel-react-best-practices
    - web-design-guidelines

  # Install all skills from a repo
  another-org/repo: all

  # Pin to a specific git ref (tag, branch, or commit)
  pinned-org/skill-repo:
    ref: v1.0.0
    skills:
      - specific-skill
```

### Supported Agents

Skillpack supports all 25 agents from [skills.sh](https://skills.sh):

| Agent | Local Skills Dir | Global Skills Dir |
|-------|------------------|-------------------|
| `amp` | `.agents/skills/` | `~/.config/agents/skills/` |
| `antigravity` | `.agent/skills/` | `~/.gemini/antigravity/skills/` |
| `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| `clawdbot` | `skills/` | `~/.clawdbot/skills/` |
| `cline` | `.cline/skills/` | `~/.cline/skills/` |
| `codex` | `.codex/skills/` | `~/.codex/skills/` |
| `command-code` | `.commandcode/skills/` | `~/.commandcode/skills/` |
| `cursor` | `.cursor/skills/` | `~/.cursor/skills/` |
| `droid` | `.factory/skills/` | `~/.factory/skills/` |
| `gemini-cli` | `.gemini/skills/` | `~/.gemini/skills/` |
| `github-copilot` | `.github/skills/` | `~/.copilot/skills/` |
| `goose` | `.goose/skills/` | `~/.config/goose/skills/` |
| `kilo` | `.kilocode/skills/` | `~/.kilocode/skills/` |
| `kiro-cli` | `.kiro/skills/` | `~/.kiro/skills/` |
| `mcpjam` | `.mcpjam/skills/` | `~/.mcpjam/skills/` |
| `neovate` | `.neovate/skills/` | `~/.neovate/skills/` |
| `opencode` | `.opencode/skills/` | `~/.config/opencode/skills/` |
| `openhands` | `.openhands/skills/` | `~/.openhands/skills/` |
| `pi` | `.pi/skills/` | `~/.pi/agent/skills/` |
| `qoder` | `.qoder/skills/` | `~/.qoder/skills/` |
| `qwen-code` | `.qwen/skills/` | `~/.qwen/skills/` |
| `roo` | `.roo/skills/` | `~/.roo/skills/` |
| `trae` | `.trae/skills/` | `~/.trae/skills/` |
| `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| `zencoder` | `.zencoder/skills/` | `~/.zencoder/skills/` |

Skills are installed by the underlying `npx skills add` command from [skills.sh](https://skills.sh).

### Lockfile

Running `skillpack install` creates a `skillpack-lock.yaml` file that tracks installed versions. Commit this file to ensure reproducible installs across your team.

## Commands

| Command | Description |
|---------|-------------|
| `skillpack install` | Install all skills from skillpack.yaml |
| `skillpack init` | Create a skillpack.yaml template |

### Flags

```bash
--dry-run       # Show what would be installed without installing
--force         # Reinstall even if already present
--verbose       # Detailed output
--config <path> # Custom config file path
--no-lock       # Ignore lockfile and install latest
-g, --global    # Install skills to global folders
```

## Examples

Preview what will be installed:

```bash
skillpack install --dry-run
```

Force reinstall all skills:

```bash
skillpack install --force
```

Use a custom config file:

```bash
skillpack install --config ./configs/skills.yaml
```

## License

MIT
