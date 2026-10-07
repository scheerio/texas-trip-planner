# Texas Trip Planner

AI trip planner for camping and hiking in Texas. You describe a trip in a sentence, and it returns a plan on a map that is checked against what you asked for.

**Status:** project scaffold. The backend, database and map page run; the planning agent and test suite are next.

## Run it locally

Requirements: Node 20 or newer, and Docker Desktop running.

```bash
cp .env.example .env      # then paste your model API key into .env
npm install
npm run dev
```

Open http://localhost:5173. The left panel shows a setup status check for the backend, the database, PostGIS and the API key.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the database, the API (port 3001) and the web app (port 5173) |
| `npm run typecheck` | Type-checks both packages |
| `npm test` | Runs the backend unit tests |
| `npm run db:reset` | Deletes the local database and starts a fresh one |

## Layout

```
api/   Fastify backend (TypeScript)
web/   React + Vite front end with a MapLibre map
db/    SQL that runs when the database is first created
```

## Stack

TypeScript, Fastify, Zod, Postgres with PostGIS, Drizzle, React, Vite, MapLibre, Vitest, GitHub Actions.
