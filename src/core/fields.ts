export type Choice = { name: string; value: string; checked?: boolean };
export type Validator = (value: string) => true | string;
export type WhenFn = (answers: Record<string, unknown>) => boolean;

type BaseField = {
  name: string;
  message: string;
  /** CLI flag long-name override (kebab-case, no dashes). Defaults to kebab(name). */
  flag?: string;
  when?: WhenFn;
};

export type InputField = BaseField & {
  type: 'input';
  required?: boolean;
  default?: string;
  validate?: Validator;
};

export type ConfirmField = BaseField & {
  type: 'confirm';
  default: boolean;
};

export type CheckboxField = BaseField & {
  type: 'checkbox';
  choices: Choice[];
};

export type ListField = BaseField & {
  type: 'list';
  choices: Choice[] | (() => string[]);
  default?: string;
};

export type GeneratorField = InputField | ConfirmField | CheckboxField | ListField;

/** Derive inquirer prompt objects from a field schema (interactive path). */
export function fieldsToPrompts(fields: GeneratorField[]): unknown[] {
  return fields.map((field) => {
    const prompt: Record<string, unknown> = {
      type: field.type,
      name: field.name,
      message: field.message,
    };
    if (field.when) prompt.when = field.when;

    switch (field.type) {
      case 'input':
        if (field.default !== undefined) prompt.default = field.default;
        if (field.validate) prompt.validate = field.validate;
        break;
      case 'confirm':
        prompt.default = field.default;
        break;
      case 'checkbox':
        prompt.choices = field.choices;
        break;
      case 'list':
        prompt.choices = field.choices;
        if (field.default !== undefined) prompt.default = field.default;
        break;
    }
    return prompt;
  });
}

export type CliOption = {
  flags: string;
  description: string;
  isBoolean: boolean;
  isList: boolean;
  fieldName: string;
};

function kebab(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function fieldToFlagName(field: GeneratorField): string {
  return field.flag ?? kebab(field.name);
}

export function fieldsToOptions(fields: GeneratorField[]): CliOption[] {
  return fields.map((field) => {
    const flagName = fieldToFlagName(field);
    const base = { description: field.message, fieldName: field.name };

    switch (field.type) {
      case 'confirm':
        // Default true is disabled via --no-x; default false is enabled via --x.
        return {
          ...base,
          flags: field.default ? `--no-${flagName}` : `--${flagName}`,
          isBoolean: true,
          isList: false,
        };
      case 'checkbox':
        return { ...base, flags: `--${flagName} <items>`, isBoolean: false, isList: true };
      case 'input':
      case 'list':
        return { ...base, flags: `--${flagName} <value>`, isBoolean: false, isList: false };
    }
  });
}
