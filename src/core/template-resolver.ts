import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { RqCodegenConfig } from '../config/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundled templates are at the package root /templates/ directory
// In the built package: dist/core/template-resolver.js → ../../templates/
const BUNDLED_TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

export function resolveTemplatePath(
  templateRelative: string,
  config: RqCodegenConfig,
): string {
  // 1. Check local override
  if (config.templatesDir) {
    const localPath = path.resolve(process.cwd(), config.templatesDir, templateRelative);
    if (fs.existsSync(localPath)) return localPath;
  }

  // 2. Fall back to bundled
  const bundledPath = path.resolve(BUNDLED_TEMPLATES_DIR, templateRelative);
  if (fs.existsSync(bundledPath)) return bundledPath;

  throw new Error(
    `Template not found: ${templateRelative}\n` +
      `Searched:\n` +
      (config.templatesDir
        ? `  - ${path.resolve(process.cwd(), config.templatesDir, templateRelative)}\n`
        : '') +
      `  - ${bundledPath}`,
  );
}
