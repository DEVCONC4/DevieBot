@AGENTS.md

# DevieBot

Task-management dashboard + Telegram bot for DEVCON code camps. A Next.js 16 / React 19
app (App Router) backed by Supabase, with a Telegram bot that parses natural-language
messages into tasks via the Anthropic API. Product context lives in `DevieBot_PRD_v1.0.0.md`.

## Commands

```bash
npm run dev              # next dev
npm run build            # next build
npm run lint             # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit         # typecheck — there are no tests, so this is the main gate
```

There is no test suite. Verify changes with `npx tsc --noEmit`, `npm run lint`, and by
exercising the API routes (`GET /api/standup` previews the standup message without sending).

## Architecture

**Two front doors to the same Supabase data:**

1. **Dashboard** — `app/dashboard/*`, all client components reading Supabase through the
   browser client and the `useTasks` / `useMembers` hooks.
2. **Telegram bot** — `app/api/telegram/webhook/route.ts` (~1400 lines, the single largest
   file) handles every command, callback query, and free-text message.

**Request pipeline:** [proxy.ts](proxy.ts) is the Next 16 replacement for `middleware.ts`.
It refreshes the Supabase session and redirects unauthenticated users to `/auth/login`.
`/api/*` is exempt — Telegram and cron callers have no session.

**Three Supabase clients — pick by context, they are not interchangeable:**

| File | Use in | Key |
|---|---|---|
| [lib/supabase/client.ts](lib/supabase/client.ts) | `'use client'` components/hooks | anon |
| [lib/supabase/server.ts](lib/supabase/server.ts) | server components, cookie-aware | anon |
| [lib/supabase/service.ts](lib/supabase/service.ts) | API routes only (webhook, standup, cron) | service role |

All three are instantiated as `createClient<any>()` — the hand-written interfaces in
`types/database.ts` don't satisfy Supabase's `GenericTable` constraint. Don't "fix" this by
adding the generic; it fails to compile.

**NLP layer** — [lib/nlp.ts](lib/nlp.ts) turns chat messages into structured tasks using
`claude-haiku-4-5`. Every model call has a deterministic fallback: `parseBulkTasks` falls
back to `parseBulkTasksHeuristic`, and even on success it re-grounds `dueDate` through the
heuristic parser to prevent date hallucination. Keep that pattern — a model call that can
silently produce a wrong date must be checked against regex parsing.

**Standup** — [lib/standup.ts](lib/standup.ts) builds paginated, filterable
(`overview | active | backlog | done | review`) reports with an inline Telegram keyboard.
`sendTelegramMessage` is the shared sender used by the standup and deadline routes.

**API routes:**

- `POST/GET /api/standup` — send / preview the daily standup
- `POST/GET /api/telegram/deadlines` — deadline digest (overdue, today, tomorrow, 2–3 days)
- `POST /api/telegram/webhook` — all bot traffic
- `GET/POST /api/telegram/setup` — register bot commands (`setMyCommands`)
- `POST /api/telegram/register` — point the Telegram webhook at `NEXT_PUBLIC_APP_URL`

Both standup and deadlines are designed to be driven by an external cron.

## Conventions

- **[supabase/schema.sql](supabase/schema.sql) and [types/database.ts](types/database.ts) must
  agree.** The SQL file bootstraps a fresh project; the TS types are what the app compiles
  against. Change both together, and add a numbered file under
  [supabase/migrations/](supabase/migrations/) so existing databases can catch up.
  There are no generated Supabase types — the interfaces are hand-written.
- **Assignees are stored as plain text** in `tasks.assigned_to`, not as a foreign key. Hooks
  resolve the text to a `Member` at read time by name / first name / `telegram_username` /
  `telegram_id`; the helpers live in [lib/member-utils.ts](lib/member-utils.ts). There is
  deliberately no join table.
- **`camp_id` is always `null` today.** `code_camps` and the FK exist for per-camp boards, but
  every task the app creates goes to the General Board.
- **Dates are ISO `YYYY-MM-DD` strings in `Asia/Manila`.** Use the helpers in
  [lib/date.ts](lib/date.ts) (`getTodayInAppTimeZoneISO`, `addDaysToISODate`,
  `addBusinessDaysToISODate`) rather than `new Date()` arithmetic — the timezone is
  overridable via `APP_TIME_ZONE`.
- **Telegram messages use HTML parse mode.** Escape every interpolated user/DB string with
  the local `esc()` helper before putting it in a message.
- **Task codes** render as `T-001` via `taskCode()` in `types/database.ts`.
- **Statuses and priorities are defined once** in [lib/constants.ts](lib/constants.ts) with
  their labels, Tailwind classes, and hex values. Add new ones there, not inline.
- **Styling** is Tailwind v4 with CSS variables in `app/globals.css` (`@theme inline`) and
  shadcn/ui primitives in `components/ui/`. Use the semantic tokens (`bg-card`,
  `text-muted-foreground`) so light and dark themes both work; `next-themes` drives the switch.
- **Toasts** use `sonner`, not a custom toast component.

## Environment

`.env.local` (gitignored) needs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
`NEXT_PUBLIC_APP_URL`. Optional: `APP_TIME_ZONE` (defaults to `Asia/Manila`).

The bot token and chat id also have a DB fallback in `telegram_config`; env wins.

## Keeping this file current

Update this file in the same change that makes it stale. In particular:

- a new API route, page, or `lib/` module → add it to **Architecture**
- a new table, column, or enum value → update `supabase/schema.sql`, `types/database.ts`, and a
  new `supabase/migrations/NNN_*.sql` together
- a new env var → add it to **Environment**
- a rule you had to learn the hard way (a footgun, a "don't fix this", a required ordering) →
  add it to **Conventions** rather than leaving it as a code comment only

Don't record one-off fixes or anything git history already tells you.
