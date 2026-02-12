import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { DEFAULT_CONFIG } from './defaults.js';
import { configSchema } from './schema.js';
import type { RqCodegenConfig } from './types.js';

// Resolve the CLI package root so jiti can find @appswave/rq-codegen
// when loading config files from user projects that don't have it installed locally.
// At runtime, this file is bundled into dist/bin/cli.js, so we go up 2 levels.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (sourceVal === undefined) continue;

    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      result[key] = sourceVal as T[keyof T];
    }
  }

  return result;
}

function detectAliasesFromTsConfig(projectRoot: string): Partial<RqCodegenConfig['aliases']> | null {
  const configFiles = ['tsconfig.app.json', 'tsconfig.json'];

  for (const configFile of configFiles) {
    const fullPath = path.resolve(projectRoot, configFile);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      const paths: Record<string, string[]> = raw.compilerOptions?.paths ?? {};
      return mapTsPathsToAliases(paths);
    } catch {
      continue;
    }
  }

  return null;
}

function mapTsPathsToAliases(
  paths: Record<string, string[]>,
): Partial<RqCodegenConfig['aliases']> {
  const aliases: Partial<RqCodegenConfig['aliases']> = {};

  const aliasMap: Record<string, keyof RqCodegenConfig['aliases']> = {
    'api': 'api',
    'components': 'components',
    'hooks': 'hooks',
    'app-types': 'types',
    'types': 'types',
    'utils': 'utils',
    'contexts': 'contexts',
    'constants': 'constants',
    'views': 'views',
    'pages': 'pages',
    'validations': 'validations',
    'assets': 'assets',
    'routes': 'routes',
    'hoc': 'hoc',
    'app-config': 'appConfig',
  };

  for (const tsAlias of Object.keys(paths)) {
    const match = tsAlias.match(/^@([\w-]+)/);
    if (!match) continue;

    const aliasName = match[1];
    const configKey = aliasMap[aliasName];
    if (configKey) {
      aliases[configKey] = tsAlias.replace('/*', '');
    }
  }

  return aliases;
}

async function findConfigFile(projectRoot: string): Promise<string | null> {
  const candidates = [
    'rqgen.config.ts',
    'rqgen.config.mts',
    'rqgen.config.js',
    'rqgen.config.mjs',
  ];

  for (const candidate of candidates) {
    const fullPath = path.resolve(projectRoot, candidate);
    if (fs.existsSync(fullPath)) return fullPath;
  }

  // Check package.json for "rqgen" key
  const pkgPath = path.resolve(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.rqgen) return pkgPath;
    } catch {
      // ignore
    }
  }

  return null;
}

async function loadConfigFromFile(configPath: string): Promise<Partial<RqCodegenConfig>> {
  const ext = path.extname(configPath);
  const basename = path.basename(configPath);

  if (basename === 'package.json') {
    const pkg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return pkg.rqgen ?? {};
  }

  if (ext === '.ts' || ext === '.mts') {
    try {
      const { createJiti } = await import('jiti');
      const jiti = createJiti(configPath, {
        interopDefault: true,
        alias: {
          '@appswave/rq-codegen': CLI_PACKAGE_ROOT,
        },
      });
      const mod = (await jiti.import(configPath)) as
        | { default?: Partial<RqCodegenConfig> }
        | Partial<RqCodegenConfig>;
      if (mod && typeof mod === 'object' && 'default' in mod && mod.default) {
        return mod.default;
      }
      return mod as Partial<RqCodegenConfig>;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to load TypeScript config: ${configPath}\n${message}`,
      );
    }
  }

  // JS/MJS files
  const fileUrl = pathToFileURL(configPath).href;
  const mod = await import(fileUrl);
  return mod.default ?? mod;
}

export async function loadConfig(projectRoot?: string): Promise<RqCodegenConfig> {
  const root = projectRoot ?? process.cwd();

  // 1. Try to find and load config file
  const configPath = await findConfigFile(root);
  let userConfig: Partial<RqCodegenConfig> = {};

  if (configPath) {
    const rawConfig = await loadConfigFromFile(configPath);
    const parsed = configSchema.safeParse(rawConfig);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
      throw new Error(`Invalid rqgen config:\n${errors.join('\n')}`);
    }

    userConfig = parsed.data as Partial<RqCodegenConfig>;
  }

  // 2. Auto-detect aliases from tsconfig if not provided in config
  if (!userConfig.aliases) {
    const detected = detectAliasesFromTsConfig(root);
    if (detected) {
      userConfig.aliases = detected as RqCodegenConfig['aliases'];
    }
  }

  // 3. Deep-merge with defaults
  const config = deepMerge(DEFAULT_CONFIG, userConfig);

  return config;
}

export { detectAliasesFromTsConfig };
