import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function sqliteConcurrency(pack) {
  const folder = await mkdtemp(join(tmpdir(), 'syntaxiser-sql-lock-'));
  const a = new DatabaseSync(join(folder, 'shared.db'));
  const b = new DatabaseSync(join(folder, 'shared.db'));
  try {
    a.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 0; CREATE TABLE orders (id INTEGER PRIMARY KEY, total INTEGER); INSERT INTO orders VALUES (1,100)');
    b.exec('PRAGMA busy_timeout = 0');
    a.exec('BEGIN IMMEDIATE; UPDATE orders SET total = 120 WHERE id = 1');
    assert.equal(b.prepare('SELECT total FROM orders WHERE id = 1').get().total, 100, 'uncommitted writes are hidden');
    const writer = pack.cards.find(c => c.id === 'sql-sqlite-isolation-writer').code;
    assert.throws(() => b.exec(writer), /locked/, 'second writer is rejected without an unbounded wait');
    a.exec('COMMIT');
    b.exec(writer);
    assert.equal(b.prepare('SELECT total FROM orders WHERE id = 1').get().total, 130, 'whole transaction retry uses committed value');
    b.exec('BEGIN; SELECT total FROM orders');
    a.exec('UPDATE orders SET total = 140 WHERE id = 1');
    assert.equal(b.prepare('SELECT total FROM orders WHERE id = 1').get().total, 130, 'WAL reader retains its snapshot');
    assert.throws(() => b.exec('UPDATE orders SET total = 150 WHERE id = 1'), /locked/, 'stale snapshot cannot upgrade to writer');
    b.exec('ROLLBACK');
    b.exec(writer);
    assert.equal(a.prepare('SELECT total FROM orders WHERE id = 1').get().total, 150, 'rollback and retry recover');
    console.log('SQLite two-connection WAL/writer/snapshot rejection and recovery passed.');
  } finally {
    a.close(); b.close();
    await rm(folder, { recursive: true, force: true });
  }
}

export async function postgresConcurrency(a, makeClient, schema, pack) {
  const b = makeClient();
  await b.connect();
  try {
    await b.query(`SET search_path TO fixture_${schema}; SET statement_timeout = '3s'; SET lock_timeout = '500ms'`);
    await a.query("SET statement_timeout = '3s'; SET lock_timeout = '500ms'");
    await a.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    assert.equal((await a.query('SELECT total FROM orders WHERE id = 1')).rows[0].total, 100);
    await b.query('UPDATE orders SET total = 120 WHERE id = 1');
    assert.equal((await a.query('SELECT total FROM orders WHERE id = 1')).rows[0].total, 100, 'repeatable read snapshot is stable');
    await assert.rejects(a.query('UPDATE orders SET total = total + 10 WHERE id = 1'), e => e.code === '40001');
    await assert.rejects(a.query('SELECT 1'), e => e.code === '25P02');
    await a.query('ROLLBACK');
    const increment = pack.cards.find(c => c.id === 'sql-pg-isolation-increment').code;
    await a.query(increment);
    assert.equal((await a.query('SELECT total FROM orders WHERE id = 1')).rows[0].total, 130, 'retry reads new committed value');
    await a.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    assert.equal((await a.query('SELECT total FROM orders WHERE id = 1')).rows[0].total, 130);
    await b.query('UPDATE orders SET total = 140 WHERE id = 1');
    assert.equal((await a.query('SELECT total FROM orders WHERE id = 1')).rows[0].total, 140, 'read committed refreshes per statement');
    await a.query('COMMIT');
    await a.query('BEGIN; UPDATE orders SET total = 150 WHERE id = 1');
    await assert.rejects(b.query('UPDATE orders SET total = total + 10 WHERE id = 1'), e => e.code === '55P03');
    await a.query('ROLLBACK');
    await b.query(increment);
    assert.equal((await b.query('SELECT total FROM orders WHERE id = 1')).rows[0].total, 150, 'lock-timeout recovery preserves atomic increment');
    console.log('PostgreSQL two-connection isolation/40001/lock-timeout recovery passed.');
  } finally {
    await a.query('ROLLBACK');
    await b.end();
  }
}
