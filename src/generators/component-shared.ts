import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { validateName } from '../utils/validation.js';

export type ComponentSharedAnswers = {
  name: string;
  subComponentsRaw: string;
  subComponents?: string[];
};

export function componentSharedFields(): GeneratorField[] {
  return [
    { name: 'name', type: 'input', message: 'Component name (e.g., InfoCard):', required: true, validate: validateName },
    { name: 'subComponentsRaw', type: 'input', message: 'Sub-component names (comma-separated, e.g., Header,Body,Footer):', default: 'Header,Body,Footer' },
  ];
}

export function preprocessComponentSharedAnswers(
  answers: ComponentSharedAnswers,
): ComponentSharedAnswers {
  return {
    ...answers,
    subComponents: answers.subComponentsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export function componentSharedActions(
  _answers: ComponentSharedAnswers,
  config: RqCodegenConfig,
): GeneratorAction[] {
  const basePath = config.paths.sharedComponents;

  return [
    {
      type: 'add',
      path: `${basePath}/{{kebabCase name}}/{{pascalCase name}}.tsx`,
      templateFile: 'component-shared/Component.tsx.hbs',
    },
    {
      type: 'add',
      path: `${basePath}/{{kebabCase name}}/index.ts`,
      templateFile: 'component-shared/index.ts.hbs',
    },
    {
      type: 'barrel-append',
      path: `${basePath}/index.ts`,
      exportLine: "export * from './{{kebabCase name}}';",
    },
  ];
}
