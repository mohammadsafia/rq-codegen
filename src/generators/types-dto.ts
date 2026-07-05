import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { validateName } from '../utils/validation.js';

export type TypesDtoAnswers = {
  name: string;
  includeCreateDto: boolean;
  includeUpdateDto: boolean;
  includeParamsDto: boolean;
};

export function typesDtoFields(): GeneratorField[] {
  return [
    { name: 'name', type: 'input', message: 'Entity name (e.g., Community, Event):', required: true, validate: validateName },
    { name: 'includeCreateDto', type: 'confirm', message: 'Include ForCreateDto?', default: true },
    { name: 'includeUpdateDto', type: 'confirm', message: 'Include ForUpdateDto?', default: true },
    { name: 'includeParamsDto', type: 'confirm', message: 'Include ParamsDto?', default: true },
  ];
}

export function typesDtoActions(
  _answers: TypesDtoAnswers,
  config: RqCodegenConfig,
): GeneratorAction[] {
  return [
    {
      type: 'add',
      path: `${config.paths.types}/{{pascalCase name}}Dto.ts`,
      templateFile: 'types-dto/dto.ts.hbs',
    },
    {
      type: 'barrel-append',
      path: `${config.paths.types}/index.ts`,
      exportLine: "export * from './{{pascalCase name}}Dto';",
    },
  ];
}
