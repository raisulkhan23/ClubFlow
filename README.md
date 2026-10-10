# ClubFlow

## 1. Project Description

ClubFlow is an event-operations platform for student clubs. It replaces the usual
pile of Google Forms, WhatsApp groups and spreadsheets with one system that runs a
club's fests end to end.

The product is built around the contest rulebook hierarchy:

**Organization → Fest → Event → Registration**

* One organization (e.g. *DRMC IT Club*) can run many fests.
* Each fest (e.g. *Tech Carnival 2026*) contains many events.
* Participants register for individual events directly on the website — no
  external form service is involved at any point.

Built for the **9th DRMC International Tech Carnival 2026 — AI Web Development
Contest**, official theme: **Smart Club Operations**.

## 2. Features

**Fest directory (public)**
* Published, upcoming and completed fests with dates, banners and descriptions.
* Event cards with title, category, date, venue, short description and live
  registration status (Open / Almost Full / Full / Closed / Live / Completed).
* Case- and spacing-tolerant event search across title, category, venue and
  description, combined with category filters and a clear-filters control.
* Breadcrumbs for the full lineage: `DRMC IT Club → Tech Carnival 2026 → AI Web Development Contest`.
* Fest details and per-event detail pages with deadline, capacity and availability.

**Registration**
* Event-specific dynamic forms (11 field types, conditional fields, team events).
* Required-field validation in the browser **and** on the server, with clean
  user-facing messages shown in a readable error card.
* Deadlines, eligibility and capacity enforced server-side, including under
  simultaneous submissions.
* Duplicate-registration prevention per event.
* Confirmation screen with a unique reference (`CLF-2026-XXXXXX`) and a QR ticket.
* Participants view, download and cancel their own registrations and certificates.

**Organizer workspace**
* Dashboard with statistics computed from real stored records.
* Participant lists per event with search, status filters and sorting.
* Registration status workflow (pending → confirmed / rejected / cancelled).
* Event editor, fest management, volunteers, tasks, announcements, analytics and
  CSV export — every action guarded server-side by role and club membership.

**Volunteer workspace**
* QR check-in scanner with manual lookup fallback for assigned events.

**Creative features**
* Event readiness checklist (tasks with owners and deadlines).
* Volunteer assignment and tracking.
* Registration analytics and capacity insights.
* Targeted announcements by audience and priority.
* QR-based attendance check-in.
* Post-event feedback collection with summaries.
* Activity timeline, verifiable PDF certificates (`/verify/<ID>`).

## 3. Tech Stack

* **Frontend:** Vite, TypeScript, React 19, React Router v7, Tailwind CSS v4,
  shadcn/ui (Radix primitives), Framer Motion, Recharts, Lucide icons.
* **Backend & database:** Convex (queries, mutations, reactive subscriptions).
* **Authentication:** Convex Auth — email OTP, plus anonymous sessions for demos.
* **PDF & media:** jsPDF (certificates), `qrcode` (tickets), `qr-scanner` (check-in).
* **Package manager:** Bun (Vite/`npm run build` also work; the deploy uses npm).
* All application code lives in `src/`; Convex backend functions in `src/convex/`.

## 4. Setup Instructions

```bash
# 1. Install dependencies
bun install            # or: npm install

# 2. Provide Convex configuration (see below) in a local .env.local file
#    CONVEX_DEPLOYMENT=<your-deployment-url>
#    VITE_CONVEX_URL=https://<deployment>.convex.cloud

# 3. Start the Convex dev deployment (pushes backend + regenerates types)
bunx convex dev --once

# 4. Start the app
bun run dev            # http://localhost:5173
```

**Environment variables**

| Variable | Where | Purpose |
| --- | --- | --- |
| `CONVEX_DEPLOYMENT` | server / CLI | Points the Convex CLI at the right deployment (written by `convex dev`) |
| `VITE_CONVEX_URL` | Vite build | Client URL of the Convex deployment, e.g. `https://<deployment>.convex.cloud` |

Backend-only auth secrets (`JWKS`, `JWT_PRIVATE_KEY`, `SITE_URL`) live in the
Convex deployment, never in this repository.

**Build:** `npm run build` (runs `tsc -b` then `vite build`).
**Type-check:** `npx tsc -b`. Convex types are generated, not hand-written — if
`src/convex/_generated/` is missing, run `bunx convex dev --once` first.

**Seeding:** demo data seeds itself. The first demo login calls an idempotent
seeder guarded by a `meta.seeded` lock, so it never overwrites or resets
production records and is safe to re-run.

## 5. Deployment URL

**https://clubflow.freebuff.app/**

> **Status — read this before judging.** The production build currently fails at
> runtime with `No address provided to ConvexReactClient`. The deploy pipeline
> runs `npm run build` on a machine without `.env.local`, and `VITE_CONVEX_URL`
> is only read at build time, so the value is missing from the bundle. The fix is
> one step: set `VITE_CONVEX_URL` (and `CONVEX_DEPLOYMENT` if deploying the
> backend too) in the host's *Production* environment variables, then redeploy.
> Until that variable exists, use the Freebuff preview environment, which has it
> configured and runs the full application against a live Convex backend.

