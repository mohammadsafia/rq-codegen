import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { validateName } from '../utils/validation.js';

export type ComponentFormAnswers = {
  name: string;
};

export function componentFormPrompts() {
  return [
    {
      type: 'input' as const,
      name: 'name',
      message: 'Field name (e.g., DateRange, Slider):',
      validate: validateName,
    },
  ];
}

export function componentFormActions(
  _answers: ComponentFormAnswers,
  config: RqCodegenConfig,
): GeneratorAction[] {
  const basePath = config.paths.formComponents;

  return [
    {
      type: 'add',
      path: `${basePath}/form-{{kebabCase name}}/Form{{pascalCase name}}.tsx`,
      templateFile: 'component-form/FormComponent.tsx.hbs',
    },
    {
      type: 'add',
      path: `${basePath}/form-{{kebabCase name}}/index.ts`,
      templateFile: 'component-form/index.ts.hbs',
    },
    {
      type: 'barrel-append',
      path: `${basePath}/index.ts`,
      exportLine: "export * from './form-{{kebabCase name}}';",
    },
  ];
}
