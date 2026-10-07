import { describe, expect, it } from "vitest";
import { parseConfig } from "./config.js";

const base = { DATABASE_URL: "postgres://ttp:ttp@localhost:5433/ttp" };

describe("parseConfig", () => {
  it("applies the default port", () => {
    expect(parseConfig(base).port).toBe(3001);
  });

  it("reads the port as a number", () => {
    expect(parseConfig({ ...base, API_PORT: "4000" }).port).toBe(4000);
  });

  it("treats a blank API key as not configured", () => {
    expect(parseConfig({ ...base, ANTHROPIC_API_KEY: "  " }).anthropicApiKey).toBeUndefined();
  });

  it("names the missing variable when the database URL is absent", () => {
    expect(() => parseConfig({})).toThrow(/DATABASE_URL/);
  });
});
