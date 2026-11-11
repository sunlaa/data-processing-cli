import { resolveArgs } from '../utils/argResolver.js';
import { createReadStream, createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolvePath } from '../utils/pathResolver.js';
import { pipeline } from 'node:stream/promises';

export const hash = async (args) => {
  const { values } = resolveArgs(args, {
    input: { type: 'string' },
    algorithm: { type: 'string' },
    save: { type: 'boolean' },
  });
  const { input, save } = values;
  const algorithm = values.algorithm ?? 'sha256';
  const supportedAlgorithm = ['sha256', 'md5', 'sha512'];

  if (!input) {
    throw new Error('Invalid input');
  }

  if (!supportedAlgorithm.includes(algorithm)) {
    throw new Error('Operation failed');
  }

  const file = createReadStream(resolvePath(input));
  const hash = createHash(algorithm);

  if (save) {
    const save = createWriteStream(resolvePath(`${input}.${algorithm}`));
    hash.setEncoding('hex');
    await pipeline(file, hash, save);
  } else {
    await pipeline(file, hash);
  }
  const result = `${algorithm}: ${hash.digest('hex')}`;
  console.log(result);
};
