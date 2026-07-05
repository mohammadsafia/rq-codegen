import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeTempProject, writeConfig, writeRawConfig, runCli, exists } from './helpers.js';

let project: { dir: string; cleanup: () => void };

beforeEach(() => {
  project = makeTempProject();
  writeConfig(project.dir);
});
afterEach(() => project.cleanup());

describe('non-interactive generation', () => {
  it('generates a DTO from flags without hanging', () => {
    const { status, stdout } = runCli(project.dir, ['types-dto', '--name', 'Product', '--yes']);
    expect(status).toBe(0);
    expect(stdout).toContain('CREATED');
    expect(exists(project.dir, 'src/types/api/ProductDto.ts')).toBe(true);
  });

  it('errors (exit 1) when a required flag is missing under --yes', () => {
    const { status, stderr } = runCli(project.dir, ['types-dto', '--yes']);
    expect(status).toBe(1);
    expect(stderr).toContain('--name');
  });

  it('falls back to defaults and still generates when no config is present', () => {
    const bare = makeTempProject();
    try {
      const { status } = runCli(bare.dir, ['types-dto', '--name', 'Product', '--yes']);
      expect(status).toBe(0);
      expect(exists(bare.dir, 'src/types/api/ProductDto.ts')).toBe(true);
    } finally {
      bare.cleanup();
    }
  });

  it('errors (exit 1) with a config message when the config is malformed', () => {
    const broken = makeTempProject();
    try {
      writeRawConfig(broken.dir, 'export default { srcDir: 123 };\n');
      const { status, stdout, stderr } = runCli(broken.dir, ['types-dto', '--name', 'Product', '--yes']);
      expect(status).toBe(1);
      expect((stdout + stderr).toLowerCase()).toContain('config');
    } finally {
      broken.cleanup();
    }
  });

  it('list --json emits machine-readable generators', () => {
    const { status, stdout } = runCli(project.dir, ['list', '--json']);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.find((g: { name: string }) => g.name === 'types-dto')).toBeDefined();
  });
});
