import { resolveArgs } from '../utils/argResolver.js';
import { createReadStream } from 'node:fs';
import { resolvePath } from '../utils/pathResolver.js';

export const count = async (args) => {
  const { values } = resolveArgs(args, {
    input: { type: 'string' },
  });
  const { input } = values;

  if (!input) {
    throw new Error('Invalid input');
  }

  let lines = 0;
  let words = 0;
  let characters = 0;

  let isPrevWhitespace = true;

  const data = createReadStream(resolvePath(input), { encoding: 'utf-8' });

  for await (const chunk of data) {
    const charArr = chunk.split('');

    charArr.forEach((char) => {
      const isCharSpace = /\s/.test(char);
      if (isPrevWhitespace && !isCharSpace) {
        words++;
      }

      isCharSpace ? (isPrevWhitespace = true) : (isPrevWhitespace = false);

      if (char === '\n') lines++;
    });

    characters += [...chunk].length;
  }
  console.log(`
Lines: ${lines}
Words: ${words}
Characters: ${characters}`);
};
