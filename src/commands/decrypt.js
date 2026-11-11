import { resolvePath } from '../utils/pathResolver.js';
import { resolveArgs } from '../utils/argResolver.js';
import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { deriveKey } from './encrypt.js';
import { pipeline } from 'node:stream/promises';
import { createDecipheriv } from 'node:crypto';

export const decrypt = async (args) => {
  const { values } = resolveArgs(args, {
    input: { type: 'string' },
    output: { type: 'string' },
    password: { type: 'string' },
  });
  const { input, output, password } = values;

  if (!input || !output || !password) {
    throw new Error('Invalid input');
  }

  const encryptedFile = await fs.open(resolvePath(input));
  const fileSize = (await encryptedFile.stat()).size;
  const authTagShift = fileSize - 16;

  const authTag = Buffer.alloc(16);
  const salt = Buffer.alloc(16);
  const iv = Buffer.alloc(12);

  await encryptedFile.read(authTag, 0, 16, authTagShift);
  await encryptedFile.read(salt, 0, 16, 0);
  await encryptedFile.read(iv, 0, 12, 16);

  await encryptedFile.close();

  const key = await deriveKey(password, salt);
  const inputReadStream = createReadStream(resolvePath(input), {
    start: 28,
    end: fileSize - 17,
  });

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const outputWriteStream = createWriteStream(resolvePath(output));

  await pipeline(inputReadStream, decipher, outputWriteStream);
};
