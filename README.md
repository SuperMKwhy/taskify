# Taskify

A spatial task board. Each task is a frosted-glass card floating on a canvas. A small physics simulation pulls unfinished cards toward the warm **Pending** light and finished ones toward the cool **Finished** light, keeps cards from the same project together, and pushes everything else apart. Tick a card and you watch it drift across the board.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion, d3-force, Prisma and PostgreSQL.

## Features

- Accounts with username/email login, signup and 30-day cookie sessions
- Create, edit, complete and delete tasks. Deleting gives you 5 seconds to undo.
- Projects are created inline from the task form and colour-code their cards
- Due-date urgency on every card: overdue, due today, due soon
- Infinite canvas: drag to pan, pinch or ⌘/Ctrl + scroll to zoom, fit-to-board
- Draggable Pending/Finished zones and a resizable board, remembered per browser
- Loading, empty, error and offline-failure states, with toasts and rollback
- Keyboard: `N` new task, `+`/`-` zoom, `0` fit board, `Esc` close, `⌘/Ctrl + Enter` save

## Quick start (Docker)

```bash
docker compose up --build
```

Open http://localhost:3000. Migrations run automatically on start.

## Local development

Requires Node 22+ and a PostgreSQL 16 database.

```bash
cp .env.example .env              # point DATABASE_URL at your database
docker compose -f docker-compose.dev.yml up -d postgres   # or use your own Postgres
npm install
npx prisma migrate deploy
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Create/apply a new migration in development |
| `npm run prisma:studio` | Browse the database |

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXT_PUBLIC_PHYSICS_DEBUG` | no | Set to `1` to show the physics debug overlay in production builds. It is always available in development (`Shift + D`). |

## Project layout

```
app/             routes: board (/), /login, /signup, and /api route handlers
components/      canvas, cards, task form, auth shell, shared UI primitives
hooks/           useTasks, useProjects, useCardPhysics (d3-force simulation)
lib/             auth sessions, API client, validation, date and colour helpers
prisma/          schema and migrations
proxy.ts         redirects signed-out visitors to /login (Next 16 "proxy", formerly middleware)
```

## API

All endpoints except auth require the `taskify_session` cookie and return JSON errors as `{ "error": string }`.

| Method | Path | Body |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | `{ username, email, password }` |
| `POST` | `/api/auth/login` | `{ identifier, password }` |
| `POST` | `/api/auth/logout` | |
| `GET` | `/api/auth/me` | |
| `GET` | `/api/tasks` | |
| `POST` | `/api/tasks` | `{ project, title, description?, dueDate: "YYYY-MM-DD" }` |
| `PATCH` | `/api/tasks/:id` | `{ completed }` and/or all of `{ project, title, description?, dueDate }` |
| `DELETE` | `/api/tasks/:id` | |
| `GET` / `POST` | `/api/projects` | `POST { name }` |

## Before going to production

- Put the app behind HTTPS. Session cookies are `Secure` when `NODE_ENV=production`.
- Add rate limiting on `/api/auth/*` at your proxy or edge. The app does not do this itself.
- Expired sessions are rejected but not purged. Schedule `DELETE FROM "Session" WHERE "expiresAt" < now()` if the table grows.
