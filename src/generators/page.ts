import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { getDirectories } from '../utils/fs.js';
import { validateName } from '../utils/validation.js';

export type PageAnswers = {
  name: string;
  category: string;
  newCategory?: string;
  registerRoute?: boolean;
  layout?: string;
  isProtected?: boolean;
  routePath?: string;
};

export function pagePrompts(config: RqCodegenConfig) {
  const prompts = [
    {
      type: 'input' as const,
      name: 'name',
      message: 'Page name (e.g., Communities, EventDetails):',
      validate: validateName,
    },
    {
      type: 'list' as const,
      name: 'category',
      message: 'Page category (folder):',
      choices: () => {
        const dirs = getDirectories(`${config.srcDir}/${config.paths.pages}`);
        return [...dirs, '── Create new category ──'];
      },
    },
    {
      type: 'input' as const,
      name: 'newCategory',
      message: 'New category name (kebab-case):',
      when: (answers: PageAnswers) => answers.category === '── Create new category ──',
      validate: validateName,
    },
  ];

  if (config.features.routeRegistration) {
    prompts.push(
      {
        type: 'confirm' as const,
        name: 'registerRoute',
        message: 'Auto-register route in router?',
        default: true,
      } as never,
      {
        type: 'list' as const,
        name: 'layout',
        message: 'Which layout?',
        choices: () => config.router.layouts,
        when: (answers: PageAnswers) => !!answers.registerRoute,
      } as never,
      {
        type: 'confirm' as const,
        name: 'isProtected',
        message: 'Is this a protected route (requires auth)?',
        default: true,
        when: (answers: PageAnswers) => !!answers.registerRoute,
      } as never,
      {
        type: 'input' as const,
        name: 'routePath',
        message: 'Route path (e.g., communities, events/details):',
        when: (answers: PageAnswers) => !!answers.registerRoute,
        validate: validateName,
      } as never,
    );
  }

  return prompts;
}

export function preprocessPageAnswers(answers: PageAnswers): PageAnswers {
  if (answers.newCategory) {
    return { ...answers, category: answers.newCategory };
  }
  return answers;
}

export function pageActions(answers: PageAnswers, config: RqCodegenConfig): GeneratorAction[] {
  const basePath = config.paths.pages;
  const pageSuffix = config.naming.pageSuffix;

  const actions: GeneratorAction[] = [
    {
      type: 'add',
      path: `${basePath}/{{kebabCase category}}/{{pascalCase name}}${pageSuffix}.tsx`,
      templateFile: 'page/Page.tsx.hbs',
      data: { pageSuffix },
    },
  ];

  if (config.features.routeRegistration && answers.registerRoute) {
    actions.push({
      type: 'route-register',
      data: {
        pageName: answers.name,
        category: answers.category,
        layout: answers.layout ?? config.router.layouts[0],
        isProtected: answers.isProtected ?? true,
        routePath: answers.routePath ?? answers.name.toLowerCase(),
      },
    });
  }

  return actions;
}
