import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';

import { runGenerate } from './commands/generate.js';
import { runInit } from './commands/init.js';
import { getGenerators } from './generators/index.js';
import { DEFAULT_CONFIG } from './config/defaults.js';
import { fieldsToOptions, fieldToFlagName, type GeneratorField } from './core/fields.js';

function readVersion(): string {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    // The actual CLI entry (bin/cli.ts) bundles to dist/bin/cli.js, two levels
    // below the package root where package.json lives. Try that first, then
    // fall back to one level up (covers dist/index.js and other layouts).
    const candidates = [
      path.resolve(dir, '..', '..', 'package.json'),
      path.resolve(dir, '..', 'package.json'),
    ];
    for (const pkgPath of candidates) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.version) return pkg.version;
      } catch {
        // try next candidate
      }
    }
    return '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** Map camelCased commander opts back to field names (handles `flag` overrides). */
function mapOptsToFieldNames(opts: Record<string, unknown>, fields: GeneratorField[]): Record<string, unknown> {
  const camel = (s: string) => s.replace(/-(.)/g, (_, c: string) => c.toUpperCase());
  const result: Record<string, unknown> = { yes: opts.yes };
  for (const field of fields) {
    const optKey = camel(fieldToFlagName(field));
    if (opts[optKey] !== undefined) result[field.name] = opts[optKey];
  }
  return result;
}

export function createCli(): Command {
  const program = new Command();
  program
    .name('rq-codegen')
    .description('Config-driven code generator for React + TypeScript + React Query projects')
    .version(readVersion());

  program
    .command('init')
    .description('Initialize rqgen.config.ts with auto-detected settings')
    .option('--force', 'Overwrite existing config file')
    .action(runInit);

  program
    .command('list')
    .description('List available generators')
    .option('--json', 'Output as JSON')
    .action((opts: { json?: boolean }) => {
      const gens = getGenerators(DEFAULT_CONFIG);
      if (opts.json) {
        console.log(JSON.stringify(gens.map((g) => ({ name: g.name, description: g.description })), null, 2));
        return;
      }
      for (const g of gens) {
        console.log(`  ${chalk.cyan(g.name.padEnd(18))} ${chalk.dim(g.description)}`);
      }
    });

  // One subcommand per generator, with derived flags + global --yes/--interactive.
  const generators = getGenerators(DEFAULT_CONFIG);
  for (const gen of generators) {
    const fields = gen.fields ? gen.fields(DEFAULT_CONFIG) : [];
    const cmd = program.command(gen.name).description(gen.description);
    for (const opt of fieldsToOptions(fields)) {
      cmd.option(opt.flags, opt.description);
    }
    cmd.option('-y, --yes', 'Run non-interactively using flags + defaults');
    cmd.option('-i, --interactive', 'Force interactive prompts for any unspecified fields');
    cmd.action(async (opts: Record<string, unknown>) => {
      const mapped = mapOptsToFieldNames(opts, fields);
      await runGenerate(gen.name, mapped);
    });
  }

  // Backward-compatible default: `rq-codegen [generator]` with no flags → interactive.
  program
    .argument('[generator]', 'Generator to run interactively (e.g., handler, page, feature)')
    .action((generator?: string) => runGenerate(generator));

  return program;
}
