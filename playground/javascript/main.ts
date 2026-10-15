export type Task = { id: string; name: string; done: boolean };
export const unfinishedNames = (tasks: Task[]): string[] => tasks.filter(task => !task.done).map(task => task.name);
export async function readStatus(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}
