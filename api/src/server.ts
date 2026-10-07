import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import Fastify from "fastify";
import { parseConfig } from "./config.js";
import { createDb } from "./db/client.js";
import { registerHealthRoute } from "./routes/health.js";

// The .env file lives at the repo root, one level above api/.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });

const config = parseConfig(process.env);
const db = createDb(config.databaseUrl);

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
registerHealthRoute(app, { config, db });

const shutdown = async () => {
  await app.close();
  await db.pool.end();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port: config.port, host: "0.0.0.0" });
