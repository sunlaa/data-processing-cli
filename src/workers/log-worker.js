import { parentPort } from 'worker_threads';
import fs from 'fs/promises';
import readline from 'node:readline';
import { createReadStream } from 'node:fs';

const accObjProp = () => {};

parentPort.on('message', async ({ start, end, filePath }) => {
  const fileStream = createReadStream(filePath, {
    start,
    end,
    encoding: 'utf-8',
  });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let total = 0;
  let responseTimeSum = 0;
  const levelsMap = {};
  const statusMap = {};
  const pathMap = {};

  for await (const line of rl) {
    const [, level, , statusCode, responseTimeMs, , path] = line
      .trim()
      .split(' ');

    total += 1;
    responseTimeSum += +responseTimeMs;

    levelsMap[level] ? (levelsMap[level] += 1) : (levelsMap[level] = 1);

    const statusCodeKey = `${statusCode[0]}xx`;
    statusMap[statusCodeKey]
      ? (statusMap[statusCodeKey] += 1)
      : (statusMap[statusCodeKey] = 1);

    pathMap[path] ? (pathMap[path] += 1) : (pathMap[path] = 1);
  }

  parentPort.postMessage({
    total,
    responseTimeSum,
    levelsMap,
    statusMap,
    pathMap,
  });

  process.exit(0);
});
