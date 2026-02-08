import { Command } from 'commander';

import { runGenerate } from './commands/generate.js';
import { runInit } from './commands/init.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('rq-codegen')
    .description(
      'Config-driven code generator for React + TypeScript + React Query projects',
    )
    .version('0.1.0');

  program
    .command('init')
    .description('Initialize rqgen.config.ts with auto-detected settings')
    .option('--force', 'Overwrite existing config file')
    .action(runInit);

  // Default command: interactive generator selection or direct generator
  program
    .argument('[generator]', 'Generator to run (e.g., handler, page, feature)')
    .action(runGenerate);

  return program;
}
