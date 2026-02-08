import { describe, it, expect } from 'vitest';

import { validateName, validatePascalCase } from '../validation.js';

describe('validateName', () => {
  it('accepts simple alphabetic name', () => {
    expect(validateName('products')).toBe(true);
  });

  it('accepts PascalCase name', () => {
    expect(validateName('MyProducts')).toBe(true);
  });

  it('accepts kebab-case name', () => {
    expect(validateName('user-profile')).toBe(true);
  });

  it('accepts name with numbers', () => {
    expect(validateName('product123')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateName('')).toBe('Name is required');
  });

  it('rejects whitespace-only string', () => {
    expect(validateName('   ')).toBe('Name is required');
  });

  it('rejects name with special characters', () => {
    const result = validateName('user@name');
    expect(result).not.toBe(true);
    expect(typeof result).toBe('string');
  });

  it('rejects name with underscores', () => {
    const result = validateName('user_name');
    expect(result).not.toBe(true);
  });

  it('rejects name with spaces', () => {
    const result = validateName('user name');
    expect(result).not.toBe(true);
  });

  it('rejects name with dots', () => {
    const result = validateName('user.name');
    expect(result).not.toBe(true);
  });
});

describe('validatePascalCase', () => {
  it('accepts valid PascalCase', () => {
    expect(validatePascalCase('UserProfile')).toBe(true);
  });

  it('accepts single uppercase word', () => {
    expect(validatePascalCase('User')).toBe(true);
  });

  it('accepts PascalCase with numbers', () => {
    expect(validatePascalCase('User123')).toBe(true);
  });

  it('accepts single uppercase letter', () => {
    expect(validatePascalCase('A')).toBe(true);
  });

  it('rejects empty string', () => {
    const result = validatePascalCase('');
    expect(result).not.toBe(true);
    expect(typeof result).toBe('string');
  });

  it('rejects camelCase (lowercase first)', () => {
    const result = validatePascalCase('userProfile');
    expect(result).not.toBe(true);
  });

  it('rejects kebab-case', () => {
    const result = validatePascalCase('user-profile');
    expect(result).not.toBe(true);
  });

  it('rejects snake_case', () => {
    const result = validatePascalCase('user_profile');
    expect(result).not.toBe(true);
  });

  it('rejects number at start', () => {
    const result = validatePascalCase('123User');
    expect(result).not.toBe(true);
  });

  it('rejects lowercase single letter', () => {
    const result = validatePascalCase('a');
    expect(result).not.toBe(true);
  });
});
