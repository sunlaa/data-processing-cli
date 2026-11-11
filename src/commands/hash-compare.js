import { resolveArgs } from '../utils/argResolver.js';
import { createReadStream } from 'node:fs';
import { text } from 'node:stream/consumers';
import { createHash } from 'node:crypto';
import { resolvePath } from '../utils/pathResolver.js';
import { pipeline } from 'node:stream/promises';

export const hashCompare = async (args) => {
  const { values } = resolveArgs(args, {
    input: { type: 'string' },
    hash: { type: 'string' },
    algorithm: { type: 'string' },
  });
  const { input, hash } = values;
  const algorithm = values.algorithm ?? 'sha256';
  const supportedAlgorithm = ['sha256', 'md5', 'sha512'];

  if (!input || !hash) {
    throw new Error('Invalid input');
  }

  if (!supportedAlgorithm.includes(algorithm)) {
    throw new Error('Operation failed');
  }

  const fileReadStream = createReadStream(resolvePath(input));
  const hashReadStream = createReadStream(resolvePath(hash));

  const expectedHash = (await text(hashReadStream)).trim().toLowerCase();

  const hashObj = createHash(algorithm);
  await pipeline(fileReadStream, hashObj);
  const actualHash = hashObj.digest('hex').trim().toLowerCase();

  expectedHash === actualHash ? console.log('OK') : console.log('MISMATCH');
};
