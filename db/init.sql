-- DDL: skapa tabellens struktur
CREATE TABLE products (
  id        SERIAL PRIMARY KEY,   -- räknas upp automatiskt: 1, 2, 3...
  name      TEXT    NOT NULL,
  price     INTEGER NOT NULL,
  category  TEXT    NOT NULL
);

-- Seed: lägg in startdata (menyn)
INSERT INTO products (name, price, category) VALUES
  ('Cheeseburger',        49, 'burgers'),
  ('Double Bacon Burger', 79, 'burgers'),
  ('Veggie Burger',       65, 'burgers'),
  ('Fries',               29, 'sides'),
  ('Onion Rings',         35, 'sides'),
  ('Cola',                25, 'drinks'),
  ('Milkshake',           39, 'drinks');

-- ---------------------------------------------------------------------------
-- DDL: ordrar (sparas persistent i databasen, inte i minnet)
-- ---------------------------------------------------------------------------

-- Sekvens som ger varje order ett id i formatet "ord-1", "ord-2", ...
CREATE SEQUENCE order_id_seq;

CREATE TABLE orders (
  id          TEXT        PRIMARY KEY DEFAULT ('ord-' || nextval('order_id_seq')),
  status      TEXT        NOT NULL DEFAULT 'PENDING',  -- PENDING -> IN_PROGRESS -> READY
  total       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id         SERIAL  PRIMARY KEY,
  order_id   TEXT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0)
);