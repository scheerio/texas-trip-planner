import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

export function createDb(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
  return { pool, db: drizzle(pool) };
}

export type Db = ReturnType<typeof createDb>;
