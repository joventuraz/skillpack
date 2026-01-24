import { describe, it, expect } from "vitest";
import {
  createLockfile,
  updateLockfile,
  isAlreadyInstalled,
} from "../src/lib/lockfile.js";

describe("lockfile", () => {
  describe("createLockfile", () => {
    it("creates empty lockfile with timestamp", () => {
      const lockfile = createLockfile();
      expect(lockfile.generated).toBeDefined();
      expect(lockfile.installations).toEqual({});
    });
  });

  describe("updateLockfile", () => {
    it("adds new installation to lockfile", () => {
      const lockfile = createLockfile();
      const updated = updateLockfile(lockfile, "org/repo", {
        commit: "abc123",
        skills: ["skill1", "skill2"],
        agents: ["claude-code"],
      });

      expect(updated.installations["org/repo"]).toEqual({
        commit: "abc123",
        skills: ["skill1", "skill2"],
        agents: ["claude-code"],
      });
    });

    it("preserves existing installations", () => {
      let lockfile = createLockfile();
      lockfile = updateLockfile(lockfile, "org/repo1", {
        commit: "abc",
        skills: ["s1"],
        agents: ["claude-code"],
      });
      lockfile = updateLockfile(lockfile, "org/repo2", {
        commit: "def",
        skills: ["s2"],
        agents: ["cursor"],
      });

      expect(Object.keys(lockfile.installations)).toHaveLength(2);
      expect(lockfile.installations["org/repo1"]).toBeDefined();
      expect(lockfile.installations["org/repo2"]).toBeDefined();
    });
  });

  describe("isAlreadyInstalled", () => {
    it("returns false when lockfile is null", () => {
      const result = isAlreadyInstalled(null, "org/repo", ["skill1"], ["claude-code"]);
      expect(result).toBe(false);
    });

    it("returns false when repo not in lockfile", () => {
      const lockfile = createLockfile();
      const result = isAlreadyInstalled(lockfile, "org/repo", ["skill1"], ["claude-code"]);
      expect(result).toBe(false);
    });

    it("returns true when all skills and agents are covered", () => {
      let lockfile = createLockfile();
      lockfile = updateLockfile(lockfile, "org/repo", {
        commit: "abc",
        skills: ["skill1", "skill2"],
        agents: ["claude-code", "cursor"],
      });

      const result = isAlreadyInstalled(lockfile, "org/repo", ["skill1"], ["claude-code"]);
      expect(result).toBe(true);
    });

    it("returns false when agent not covered", () => {
      let lockfile = createLockfile();
      lockfile = updateLockfile(lockfile, "org/repo", {
        commit: "abc",
        skills: ["skill1"],
        agents: ["claude-code"],
      });

      const result = isAlreadyInstalled(lockfile, "org/repo", ["skill1"], ["cursor"]);
      expect(result).toBe(false);
    });

    it("returns false when skill not covered", () => {
      let lockfile = createLockfile();
      lockfile = updateLockfile(lockfile, "org/repo", {
        commit: "abc",
        skills: ["skill1"],
        agents: ["claude-code"],
      });

      const result = isAlreadyInstalled(lockfile, "org/repo", ["skill2"], ["claude-code"]);
      expect(result).toBe(false);
    });

    it("returns false for 'all' (conservative approach)", () => {
      let lockfile = createLockfile();
      lockfile = updateLockfile(lockfile, "org/repo", {
        commit: "abc",
        skills: [],
        agents: ["claude-code"],
      });

      const result = isAlreadyInstalled(lockfile, "org/repo", "all", ["claude-code"]);
      expect(result).toBe(false);
    });
  });
});
