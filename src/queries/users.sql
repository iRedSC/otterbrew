-- name: CreateUser :one
INSERT INTO users (discord_id, gold) VALUES ($1, 0) RETURNING *;

-- name: GetByDiscordID :one
SELECT * FROM users WHERE discord_id = $1 LIMIT 1;

-- name: SetGold :one
UPDATE users SET gold = $1 WHERE discord_id = $2 RETURNING *;