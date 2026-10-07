import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { parseConfig } from "../config.js";
import { createDb } from "../db/client.js";
import { places } from "../db/schema.js";
import { buildOverpassQuery, toPlaceRows, type OverpassElement } from "./overpass.js";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const BATCH_SIZE = 500;

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../.env") });
const config = parseConfig(process.env);

console.log("Requesting campgrounds and parks from OpenStreetMap (this can take a minute)...");
const res = await fetch(OVERPASS_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "texas-trip-planner (github.com/scheerio/texas-trip-planner)",
  },
  body: new URLSearchParams({ data: buildOverpassQuery() }),
});
if (!res.ok) {
  throw new Error(`Overpass request failed: ${res.status} ${res.statusText}\n${await res.text()}`);
}
const body = (await res.json()) as { elements: OverpassElement[] };
const rows = toPlaceRows(body.elements);
console.log(`Received ${body.elements.length} elements, ${rows.length} usable.`);

const { db, pool } = createDb(config.databaseUrl);
for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  await db
    .insert(places)
    .values(rows.slice(i, i + BATCH_SIZE))
    .onConflictDoUpdate({
      target: [places.source, places.sourceId],
      set: {
        kind: sql`excluded.kind`,
        name: sql`excluded.name`,
        location: sql`excluded.location`,
        operator: sql`excluded.operator`,
        website: sql`excluded.website`,
        hasDrinkingWater: sql`excluded.has_drinking_water`,
        hasToilets: sql`excluded.has_toilets`,
        tags: sql`excluded.tags`,
        updatedAt: sql`now()`,
      },
    });
}

const counts = await pool.query<{ kind: string; count: string }>(
  "select kind, count(*) from places group by kind order by kind",
);
for (const row of counts.rows) console.log(`  ${row.kind}: ${row.count}`);

// Sanity check that distance queries work: the five campgrounds closest to Austin.
const nearest = await pool.query<{ name: string; km: string }>(
  `select name, round((ST_Distance(location, ST_MakePoint(-97.7431, 30.2672)::geography) / 1000)::numeric, 1) as km
   from places where kind = 'campground'
   order by location <-> ST_MakePoint(-97.7431, 30.2672)::geography limit 5`,
);
console.log("Closest campgrounds to Austin:");
for (const row of nearest.rows) console.log(`  ${row.km} km  ${row.name}`);

await pool.end();
