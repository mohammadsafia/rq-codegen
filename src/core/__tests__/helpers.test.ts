import { describe, it, expect, beforeEach } from 'vitest';
import Handlebars from 'handlebars';

import { registerHelpers } from '../helpers.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';
import type { RqCodegenConfig } from '../../config/types.js';

let hbs: typeof Handlebars;
let config: RqCodegenConfig;

beforeEach(() => {
  hbs = Handlebars.create();
  config = { ...DEFAULT_CONFIG };
  registerHelpers(hbs, config);
});

function render(template: string, data: Record<string, unknown> = {}): string {
  return hbs.compile(template)(data);
}

describe('constantCase helper', () => {
  it('converts camelCase', () => {
    expect(render('{{constantCase val}}', { val: 'userName' })).toBe('USER_NAME');
  });

  it('converts kebab-case', () => {
    expect(render('{{constantCase val}}', { val: 'user-name' })).toBe('USER_NAME');
  });

  it('converts space-separated', () => {
    expect(render('{{constantCase val}}', { val: 'user name' })).toBe('USER_NAME');
  });

  it('handles already CONSTANT_CASE', () => {
    expect(render('{{constantCase val}}', { val: 'USER_NAME' })).toBe('USER_NAME');
  });
});

describe('eq helper', () => {
  it('returns true for equal values', () => {
    expect(render('{{#if (eq a b)}}yes{{/if}}', { a: 5, b: 5 })).toBe('yes');
  });

  it('returns false for different values', () => {
    expect(render('{{#if (eq a b)}}yes{{else}}no{{/if}}', { a: 5, b: 6 })).toBe('no');
  });

  it('strict equality (number vs string)', () => {
    expect(render('{{#if (eq a b)}}yes{{else}}no{{/if}}', { a: 5, b: '5' })).toBe('no');
  });
});

describe('neq helper', () => {
  it('returns true for different values', () => {
    expect(render('{{#if (neq a b)}}yes{{/if}}', { a: 5, b: 6 })).toBe('yes');
  });

  it('returns false for equal values', () => {
    expect(render('{{#if (neq a b)}}yes{{else}}no{{/if}}', { a: 5, b: 5 })).toBe('no');
  });
});

describe('plural helper', () => {
  it('adds s to regular word', () => {
    expect(render('{{plural val}}', { val: 'product' })).toBe('products');
  });

  it('handles word ending in y (consonant)', () => {
    expect(render('{{plural val}}', { val: 'category' })).toBe('categories');
  });

  it('keeps word ending in y (vowel)', () => {
    expect(render('{{plural val}}', { val: 'boy' })).toBe('boys');
  });

  it('keeps word already ending in s', () => {
    expect(render('{{plural val}}', { val: 'items' })).toBe('items');
  });
});

describe('includes helper', () => {
  it('returns true when array includes value', () => {
    expect(render('{{#if (includes arr "a")}}yes{{/if}}', { arr: ['a', 'b'] })).toBe('yes');
  });

  it('returns false when array does not include value', () => {
    expect(render('{{#if (includes arr "c")}}yes{{else}}no{{/if}}', { arr: ['a', 'b'] })).toBe('no');
  });

  it('returns false for non-array', () => {
    expect(render('{{#if (includes arr "a")}}yes{{else}}no{{/if}}', { arr: null })).toBe('no');
  });
});

describe('join helper', () => {
  it('joins array with separator', () => {
    expect(render('{{join arr ","}}', { arr: ['a', 'b', 'c'] })).toBe('a,b,c');
  });

  it('returns empty for non-array', () => {
    expect(render('{{join arr ","}}', { arr: null })).toBe('');
  });
});

describe('configAlias helper', () => {
  it('returns configured alias', () => {
    expect(render('{{configAlias "api"}}')).toBe('@api');
  });

  it('returns @app-types for types alias', () => {
    expect(render('{{configAlias "types"}}')).toBe('@app-types');
  });

  it('returns fallback for unknown alias', () => {
    expect(render('{{configAlias "unknown"}}')).toBe('@unknown');
  });
});

