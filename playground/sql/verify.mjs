import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const json = async file => JSON.parse(await readFile(join(root, file), 'utf8'));
const pack = await json('packs/sql.json');
const companions = await json('packs/sql-companions.json');
const cases = await json('playground/sql/cases.json');
const seed = await readFile(join(here, 'seed.sql'), 'utf8');
const require = createRequire(import.meta.url);
// Build the extension first: reuse its offset-safe SQL lexer to split statements.
const { maskSql } = require('../../out/languages/sql');
const statements = code => {
  const masked = maskSql(code), parts = [];
  let start = 0;
  for (let i = 0; i <= code.length; i++) {
    if (i === code.length || masked[i] === ';') {
      if (code.slice(start, i).trim()) parts.push(code.slice(start, i).trim());
      start = i + 1;
    }
  }
  return parts;
};
async function command(binary, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd: here, stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${binary} exited ${code}`)));
  });
}
function sqliteDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(seed);
  return {
    async query(code, params = []) {
      let rows = [];
      for (const sql of statements(code)) {
        const statement = db.prepare(sql);
        if (statement.columns().length) {
          statement.setReturnArrays(true);
          rows = statement.all(...params);
        } else statement.run(...params);
      }
      return rows;
    },
    async close() { db.close(); },
  };
}
async function assertions(db, dialect, card) {
  const params = card.topics[0] === 'parameters' ? [1] : [];
  const rows = await db.query(card.code, params);
  if (cases[card.id].expected !== null) assert.deepEqual(rows, cases[card.id].expected, card.id);
  switch (card.topics[0]) {
    case 'insert': assert.deepEqual(await db.query('SELECT name FROM customers WHERE id = 5'), [['Eve']]); break;
    case 'update': assert.deepEqual(await db.query('SELECT status FROM orders WHERE id = 2'), [['paid']]); break;
    case 'delete': assert.deepEqual(await db.query('SELECT id FROM orders ORDER BY id'), [[1],[2],[3]]); break;
    case 'constraints':
      await db.query("INSERT INTO inventory VALUES (1, 'seed', 1)");
      await assert.rejects(db.query("INSERT INTO inventory VALUES (2, 'seed', 1)"));
      await assert.rejects(db.query("INSERT INTO inventory VALUES (3, NULL, 1)"));
      await assert.rejects(db.query("INSERT INTO inventory VALUES (4, 'bad', -1)"));
      assert.deepEqual(await db.query('SELECT quantity FROM inventory'), [[1]]);
      break;
    case 'indexes': {
      const plan = await db.query(dialect === 'sqlite'
        ? 'EXPLAIN QUERY PLAN SELECT id FROM orders WHERE customer_id = 1'
        : 'EXPLAIN SELECT id FROM orders WHERE customer_id = 1');
      assert.ok(plan.length, 'engine-specific EXPLAIN works');
      break;
    }
    case 'sqlite-setup': assert.deepEqual(await db.query('PRAGMA foreign_keys'), [[1]]); break;
  }
}
async function behavior(db, dialect) {
  assert.deepEqual(await db.query('SELECT id FROM customers WHERE email = NULL'), []);
  assert.deepEqual(await db.query('SELECT NULL = NULL, NOT (NULL = NULL)'), [[null,null]]);
  assert.deepEqual(await db.query('SELECT id FROM customers ORDER BY email NULLS LAST, id'), [[1],[3],[2],[4]]);
  assert.deepEqual(await db.query('SELECT COUNT(*), COUNT(email) FROM customers'), [[4,2]]);
  await assert.rejects(db.query("INSERT INTO orders VALUES (99, 999, 1, 'paid')"));
  await db.query('BEGIN; SAVEPOINT before_error;');
  await assert.rejects(db.query("INSERT INTO customers VALUES (1, 'duplicate', NULL)"));
  if (dialect === 'postgresql') await assert.rejects(db.query('SELECT 1'), /aborted/);
  await db.query('ROLLBACK TO before_error; RELEASE before_error;');
  await db.query('UPDATE orders SET total = 999 WHERE id = 1; ROLLBACK;');
  assert.deepEqual(await db.query('SELECT total FROM orders WHERE id = 1'), [[100]]);
  const marker = dialect === 'sqlite' ? '?' : '$1';
  assert.deepEqual(await db.query(`SELECT id FROM customers WHERE name = ${marker}`, ["Ada' OR 1=1 --"]), []);
}
async function sqlite() {
  let count = 0;
  for (const card of pack.cards.filter(c => !c.dialects || c.dialects.includes('sqlite'))) {
    const db = sqliteDatabase();
    try { await assertions(db, 'sqlite', card); count++; } finally { await db.close(); }
  }
  const db = sqliteDatabase();
  try {
    assert.deepEqual(await db.query('SELECT sqlite_version()'), [['3.53.1']]);
    await behavior(db, 'sqlite');
  } finally { await db.close(); }
  console.log(`SQLite 3.53.1: ${count} catalog cards plus NULL, constraint, binding and failed-transaction checks passed.`);
}
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function postgres(serve, queryFile) {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const folder = await mkdtemp(join(tmpdir(), 'syntaxiser-pg-'));
  const port = await freePort();
  const logs = [];
  const server = new EmbeddedPostgres({ databaseDir: join(folder, 'data'), port, user: 'syntaxiser',
    password: 'unused-local-fixture', authMethod: 'trust', persistent: false,
    postgresFlags: ['-h', '127.0.0.1', '-k', folder],
    onLog: line => logs.push(line), onError: line => logs.push(String(line)) });
  const client = server.getPgClient('postgres', '127.0.0.1');
  let started = false, connected = false, sequence = 0;
  const db = {
    async query(code, values = []) {
      let rows = [];
      for (const text of statements(code)) {
        const result = await client.query({text, values, rowMode:'array'});
        // pg returns int8 as strings. This fixture uses only safe, small integers.
        rows = result.rows.map(row => row.map((value, i) => {
          if (value === null || result.fields[i].dataTypeID !== 20) return value;
          const number = Number(value);
          assert.ok(Number.isSafeInteger(number), 'fixture int8 is safely representable');
          return number;
        }));
      }
      return rows;
    },
    async reset() {
      // Names are generated locally, never derived from user input.
      await client.query(`CREATE SCHEMA fixture_${sequence}; SET search_path TO fixture_${sequence++}`);
      await client.query(seed);
    },
  };
  try {
    await server.initialise();
    await server.start(); started = true;
    await client.connect(); connected = true;
    assert.deepEqual(await db.query('SHOW server_version_num'), [['180004']]);
    if (queryFile) {
      await db.reset();
      for (const sql of statements(await readFile(queryFile, 'utf8'))) console.table(await db.query(sql));
      return;
    }
    if (serve) {
      await db.reset();
      console.log(`Seeded PostgreSQL 18.4 on localhost:${port}; schema fixture_0.`);
      console.log(`PGHOST=127.0.0.1 PGPORT=${port} PGUSER=syntaxiser PGDATABASE=postgres PGOPTIONS='-c search_path=fixture_0' psql`);
      console.log('No password required. Press Ctrl+C to stop and delete this disposable database.');
      await new Promise(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); });
      return;
    }
    let count = 0;
    for (const card of pack.cards.filter(c => !c.dialects || c.dialects.includes('postgresql'))) {
      await db.reset(); await assertions(db, 'postgresql', card); count++;
    }
    await db.reset(); await behavior(db, 'postgresql');
    await db.reset();
    await nodeClients(client);
    await db.reset();
    await goClients(port, sequence - 1);
    console.log(`PostgreSQL 18.4: ${count} catalog cards plus behavior, strict TypeScript pg and Go database/sql checks passed.`);
  } catch (error) {
    // Startup diagnostics contain only this fixture's paths and database messages.
    if (!started) console.error(logs.join(''));
    throw error;
  } finally {
    if (connected) await client.end();
    if (started) await server.stop();
    await rm(folder, {recursive:true,force:true});
  }
}
async function nodeClients(client) {
  const folder = await mkdtemp(join(here, '.catalog-node-'));
  try {
    const cards = companions.typescript.cards;
    await writeFile(join(folder,'find.ts'), cards[0].code);
    await writeFile(join(folder,'transaction.ts'), cards[1].code);
    await command(process.execPath, [join(here,'node_modules/typescript/bin/tsc'), '--strict', '--noUncheckedIndexedAccess',
      '--target','ES2022','--module','NodeNext','--types','node',join(folder,'find.ts'),join(folder,'transaction.ts')]);
    const { findCustomer } = await import(pathToFileURL(join(folder,'find.js')));
    const { addCustomer } = await import(pathToFileURL(join(folder,'transaction.js')));
    assert.equal(await findCustomer(client, 1), 'Ada');
    assert.equal(await findCustomer(client, 999), undefined);
    await addCustomer(client, 5, "Eve' OR 1=1 --");
    assert.equal(await findCustomer(client, 5), "Eve' OR 1=1 --");
    await assert.rejects(addCustomer(client, 1, 'duplicate'));
    assert.equal(await findCustomer(client, 1), 'Ada');
  } finally { await rm(folder,{recursive:true,force:true}); }
}
async function goClients(port, schema) {
  const folder = join(here,'go');
  try {
    await writeFile(join(folder,'catalog.go'), companions.go.cards[0].code);
    await writeFile(join(folder,'contacts.go'), companions.go.cards[1].code);
    await command('go',['test','-count=1','./...'],{cwd:folder,env:{...process.env,
      PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:'syntaxiser',PGDATABASE:'postgres',PGSSLMODE:'disable',
      PGOPTIONS:`-c search_path=fixture_${schema}`,SYNTAXISER_SQL_FIXTURE:'1'}});
  } finally {
    await rm(join(folder,'catalog.go'),{force:true});
    await rm(join(folder,'contacts.go'),{force:true});
  }
}
async function pythonClients() {
  const folder = await mkdtemp(join(here, '.catalog-python-'));
  try {
    const source = companions.python.cards.map(c=>c.code).join('\n\n');
    const file = join(folder, 'verify.py');
    await writeFile(file, `${source}\n\nfrom pathlib import Path\nconnection = sqlite3.connect(":memory:")\ntry:\n    connection.execute("PRAGMA foreign_keys = ON")\n    connection.executescript(Path(${JSON.stringify(join(here,'seed.sql'))}).read_text())\n    assert find_customer(connection, 1) == "Ada"\n    assert find_customer(connection, 999) is None\n    assert find_by_name(connection, "Ada") == [(1, "Ada")]\n    assert find_by_name(connection, "Ada' OR 1=1 --") == []\n    with connection:\n        connection.execute("INSERT INTO customers VALUES (5, 'Eve', NULL)")\n    try:\n        with connection:\n            connection.execute("UPDATE customers SET name = 'changed' WHERE id = 1")\n            connection.execute("INSERT INTO customers VALUES (1, 'duplicate', NULL)")\n    except sqlite3.IntegrityError:\n        pass\n    assert find_customer(connection, 1) == "Ada"\nfinally:\n    connection.close()\nprint("Python 3.13 sqlite3: catalog bindings and transaction recovery passed.")\n`);
    await command(process.env.UV_BIN || 'uv', ['run','--no-project','--python','3.13',file]);
  } finally { await rm(folder,{recursive:true,force:true}); }
}
const mode = process.argv[2];
if (mode === '--query') {
  const db = sqliteDatabase();
  try {
    for (const sql of statements(await readFile(process.argv[3], 'utf8'))) console.table(await db.query(sql));
  } finally { await db.close(); }
}
if (!mode || mode === '--sqlite') { await sqlite(); await pythonClients(); }
if (!mode || ['--postgresql','--serve','--postgresql-query'].includes(mode)) await postgres(mode === '--serve', mode === '--postgresql-query' ? process.argv[3] : undefined);
if (mode && !['--sqlite','--postgresql','--serve','--query','--postgresql-query'].includes(mode)) throw new Error(`Unknown mode ${mode}`);
