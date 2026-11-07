import { parseArgs } from 'node:util';

export const extractCommand = (input) => {
  const [command, ...args] = input.trim().split(/\s+/);
  return { command, args };
};

export const resolveArgs = (args, options) => {
  return parseArgs({ args, options, allowPositionals: true });
};
