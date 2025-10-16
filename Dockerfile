FROM oven/bun:1.1.13
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
CMD ["bun", "run", "start"]