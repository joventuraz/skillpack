import { describe, it, expect } from 'vitest';
import { SUPPORTED_AGENTS } from '../src/lib/types.js';

describe('Supported Agents', () => {
  it('should include claude-code', () => {
    expect(SUPPORTED_AGENTS).toContain('claude-code');
  });

  it('should include cursor', () => {
    expect(SUPPORTED_AGENTS).toContain('cursor');
  });

  it('should include antigravity', () => {
    expect(SUPPORTED_AGENTS).toContain('antigravity');
  });

  it('should have at least 3 agents supported', () => {
    expect(SUPPORTED_AGENTS.length).toBeGreaterThanOrEqual(3);
  });
});
