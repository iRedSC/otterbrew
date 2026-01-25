FROM oven/bun:1.1.13

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code and config files
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY index.ts register_commands.ts ./

# Copy drizzle migrations directory (needed for running migrations)
COPY drizzle ./drizzle

# Ensure drizzle-kit is available for migrations
# (already included via dependencies, but explicit for clarity)
RUN bunx drizzle-kit --version || true

# Default command runs the bot
CMD ["bun", "run", "start"]