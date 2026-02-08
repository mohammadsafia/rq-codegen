import { describe, it, expect } from 'vitest';

import { toPascalCase, toKebabCase, toCamelCase, toConstantCase } from '../string.js';

describe('toPascalCase', () => {
  it('converts kebab-case', () => {
    expect(toPascalCase('product-list')).toBe('ProductList');
  });

  it('converts snake_case', () => {
    expect(toPascalCase('product_list')).toBe('ProductList');
  });

  it('converts space-separated', () => {
    expect(toPascalCase('product list')).toBe('ProductList');
  });

  it('handles already PascalCase', () => {
    expect(toPascalCase('ProductList')).toBe('ProductList');
  });

  it('capitalizes first letter of single word', () => {
    expect(toPascalCase('product')).toBe('Product');
  });

  it('handles single character', () => {
    expect(toPascalCase('p')).toBe('P');
  });

  it('handles empty string', () => {
    expect(toPascalCase('')).toBe('');
  });

  it('handles mixed separators', () => {
    expect(toPascalCase('my-product_list')).toBe('MyProductList');
  });
});

describe('toKebabCase', () => {
  it('converts PascalCase', () => {
    expect(toKebabCase('ProductList')).toBe('product-list');
  });

  it('converts camelCase', () => {
    expect(toKebabCase('productList')).toBe('product-list');
  });

  it('converts snake_case', () => {
    expect(toKebabCase('product_list')).toBe('product-list');
  });

  it('converts space-separated', () => {
    expect(toKebabCase('product list')).toBe('product-list');
  });

  it('handles already kebab-case', () => {
    expect(toKebabCase('product-list')).toBe('product-list');
  });

  it('handles single word', () => {
    expect(toKebabCase('Product')).toBe('product');
  });

  it('handles empty string', () => {
    expect(toKebabCase('')).toBe('');
  });
});

describe('toCamelCase', () => {
  it('converts kebab-case', () => {
    expect(toCamelCase('product-list')).toBe('productList');
  });

  it('converts snake_case', () => {
    expect(toCamelCase('product_list')).toBe('productList');
  });

  it('converts PascalCase', () => {
    expect(toCamelCase('ProductList')).toBe('productList');
  });

  it('converts space-separated', () => {
    expect(toCamelCase('product list')).toBe('productList');
  });

  it('handles single word', () => {
    expect(toCamelCase('product')).toBe('product');
  });

  it('handles empty string', () => {
    expect(toCamelCase('')).toBe('');
  });

  it('lowercases first character of PascalCase', () => {
    expect(toCamelCase('StatusIndicator')).toBe('statusIndicator');
  });
});

describe('toConstantCase', () => {
  it('converts camelCase', () => {
    expect(toConstantCase('productList')).toBe('PRODUCT_LIST');
  });

  it('converts kebab-case', () => {
    expect(toConstantCase('product-list')).toBe('PRODUCT_LIST');
  });

  it('converts space-separated', () => {
    expect(toConstantCase('product list')).toBe('PRODUCT_LIST');
  });

  it('handles already CONSTANT_CASE', () => {
    expect(toConstantCase('PRODUCT_LIST')).toBe('PRODUCT_LIST');
  });

  it('converts PascalCase', () => {
    expect(toConstantCase('ProductList')).toBe('PRODUCT_LIST');
  });

  it('handles single word', () => {
    expect(toConstantCase('product')).toBe('PRODUCT');
  });

  it('handles empty string', () => {
    expect(toConstantCase('')).toBe('');
  });
});
