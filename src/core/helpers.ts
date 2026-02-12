import Handlebars from 'handlebars';

import type { RqCodegenConfig } from '../config/types.js';

export function registerHelpers(handlebars: typeof Handlebars, config: RqCodegenConfig): void {
  // -- Existing helpers (migrated from original) --

  handlebars.registerHelper('constantCase', (text: string) => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toUpperCase();
  });

  handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  handlebars.registerHelper('neq', (a: unknown, b: unknown) => a !== b);

  handlebars.registerHelper('plural', (text: string) => {
    if (text.endsWith('s')) return text;
    if (text.endsWith('y') && !/[aeiou]y$/i.test(text)) return text.slice(0, -1) + 'ies';
    return text + 's';
  });

  handlebars.registerHelper('includes', (arr: string[], val: string) => {
    return Array.isArray(arr) && arr.includes(val);
  });

  handlebars.registerHelper('join', (arr: string[], separator: string) => {
    return Array.isArray(arr) ? arr.join(separator) : '';
  });

  // -- New config-aware helpers --

  handlebars.registerHelper('configAlias', (key: string) => {
    return (config.aliases as Record<string, string>)[key] ?? `@${key}`;
  });

  handlebars.registerHelper('configPath', (key: string) => {
    return (config.paths as Record<string, string>)[key] ?? key;
  });

  handlebars.registerHelper('dtoSuffix', (key: string) => {
    return (config.naming.dtoSuffixes as Record<string, string>)[key] ?? '';
  });

  // Block helper for feature checks
  handlebars.registerHelper('ifFeature', function (
    this: unknown,
    feature: string,
    options: Handlebars.HelperOptions,
  ) {
    const isEnabled = (config.features as Record<string, boolean>)[feature];
    return isEnabled ? options.fn(this) : options.inverse(this);
  });

  // Check if any of the given values exist in the array
  handlebars.registerHelper('includesAny', (arr: string[], ...values: unknown[]) => {
    // Last argument is Handlebars options object, exclude it
    const vals = values.slice(0, -1) as string[];
    return Array.isArray(arr) && vals.some((v) => arr.includes(v));
  });

  // Plop built-in helpers that we need to provide
  handlebars.registerHelper('pascalCase', (text: string) => {
    return text
      .replace(/[-_\s]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (_, c: string) => c.toUpperCase());
  });

  handlebars.registerHelper('camelCase', (text: string) => {
    return text
      .replace(/[-_\s]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (_, c: string) => c.toLowerCase());
  });

  handlebars.registerHelper('kebabCase', (text: string) => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  });
}
