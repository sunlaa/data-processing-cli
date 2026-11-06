import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { resolveArgs } from './utils/argResolver.js';
import { currentDir, up, cd, ls } from './navigations.js';

const rl = readline.createInterface({
  input,
  output,
  prompt: '> ',
});

const exitUtil = () => {
  console.log('Thank you for using Data Processing CLI!');
  process.exit(0);
};

rl.write(
  `Welcome to Data Processing CLI!\nYou are currently in ${currentDir}\n`,
);
rl.prompt();

rl.on('line', async (line) => {
  try {
    const { command, args } = resolveArgs(line);
    switch (command) {
      case 'up':
        up();
        break;
      case 'cd':
        await cd(args[0]);
        break;
      case 'ls':
        await ls();
        break;
      case '.exit':
        exitUtil();
        break;
      default:
        console.log(`Unknown command: ${line.trim()}`);
        break;
    }
    console.log(currentDir);
    rl.prompt();
  } catch (error) {
    console.log(error.message);
    rl.prompt();
  }
});

rl.on('SIGINT', exitUtil);
rl.on('exit', exitUtil);
