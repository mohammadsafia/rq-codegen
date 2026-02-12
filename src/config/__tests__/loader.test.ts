import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

import { loadConfig, detectAliasesFromTsConfig } from '../loader.js';
import { DEFAULT_CONFIG } from '../defaults.js';

// Use unique directories per test to avoid ESM module caching issues
function createTestDir(): string {
  const dir = path.join(os.tmpdir(), `rq-codegen-loader-${crypto.randomUUID()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const cleanupDirs: string[] = [];

afterEach(() => {
  for (const dir of cleanupDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  cleanupDirs.length = 0;
});

function trackDir(dir: string): string {
  cleanupDirs.push(dir);
  return dir;
}

describe('loadConfig', () => {
  it('returns default config when no config file exists', async () => {
    const testDir = trackDir(createTestDir());
    const config = await loadConfig(testDir);
    expect(config.srcDir).toBe(DEFAULT_CONFIG.srcDir);
    expect(config.features.barrel).toBe(DEFAULT_CONFIG.features.barrel);
    expect(config.naming.dtoSuffixes.read).toBe('ForReadDto');
  });

  it('loads config from rqgen.config.mjs', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'rqgen.config.mjs'),
      `export default { srcDir: './app', features: { i18n: true } };`,
    );

    const config = await loadConfig(testDir);
    expect(config.srcDir).toBe('./app');
    expect(config.features.i18n).toBe(true);
  });

  it('merges user config with defaults (package.json)', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test',
        rqgen: { features: { i18n: true } },
      }),
    );

    const config = await loadConfig(testDir);
    // User override
    expect(config.features.i18n).toBe(true);
    // Default preserved
    expect(config.srcDir).toBe('./src');
    expect(config.naming.dtoSuffixes.read).toBe('ForReadDto');
    expect(config.paths.handlers).toBeDefined();
  });

  it('deep merges nested objects (package.json)', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test',
        rqgen: {
          naming: { dtoSuffixes: { read: 'ReadDto' } },
        },
      }),
    );

    const config = await loadConfig(testDir);
    // Overridden
    expect(config.naming.dtoSuffixes.read).toBe('ReadDto');
    // Other defaults preserved
    expect(config.naming.dtoSuffixes.create).toBe('ForCreateDto');
    expect(config.naming.validationSuffix).toBe('.schema.ts');
  });

  it('loads config from package.json rqgen field', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        rqgen: { srcDir: './client' },
      }),
    );

    const config = await loadConfig(testDir);
    expect(config.srcDir).toBe('./client');
  });

  it('throws on invalid config (package.json)', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test',
        rqgen: { features: { i18n: 'not-a-boolean' } },
      }),
    );

    await expect(loadConfig(testDir)).rejects.toThrow('Invalid rqgen config');
  });

  it('prefers rqgen.config.mjs over package.json', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'rqgen.config.mjs'),
      `export default { srcDir: './from-config' };`,
    );
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({ name: 'test', rqgen: { srcDir: './from-pkg' } }),
    );

    const config = await loadConfig(testDir);
    expect(config.srcDir).toBe('./from-config');
  });

  it('overrides aliases from config (package.json)', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test',
        rqgen: {
          aliases: { api: '@my-api', types: '@my-types' },
        },
      }),
    );

    const config = await loadConfig(testDir);
    expect(config.aliases.api).toBe('@my-api');
    expect(config.aliases.types).toBe('@my-types');
    // Defaults preserved for unset aliases
    expect(config.aliases.components).toBe('@components');
  });

  it('overrides hooks from config (package.json)', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test',
        rqgen: {
          hooks: {
            toast: { import: 'useCustomToast', from: '@custom/hooks' },
          },
        },
      }),
    );

    const config = await loadConfig(testDir);
    expect(config.hooks.toast.import).toBe('useCustomToast');
    expect(config.hooks.toast.from).toBe('@custom/hooks');
    // Others preserved
    expect(config.hooks.translation.import).toBe('useAppTranslation');
  });

  it('loads config from rqgen.config.ts', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'rqgen.config.ts'),
      `const config = { srcDir: './app', features: { i18n: true } };\nexport default config;`,
    );

    const config = await loadConfig(testDir);
    expect(config.srcDir).toBe('./app');
    expect(config.features.i18n).toBe(true);
    // Defaults preserved
    expect(config.naming.dtoSuffixes.read).toBe('ForReadDto');
  });

  it('loads config from rqgen.config.ts with defineConfig pattern', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'rqgen.config.ts'),
      `function defineConfig<T>(config: T): T { return config; }\nexport default defineConfig({ srcDir: './custom', features: { toast: false } });`,
    );

    const config = await loadConfig(testDir);
    expect(config.srcDir).toBe('./custom');
    expect(config.features.toast).toBe(false);
  });

  it('prefers rqgen.config.ts over rqgen.config.mjs', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'rqgen.config.ts'),
      `export default { srcDir: './from-ts' };`,
    );
    fs.writeFileSync(
      path.join(testDir, 'rqgen.config.mjs'),
      `export default { srcDir: './from-mjs' };`,
    );

    const config = await loadConfig(testDir);
    expect(config.srcDir).toBe('./from-ts');
  });

  it('throws readable error for invalid TypeScript config', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'rqgen.config.ts'),
      `export default (() => { throw new Error('compile error'); })();`,
    );

    await expect(loadConfig(testDir)).rejects.toThrow('Failed to load TypeScript config');
  });

  it('auto-detects aliases from tsconfig.json', async () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@api/*': ['./src/api/*'],
            '@hooks/*': ['./src/lib/hooks/*'],
          },
        },
      }),
    );

    const config = await loadConfig(testDir);
    // Auto-detected from tsconfig paths
    expect(config.aliases.api).toBe('@api');
    expect(config.aliases.hooks).toBe('@hooks');
  });
});

describe('detectAliasesFromTsConfig', () => {
  it('detects aliases from tsconfig.json', () => {
    const testDir = trackDir(createTestDir());
    const tsconfig = {
      compilerOptions: {
        paths: {
          '@api/*': ['./src/api/*'],
          '@components/*': ['./src/components/*'],
          '@hooks/*': ['./src/lib/hooks/*'],
          '@app-types': ['./src/types/index'],
          '@utils': ['./src/lib/utils/index'],
        },
      },
    };
    fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig));

    const aliases = detectAliasesFromTsConfig(testDir);
    expect(aliases).not.toBeNull();
    expect(aliases!.api).toBe('@api');
    expect(aliases!.components).toBe('@components');
    expect(aliases!.hooks).toBe('@hooks');
    expect(aliases!.types).toBe('@app-types');
    expect(aliases!.utils).toBe('@utils');
  });

  it('prefers tsconfig.app.json over tsconfig.json', () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'tsconfig.app.json'),
      JSON.stringify({
        compilerOptions: { paths: { '@api/*': ['./src/api/*'] } },
      }),
    );
    fs.writeFileSync(
      path.join(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { paths: { '@api/*': ['./src/other-api/*'] } },
      }),
    );

    const aliases = detectAliasesFromTsConfig(testDir);
    expect(aliases!.api).toBe('@api');
  });

  it('returns null if no tsconfig exists', () => {
    const testDir = trackDir(createTestDir());
    const aliases = detectAliasesFromTsConfig(testDir);
    expect(aliases).toBeNull();
  });

  it('returns empty object if tsconfig has no paths', () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: {} }),
    );

    const aliases = detectAliasesFromTsConfig(testDir);
    expect(aliases).not.toBeNull();
    expect(Object.keys(aliases!).length).toBe(0);
  });

  it('handles invalid JSON gracefully', () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(path.join(testDir, 'tsconfig.json'), '{ invalid json }');

    const aliases = detectAliasesFromTsConfig(testDir);
    expect(aliases).toBeNull();
  });

  it('maps @app-types to types key', () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { paths: { '@app-types': ['./src/types/index'] } },
      }),
    );

    const aliases = detectAliasesFromTsConfig(testDir);
    expect(aliases!.types).toBe('@app-types');
  });

  it('maps @app-config to appConfig key', () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { paths: { '@app-config': ['./src/app-config'] } },
      }),
    );

    const aliases = detectAliasesFromTsConfig(testDir);
    expect(aliases!.appConfig).toBe('@app-config');
  });

  it('strips /* from path aliases', () => {
    const testDir = trackDir(createTestDir());
    fs.writeFileSync(
      path.join(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { paths: { '@hooks/*': ['./src/lib/hooks/*'] } },
      }),
    );

    const aliases = detectAliasesFromTsConfig(testDir);
    expect(aliases!.hooks).toBe('@hooks');
  });
});
