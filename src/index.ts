import type { RqCodegenConfig } from './config/types.js';

export function defineConfig(config: Partial<RqCodegenConfig>): Partial<RqCodegenConfig> {
  return config;
}

export type {
  RqCodegenConfig,
  AliasConfig,
  FeatureToggles,
  NamingConfig,
  PathsConfig,
  RouterConfig,
  HooksConfig,
  HookImportConfig,
  DtoSuffixes,
} from './config/types.js';
