import { currentDir } from '../navigations.js';
import path from 'node:path';

export const resolvePath = (userPath) => path.resolve(currentDir, userPath);
