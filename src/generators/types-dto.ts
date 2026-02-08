import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { validateName } from '../utils/validation.js';

export type TypesDtoAnswers = {
  name: string;
  includeCreateDto: boolean;
  includeUpdateDto: boolean;
  includeParamsDto: boolean;
};

export function typesDtoPrompts() {
  return [
    {
      type: 'input' as const,
      name: 'name',
      message: 'Entity name (e.g., Community, Event):',
      validate: validateName,
    },
    {
      type: 'confirm' as const,
      name: 'includeCreateDto',
      message: 'Include ForCreateDto?',
      default: true,
    },
    {
      type: 'confirm' as const,
      name: 'includeUpdateDto',
      message: 'Include ForUpdateDto?',
      default: true,
    },
    {
      type: 'confirm' as const,
      name: 'includeParamsDto',
      message: 'Include ParamsDto?',
      default: true,
    },
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
