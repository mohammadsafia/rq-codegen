import { describe, it, expect } from 'vitest';
import { fieldsToPrompts, type GeneratorField } from '../fields.js';

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
