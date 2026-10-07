# Texas Trip Planner

AI trip planner for camping and hiking in Texas. The user types a trip request in one sentence; an agent returns a plan (campground, daily hikes, forecast, drive time) shown on a map, and the backend checks the plan against the request before returning it.

## Why this project exists

This is a portfolio project for a senior engineer. It has to show three things, and every decision should serve them:

1. **Measured AI quality.** A test suite of 30 trip requests scores each plan automatically against its own constraints. The pass rate is the headline number.
2. **Backend depth.** Schema design, location queries, caching, run logging with latency and cost.
3. **Code the owner can defend in an interview.** Prefer plain, readable code over clever abstractions. No agent framework: the agent loop is written directly against the Anthropic SDK so every step can be explained.

Explain what each piece does when you add it. The owner is strong in React/TypeScript/AWS and is building backend and AI experience through this project.

## Stack (decided, don't change without asking)

- TypeScript end to end, npm workspaces: `api/` and `web/`
- API: Node, Fastify, Zod for validation
- Agent: Claude API with tool calling, via `@anthropic-ai/sdk` (not yet installed)
- Database: Postgres 16 with PostGIS, Drizzle ORM. Local database runs in Docker on host port 5433
- Front end: React, Vite, MapLibre with OpenFreeMap tiles (no key)
- Tests: Vitest for unit tests; a separate script for the 30-request scoring
- CI: GitHub Actions (`.github/workflows/ci.yml`) runs type-checks and unit tests
- Deploy target: AWS Fargate and RDS, only after everything works locally

## Commands

```bash
npm run dev          # database + API (3001) + web (5173)
npm run db:migrate   # apply migrations
npm run db:seed      # load campgrounds and parks from OpenStreetMap
npm run typecheck
npm test
```

After changing `api/src/db/schema.ts`, run `npm run db:generate -w api`. Drizzle wraps the PostGIS type in quotes (`"geography(Point, 4326)"`), which Postgres rejects; remove the quotes in the generated SQL by hand.

## Current state

Done:
- Scaffold: Fastify API with `/api/health`, React page with a map and a setup-status panel
- Schema and first migration: `places`, `api_cache`, `agent_runs`, `agent_steps`
- Seed script: named campgrounds and parks within 320 km of Austin from the Overpass API

Not yet verified (check these first):
- `npm run db:migrate` and `npm run db:seed` have never run against a real PostGIS database or the live Overpass API. Run both, confirm the counts are plausible and the five campgrounds nearest Austin are real places.
- The CI workflow has not been seen passing on GitHub.

## Remaining steps

1. **Four lookups**, each a plain async function in `api/src/tools/` with a Zod input schema, a typed result, and caching through `api_cache`:
   - `findCampgrounds`: PostGIS query on `places` (radius, amenities)
   - `findTrails`: OpenStreetMap hiking routes and paths near a point, with length
   - `getForecast`: National Weather Service API (`api.weather.gov`, no key, needs a User-Agent header)
   - `getDriveTime`: source not chosen yet. Compare a free open-source routing service against a keyed one with a free tier, and ask the owner before picking one that needs a key
2. **Agent loop** in `api/src/agent/`: parse the request into constraints (nights, max drive time, max daily miles, features), call tools, produce a plan matching a Zod schema.
3. **Plan validator**: a pure function that checks a plan against the constraints and returns a list of violations. If there are violations, feed them back to the model for one retry. This same function scores the test suite.
4. **Run logging**: write every run to `agent_runs` and every model and tool call to `agent_steps`, with latency, token counts and cost.
5. **`POST /api/plan`** endpoint and the map page: request box, route and campsite on the map, forecast, the agent's explanation.
6. **Test suite**: 30 trip requests in a JSON file with expected constraints, plus a script (`npm run eval`) that runs them, scores with the validator, and prints pass rate, p50/p95 latency and cost per run.
7. **CI gate**: run the scoring in GitHub Actions and fail if the pass rate drops below a stored baseline. Needs `ANTHROPIC_API_KEY` as a repo secret.
8. **Deploy** to AWS, written as code. Ask before creating anything that costs money.
9. **README** rewritten around the real numbers.

## Scope limits

- No live campsite availability. Neither the federal recreation database nor Texas state parks offer it through an open API. Link out to the booking page instead.
- No user accounts or saved trips in the first version.
- First version covers trips within driving range of Austin.

## Conventions

- Secrets live only in `.env` (git-ignored) and GitHub Actions secrets. Never print or commit a key.
- Be polite to free public APIs: cache responses, set a descriptive User-Agent, no parallel bursts.
- Unit-test pure logic (parsers, validators, scoring). Don't mock the model in unit tests; the test suite covers agent behaviour.
- Small commits to `main` with a message that says what changed and why.
- Never report a number (pass rate, latency, cost) that wasn't produced by actually running the code.
