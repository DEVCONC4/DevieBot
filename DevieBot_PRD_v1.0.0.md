

**DevieBot**  
Product Requirements Document

*Command-driven task management for distributed teams, living where your team already communicates.*

**Version 1.1.0  •  August 10, 2026**

**Status: Live**

**Quick Links**  
**Live Web Dashboard:** [https://devie-devcon-jumpstart-cohort4-operations.vercel.app/dashboard](https://devie-devcon-jumpstart-cohort4-operations.vercel.app/dashboard)  
**DevieBot on Telegram:** https://t.me/DevieTheBot

# **1\. Executive Summary**

DevieBot is a Telegram-first task and project management platform designed for distributed engineering teams and remote team6. It enables teams to manage tasks, standups, and project coordination entirely within Telegram, while providing a full-context web dashboard for deeper visibility and reporting.

Built specifically for DevCon Jumpstart's cohort-based learning structure, DevieBot bridges the gap between where teams communicate (Telegram) and where work is tracked. By combining a Telegram bot with Claude-powered NLP and a real-time Kanban dashboard, DevieBot eliminates the friction of context switching between chat and traditional PM tools.

Version 1.0.0 shipped with six bot commands, an AI standup generator, drag-and-drop Kanban, and a full-featured operations dashboard — making it the first tool purpose-built for chat-native project coordination at scale. As of v1.1.0, the bot has grown to eight chat commands, and admins can self-serve webhook registration and command sync directly from the Settings dashboard rather than through manual BotFather/API setup.

# **2\. Product Vision**

## **2.1 Mission Statement**

| Mission: Bring task management into Telegram — eliminating context switching for distributed teams while keeping a full-context dashboard for deeper visibility. |
| :---- |

## 

## **2.2 Value Proposition**

| Chat-Native | Intelligent | Visible |
| :---- | :---- | :---- |
| Create and update tasks directly in Telegram using plain language commands. | Claude Haiku NLP parses tasks, extracts deadlines, infers priority, and resolves assignees. | Real-time Kanban dashboard keeps all stakeholders aligned without manual syncing. |

# **3\. User Personas**

## **3.1 Cohort Member**

| Attribute | Detail |
| :---- | :---- |
| **Name** | Cohort Member |
| **Role** | Bootcamp student, tagged with a free-form role label (e.g. "cohort3", "cohort4") rather than a fixed enum |
| **Primary Interface** | Telegram only — no dashboard required |
| **Goals** | Log tasks quickly, check deadlines, respond to standups |
| **Pain Points** | Doesn't want to switch apps; needs simple bot commands |
| **Tech Comfort** | Low to medium — prefers plain-language interaction |

## **3.2 Operations Manager**

| Attribute | Detail |
| :---- | :---- |
| **Name** | Operations Manager |
| **Role** | Coordinates tasks across cohorts |
| **Primary Interface** | Both dashboard and Telegram bot |
| **Goals** | Monitor completion rates, assign tasks, review overdue items |
| **Pain Points** | Needs real-time visibility without polling every team member |
| **Tech Comfort** | Medium to high — comfortable with Kanban and dashboards |

## **3.3 Team Lead / Admin**

| Attribute | Detail |
| :---- | :---- |
| **Name** | Team Lead / Admin |
| **Role** | Configures bot, manages members, reviews audit log |
| **Primary Interface** | Dashboard Settings panel |
| **Goals** | Ensure bot is properly configured, schedule standups, maintain compliance |
| **Pain Points** | Needs reliable webhook setup and clear audit trails |
| **Tech Comfort** | High — developer or semi-technical |

## **3.4 Project / Program Manager**

| Attribute | Detail |
| :---- | :---- |
| **Name** | Project / Program Manager |
| **Role** | Analytics, accountability, reporting |
| **Primary Interface** | Operations Dashboard |
| **Goals** | Track KPIs, review audit logs, monitor workload balance |
| **Pain Points** | Traditional tools require too much manual data entry |
| **Tech Comfort** | Medium — power user of dashboards |

# **4\. Problem Statement**

## **4.1 The Core Problem**

Distributed bootcamp teams discuss work in Telegram but are forced to track work in separate tools like Jira or Trello. This causes:

* Context switching between chat and PM tools

* Missed tasks due to information buried in chat threads

* Stale boards that are rarely updated after initial setup

* Inefficient standups with no automated summaries

* Poor manager visibility into real-time task status

## **4.2 Competitor Comparison**

| Tool | Strengths | Weaknesses | vs DevieBot |
| :---- | :---- | :---- | :---- |
| **Jira** | Powerful, enterprise-grade | Heavy, steep learning curve, no Telegram | DevieBot is lightweight and chat-native |
| **Trello** | Simple Kanban boards | Lacks automation, no Telegram integration | DevieBot adds AI \+ bot commands |
| **Asana / Monday** | Good collaboration features | Expensive, not Telegram-native | DevieBot is free-first and Telegram-integrated |
| **Linear** | Fast, developer-friendly | No Telegram integration | DevieBot bridges chat \+ board seamlessly |

# **5\. Success Metrics**

## **5.1 North Star Metric**

**North Star Metric: Weekly Active Teams (WAT) — teams that create or complete at least one task per week.**

## **5.2 Key Performance Indicators**

| KPI | Target | Notes |
| :---- | :---- | :---- |
| **Daily Active Users** | 10 DAU | Baseline adoption target for v1 |
| **Task Completion Rate** | ≥ 80% within 14 days | Core productivity signal |
| **Telegram Task Creation** | ≥ 40% tasks via bot | Validates chat-native value prop |
| **Standup Participation** | ≥ 70% | Measures daily engagement |
| **Onboarding Completion** | ≥ 80% within 24 hours | Critical for new cohort onboarding |
| **30-Day Retention** | ≥ 60% | Product stickiness indicator |
| **NLP Parse Accuracy** | ≥ 90% | Confidence in Claude Haiku integration |
| **Dashboard Load Time** | \< 2.5 seconds | Performance baseline |
| **Telegram Bot Response** | \< 1s basic, \< 3s AI | UX responsiveness target |
| **System Uptime** | ≥ 99.5% | Reliability SLA |

# **6\. Feature Priorities — v1**

Features are classified using the MoSCoW framework and mapped to Q2 2026 delivery.

## **6.1 MoSCoW Prioritization**

| Priority | Feature | Rationale |
| :---- | :---- | :---- |
| **Must Have** | Stable /addtask with NLP parsing (title, deadline, priority, assignee) | Core bot value; critical path for adoption |
| **Must Have** | Real-time Kanban board with drag-and-drop across 6 columns — Backlog, To Do, In Progress, In Review, Blocked, Done | Dashboard visibility for managers |
| **Must Have** | Daily standup card \+ AI summary delivery, triggered on schedule via an external cron service (cron-job.org) calling /api/standup | Daily team coordination |
| **Must Have** | Deadline reminders via Telegram | Proactive task completion nudge |
| **Must Have** | Audit log viewer in Settings panel | Accountability and compliance |
| **Must Have** | Operations Dashboard — KPI cards and completion metrics | Management visibility |
| **Must Have** | Team Management — member roster, roles, auto-registration | Multi-user foundation |
| **Should Have** | AI bulk task extraction from long Telegram messages | Efficiency for task-heavy messages |
| **Should Have** | Task filtering, sorting, and search | Usability at scale |
| **Should Have** | Member assignment \+ workload balancing | Fair task distribution |
| **Should Have** | New-member auto-registration on first Telegram interaction; admin-driven webhook registration and command sync from the Settings dashboard | Reduce friction for new users and for bot setup — there is no in-chat /register or /setup command |
| **Could Have** | Recurring tasks | Convenience for regular workflows |
| **Could Have** | Custom task statuses | Team-specific workflow customization |
| **Could Have** | Motivational quote improvements in standup reports | Engagement and culture — implemented via curated book-quote generation |
| **Could Have** | Sidebar utilities — Manila-timezone clock, automatic overdue-task demotion to Backlog, light/dark/system theme toggle | Quality-of-life polish for a distributed team |
| **Won't Have (v1)** | Native iOS/Android apps | Out of scope; Telegram covers mobile |
| **Won't Have (v1)** | GitHub/GitLab sync | Deferred to future enhancement |
| **Won't Have (v1)** | Calendar integrations | Not needed for bootcamp use case |
| **Won't Have (v1)** | RBAC and enterprise compliance | Beyond current scale requirements |

# **7\. Key User Flows**

## **7.1 /addtask Flow**

* User sends /addtask command (or @-mentions the bot) in Telegram with natural language description

* Claude Haiku NLP parses: title, due date, priority, and assignee from the message; if no deadline is stated, the task defaults to the nearest onsite day (Tuesday or Thursday)

* Parsed task is saved to Supabase PostgreSQL database

* Task appears in real-time on the Kanban dashboard under the appropriate column

* Assigned team member receives a Telegram notification

## **7.2 Daily Standup Flow**

* An external scheduler (cron-job.org) calls /api/standup at the configured time; the Settings panel provides an enable/disable toggle for standups but the trigger time itself is managed in the external cron service, not in-app

* Standup prompt is sent to the Telegram group

* Team members respond with status updates in chat

* Claude Haiku generates an AI summary of all responses

* Summary is posted back to Telegram with status breakdown, blockers, and overdue alerts

* Standup event is logged to the audit log

## **7.3 Manager Dashboard Flow**

* Operations Manager logs into the web dashboard via Supabase SSR auth

* KPI cards display: total, completed, in-progress, in-review, blocked, urgent, and overdue task counts

* Kanban board shows all tasks across 6 columns with drag-and-drop reordering

* Manager can create tasks directly from the dashboard with T-001 style numbering

* Search and priority filters help surface the most critical work

## **7.4 Bulk Task Extraction Flow**

* User sends a long message or project brief in Telegram

* Bot detects multiple task candidates in the message

* Claude Haiku extracts all tasks in bulk — with dates, priorities, and assignees

* Tasks are confirmed via inline pagination and saved to Supabase

## **7.5 Admin Webhook & Command Setup Flow**

* Team Lead/Admin opens the Settings panel and clicks "Register Webhook," which POSTs to /api/telegram/register and calls Telegram's setWebhook

* A "Check Status" action GETs webhook info to confirm registration succeeded

* A separate "Sync Commands" action pushes the bot's command list to Telegram via setMyCommands

* Each action is written to the audit log (e.g. settings.webhook.register, settings.commands.sync)

# **8\. Technical Constraints & Requirements**

## **8.1 Technology Stack**

| Layer | Technology | Notes |
| :---- | :---- | :---- |
| **Framework** | Next.js 16.2.2, React 19.2.4, TypeScript 5.x | SSR-first, full-stack |
| **Database** | Supabase (PostgreSQL) with SSR auth | RLS enabled on all tables; row-scoped (per-user/per-team) policies still targeted for a future release |
| **AI / NLP** | Anthropic Claude API — Claude Haiku (@anthropic-ai/sdk ^0.85.0) | NLP task parsing, standup summarization |
| **Telegram Bot** | Custom webhook handler (Next.js API route) — hand-rolled command router | 8 chat commands with inline pagination |
| **UI** | Tailwind CSS 4.x, shadcn/ui 4.2.0, Radix UI primitives | Accessible component library |
| **Drag & Drop** | @dnd-kit (Kanban board) | Order-index based column management |
| **Utilities** | date-fns, sonner (toasts), next-themes, Lucide icons | DX and UX quality tools |

## **8.2 Performance Targets**

| Metric | Target | Context |
| :---- | :---- | :---- |
| **Dashboard Initial Load** | \< 2.5 seconds | Full page with KPI cards and Kanban |
| **Telegram Bot Response (basic)** | \< 1 second | /tasks, /deadlines, /done commands |
| **Telegram Bot Response (AI-heavy)** | \< 3 seconds | /addtask, /standup with NLP |
| **Realtime Sync Latency** | \< 500 ms | Supabase Realtime updates to Kanban |
| **System Uptime** | ≥ 99.5% | Monthly SLA target |
| **Concurrent Users** | Up to 100 | v1 capacity planning baseline |

## **8.3 API Rate Limits & Constraints**

| API / Service | Constraint & Mitigation |
| :---- | :---- |
| Telegram Bot API | Webhook secured by bot token validation on every request via a custom Next.js route handler. Inline keyboard for interactive views. |
| Supabase | RLS enabled on all tables, but current policies grant full access to any authenticated user (no per-user/per-team row filtering yet). Dashboard data fetched via server-side queries. |
| Standup Scheduling | /api/standup is called on a schedule by an external cron service (cron-job.org), not an in-repo Vercel cron job. The endpoint currently has no shared-secret/auth check — see Risks. |

## **8.4 Security Requirements**

* Supabase Row-Level Security (RLS) — enabled on all tables today, but policies currently grant full access to any authenticated user; per-user/per-team scoped policies are targeted for a future release

* Telegram webhook secret validation on every incoming update

* Append-only audit logs — no deletion of historical records

* All secrets and API keys stored as secure environment variables

* Data encrypted at rest via Supabase managed encryption

* Gap: /api/standup, called by the external cron-job.org scheduler, is currently unauthenticated — a shared-secret check is targeted before wider rollout

## **8.5 Stack Summary**

| Layer | Technology & Notes | Version |
| :---- | :---- | :---- |
| Framework | Next.js (App Router) — Server Components for data-heavy pages; note: this version replaces middleware.ts with proxy.ts | 16.2.2 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | v4 |
| Database / Auth | Supabase (PostgreSQL) — RLS enabled, policies not yet row-scoped | Latest |
| Telegram Bot | Custom webhook handler at /api/telegram — hand-rolled router, not the grammy framework | — |
| Deployment | Vercel — Hosting | — |

# **9\. Out of Scope (v1 Q2 2026\)**

**The following features are intentionally deferred to keep v1.0 focused on core chat-native task management.**

* Resource management — defined in schema but unused in the current UI

* Code Camps — the dashboard UI and API routes were removed, but camp_id, the code_camps table, and related NLP intents remain in the schema/codebase as unused cleanup debt (see Risks)

* Role-based analytics charts — no charting library integrated in v1

* Time tracking and effort estimation — no time-logging fields exposed in UI

* Native iOS/Android apps — Telegram provides mobile access; native apps not required

* GitHub/GitLab sync — deferred to future enhancement roadmap

* Calendar integrations — not needed for current use case

# **10\. Risks & Mitigations**

| Risk | Likelihood | Impact | Mitigation |
| :---- | :---- | :---- | :---- |
| **No API rate limiting on Claude calls — every /addtask and standup hits Anthropic** | High | High | Implement per-user and per-team rate limits; add request queuing in v1.1 |
| **RLS is enabled on all tables, but every policy grants full access to any authenticated user — no real row-level filtering** | High | High | Design and implement per-user/per-team scoped RLS policies before any multi-tenant expansion |
| **/api/standup is unauthenticated and publicly callable; it's triggered by an external cron-job.org schedule with no shared secret check** | Medium | High | Add a shared-secret header check on /api/standup, validated against an env var configured to match the cron-job.org request |
| **Task search loads all tasks client-side (no query limit) and filters locally — now unbounded, not just capped at 500** | Medium | Medium | Add server-side full-text search using PostgreSQL pg\_trgm or Supabase search, and cap client fetch size |
| **Business days calculation ignores Philippine public holidays; default due date is hardcoded to the nearest Tuesday/Thursday "onsite day"** | Medium | Medium | Integrate a Philippine holiday calendar API or static lookup table |
| **Telegram command parsing is a hand-rolled if/else router on raw text, not a typed command framework — grammy is listed as a dependency but is never imported or used** | Medium | Medium | Either wire up grammy's typed command router or formally drop it as a dependency to avoid confusion |
| **Drag-and-drop order\_index may have race conditions under concurrent edits** | Low | Medium | Add optimistic locking or last-write-wins with conflict detection |
| **Telegram API changes breaking webhook integration** | Low | High | Monitor Telegram Bot API changelog; add integration tests against the webhook route |
| **Supabase Realtime hitting connection limits at scale** | Low | Medium | Monitor active subscriptions; implement connection pooling if needed |
| **Code Camps was removed from the UI/API but camp\_id, the code\_camps table, and addcamp/camps NLP intents remain as dead code; supabase/schema.sql's task\_status enum is also missing 'backlog', which the app code otherwise relies on — a sign schema.sql has drifted from the live database** | Low | Medium | Clean up unused camp code paths; regenerate schema.sql from the live database or add a migration for the missing enum value |

# **11\. Current Scope vs. Future Enhancements**

| Capability Area | v1.0 Status | Future Enhancement |
| :---- | :---- | :---- |
| **Task Creation** | 8 Telegram commands \+ dashboard dialog | Voice-to-task creation; inline keyboard actions |
| **NLP Parsing** | Claude Haiku single-task and bulk parse, with deterministic date-grounding to prevent hallucinated dates | Further accuracy tuning; target \>95% overall parse accuracy |
| **Standup Reports** | AI-generated with motivational quotes, externally scheduled via cron-job.org | Adaptive summaries based on team patterns; in-app schedule configuration |
| **Kanban Board** | 6-column drag-and-drop (Backlog, To Do, In Progress, In Review, Blocked, Done) | Burndown charts; workload heatmaps |
| **Analytics** | KPI dashboard cards | Predictive deadline risk scoring; trend analysis |
| **Member Management** | Roster with free-form roles, auto-registration | Smart workload balancing; capacity planning |
| **Notifications** | Deadline reminders, standup alerts | /myTasks command; personalized digest |
| **Integrations** | Telegram \+ Supabase \+ Anthropic | GitHub, Google Calendar, Slack |
| **Monetization** | None (v1) | Freemium \+ Pro \+ Enterprise tiers |
| **Security** | Auth \+ audit log \+ RLS enabled (policies not yet row-scoped) | Row-scoped RLS policies; SOC 2 alignment |
| **Onboarding** | Auto-registration from Telegram joins; webhook/command setup is admin-driven via the Settings dashboard | In-chat guided onboarding flow |
| **Code Camps** | Removed from UI/API; schema and some NLP intents remain as unused dead code | Full multi-camp UI with milestone tracking, or full removal |

# **12\. Summary, Links & Resources**

## **12.1 Executive Summary Snapshot**

| Attribute | Value |
| :---- | :---- |
| **Product** | DevieBot |
| **Version** | 1.1.0 |
| **Status** | Live |
| **Date** | August 10, 2026 |
| **Primary Interface** | Telegram Bot \+ Web Dashboard |
| **Core AI** | Claude Haiku via Anthropic API |
| **Database** | Supabase (PostgreSQL) |
| **Context** | DevCon Jumpstart Coding Bootcamp |
| **North Star Metric** | Weekly Active Teams (WAT) |
| **Key Differentiator** | Chat-native task management with real-time Kanban sync |

## **12.2 Key Technology Documentation**

The links below are the primary reference resources 

| Technology | Documentation / Reference | Description |
| :---- | :---- | :---- |
| **Next.js** | https://nextjs.org/docs | This full-stack framework serves as the core of the web dashboard, utilizing App Router and Server Components for efficient data handling. It was selected to provide a high-performance, SEO-friendly interface that supports complex server-side logic and fast initial load times. |
| **Supabase** | https://supabase.com/docs | Supabase provides the managed PostgreSQL database and authentication system required for secure data storage and user management. It was chosen for its built-in Realtime capabilities, which allow the Kanban board to sync instantly across all team members. |
| **Anthropic Claude API** | https://docs.anthropic.com | This API provides access to the Claude Haiku model, which handles the platform's natural language processing tasks. It was implemented to accurately parse plain-language Telegram commands into structured data and generate automated daily standup summaries.  |
| **Telegram Bot API** | https://core.telegram.org/bots/api | DevieBot's Telegram integration is a custom, hand-rolled webhook handler built directly on the Telegram Bot API inside a Next.js API route — not the grammy framework (grammy remains an installed but unused dependency). It handles command routing and interactive inline keyboards directly. |
| **BotFather**  | https://t.me/botfather  | This is the official Telegram tool used to create, configure, and manage bot accounts and their API tokens. It was used to set up the DevieBot identity, define global commands like `/addtask`, and secure the webhook connection to the server.  |
| **cron-job.org** | https://cron-job.org | A third-party scheduler used to trigger the daily standup by calling /api/standup at a configured time, since no in-repo/Vercel cron job is defined. |
| **shadcn/ui** | https://ui.shadcn.com | This is a collection of re-usable components built on top of Radix UI primitives for creating accessible user interfaces. It was used to rapidly build a professional, consistent dashboard that meets modern accessibility and design standards.  |
| **@dnd-kit** | https://dndkit.com | This is a lightweight and modular drag-and-drop toolkit specifically designed for React applications. It was chosen to enable the smooth, index-based reordering of tasks across the six columns of the real-time Kanban board.  |
| **Tailwind CSS** | https://tailwindcss.com/docs | This utility-first CSS framework provides low-level classes for styling components directly in the markup. It was implemented to streamline the development of a responsive, high-performance web dashboard while maintaining a small CSS footprint.  |

# **13\. Appendix — Glossary**

| Term | Definition |
| :---- | :---- |
| **WAT** | Weekly Active Teams — the North Star metric; teams creating or completing ≥1 task/week |
| **NLP** | Natural Language Processing — used to parse Telegram messages into structured task data |
| **Standup** | A daily team check-in where members share status, blockers, and plans for the day |
| **Kanban** | A visual board with columns representing task status stages (backlog → done) |
| **RLS** | Row-Level Security — Supabase/PostgreSQL feature that restricts data access per user/role |
| **Claude Haiku** | Anthropic's fast, cost-efficient LLM model used for NLP task parsing in DevieBot |
| **T-001** | The task numbering format used in DevieBot (prefix T- with zero-padded sequential number) |
| **Webhook** | An HTTP callback from Telegram to DevieBot's server when a new message is received |
| **Cohort** | A group of bootcamp students (e.g. cohort3, cohort4) — stored as a free-form role label on a member, not a fixed enum |
| **SSR** | Server-Side Rendering — Next.js feature used for Supabase authentication flows |

**Quick Links**  
**Live Web Dashboard:** [https://devie-devcon-jumpstart-cohort4-operations.vercel.app/dashboard](https://devie-devcon-jumpstart-cohort4-operations.vercel.app/dashboard)  
**DevieBot on Telegram:** https://t.me/DevieTheBot  
