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