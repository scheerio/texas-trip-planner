import type { places } from "../db/schema.js";

export type PlaceRow = typeof places.$inferInsert;

/** One element from an Overpass API response requested with `out center tags`. */
export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export const AUSTIN = { lat: 30.2672, lon: -97.7431 };

/**
 * Straight-line radius for the load. About three hours of driving from Austin
 * is under 320 km as the crow flies; the drive-time tool does the exact filtering later.
 */
export const SEARCH_RADIUS_M = 320_000;

const PARK_NAME = "State Park|State Natural Area|National Park|National Forest|National Recreation Area|Wilderness";

export function buildOverpassQuery(center = AUSTIN, radiusM = SEARCH_RADIUS_M): string {
  const around = `(around:${radiusM},${center.lat},${center.lon})`;
  return `
[out:json][timeout:180];
(
  nwr["tourism"="camp_site"]["name"]${around};
  nwr["boundary"~"^(protected_area|national_park)$"]["name"~"${PARK_NAME}"]${around};
  nwr["leisure"~"^(park|nature_reserve)$"]["name"~"${PARK_NAME}"]${around};
);
out center tags;`.trim();
}

function yesNo(value: string | undefined): boolean | null {
  if (value === undefined) return null;
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

/** Turns one Overpass element into a places row, or null if it can't be used. */
export function toPlaceRow(el: OverpassElement): PlaceRow | null {
  const tags = el.tags ?? {};
  const name = tags.name?.trim();
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!name || lat === undefined || lon === undefined) return null;

  // Private and members-only sites can't be booked by the public.
  if (tags.access === "private" || tags.access === "members") return null;

  const kind = tags.tourism === "camp_site" ? "campground" : "park";
  return {
    source: "osm",
    sourceId: `${el.type}/${el.id}`,
    kind,
    name,
    location: { lon, lat },
    operator: tags.operator ?? null,
    website: tags.website ?? tags["contact:website"] ?? null,
    hasDrinkingWater: yesNo(tags.drinking_water),
    hasToilets: yesNo(tags.toilets),
    tags,
  };
}

/** Converts a full response, dropping unusable elements and duplicate ids. */
export function toPlaceRows(elements: OverpassElement[]): PlaceRow[] {
  const seen = new Set<string>();
  const rows: PlaceRow[] = [];
  for (const el of elements) {
    const row = toPlaceRow(el);
    if (!row || seen.has(row.sourceId)) continue;
    seen.add(row.sourceId);
    rows.push(row);
  }
  return rows;
}
