import { resolveArgs } from '../utils/argResolver.js';
import { createReadStream, createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// null/undefined -> empty cell, nested objects/arrays -> JSON text,
// values with a comma, quote or line break are wrapped in quotes
const toCsvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

class JsonToCsvTransform extends Transform {
  constructor() {
    super();
    this.buffer = '';
  }

  _transform(chunk, enc, cb) {
    this.buffer += chunk.toString();
    cb();
  }

  _flush(cb) {
    try {
      const data = JSON.parse(this.buffer);

      if (!Array.isArray(data) || !data.every(isPlainObject)) {
        throw new Error('Input must be a JSON array of objects');
      }

      if (data.length > 0) {
        const header = Object.keys(data[0]);
        this.push(`${header.map(toCsvCell).join(',')}\n`);

        for (const obj of data) {
          // read values by header keys, so every row has the same column order
          this.push(`${header.map((key) => toCsvCell(obj[key])).join(',')}\n`);
        }
      }

      cb();
    } catch (error) {
      cb(error);
    }
  }
}

export const jsonToCsv = async (args) => {
  const { values } = resolveArgs(args, {
    input: { type: 'string' },
    output: { type: 'string' },
  });
  const { input, output } = values;

  if (!input || !output) {
    throw new Error('Invalid input');
  }

  const json = createReadStream(resolvePath(input), { encoding: 'utf8' });
  const csv = createWriteStream(resolvePath(output));

  await pipeline(json, new JsonToCsvTransform(), csv);
};
