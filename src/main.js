import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { extractCommand } from './utils/argResolver.js';
import { currentDir, up, cd, ls } from './navigations.js';
import { csvToJson } from './commands/csv-to-json.js';
import { jsonToCsv } from './commands/json-to-csv.js';
import { count } from './commands/count.js';
import { hash } from './commands/hash.js';
import { hashCompare } from './commands/hash-compare.js';
import { encrypt } from './commands/encrypt.js';
import { decrypt } from './commands/decrypt.js';

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
    const { command, args } = extractCommand(line);
    switch (command) {
      case 'up':
        up();
        break;
      case 'cd':
        await cd(args);
        break;
      case 'ls':
        await ls();
        break;
      case 'csv-to-json':
        await csvToJson(args);
        break;
      case 'json-to-csv':
        await jsonToCsv(args);
        break;
      case 'count':
        await count(args);
        break;
      case 'hash':
        await hash(args);
        break;
      case 'hash-compare':
        await hashCompare(args);
        break;
      case 'encrypt':
        await encrypt(args);
        break;
      case 'decrypt':
        await decrypt(args);
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
