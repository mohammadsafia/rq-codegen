import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = path.join(ROOT, 'dist', 'bin', 'cli.js');

export function makeTempProject(): { dir: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rqgen-e2e-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

export function writeConfig(dir: string): void {
  fs.writeFileSync(
    path.join(dir, 'rqgen.config.ts'),
    `import { defineConfig } from '@appswave/rq-codegen';\nexport default defineConfig({ srcDir: './src' });\n`,
    'utf-8',
  );
}

export function writeRawConfig(dir: string, contents: string): void {
  fs.writeFileSync(path.join(dir, 'rqgen.config.ts'), contents, 'utf-8');
}

export function runCli(dir: string, args: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync('node', [CLI, ...args], { cwd: dir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { status: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

export function read(dir: string, rel: string): string {
  return fs.readFileSync(path.join(dir, rel), 'utf-8');
}

export function exists(dir: string, rel: string): boolean {
  return fs.existsSync(path.join(dir, rel));
}
