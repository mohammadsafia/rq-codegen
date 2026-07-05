import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { validateName } from '../utils/validation.js';

export type ValidationAnswers = {
  name: string;
};

export function validationFields(): GeneratorField[] {
  return [
    { name: 'name', type: 'input', message: 'Schema name (e.g., communitySettings, eventCreate):', required: true, validate: validateName },
  ];
}

export function validationActions(
  _answers: ValidationAnswers,
  config: RqCodegenConfig,
): GeneratorAction[] {
  // Determine file extension from config (e.g., '.schema.ts' or '.ts')
  const suffix = config.naming.validationSuffix;
  // Strip leading dot and extension for barrel export
  // '.schema.ts' -> file: '{{camelCase name}}.schema.ts', export: './{{camelCase name}}.schema'
  const fileExt = suffix; // e.g., '.schema.ts'
  const barrelExt = suffix.replace(/\.ts$/, ''); // e.g., '.schema'

  return [
    {
      type: 'add',
      path: `${config.paths.validations}/{{camelCase name}}${fileExt}`,
      templateFile: 'validation/validation.ts.hbs',
    },
    {
      type: 'barrel-append',
      path: `${config.paths.validations}/index.ts`,
      exportLine: `export * from './{{camelCase name}}${barrelExt}';`,
    },
  ];
}
