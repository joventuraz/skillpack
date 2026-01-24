import { z } from "zod";

// Supported agents for skill installation
export const SUPPORTED_AGENTS = ['claude-code', 'cursor', 'antigravity'] as const;
export type SupportedAgent = typeof SUPPORTED_AGENTS[number];

// Schema for individual skill entry in config
// Can be:
// - "all" (install all skills from repo)
// - ["skill1", "skill2"] (list of skill names)
// - { ref: "v1.0.0", skills: ["skill1"] } (pinned version)
const SkillEntrySchema = z.preprocess(
  (val) => {
    // Normalize array shorthand to object form
    if (Array.isArray(val)) {
      return { skills: val };
    }
    return val;
  },
  z.union([
    z.literal("all"),
    z.object({
      ref: z.string().optional(),
      skills: z.array(z.string()).min(1),
    }),
  ])
);

export type SkillEntry = z.infer<typeof SkillEntrySchema>;

// Main skillpack.yaml schema
export const SkillpackConfigSchema = z.object({
  agents: z.array(z.string()).min(1, "At least one agent must be specified"),
  skills: z.record(z.string(), SkillEntrySchema),
});

export type SkillpackConfig = z.infer<typeof SkillpackConfigSchema>;

// Lockfile schema for tracking installed versions
const LockfileInstallationSchema = z.object({
  commit: z.string(),
  skills: z.array(z.string()),
  agents: z.array(z.string()),
  installedAt: z.string().optional(),
});

export type LockfileInstallation = z.infer<typeof LockfileInstallationSchema>;

export const LockfileSchema = z.object({
  generated: z.string(),
  installations: z.record(z.string(), LockfileInstallationSchema),
});

export type Lockfile = z.infer<typeof LockfileSchema>;

// Parsed skill to install (normalized form)
export interface SkillToInstall {
  repo: string; // e.g., "vercel-labs/agent-skills"
  skills: string[] | "all";
  ref?: string; // git ref (tag, branch, commit)
  agents: string[];
}

// Installation result for summary
export interface InstallResult {
  repo: string;
  skill: string;
  status: "installed" | "skipped" | "failed";
  message?: string;
}

// CLI options
export interface InstallOptions {
  dryRun: boolean;
  force: boolean;
  verbose: boolean;
  config: string;
  noLock: boolean;
}

export interface InitOptions {
  force: boolean;
}
