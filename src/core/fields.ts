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
  required?: boolean;
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

export class MissingRequiredFieldsError extends Error {
  fields: string[];
  constructor(fields: GeneratorField[]) {
    const flags = fields.map((f) => `--${fieldToFlagName(f)}`);
    super(
      `Missing required option(s): ${flags.join(', ')}.\n` +
        `Provide them as flags, or drop --yes to answer interactively.`,
    );
    this.name = 'MissingRequiredFieldsError';
    this.fields = fields.map((f) => f.name);
  }
}

export class InvalidFieldValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFieldValueError';
  }
}

export type PromptRunner = (prompts: unknown[]) => Promise<Record<string, unknown>>;

function coerce(field: GeneratorField, value: unknown): unknown {
  if (field.type === 'checkbox' && typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return value;
}

export async function resolveAnswers(
  fields: GeneratorField[],
  provided: Record<string, unknown>,
  opts: { interactive: boolean; prompt: PromptRunner },
): Promise<Record<string, unknown>> {
  if (opts.interactive) {
    const answers: Record<string, unknown> = {};
    const unresolved: GeneratorField[] = [];
    for (const field of fields) {
      if (field.when && !field.when(answers)) continue;
      if (provided[field.name] !== undefined) {
        answers[field.name] = coerce(field, provided[field.name]);
      } else {
        unresolved.push(field);
      }
    }
    if (unresolved.length === 0) return answers;
    const results = await opts.prompt(fieldsToPrompts(unresolved));
    return { ...answers, ...results };
  }

  // Non-interactive: single ordered pass; defaults applied inline so later
  // `when` predicates see them.
  const answers: Record<string, unknown> = {};
  const missing: GeneratorField[] = [];
  for (const field of fields) {
    if (field.when && !field.when(answers)) continue;

    if (provided[field.name] !== undefined) {
      const value = coerce(field, provided[field.name]);
      if (field.type === 'input' && field.validate && typeof value === 'string') {
        const result = field.validate(value);
        if (result !== true) {
          throw new InvalidFieldValueError(`Invalid --${fieldToFlagName(field)}: ${result}`);
        }
      }
      answers[field.name] = value;
      continue;
    }

    switch (field.type) {
      case 'confirm':
        answers[field.name] = field.default;
        break;
      case 'checkbox':
        answers[field.name] = field.choices.filter((c) => c.checked).map((c) => c.value);
        break;
      case 'input':
      case 'list':
        if (field.default !== undefined) {
          answers[field.name] = field.default;
        } else if (field.required) {
          missing.push(field);
        }
        break;
    }
  }

  if (missing.length > 0) throw new MissingRequiredFieldsError(missing);
  return answers;
}
