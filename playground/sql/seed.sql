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
