import { describe, expect, it } from "vitest";
import { buildOverpassQuery, toPlaceRow, toPlaceRows, type OverpassElement } from "./overpass.js";

const campNode: OverpassElement = {
  type: "node",
  id: 1,
  lat: 30.5,
  lon: -98.8,
  tags: { tourism: "camp_site", name: " Walnut Springs ", drinking_water: "yes", toilets: "no" },
};

describe("toPlaceRow", () => {
  it("maps a campground node", () => {
    expect(toPlaceRow(campNode)).toMatchObject({
      source: "osm",
      sourceId: "node/1",
      kind: "campground",
      name: "Walnut Springs",
      location: { lon: -98.8, lat: 30.5 },
      hasDrinkingWater: true,
      hasToilets: false,
    });
  });

  it("uses the center point for ways and relations, and treats them as parks", () => {
    const row = toPlaceRow({
      type: "relation",
      id: 7,
      center: { lat: 30.1, lon: -98.2 },
      tags: { boundary: "protected_area", name: "Example State Park", website: "https://example.org" },
    });
    expect(row).toMatchObject({ sourceId: "relation/7", kind: "park", website: "https://example.org" });
    expect(row?.location).toEqual({ lon: -98.2, lat: 30.1 });
  });

  it("leaves amenities unknown when the tag is absent", () => {
    const row = toPlaceRow({ ...campNode, tags: { tourism: "camp_site", name: "Bare" } });
    expect(row?.hasDrinkingWater).toBeNull();
    expect(row?.hasToilets).toBeNull();
  });

  it("drops elements with no name, no coordinates, or private access", () => {
    expect(toPlaceRow({ ...campNode, tags: { tourism: "camp_site" } })).toBeNull();
    expect(toPlaceRow({ type: "way", id: 2, tags: { tourism: "camp_site", name: "X" } })).toBeNull();
    expect(toPlaceRow({ ...campNode, tags: { ...campNode.tags, access: "private" } })).toBeNull();
  });
});

describe("toPlaceRows", () => {
  it("removes duplicates and unusable elements", () => {
    const rows = toPlaceRows([campNode, campNode, { type: "node", id: 3 }]);
    expect(rows).toHaveLength(1);
  });
});

describe("buildOverpassQuery", () => {
  it("includes the radius and center", () => {
    const q = buildOverpassQuery({ lat: 30, lon: -97 }, 1000);
    expect(q).toContain("(around:1000,30,-97)");
    expect(q).toContain('"tourism"="camp_site"');
  });
});
