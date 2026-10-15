import { test, expect, jest } from '@jest/globals';

test.each([[2, 3, 5], [-1, 1, 0]])('%i + %i = %i', (a, b, expected) => {
  expect(a + b).toBe(expected);
});

test('loads a user name through a typed mock', async () => {
  const load = jest.fn<(id: string) => Promise<string>>().mockResolvedValue('Ada');
  await expect(load('u1')).resolves.toBe('Ada');
  expect(load).toHaveBeenCalledWith('u1');
});
