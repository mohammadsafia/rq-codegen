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
