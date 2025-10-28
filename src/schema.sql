-- Enable extensions for vector support
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================
-- Table: users
-- ========================
CREATE TABLE users (
  discord_id BIGINT PRIMARY KEY,
  gold INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: items
-- ========================
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity INTEGER NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ========================
-- Table: inventory_items
-- ========================
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 1
);

-- ========================
-- Table: potions
-- ========================
CREATE TABLE potions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ========================
-- Table: inventory_potions
-- ========================
CREATE TABLE inventory_potions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  potion_id INTEGER NOT NULL REFERENCES potions(id) ON DELETE CASCADE,
  quality INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 100),
  amount INTEGER NOT NULL DEFAULT 1
);

-- ========================
-- Table: potion_recipes
-- ========================
CREATE TABLE potion_recipes (
  id SERIAL PRIMARY KEY,
  potion_id INTEGER NOT NULL REFERENCES potions(id) ON DELETE CASCADE,
  quality INTEGER NOT NULL DEFAULT 100 CHECK (quality BETWEEN 1 AND 100),
  recipe VECTOR(8) NOT NULL
);