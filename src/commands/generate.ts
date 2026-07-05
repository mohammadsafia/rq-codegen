import chalk from 'chalk';
import inquirer from 'inquirer';

import { loadConfig } from '../config/loader.js';
import { executeActions, resetHandlebars } from '../core/engine.js';
import { getGenerators } from '../generators/index.js';
import { resolveAnswers, MissingRequiredFieldsError, InvalidFieldValueError } from '../core/fields.js';

export async function runGenerate(
  generatorName?: string,
  cliOptions: Record<string, unknown> = {},
): Promise<void> {
  let config;
  try {
    config = await loadConfig();
  } catch (error) {
    console.error(chalk.red('Error loading config:'), error instanceof Error ? error.message : error);
    console.log(chalk.yellow('Run "rq-codegen init" to create a config file.'));
    process.exit(1);
  }

  resetHandlebars();
  const generators = getGenerators(config);

  const nonInteractive = cliOptions.yes === true && cliOptions.interactive !== true;

  if (!generatorName) {
    if (nonInteractive) {
      console.error(chalk.red('A generator name is required with --yes.'));
      console.log(chalk.yellow('Available generators:'), generators.map((g) => g.name).join(', '));
      process.exit(1);
    }
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'What would you like to generate?',
        choices: generators.map((g) => ({
          name: `${g.name.padEnd(18)} ${chalk.dim('—')} ${g.description}`,
          value: g.name,
        })),
      },
    ]);
    generatorName = selected;
  }

  const generator = generators.find((g) => g.name === generatorName);
  if (!generator) {
    console.error(chalk.red(`Unknown generator: ${generatorName}`));
    console.log(chalk.yellow('Available generators:'), generators.map((g) => g.name).join(', '));
    process.exit(1);
  }

  console.log(chalk.cyan(`\n  Running: ${generator.name}\n`));

  const fields = generator.fields ? generator.fields(config) : [];
  // Only forward flags the user actually supplied (undefined omitted).
  const provided: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(cliOptions)) {
    if (value !== undefined) provided[key] = value;
  }

  let answers: Record<string, unknown>;
  try {
    answers = await resolveAnswers(fields, provided, {
      interactive: !nonInteractive,
      prompt: (prompts) => inquirer.prompt(prompts as never),
    });
  } catch (error) {
    if (error instanceof MissingRequiredFieldsError || error instanceof InvalidFieldValueError) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
    throw error;
  }

  const processedAnswers = generator.preprocess ? generator.preprocess(answers) : answers;
  const actions = generator.actions(processedAnswers, config);
  const results = await executeActions(actions, processedAnswers, config);

  console.log('');
  for (const result of results) {
    switch (result.type) {
      case 'created': console.log(chalk.green('  CREATED'), result.message); break;
      case 'updated': console.log(chalk.blue('  UPDATED'), result.message); break;
      case 'skipped': console.log(chalk.yellow('  SKIPPED'), result.message); break;
      case 'failed': console.error(chalk.red('  FAILED'), result.message); break;
    }
  }

  const created = results.filter((r) => r.type === 'created').length;
  const updated = results.filter((r) => r.type === 'updated').length;
  const failed = results.filter((r) => r.type === 'failed').length;

  console.log('');
  if (failed > 0) {
    console.log(chalk.red(`  ${failed} action(s) failed.`));
    process.exit(1);
  }
  console.log(chalk.green(`  Done! ${created} file(s) created, ${updated} barrel(s) updated.\n`));
}
