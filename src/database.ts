import postgres from "postgres";

const sql = postgres(process.env.DB_URL!, {
  ssl: false,
});

export default sql;