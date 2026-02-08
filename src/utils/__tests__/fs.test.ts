import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { fileExists, dirExists, getDirectories, ensureDirectoryExists } from '../fs.js';

const TEST_DIR = path.join(os.tmpdir(), 'rq-codegen-fs-test');

beforeEach(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('fileExists', () => {
  it('returns true for existing file', () => {
    const filePath = path.join(TEST_DIR, 'test.txt');
    fs.writeFileSync(filePath, 'test');
    expect(fileExists(filePath)).toBe(true);
  });

  it('returns false for non-existent file', () => {
    expect(fileExists(path.join(TEST_DIR, 'nonexistent.txt'))).toBe(false);
  });

  it('returns true for a directory (existsSync checks both)', () => {
    // fileExists uses fs.existsSync which returns true for directories too
    expect(fileExists(TEST_DIR)).toBe(true);
  });
});

describe('dirExists', () => {
  it('returns true for existing directory', () => {
    expect(dirExists(TEST_DIR)).toBe(true);
  });

  it('returns false for non-existent directory', () => {
    expect(dirExists(path.join(TEST_DIR, 'nonexistent'))).toBe(false);
  });

  it('returns false for a file', () => {
    const filePath = path.join(TEST_DIR, 'test.txt');
    fs.writeFileSync(filePath, 'test');
    expect(dirExists(filePath)).toBe(false);
  });
});

describe('getDirectories', () => {
  it('returns directory names', () => {
    fs.mkdirSync(path.join(TEST_DIR, 'dir1'));
    fs.mkdirSync(path.join(TEST_DIR, 'dir2'));
    fs.writeFileSync(path.join(TEST_DIR, 'file.txt'), 'test');

    const dirs = getDirectories(TEST_DIR);
    expect(dirs).toContain('dir1');
    expect(dirs).toContain('dir2');
    expect(dirs).not.toContain('file.txt');
  });

  it('returns empty array if directory does not exist', () => {
    expect(getDirectories(path.join(TEST_DIR, 'nonexistent'))).toEqual([]);
  });

  it('returns empty array for empty directory', () => {
    expect(getDirectories(TEST_DIR)).toEqual([]);
  });
});

describe('ensureDirectoryExists', () => {
  it('creates directory if it does not exist', () => {
    const filePath = path.join(TEST_DIR, 'nested', 'deep', 'file.txt');
    ensureDirectoryExists(filePath);

    expect(fs.existsSync(path.join(TEST_DIR, 'nested', 'deep'))).toBe(true);
  });

  it('does not fail if directory already exists', () => {
    const filePath = path.join(TEST_DIR, 'file.txt');
    expect(() => ensureDirectoryExists(filePath)).not.toThrow();
  });

  it('creates parent directories recursively', () => {
    const filePath = path.join(TEST_DIR, 'a', 'b', 'c', 'file.txt');
    ensureDirectoryExists(filePath);

    expect(fs.existsSync(path.join(TEST_DIR, 'a', 'b', 'c'))).toBe(true);
  });
});
