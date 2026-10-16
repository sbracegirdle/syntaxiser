// These are compiler assertions, not executable tests. Every expected rejection
// must remain an error; TypeScript reports unused @ts-expect-error directives.
import type { Success, ValidName } from './.catalog-depth/ts-conditional-result.js';
import { batch, type EachArray, type WholeArray } from './.catalog-depth/ts-conditional-batch.js';
import { nameEvents } from './.catalog-depth/ts-template-events.js';
import type { EventName } from './.catalog-depth/ts-template-events.js';
import type { Route } from './.catalog-depth/ts-template-route.js';
import type { Getters } from './.catalog-depth/ts-mapped-getters.js';
import type { Public } from './.catalog-depth/ts-mapped-public.js';
import { makeDate } from './.catalog-depth/ts-overload-date.js';
import { labels } from './.catalog-depth/ts-overload-format.js';
import { assertUser } from './.catalog-depth/ts-assert-user.js';
import { assertNever, type Load } from './.catalog-depth/ts-exhaustive-load.js';
import { clamp, percentage } from './.catalog-depth/ts-readonly-tuple.js';
import { pluck } from './.catalog-depth/ts-constrained-pluck.js';
import type { Animal, Dog, Consumer } from './.catalog-depth/ts-variance-consumer.js';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Check<T extends true> = T;
export type Contracts = [
  Check<Equal<ValidName, { name: string }>>,
  Check<Equal<Success<{ ok: false; error: string }>, never>>,
  Check<Equal<Success<never>, never>>,
  Check<Equal<EachArray<string | number>, string[] | number[]>>,
  Check<Equal<WholeArray<string | number>, (string | number)[]>>,
  Check<Equal<WholeArray<string | boolean>, never>>,
  Check<Equal<EventName, 'nameChanged' | 'ageChanged'>>,
  Check<Equal<keyof Getters<{ name: string; 0: number }>, 'getName'>>,
  Check<Equal<keyof Public<{ id: string; _secret: string }>, 'id'>>
];
function rejectedContracts(input: unknown, dogOnly: Consumer<Dog>) {
  const mixed: (string | number)[] = batch<string | number>('x', 1);
  // @ts-expect-error a distributive union cannot accept a mixed array
  const each: EachArray<string | number> = mixed;
  // @ts-expect-error unsuccessful results have no successful data type
  const failure: Success<{ ok: false; error: string }> = {};
  // @ts-expect-error finite event names exclude typos
  const event: EventName = 'namesChanged';
  // @ts-expect-error this emitter exposes only its nameChanged branch
  nameEvents().on('ageChanged', () => {});
  // @ts-expect-error event listeners receive a string
  nameEvents().on('nameChanged', (name: number) => {});
  // @ts-expect-error finite routes exclude unknown suffixes
  const route: Route = '/users/delete';
  // @ts-expect-error required remapped getter cannot be omitted
  const getters: Getters<{ id: string }> = {};
  // @ts-expect-error projected public keys exclude internal fields
  const dto: Public<{ id: string; _token: string }> = { id: '1', _token: 'secret' };
  // @ts-expect-error no two-argument overload
  makeDate(2026, 10);
  const text: string = labels(1);
  const texts: string[] = labels([1]);
  // @ts-expect-error argument must match one callable overload
  labels('1');
  // @ts-expect-error unknown is unsafe before the assertion
  input.name;
  assertUser(input);
  const name: string = input.name;
  const forgotten: Load = { kind: 'failed', message: 'offline' };
  // @ts-expect-error forgetting a union case cannot satisfy never
  assertNever(forgotten);
  // @ts-expect-error tuple mutation is rejected
  percentage[0] = 1;
  // @ts-expect-error tuple mutation via push is also rejected
  percentage.push(1);
  const arbitrary: number[] = [0, 1];
  // @ts-expect-error plain arrays cannot guarantee tuple length
  clamp(1, arbitrary);
  // @ts-expect-error three positions do not fit the two-element contract
  clamp(1, [0, 1, 2]);
  const numbers: number[] = pluck([{ age: 1 }], 'age');
  // @ts-expect-error key must exist on every row
  pluck([{ age: 1 }], 'name');
  // @ts-expect-error a dog-only callback cannot consume every Animal
  const unsafe: Consumer<Animal> = dogOnly;
  void [each, failure, event, route, getters, dto, text, texts, name, numbers, unsafe];
}
void rejectedContracts;
