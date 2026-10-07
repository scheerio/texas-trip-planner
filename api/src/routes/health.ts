import type { FastifyInstance } from "fastify";
import type { Config } from "../config.js";
import type { Db } from "../db/client.js";

/**
 * GET /api/health reports whether each dependency is ready,
 * so setup problems show up as a named failing check.
 */
export function registerHealthRoute(app: FastifyInstance, deps: { config: Config; db: Db }) {
  app.get("/api/health", async (_req, reply) => {
    let database = false;
    let postgis: string | null = null;
    let error: string | null = null;

    try {
      const res = await deps.db.pool.query<{ version: string }>(
        "select postgis_version() as version",
      );
      database = true;
      postgis = res.rows[0]?.version ?? null;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const body = {
      ok: database && postgis !== null,
      database,
      postgis,
      modelKeyConfigured: deps.config.anthropicApiKey !== undefined,
      error,
    };
    return reply.code(body.ok ? 200 : 503).send(body);
  });
}
