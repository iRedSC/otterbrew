# otterbrew

To install dependencies:

```bash
bun install
```

## Database Setup

This project requires PostgreSQL with the **pgvector** extension installed.

### Installing pgvector

**For managed databases:**
- **Supabase**: pgvector is available by default. Enable it in the SQL editor: `CREATE EXTENSION IF NOT EXISTS vector;`
- **Railway**: Add pgvector via the Railway dashboard or CLI
- **Neon**: pgvector is available. Enable it via: `CREATE EXTENSION IF NOT EXISTS vector;`
- **Other providers**: Check your provider's documentation for enabling pgvector

**For self-hosted PostgreSQL:**

Ubuntu/Debian:
```bash
sudo apt-get install postgresql-XX-pgvector
# Replace XX with your PostgreSQL version (e.g., postgresql-14-pgvector)
```

Or compile from source:
```bash
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

After installation, enable the extension in your database:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Running Migrations

After pgvector is installed, run migrations:

```bash
bun run db:migrate
```

Or migrations will run automatically when starting the bot:

```bash
bun run index.ts
```

## Running the Bot

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
