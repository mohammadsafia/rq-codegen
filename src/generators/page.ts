import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
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

export function pageFields(config: RqCodegenConfig): GeneratorField[] {
  const fields: GeneratorField[] = [
    { name: 'name', type: 'input', message: 'Page name (e.g., Communities, EventDetails):', required: true, validate: validateName },
    {
      name: 'category', type: 'list', message: 'Page category (folder):',
      choices: () => {
        const dirs = getDirectories(`${config.srcDir}/${config.paths.pages}`);
        return [...dirs, '── Create new category ──'];
      },
    },
    { name: 'newCategory', type: 'input', message: 'New category name (kebab-case):', validate: validateName, when: (a) => a.category === '── Create new category ──' },
  ];

  if (config.features.routeRegistration) {
    fields.push(
      { name: 'registerRoute', type: 'confirm', message: 'Auto-register route in router?', default: true },
      { name: 'layout', type: 'list', message: 'Which layout?', choices: () => config.router.layouts, when: (a) => !!a.registerRoute },
      { name: 'isProtected', type: 'confirm', message: 'Is this a protected route (requires auth)?', default: true, when: (a) => !!a.registerRoute },
      { name: 'routePath', type: 'input', message: 'Route path (e.g., communities, events/details):', validate: validateName, when: (a) => !!a.registerRoute },
    );
  }
  return fields;
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
