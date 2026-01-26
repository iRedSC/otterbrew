import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "./schema/users.js";
import { seeds } from "./schema/seeds.js";
import { ingredients } from "./schema/ingredients.js";
import { potionModifiers } from "./schema/potion-modifiers.js";
import { potions } from "./schema/potions.js";
import { potionRecipes } from "./schema/potion-recipes.js";
import { potionItems } from "./schema/potion-items.js";

let _postgresClient: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function initializeDatabase(): void {
  if (_postgresClient && _db) {
    return; // Already initialized
  }

  console.log("[DB] Initializing database connection...");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[DB] DATABASE_URL is not set!");
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("[DB] Creating postgres client...");
  // Let the connection string handle SSL configuration
  // Many managed databases (like Railway, Supabase, etc.) configure SSL via URL params
  _postgresClient = postgres(databaseUrl, {
    connect_timeout: 10, // 10 second connection timeout
    idle_timeout: 20, // 20 second idle timeout
    max_lifetime: 60 * 30, // 30 minutes max lifetime
    onnotice: () => {}, // Suppress notices
    // Don't set ssl option - let connection string handle it
    // If SSL is required, it should be in the URL as ?sslmode=require
  });

  console.log("[DB] Creating Drizzle instance...");
  _db = drizzle(_postgresClient, {
    schema: {
      users,
      seeds,
      ingredients,
      potionModifiers,
      potions,
      potionRecipes,
      potionItems,
    },
  });
  console.log("[DB] Database connection initialized successfully");
}

// Lazy initialization - only connect when db is actually accessed
export const postgresClient: postgres.Sql = new Proxy({} as postgres.Sql, {
  get(_target, prop) {
    initializeDatabase();
    return (_postgresClient as postgres.Sql)[prop as keyof postgres.Sql];
  },
});

export const db: ReturnType<typeof drizzle> = new Proxy(
  {} as ReturnType<typeof drizzle>,
  {
    get(_target, prop) {
      initializeDatabase();
      return (_db as ReturnType<typeof drizzle>)[prop as keyof ReturnType<typeof drizzle>];
    },
  },
);