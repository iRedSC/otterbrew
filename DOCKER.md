# Docker Deployment Guide

This project is configured to run on Dokploy with Docker.

## Building the Image

```bash
docker build -t otterbrew .
```

## Running Migrations

Migrations can be run inside the container:

```bash
# Generate new migrations (if schema changed)
docker run --rm --env-file .env otterbrew bun run db:generate

# Push schema changes directly (development - not recommended for production)
docker run --rm --env-file .env otterbrew bun run db:push
```

**Note:** For production, you'll need to execute the SQL migration files in the `drizzle/` directory directly against your PostgreSQL database. You can do this by:

1. Using a database client (pgAdmin, DBeaver, etc.) to run the SQL files
2. Using `psql` inside the container: `docker exec -it <container> psql $DATABASE_URL -f drizzle/0000_aspiring_wrecker.sql`
3. Using Dokploy's database management features if available

The `drizzle-kit migrate` command doesn't exist - drizzle-kit generates migrations but doesn't execute them automatically.

## Required Environment Variables

The following environment variables must be set in Dokploy:

- `BOT_TOKEN` - Discord bot token
- `CLIENT_ID` - Discord application client ID  
- `DATABASE_URL` - PostgreSQL connection string (with SSL)
- `GUILD_ID` - Discord guild ID (for command registration)

## Running the Bot

The default CMD runs the bot:

```bash
docker run --env-file .env otterbrew
```

## Registering Commands

To register Discord slash commands:

```bash
docker run --rm --env-file .env otterbrew bun run setup
```

## Notes

- All migrations must be run from within the container
- The `drizzle` directory is included in the image for migration execution
- Environment variables are validated on startup - missing vars will cause exit
- Database connections use SSL (required for most cloud PostgreSQL providers)
