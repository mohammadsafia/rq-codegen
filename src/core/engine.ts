import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

import type { RqCodegenConfig } from '../config/types.js';
import { registerHelpers } from './helpers.js';
import { barrelAppend, routeRegister, endpointRegister, type ActionResult } from './actions.js';
import { resolveTemplatePath } from './template-resolver.js';
import { ensureDirectoryExists } from '../utils/fs.js';

export type GeneratorAction =
  | AddAction
  | BarrelAppendAction
  | RouteRegisterAction
  | EndpointRegisterAction;

export type AddAction = {
  type: 'add';
  path: string;
  templateFile: string;
  data?: Record<string, unknown>;
};

export type BarrelAppendAction = {
  type: 'barrel-append';
  path: string;
  exportLine: string;
};

export type RouteRegisterAction = {
  type: 'route-register';
  data: {
    pageName: string;
    category: string;
    layout: string;
    isProtected: boolean;
    routePath: string;
  };
};

export type EndpointRegisterAction = {
  type: 'endpoint-register';
  data: {
    endpointKey: string;
    apiBaseUrl: string;
    operations: string[];
  };
};

let handlebarsInstance: typeof Handlebars | null = null;

function getHandlebars(config: RqCodegenConfig): typeof Handlebars {
  if (!handlebarsInstance) {
    handlebarsInstance = Handlebars.create();
    registerHelpers(handlebarsInstance, config);
  }
  return handlebarsInstance;
}

export function resetHandlebars(): void {
  handlebarsInstance = null;
}

function renderString(
  template: string,
  data: Record<string, unknown>,
  config: RqCodegenConfig,
): string {
  const hbs = getHandlebars(config);
  return hbs.compile(template)(data);
}

export async function executeActions(
  actions: GeneratorAction[],
  answers: Record<string, unknown>,
  config: RqCodegenConfig,
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  const hbs = getHandlebars(config);

  for (const action of actions) {
    switch (action.type) {
      case 'add': {
        try {
          const mergedData = { ...answers, ...(action.data ?? {}), config };
          const resolvedPath = renderString(action.path, mergedData, config);
          const outputPath = path.resolve(process.cwd(), config.srcDir, resolvedPath);

          // Resolve template
          const templatePath = resolveTemplatePath(action.templateFile, config);
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          const compiled = hbs.compile(templateContent);
          const rendered = compiled(mergedData);

          ensureDirectoryExists(outputPath);

          if (fs.existsSync(outputPath)) {
            results.push({
              type: 'skipped',
              path: outputPath,
              message: 'File already exists',
            });
          } else {
            fs.writeFileSync(outputPath, rendered, 'utf-8');
            results.push({
              type: 'created',
              path: outputPath,
              message: `Created ${resolvedPath}`,
            });
          }
        } catch (error) {
          results.push({
            type: 'failed',
            path: action.path,
            message: error instanceof Error ? error.message : String(error),
          });
        }
        break;
      }

      case 'barrel-append': {
        const mergedData = { ...answers, config };
        const result = barrelAppend(action.path, action.exportLine, config, mergedData);
        results.push(result);
        break;
      }

      case 'route-register': {
        const routeResults = routeRegister(config, action.data);
        results.push(...routeResults);
        break;
      }

      case 'endpoint-register': {
        const endpointResult = endpointRegister(config, action.data);
        results.push(endpointResult);
        break;
      }
    }
  }

  return results;
}
