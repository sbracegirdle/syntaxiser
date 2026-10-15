import { readFile } from 'node:fs/promises';
export const unfinishedNames = tasks => tasks.filter(task => !task.done).map(task => task.name);
export async function readNotes(path) {
  return (await readFile(path, 'utf8')).trim().split(/\r?\n/);
}
export function makeCounter() {
  let count = 0;
  return () => ++count;
}
