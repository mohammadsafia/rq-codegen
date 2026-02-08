import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

import { detectAliasesFromTsConfig } from '../config/loader.js';

type InitOptions = {
  force?: boolean;
};

export async function runInit(options: InitOptions): Promise<void> {
  const configPath = path.resolve(process.cwd(), 'rqgen.config.ts');

  if (fs.existsSync(configPath) && !options.force) {
    console.error(
      chalk.red('Config file already exists: rqgen.config.ts'),
    );
    console.log(chalk.yellow('Use --force to overwrite.'));
    process.exit(1);
  }

  console.log(chalk.cyan('\n  Initializing @appswave/rq-codegen config...\n'));

  // Auto-detect
  const detectedAliases = detectAliasesFromTsConfig(process.cwd());
  const srcDirExists = fs.existsSync(path.resolve(process.cwd(), 'src'));
  const srcDir = srcDirExists ? './src' : '.';

  const hasRouter = fs.existsSync(
    path.resolve(process.cwd(), srcDir, 'routes/router.tsx'),
  );

  const hasI18n =
    fs.existsSync(path.resolve(process.cwd(), srcDir, 'locales')) ||
    fs.existsSync(path.resolve(process.cwd(), 'i18next.config.ts'));

  // Interactive questions
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'i18n',
      message: 'Does your project use i18n (i18next)?',
      default: hasI18n,
    },
    {
      type: 'confirm',
      name: 'toast',
      message: 'Does your project use toast notifications?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'routeRegistration',
      message: 'Enable automatic route registration when generating pages?',
      default: hasRouter,
    },
  ]);

  // Build config content
  const aliasesStr = detectedAliases
    ? formatAliases(detectedAliases)
    : '    // Auto-detected from tsconfig.json — customize if needed';

  const configContent = `import { defineConfig } from '@appswave/rq-codegen';

export default defineConfig({
  srcDir: '${srcDir}',

  aliases: {
${aliasesStr}
  },

  features: {
    i18n: ${answers.i18n},
    toast: ${answers.toast},
    barrel: true,
    routeRegistration: ${answers.routeRegistration},
  },

  naming: {
    dtoSuffixes: {
      read: 'ForReadDto',
      create: 'ForCreateDto',
      update: 'ForUpdateDto',
      list: 'ListDto',
      listResponse: 'ListResponseDto',
      params: 'ParamsDto',
    },
    validationSuffix: '.schema.ts',
    pageSuffix: 'Page',
    hookPrefix: 'use',
  },

  paths: {
    handlers: 'api/handlers',
    apiConfig: 'api/config',
    types: 'types/api',
    queries: 'lib/hooks/queries',
    mutations: 'lib/hooks/mutations',
    sharedHooks: 'lib/hooks/shared',
    hookUtils: 'lib/hooks/utils',
    uiComponents: 'components/ui',
    sharedComponents: 'components/shared',
    formComponents: 'components/forms',
    pages: 'pages',
    views: 'views',
    validations: 'validations',
  },
${
  answers.routeRegistration
    ? `
  router: {
    routerFile: 'routes/router.tsx',
    routesFile: 'routes/routes.ts',
    layouts: ['MainLayout', 'DashboardLayout'],
  },
`
    : ''
}
  hooks: {
    toast: { import: 'useToast', from: '@hooks/shared' },
    translation: { import: 'useAppTranslation', from: '@hooks/shared' },
    paginatedQuery: { import: 'usePaginatedDataTableQuery', from: '@hooks/utils' },
  },
});
`;

  fs.writeFileSync(configPath, configContent, 'utf-8');
  console.log(chalk.green('  Created rqgen.config.ts'));
  console.log(chalk.dim('  Edit the config to customize paths, aliases, and features.\n'));
}

function formatAliases(
  aliases: Partial<Record<string, string>>,
): string {
  const lines: string[] = [];
  const keyMap: Record<string, string> = {
    api: 'api',
    components: 'components',
    hooks: 'hooks',
    types: 'types',
    utils: 'utils',
    contexts: 'contexts',
    constants: 'constants',
    views: 'views',
    pages: 'pages',
    validations: 'validations',
    assets: 'assets',
    routes: 'routes',
    hoc: 'hoc',
    appConfig: 'appConfig',
  };

  for (const [key, configKey] of Object.entries(keyMap)) {
    const value = aliases[key as keyof typeof aliases];
    if (value) {
      lines.push(`    ${configKey}: '${value}',`);
    }
  }

  return lines.length > 0
    ? lines.join('\n')
    : '    // No aliases detected — add your path aliases here';
}