## 6. Demo Credentials

No credentials are required. On `/auth`, the **demo panel** starts a
one-click session with the correct role and seeded data:

| Demo | What it shows |
| --- | --- |
| Organizer Demo | Full workspace: events, registrations, participants, analytics, certificates |
| Volunteer Demo | QR check-in scanner at assigned events |
| Participant Demo | Browse events, register, QR ticket, certificates |
| Super Admin Demo | Platform-wide clubs & events console |

Demo sessions are anonymous and clearly labelled in the page header and footer;
they can be left at any time from the header pill. Verified email sign-in is also
available (email OTP). The very first real account can claim super admin from the
access-denied screen while the platform has none; after that, promotion happens
from the Admin console.

## 7. Third-Party Services and APIs

* **Convex** — database, reactive backend, file storage hooks and hosting for all
  server functions (`https://convex.cloud`).
* **Convex Auth** — email OTP sign-in and anonymous demo sessions.
* **Freebuff** — frontend hosting and preview/deploy pipeline.
* **jsPDF / qrcode / qr-scanner** — client-side certificate PDFs, QR generation
  and camera scanning (no external API calls).
* No payment, email-delivery or analytics third parties are currently wired in.

## 8. AI Tools and Features Used

* **Freebuff** — the primary development agent. Worked end to end in this
  repository: audited the existing codebase, implemented the fest hierarchy,
  registration system, organizer/volunteer workspaces and the seed pipeline, and
  produced the deployment fixes and the README rewrite.
* **Convex codegen** (`convex dev`) — generated API and data-model types.
* No third-party generated code was vendored without review; AI-produced
  registration, authorization and capacity logic was reviewed against the
  rulebook before being kept.

## 9. Screenshots

> **Pending.** The contest rules require screenshots of the *actually running*
> application, and this build's production deployment is currently blocked (see
> §5). Rather than substitute mockups, the shots below should be captured from
> the working preview environment after `VITE_CONVEX_URL` is set in production:
>
> 1. Festival directory (`/fests`) — cards, statuses, responsive grid
> 2. Festival details + event list (`/fests/<slug>`)
> 3. Event details (`/events/<slug>`) — deadline, capacity, breadcrumb
> 4. Registration form (`/events/<slug>/register`) and confirmation screen
> 5. Organizer dashboard (`/organizer`) — statistics from real records
> 6. Participant management with search, status filters and export
> 7. Mobile layout at 375px and 430px widths
>
> Capture with: `bunx convex dev --once && bun run dev`, then screenshot at
> 1440px (desktop) and 390px (mobile).

## 10. Known Limitations

* **Production env var:** `VITE_CONVEX_URL` must be set in the host's Production
  environment or the deployed bundle crashes on boot (§5).
* **Screenshots:** pending for the reason above (§9).
* **GitHub visibility:** must be flipped to *public* manually by the repo owner —
  the publishing agent has no repository-admin credentials.
* **Sample data:** all fests, events, registrations and certificates are clearly
  labelled demonstration records. No official schedule, result or real
  registration is claimed.
* **Email OTP:** requires SMTP/mail credentials in the Convex deployment; the demo
  role logins work without them.
* **PDF certificates** are generated in-browser, so they depend on a modern
  browser and are not stored server-side.

## 11. License

MIT — see [LICENSE](https://github.com/raisulkhan23/ClubFlow/blob/main/LICENSE). Copyright © 2026 DRMC IT Club. Dependencies are
distributed under their own licenses (MIT/Apache-2.0); no copyleft libraries are
bundled.

## 12. Submission Notes for Judges

* **Rulebook compliance:** Organization → Fest → Event → Registration is the real
  data model (`clubs`, `fests`, `events`, `registrations` in `src/convex/schema.ts`),
  enforced end to end. Registration is first-party; no Google Forms or external
  form service is used anywhere.
* **Server-side enforcement:** deadlines, capacity, duplicate prevention,
  eligibility, role checks and record ownership are all enforced inside Convex
  mutations (`src/convex/registrations.ts`, `events.ts`, `helpers.ts`) — never by
  the frontend alone.
* **Rulebook sample data:** the three example fests (Tech Carnival 2026, Winter
  Tech Fest 2026, Freshers Tech Fest 2027) and the example Tech Carnival events
  are seeded as clearly marked demo records, including varied registration states
  so search, filters and participant management can be evaluated immediately.
* **Re-running seeds** is safe: seeding is locked by `meta.seeded` and never
  deletes or overwrites user data.
* **Verification of certificates** is public at `/verify/<certificateId>` and
  exposes no private participant data.

## 13. Organizing Authority Disclaimer

The organizing authority reserves the right to make the final decision regarding
rule interpretation, eligibility, judging, scoring, and any matters not
explicitly covered in these guidelines. All decisions made by the judging panel
and organizing authority shall be final.
