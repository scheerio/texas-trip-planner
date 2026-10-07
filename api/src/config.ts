import { z } from "zod";

/**
 * All environment variables the API reads, validated in one place.
 * The server refuses to start on a bad config instead of failing later mid-request.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_PORT: z.coerce.number().int().positive().default(3001),
  // Optional for now: the agent that needs it arrives in a later step.
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
});

export type Config = {
  databaseUrl: string;
  port: number;
  anthropicApiKey: string | undefined;
};

export function parseConfig(env: Record<string, string | undefined>): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment. Copy .env.example to .env and check these values:\n${problems}`,
    );
  }
  return {
    databaseUrl: result.data.DATABASE_URL,
    port: result.data.API_PORT,
    anthropicApiKey: result.data.ANTHROPIC_API_KEY,
  };
}
