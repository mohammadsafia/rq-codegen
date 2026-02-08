import fs from 'fs';
import path from 'path';

export function fileExists(filePath: string): boolean {
  return fs.existsSync(path.resolve(process.cwd(), filePath));
}

export function dirExists(dirPath: string): boolean {
  const resolved = path.resolve(process.cwd(), dirPath);
  return fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
}

export function getDirectories(dirPath: string): string[] {
  const resolved = path.resolve(process.cwd(), dirPath);
  if (!fs.existsSync(resolved)) return [];
  return fs
    .readdirSync(resolved, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

export function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
