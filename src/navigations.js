import path from 'node:path';
import os from 'node:os';
import fsPromises from 'node:fs/promises';

export let currentDir = os.homedir();

export const up = () => {
  currentDir = path.resolve(currentDir, '..');
};

export const cd = async (dir) => {
  if (!dir) {
    throw new Error('Invalid input');
  }
  const newPath = path.resolve(currentDir, dir);
  const stat = await fsPromises.stat(newPath);
  if (!stat.isDirectory()) {
    throw new Error('Operation failed');
  }
  currentDir = newPath;
};

export const ls = async () => {
  const entities = await fsPromises.readdir(currentDir, {
    withFileTypes: true,
  });
  const result = entities.map((file) =>
    file.isDirectory()
      ? { name: file.name, type: 'folder' }
      : { name: file.name, type: 'file' },
  );
  result.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const maxLength = Math.max(...result.map(({ name }) => name.length));

  result.forEach(({ name, type }) => {
    console.log(`${name.padEnd(maxLength)} [${type}]`);
  });
};
