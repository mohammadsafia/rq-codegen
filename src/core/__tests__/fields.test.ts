import { describe, it, expect } from 'vitest';
import { fieldsToPrompts, type GeneratorField } from '../fields.js';
import { fieldsToOptions, fieldToFlagName } from '../fields.js';

describe('fieldsToPrompts', () => {
  it('maps an input field to an inquirer input prompt', () => {
    const fields: GeneratorField[] = [
      { name: 'name', type: 'input', message: 'Name:', required: true },
    ];
    const prompts = fieldsToPrompts(fields) as Array<Record<string, unknown>>;
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({ type: 'input', name: 'name', message: 'Name:' });
  });

  it('passes through default, validate, when, and choices', () => {
    const validate = () => true as const;
    const when = () => true;
    const fields: GeneratorField[] = [
      { name: 'ops', type: 'checkbox', message: 'Ops:', choices: [{ name: 'list', value: 'list', checked: true }] },
      { name: 'paginated', type: 'confirm', message: 'Paginated?', default: false, when },
      { name: 'handlerKey', type: 'input', message: 'Key:', default: 'list', validate },
    ];
    const prompts = fieldsToPrompts(fields) as Array<Record<string, unknown>>;
    expect(prompts[0]).toMatchObject({ type: 'checkbox', name: 'ops' });
    expect((prompts[0].choices as unknown[])).toHaveLength(1);
    expect(prompts[1]).toMatchObject({ type: 'confirm', name: 'paginated', default: false });
    expect(prompts[1].when).toBe(when);
    expect(prompts[2]).toMatchObject({ default: 'list' });
    expect(prompts[2].validate).toBe(validate);
  });

  it('supports list fields with function choices', () => {
    const choices = () => ['a', 'b'];
    const fields: GeneratorField[] = [
      { name: 'category', type: 'list', message: 'Cat:', choices },
    ];
    const prompts = fieldsToPrompts(fields) as Array<Record<string, unknown>>;
    expect(prompts[0].choices).toBe(choices);
  });
});

describe('fieldToFlagName', () => {
  it('kebab-cases the field name by default', () => {
    expect(fieldToFlagName({ name: 'singularName', type: 'input', message: '' })).toBe('singular-name');
    expect(fieldToFlagName({ name: 'isPaginated', type: 'confirm', message: '', default: false })).toBe('is-paginated');
  });
  it('honors an explicit flag override', () => {
    expect(fieldToFlagName({ name: 'endpointKey', type: 'input', message: '', flag: 'endpoint' })).toBe('endpoint');
  });
});

describe('fieldsToOptions', () => {
  it('input -> value option', () => {
    const [opt] = fieldsToOptions([{ name: 'name', type: 'input', message: 'Name:' }]);
    expect(opt).toMatchObject({ flags: '--name <value>', isBoolean: false, isList: false, fieldName: 'name' });
  });

  it('confirm with default true -> negatable --no flag', () => {
    const [opt] = fieldsToOptions([{ name: 'update', type: 'confirm', message: 'Update?', default: true, flag: 'update' }]);
    expect(opt.flags).toBe('--no-update');
    expect(opt.isBoolean).toBe(true);
  });

  it('confirm with default false -> plain boolean flag', () => {
    const [opt] = fieldsToOptions([{ name: 'isPaginated', type: 'confirm', message: 'Paginated?', default: false }]);
    expect(opt.flags).toBe('--is-paginated');
    expect(opt.isBoolean).toBe(true);
  });

  it('checkbox -> csv list option', () => {
    const [opt] = fieldsToOptions([{ name: 'operations', type: 'checkbox', message: 'Ops:', choices: [] }]);
    expect(opt.flags).toBe('--operations <items>');
    expect(opt.isList).toBe(true);
  });

  it('list -> value option', () => {
    const [opt] = fieldsToOptions([{ name: 'category', type: 'list', message: 'Cat:', choices: () => [] }]);
    expect(opt.flags).toBe('--category <value>');
    expect(opt.isBoolean).toBe(false);
  });
});

import { resolveAnswers, MissingRequiredFieldsError, type GeneratorField as GF } from '../fields.js';

const noPrompt = async () => ({});

describe('resolveAnswers (non-interactive)', () => {
  it('uses provided flags and coerces checkbox CSV to array', async () => {
    const fields: GF[] = [
      { name: 'name', type: 'input', message: '', required: true },
      { name: 'operations', type: 'checkbox', message: '', choices: [] },
    ];
    const answers = await resolveAnswers(
      fields,
      { name: 'Product', operations: 'list,details' },
      { interactive: false, prompt: noPrompt },
    );
    expect(answers).toEqual({ name: 'Product', operations: ['list', 'details'] });
  });

  it('applies defaults for unprovided fields', async () => {
    const fields: GF[] = [
      { name: 'name', type: 'input', message: '', required: true },
      { name: 'includeParamsDto', type: 'confirm', message: '', default: true },
    ];
    const answers = await resolveAnswers(
      fields,
      { name: 'Product' },
      { interactive: false, prompt: noPrompt },
    );
    expect(answers).toEqual({ name: 'Product', includeParamsDto: true });
  });

  it('throws MissingRequiredFieldsError when a required input is absent', async () => {
    const fields: GF[] = [{ name: 'name', type: 'input', message: '', required: true }];
    await expect(
      resolveAnswers(fields, {}, { interactive: false, prompt: noPrompt }),
    ).rejects.toBeInstanceOf(MissingRequiredFieldsError);
  });

  it('skips fields whose when() is false', async () => {
    const fields: GF[] = [
      { name: 'chainQueryHook', type: 'confirm', message: '', default: false },
      { name: 'isPaginated', type: 'confirm', message: '', default: false, when: (a) => a.chainQueryHook === true },
    ];
    const answers = await resolveAnswers(fields, {}, { interactive: false, prompt: noPrompt });
    expect(answers).toEqual({ chainQueryHook: false });
    expect('isPaginated' in answers).toBe(false);
  });

  it('prompts only for unresolved fields in interactive mode', async () => {
    const fields: GF[] = [
      { name: 'name', type: 'input', message: '', required: true },
      { name: 'singularName', type: 'input', message: '', required: true },
    ];
    const seen: unknown[] = [];
    const prompt = async (prompts: unknown[]) => {
      seen.push(...(prompts as unknown[]));
      return { singularName: 'product' };
    };
    const answers = await resolveAnswers(fields, { name: 'Products' }, { interactive: true, prompt });
    expect(answers).toEqual({ name: 'Products', singularName: 'product' });
    expect(seen).toHaveLength(1);
    expect((seen[0] as Record<string, unknown>).name).toBe('singularName');
  });
});
