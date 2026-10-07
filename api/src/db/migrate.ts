import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { parseConfig } from "../config.js";
import { createDb } from "./client.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../.env") });

const config = parseConfig(process.env);
const { db, pool } = createDb(config.databaseUrl);

// PostGIS must exist before the places table is created.
await pool.query("CREATE EXTENSION IF NOT EXISTS postgis");
await migrate(db, { migrationsFolder: path.resolve(here, "../../drizzle") });
await pool.end();
console.log("Migrations applied.");
