CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  total INTEGER NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'cancelled'))
);
INSERT INTO customers (id, name, email) VALUES
  (1, 'Ada', 'ada@example.test'),
  (2, 'Ben', NULL),
  (3, 'Cy', 'cy@example.test'),
  (4, 'Dee', NULL);
INSERT INTO orders (id, customer_id, total, status) VALUES
  (1, 1, 100, 'paid'),
  (2, 1, 30, 'pending'),
  (3, 2, 50, 'paid'),
  (4, 3, 20, 'cancelled');

CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT NOT NULL, manager_id INTEGER REFERENCES employees(id));
INSERT INTO employees VALUES (1, 'Ada', NULL), (2, 'Ben', 1), (3, 'Cy', 1), (4, 'Dee', 2);
CREATE TABLE documents (id INTEGER PRIMARY KEY, payload TEXT NOT NULL);
INSERT INTO documents VALUES (1, '{"name":"Ada"}'), (2, '{"name":null}'), (3, '{}'), (4, 'broken');
CREATE TABLE events (id INTEGER PRIMARY KEY, occurred_at TEXT NOT NULL);
INSERT INTO events VALUES (1, '2026-10-17T00:00:00Z'), (2, '2026-10-17T08:00:00+08:00'), (3, '2026-10-18T00:00:00Z'), (4, 'invalid');
