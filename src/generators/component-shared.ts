import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { validateName } from '../utils/validation.js';

export type ComponentSharedAnswers = {
  name: string;
  subComponentsRaw: string;
  subComponents?: string[];
};

export function componentSharedPrompts() {
  return [
    {
      type: 'input' as const,
      name: 'name',
      message: 'Component name (e.g., InfoCard):',
      validate: validateName,
    },
    {
      type: 'input' as const,
      name: 'subComponentsRaw',
      message: 'Sub-component names (comma-separated, e.g., Header,Body,Footer):',
      default: 'Header,Body,Footer',
    },
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
