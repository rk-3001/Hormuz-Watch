# HormuzWatch — AI Energy Supply Chain Resilience Platform

A real-time command center for monitoring geopolitical and shipping risk signals threatening India's crude oil imports. Simulates disruption scenarios and auto-generates ranked procurement rerouting recommendations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/hormuzwatch run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `ANTHROPIC_API_KEY` — for AI assistant and Claude-powered chat

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- Charts: Recharts (RadialBarChart for risk gauges, AreaChart for SPR)
- Maps: React-Leaflet + OpenStreetMap/CARTO tiles
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (for AI conversation history)
- AI: Anthropic Claude claude-sonnet-4-6 (assistant chat + scenario narratives)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/hormuzwatch/` — React frontend
- `artifacts/api-server/` — Express API server
- `artifacts/api-server/src/mockData.ts` — all in-memory mock data (signals, scenarios, procurement options, corridor risks)
- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/api-server/src/routes/assistant.ts` — AI chat endpoint (uses ANTHROPIC_API_KEY)
- `artifacts/api-server/src/routes/anthropic/` — conversation history CRUD (DB-backed)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle schema (conversations, messages tables)

## Architecture decisions

- Mock data is in-memory for signals, scenarios, procurement options, and corridor risks — no DB migration needed for these. Only AI conversation history uses the DB.
- Risk scores use a random-walk refresh model (±3pts per call) to simulate live updates on a 12-second frontend interval.
- The Anthropic assistant uses `ANTHROPIC_API_KEY` directly (not Replit AI Integrations) — set this as a Replit Secret.
- React-Leaflet uses CARTO dark basemap tiles for the command-center aesthetic.

## Product

Six-page intelligence platform:
- **Command Center (/)** — 3 corridor risk gauges (Hormuz/Red Sea/Persian Gulf), live intelligence feed, audit timeline
- **Scenario Simulator (/simulate)** — Hormuz Closure, OPEC+ Cut, Red Sea Suspension scenarios with animated impact cards
- **Procurement (/recommendations)** — ranked alternative crude sources with scoring breakdown
- **SPR Reserves (/reserves)** — drawdown curve with interactive disruption-days slider
- **Map (/map)** — full-screen geospatial view with chokepoint/port markers
- **AI Assistant** — persistent floating drawer powered by Claude claude-sonnet-4-6

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run codegen before restarting workflows.
- `pnpm run typecheck:libs` must run before leaf artifact typechecks when `lib/*` changes.
- react-leaflet 4.x has peer warnings with React 19 — these are harmless, the library works correctly.
- The API server must be running for the frontend to fetch any data.
