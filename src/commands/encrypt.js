import { resolvePath } from '../utils/pathResolver.js';
import { resolveArgs } from '../utils/argResolver.js';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createCipheriv, randomBytes, argon2 } from 'node:crypto';
import { promisify } from 'node:util';
import { Transform } from 'node:stream';

export const deriveKey = async (password, salt) => {
  const argon2Async = promisify(argon2);
  const derivedKey = async () => {
    try {
      const key = await argon2Async('argon2d', {
        message: password,
        nonce: salt,
        parallelism: 4,
        tagLength: 32,
        memory: 65536,
        passes: 3,
      });
      return key;
    } catch (err) {
      throw err;
    }
  };
  return await derivedKey();
};

class EncryptTransform extends Transform {
  constructor(key, salt, iv) {
    super();
    this.salt = salt;
    this.iv = iv;
    this.cipher = createCipheriv('aes-256-gcm', key, iv);
    this.isHeaderAdded = false;
  }

  _transform(chunk, enc, cb) {
    if (!this.isHeaderAdded) {
      this.push(Buffer.concat([this.salt, this.iv]));
      this.isHeaderAdded = true;
    }

    const encrypted = this.cipher.update(chunk);
    if (encrypted) {
      this.push(encrypted);
    }
    cb();
  }

  _flush(cb) {
    this.cipher.final();
    const tag = this.cipher.getAuthTag();
    this.push(tag);
    cb();
  }
}

export const encrypt = async (args) => {
  const { values } = resolveArgs(args, {
    input: { type: 'string' },
    output: { type: 'string' },
    password: { type: 'string' },
  });
  const { input, output, password } = values;

  if (!input || !output || !password) {
    throw new Error('Invalid input');
  }

  const salt = randomBytes(16);
  const iv = randomBytes(12);

  const key = await deriveKey(password, salt);

  const inputReadStream = createReadStream(resolvePath(input));
  const outputWriteStream = createWriteStream(resolvePath(output));
  const encryptTransform = new EncryptTransform(key, salt, iv);
  await pipeline(inputReadStream, encryptTransform, outputWriteStream);
};
