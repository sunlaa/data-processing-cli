import { resolveArgs } from '../utils/argResolver.js';
import { createReadStream, createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

class CsvToJsonTransform extends Transform {
  constructor() {
    super();
    this.header = null;
    this.leftover = '';
    this.isFirstObject = true;
  }

  processLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    const values = trimmed.split(',');

    if (!this.header) {
      this.header = values;
      this.push('[\n');
      return;
    }

    const obj = Object.fromEntries(
      this.header.map((key, i) => [key, values[i] ?? '']),
    );

    if (!this.isFirstObject) this.push(',\n');
    this.push(`  ${JSON.stringify(obj)}`);
    this.isFirstObject = false;
  }

  _transform(chunk, enc, cb) {
    try {
      const lines = (this.leftover + chunk.toString()).split(/\r?\n/);
      // the last element has no line break after it, so it may be incomplete
      this.leftover = lines.pop();
      lines.forEach((line) => this.processLine(line));
      cb();
    } catch (error) {
      cb(error);
    }
  }

  _flush(cb) {
    try {
      this.processLine(this.leftover);
      this.push(this.header ? '\n]\n' : '[]\n');
      cb();
    } catch (error) {
      cb(error);
    }
  }
}

export const csvToJson = async (args) => {
  const { values } = resolveArgs(args, {
    input: { type: 'string' },
    output: { type: 'string' },
  });
  const { input, output } = values;

  if (!input || !output) {
    throw new Error('Invalid input');
  }

  const csv = createReadStream(pathResolver(input), { encoding: 'utf8' });
  const json = createWriteStream(pathResolver(output));

  await pipeline(csv, new CsvToJsonTransform(), json);
};
