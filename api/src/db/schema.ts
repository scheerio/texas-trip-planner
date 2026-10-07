import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * PostGIS point stored as geography, so distances come back in meters.
 * Written and read as { lon, lat }.
 */
export const geographyPoint = customType<{
  data: { lon: number; lat: number };
  driverData: string;
}>({
  dataType: () => "geography(Point, 4326)",
  toDriver: ({ lon, lat }) => `SRID=4326;POINT(${lon} ${lat})`,
});

/** Reference data: campgrounds and parks loaded from OpenStreetMap. */
export const places = pgTable(
  "places",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    kind: text("kind", { enum: ["campground", "park"] }).notNull(),
    name: text("name").notNull(),
    location: geographyPoint("location").notNull(),
    operator: text("operator"),
    website: text("website"),
    hasDrinkingWater: boolean("has_drinking_water"),
    hasToilets: boolean("has_toilets"),
    tags: jsonb("tags").$type<Record<string, string>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("places_source_uq").on(t.source, t.sourceId),
    index("places_location_gix").using("gist", t.location),
    index("places_kind_idx").on(t.kind),
  ],
);

/** Cached responses from outside services (weather, trails, routing). */
export const apiCache = pgTable(
  "api_cache",
  {
    key: text("key").primaryKey(),
    source: text("source").notNull(),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("api_cache_expires_idx").on(t.expiresAt)],
);

/** One row per trip request the agent handles. */
export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    requestText: text("request_text").notNull(),
    constraints: jsonb("constraints"),
    plan: jsonb("plan"),
    status: text("status", { enum: ["running", "succeeded", "failed"] })
      .notNull()
      .default("running"),
    passedChecks: boolean("passed_checks"),
    model: text("model"),
    latencyMs: integer("latency_ms"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),
    error: text("error"),
  },
  (t) => [index("agent_runs_created_idx").on(t.createdAt)],
);

/** Each model call and tool call inside a run, in order. */
export const agentSteps = pgTable(
  "agent_steps",
  {
    id: serial("id").primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    stepIndex: integer("step_index").notNull(),
    kind: text("kind", { enum: ["model", "tool"] }).notNull(),
    name: text("name").notNull(),
    input: jsonb("input"),
    output: jsonb("output"),
    latencyMs: integer("latency_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("agent_steps_run_idx_uq").on(t.runId, t.stepIndex)],
);
