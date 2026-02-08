import chalk from 'chalk';
import inquirer from 'inquirer';

import { loadConfig } from '../config/loader.js';
import { executeActions, resetHandlebars } from '../core/engine.js';
import { getGenerators } from '../generators/index.js';

export async function runGenerate(generatorName?: string): Promise<void> {
  let config;

  try {
    config = await loadConfig();
  } catch (error) {
    console.error(
      chalk.red('Error loading config:'),
      error instanceof Error ? error.message : error,
    );
    console.log(chalk.yellow('Run "rq-codegen init" to create a config file.'));
    process.exit(1);
  }

  // Reset handlebars instance for fresh config
  resetHandlebars();

  const generators = getGenerators(config);

  // If no generator specified, show interactive menu
  if (!generatorName) {
    const choices = generators.map((g) => ({
      name: `${g.name.padEnd(18)} ${chalk.dim('—')} ${g.description}`,
      value: g.name,
    }));

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'What would you like to generate?',
        choices,
      },
    ]);

    generatorName = selected;
  }

  // Find the generator
  const generator = generators.find((g) => g.name === generatorName);

  if (!generator) {
    console.error(chalk.red(`Unknown generator: ${generatorName}`));
    console.log(
      chalk.yellow('Available generators:'),
      generators.map((g) => g.name).join(', '),
    );
    process.exit(1);
  }

  console.log(chalk.cyan(`\n  Running: ${generator.name}\n`));

  // Run prompts
  const prompts = generator.prompts(config);
  const answers = await inquirer.prompt(prompts as never);

  // Preprocess answers if needed
  const processedAnswers = generator.preprocess
    ? generator.preprocess(answers)
    : answers;

  // Get actions
  const actions = generator.actions(processedAnswers, config);

  // Execute actions
  const results = await executeActions(actions, processedAnswers, config);

  // Display results
  console.log('');
  for (const result of results) {
    switch (result.type) {
      case 'created':
        console.log(chalk.green('  CREATED'), result.message);
        break;
      case 'updated':
        console.log(chalk.blue('  UPDATED'), result.message);
        break;
      case 'skipped':
        console.log(chalk.yellow('  SKIPPED'), result.message);
        break;
      case 'failed':
        console.error(chalk.red('  FAILED'), result.message);
        break;
    }
  }

  const created = results.filter((r) => r.type === 'created').length;
  const updated = results.filter((r) => r.type === 'updated').length;
  const failed = results.filter((r) => r.type === 'failed').length;

  console.log('');
  if (failed > 0) {
    console.log(chalk.red(`  ${failed} action(s) failed.`));
  }
  console.log(
    chalk.green(`  Done! ${created} file(s) created, ${updated} barrel(s) updated.\n`),
  );
}
