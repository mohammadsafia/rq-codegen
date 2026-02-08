import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { dirExists, getDirectories } from '../utils/fs.js';
import { validateName } from '../utils/validation.js';

export type ViewAnswers = {
  feature: string;
  newFeature?: string;
  name: string;
};

export function viewPrompts(config: RqCodegenConfig) {
  return [
    {
      type: 'list' as const,
      name: 'feature',
      message: 'Feature (parent folder):',
      choices: () => {
        const dirs = getDirectories(`${config.srcDir}/${config.paths.views}`);
        return [...dirs, '── Create new feature ──'];
      },
    },
    {
      type: 'input' as const,
      name: 'newFeature',
      message: 'New feature name (kebab-case):',
      when: (answers: ViewAnswers) => answers.feature === '── Create new feature ──',
      validate: validateName,
    },
    {
      type: 'input' as const,
      name: 'name',
      message: 'View component name (e.g., CommunityCard):',
      validate: validateName,
    },
  ];
}

export function preprocessViewAnswers(answers: ViewAnswers): ViewAnswers {
  if (answers.newFeature) {
    return { ...answers, feature: answers.newFeature };
  }
  return answers;
}

export function viewActions(answers: ViewAnswers, config: RqCodegenConfig): GeneratorAction[] {
  const basePath = config.paths.views;
  const isNewFeature = !!answers.newFeature;

  const actions: GeneratorAction[] = [
    {
      type: 'add',
      path: `${basePath}/{{kebabCase feature}}/{{kebabCase name}}/{{pascalCase name}}.tsx`,
      templateFile: 'view/View.tsx.hbs',
    },
    {
      type: 'add',
      path: `${basePath}/{{kebabCase feature}}/{{kebabCase name}}/index.ts`,
      templateFile: 'view/index.ts.hbs',
    },
    {
      type: 'barrel-append',
      path: `${basePath}/{{kebabCase feature}}/index.ts`,
      exportLine: "export * from './{{kebabCase name}}';",
    },
  ];

  if (isNewFeature || !dirExists(`${config.srcDir}/${config.paths.views}/${answers.feature}`)) {
    actions.push({
      type: 'barrel-append',
      path: `${basePath}/index.ts`,
      exportLine: "export * from './{{kebabCase feature}}';",
    });
  }

  return actions;
}
