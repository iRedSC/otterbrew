import sql from "./src/database"


async function main() {
  // 1️⃣ Create a users table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )
  `;

  console.log("✅ Table ensured.");

  // 2️⃣ Insert some sample users
  await sql`
    INSERT INTO users (name, email)
    VALUES
      ('Alice', 'alice@example.com'),
      ('Bob', 'bob@example.com'),
      ('Charlie', 'charlie@example.com')
    ON CONFLICT (email) DO NOTHING
  `;

  console.log("✅ Sample users inserted.");

  // 3️⃣ Query all users
  const users = await sql`SELECT * FROM users ORDER BY id;`;

  // 4️⃣ Log them
  console.log("📦 Users in database:");
  console.table(users);

  // 5️⃣ End connection (optional, good practice in scripts)
  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error running DB test:", err);
    process.exit(1);
  });