-- Shared SQLite / PostgreSQL SQL. Use playground/sql's seeded database.
SELECT id, name FROM customers ORDER BY id;

SELECT c.name, o.total
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
ORDER BY o.id;

SELECT c.name FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL ORDER BY c.id;

SELECT customer_id, SUM(total) AS paid_total
FROM orders WHERE status = 'paid'
GROUP BY customer_id HAVING SUM(total) >= 50
ORDER BY customer_id;

SELECT id, COALESCE(email, 'not supplied') AS contact
FROM customers WHERE email IS NULL ORDER BY id;

WITH ranked AS (
  SELECT customer_id, id,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC, id) AS position
  FROM orders
)
SELECT customer_id, id FROM ranked WHERE position = 1 ORDER BY customer_id;

BEGIN;
UPDATE orders SET total = 999 WHERE id = 1;
ROLLBACK;
SELECT total FROM orders WHERE id = 1;
