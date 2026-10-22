# Teamdesk

Rooms, bookings and tasks for a small team. A [TanStack Start](https://tanstack.com/start) app on Cloudflare Workers with D1, built from [cf-tanstack-boilerplate](https://github.com/codewithpassion/cf-tanstack-boilerplate).

## Develop

```bash
bun install
bun test
bun run dev
```

`bun run dev` applies the D1 migrations and the demo data (`packages/db/seed.sql`) to a local SQLite database and starts the app on http://localhost:3000. No Cloudflare account and no environment variables are needed. The local database lives in `apps/web/.wrangler`; delete that folder for a clean slate.

There is no sign-in yet. Pages that change data have a member picker, and the chosen member is sent as `actorId` with every mutation.

## Browser demo

`bun run --filter web demo:build` builds a static copy of the app that needs no server: the same routes, tRPC router, services and Drizzle queries, run in the page against SQLite compiled to JavaScript ([sql.js](https://sql.js.org)), with the migrations, the demo data and some extra example rows. It writes one self-contained file, `apps/web/demo/dist/teamdesk-demo.html`, that you can host anywhere. Each viewer's changes stay in their own browser. The sources are in [`apps/web/demo`](apps/web/demo).

## Layout

- [`apps/web`](apps/web): the TanStack Start app. Hono is the Worker's `fetch` handler, tRPC is mounted at `/api/trpc`. See its [README](apps/web/README.md).
- [`packages/db`](packages/db) (`@repo/db`): the Drizzle schema, migrations and query functions. See its [README](packages/db/README.md).
- [`packages/services`](packages/services) (`@repo/services`): business rules and validation on top of `@repo/db`. See its [README](packages/services/README.md).

A request goes route component, then tRPC router (`apps/web/src/server/trpc/routers/`), then service (`@repo/services/<module>`), then query functions (`@repo/db/<module>`).

## Commands

- `bun test`: every test in the repo, against in-memory SQLite.
- `bun run check`: lint (Ultracite, which is Biome) and typecheck.
- `bun run fix`: format and apply safe lint fixes.
- `bun run build`: production build.
- `bun run deploy`: build and deploy with wrangler. Needs a Cloudflare login and a real D1 database id in `apps/web/wrangler.jsonc`.
- `bun run db:apply` / `bun run db:apply:remote`: apply the D1 migrations to the local or the deployed database.
- `bun run db:seed` / `bun run db:seed:remote`: load the demo data into the local or the deployed database.

## Stack

Cloudflare Workers and D1, Hono, TanStack Start and Router, tRPC, Drizzle ORM, zod, shadcn/ui with Tailwind CSS v4, Bun, Turborepo, Ultracite.
