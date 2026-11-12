import { resolvePath } from '../utils/pathResolver.js';
import { resolveArgs } from '../utils/argResolver.js';
import { open, writeFile } from 'fs/promises';
import path from 'path';
import os from 'node:os';
import { Worker } from 'node:worker_threads';

const getChunkReadPositions = async (filePath, chunkNumber) => {
  const chunks = [];

  const fileHandle = await open(resolvePath(filePath));

  const bytes = (await fileHandle.stat()).size;
  const roughChunkSize = Math.floor(bytes / chunkNumber);

  let start = 0;

  for (let i = 0; i < chunkNumber; i++) {
    if (start >= bytes) break;

    let exactSizeToRead = bytes - start;

    const currentGuess = roughChunkSize * (i + 1);

    if (i < chunkNumber - 1) {
      const position = Math.max(currentGuess - 1, start);

      const tempBuffer = Buffer.alloc(1024);
      await fileHandle.read(tempBuffer, 0, 1024, position);

      for (let [index, char] of tempBuffer.entries()) {
        if (char === 10) {
          exactSizeToRead = position + index + 1 - start;
          break;
        }
      }
    }

    const end = start + exactSizeToRead - 1;

    chunks.push({ start, end });
    start += exactSizeToRead;
  }

  await fileHandle.close();

  return chunks;
};

const accObjProp = (useObj, accObj) => {
  Object.entries(useObj).forEach(([value, count]) => {
    accObj[value] ? (accObj[value] += count) : (accObj[value] = count);
  });
};

export const logStats = async (args) => {
  const { values } = resolveArgs(args, {
    input: { type: 'string' },
    output: { type: 'string' },
  });
  const { input, output } = values;

  if (!input || !output) {
    throw new Error('Invalid input');
  }

  const workersNumber = os.availableParallelism();

  const createWorker = (dataToSend) => {
    return new Promise((res, rej) => {
      const worker = new Worker(
        path.join(import.meta.dirname, '../workers/log-worker.js'),
      );

      worker.on('message', (data) => res(data));

      worker.on('error', (err) => rej(err));

      worker.on('exit', (code) => {
        if (code !== 0) {
          rej(new Error(`Worker failed, code - ${code}`));
        }
      });

      worker.postMessage(dataToSend);
    });
  };

  const filePath = resolvePath(input);

  const chunkReadPositions = await getChunkReadPositions(
    filePath,
    workersNumber,
  );

  const workers = chunkReadPositions.map((data) =>
    createWorker({ ...data, filePath }),
  );

  const data = await Promise.all(workers);

  const result = {
    total: 0,
  };

  let responseTimeSum = 0;
  const levels = {};
  const status = {};
  const paths = {};

  for (const piece of data) {
    result.total += piece.total;
    responseTimeSum += piece.responseTimeSum;
    accObjProp(piece.levelsMap, levels);
    accObjProp(piece.statusMap, status);
    accObjProp(piece.pathMap, paths);
  }

  const avgResponseTimeMs = Math.round(responseTimeSum / result.total);

  const top3 = Object.entries(paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topPaths = [];
  for (const [path, count] of top3) {
    topPaths.push({ path, count });
  }

  result.levels = levels;
  result.status = status;
  result.topPaths = topPaths;
  result.avgResponseTimeMs = avgResponseTimeMs;

  const JSONresult = JSON.stringify(result, null, 2);
  await writeFile(resolvePath(output), JSONresult);
};