describe('configPath helper', () => {
  it('returns configured path', () => {
    expect(render('{{configPath "handlers"}}')).toBe(config.paths.handlers);
  });

  it('returns key as fallback for unknown path', () => {
    expect(render('{{configPath "unknown"}}')).toBe('unknown');
  });
});

describe('dtoSuffix helper', () => {
  it('returns read suffix', () => {
    expect(render('{{dtoSuffix "read"}}')).toBe('ForReadDto');
  });

  it('returns create suffix', () => {
    expect(render('{{dtoSuffix "create"}}')).toBe('ForCreateDto');
  });

  it('returns update suffix', () => {
    expect(render('{{dtoSuffix "update"}}')).toBe('ForUpdateDto');
  });

  it('returns list suffix', () => {
    expect(render('{{dtoSuffix "list"}}')).toBe('ListDto');
  });

  it('returns listResponse suffix', () => {
    expect(render('{{dtoSuffix "listResponse"}}')).toBe('ListResponseDto');
  });

  it('returns params suffix', () => {
    expect(render('{{dtoSuffix "params"}}')).toBe('ParamsDto');
  });

  it('returns empty for unknown suffix', () => {
    expect(render('{{dtoSuffix "unknown"}}')).toBe('');
  });
});

describe('ifFeature helper', () => {
  it('renders content when feature is enabled', () => {
    config.features.i18n = true;
    hbs = Handlebars.create();
    registerHelpers(hbs, config);

    expect(render('{{#ifFeature "i18n"}}enabled{{/ifFeature}}')).toBe('enabled');
  });

  it('renders inverse when feature is disabled', () => {
    config.features.i18n = false;
    hbs = Handlebars.create();
    registerHelpers(hbs, config);

    expect(render('{{#ifFeature "i18n"}}enabled{{else}}disabled{{/ifFeature}}')).toBe('disabled');
  });

  it('renders empty when feature disabled and no inverse', () => {
    config.features.toast = false;
    hbs = Handlebars.create();
    registerHelpers(hbs, config);

    expect(render('{{#ifFeature "toast"}}enabled{{/ifFeature}}')).toBe('');
  });
});

describe('pascalCase helper', () => {
  it('converts kebab-case', () => {
    expect(render('{{pascalCase val}}', { val: 'user-profile' })).toBe('UserProfile');
  });

  it('converts snake_case', () => {
    expect(render('{{pascalCase val}}', { val: 'user_profile' })).toBe('UserProfile');
  });

  it('converts space-separated', () => {
    expect(render('{{pascalCase val}}', { val: 'user profile' })).toBe('UserProfile');
  });

  it('capitalizes single word', () => {
    expect(render('{{pascalCase val}}', { val: 'user' })).toBe('User');
  });
});

describe('camelCase helper', () => {
  it('converts kebab-case', () => {
    expect(render('{{camelCase val}}', { val: 'user-profile' })).toBe('userProfile');
  });

  it('converts snake_case', () => {
    expect(render('{{camelCase val}}', { val: 'user_profile' })).toBe('userProfile');
  });

  it('lowercases first character', () => {
    expect(render('{{camelCase val}}', { val: 'UserProfile' })).toBe('userProfile');
  });
});

describe('kebabCase helper', () => {
  it('converts PascalCase', () => {
    expect(render('{{kebabCase val}}', { val: 'UserProfile' })).toBe('user-profile');
  });

  it('converts camelCase', () => {
    expect(render('{{kebabCase val}}', { val: 'userProfile' })).toBe('user-profile');
  });

  it('converts snake_case', () => {
    expect(render('{{kebabCase val}}', { val: 'user_profile' })).toBe('user-profile');
  });
});
