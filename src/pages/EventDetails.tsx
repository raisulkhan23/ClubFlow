import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CoverArt, EmptyState, StatusBadge } from "@/components/RequireRole";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, MapPin, Megaphone, Trophy, Users } from "lucide-react";
import { Link, useParams } from "react-router";
import { useState } from "react";
import { countdown, fmtDate, fmtDateTime } from "@/lib/format";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const data = useQuery(api.events.getPublicBySlug, slug ? { slug } : "skip");
  // Captured once per mount so render stays pure.
  const [now] = useState(() => Date.now());

  if (data === undefined) {
    return (
      <main className="min-h-screen bg-background">
        <Skeleton className="h-56 w-full rounded-none" />
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <EmptyState
          title="Event not found"
          description="This event doesn't exist or isn't public yet."
          action={
            <Button asChild>
              <Link to="/events">Browse events</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const { event, club, publishedResults, announcements } = data;
  const fillPct = Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100));
  const isOver = event.endAt < now;

  const cta =
    event.state === "open" || event.state === "almost_full" ? (
      <Button asChild size="lg" className="w-full sm:w-auto">
        <Link to={`/events/${event.slug}/register`}>Register now</Link>
      </Button>
    ) : event.state === "full" ? (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Event full
      </Button>
    ) : event.state === "closed" ? (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Registration closed
      </Button>
    ) : event.state === "live" ? (
      <Button size="lg" disabled variant="secondary" className="w-full sm:w-auto">
        Event happening now
      </Button>
    ) : (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Event completed
      </Button>
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/events" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            ← All events
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/verify">Verify certificate</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/dashboard">My dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Banner */}
      <CoverArt theme={event.coverTheme} title={event.title} className="h-52 sm:h-64">
        <div className="flex h-full flex-col justify-end p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {event.category}
            </span>
            <StatusBadge status={event.state} dot={event.state === "live"} />
            {event.teamEvent && (
              <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur">
                Team · {event.minTeamSize}–{event.maxTeamSize} members
              </span>
            )}
          </div>
          <h1 className="mt-3 max-w-2xl font-display text-2xl font-bold text-white sm:text-4xl">{event.title}</h1>
          <p className="mt-1 text-sm text-white/70">Hosted by DRMC IT CLUB</p>
        </div>
      </CoverArt>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="font-display text-lg font-semibold">About this event</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p>
          </section>

          {event.prizes && (
            <section className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <Trophy className="size-4 text-primary" /> Prizes
              </h3>
              <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">{event.prizes}</p>
            </section>
          )}

          {event.schedule.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold">Schedule</h2>
              <ol className="mt-3 space-y-0">
                {event.schedule.map((s, i) => (
                  <li key={s.id} className="relative flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 size-2.5 rounded-full border-2 border-primary bg-background" />
                      {i < event.schedule.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary">{s.time}</p>
                      <p className="text-sm font-semibold">{s.title}</p>
                      {s.description && <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(event.eligibility || event.rules) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {event.eligibility && (
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="text-sm font-semibold">Eligibility</h3>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">{event.eligibility}</p>
                </div>
              )}
              {event.rules && (
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="text-sm font-semibold">Rules</h3>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">{event.rules}</p>
                </div>
              )}
            </section>
          )}

          {announcements.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Megaphone className="size-4 text-primary" /> Announcements
              </h2>
              <div className="mt-3 space-y-2">
                {announcements.map((a) => (
                  <div key={a.title} className="rounded-xl border bg-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <StatusBadge status={a.priority} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{fmtDateTime(a.publishedAt)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {publishedResults.length > 0 && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Trophy className="size-4 text-primary" /> Results
              </h2>
              <div className="mt-3 space-y-2">
                {publishedResults.map((r) => (
                  <div key={`${r.position}-${r.participantName}`} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="w-8 text-center text-xl">{MEDALS[r.position - 1] ?? "🏅"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.participantName}</p>
                      <p className="text-xs text-muted-foreground">{r.positionLabel}{r.score !== undefined ? ` · ${r.score} pts` : ""}</p>
                      {r.remarks && <p className="mt-0.5 text-xs text-muted-foreground">{r.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {event.faq.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold">FAQ</h2>
              <Accordion type="single" collapsible className="mt-3">
                {event.faq.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-sm">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground">
              {event.state === "open" || event.state === "almost_full"
                ? `Registration closes ${fmtDate(event.registrationDeadline)}`
                : event.state === "live"
                  ? "Event happening now"
                  : event.state === "completed"
                    ? "Event completed"
                    : "Registration closed"}
            </p>
            {event.state === "open" && !isOver && (
              <p className="mt-1 font-display text-xl font-bold text-primary">{countdown(event.startAt)}</p>
            )}
            <div className="mt-4">{cta}</div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> {event.confirmedCount} / {event.capacity} seats
                </span>
                <span className="tabular">{fillPct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-5 text-sm">
            <p className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="block font-medium">{fmtDate(event.startAt)}</span>
                <span className="text-xs text-muted-foreground">
                  {fmtDateTime(event.startAt)} → {fmtDate(event.endAt)}
                </span>
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="block font-medium">{event.venue}</span>
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="block font-medium">Registration deadline</span>
                <span className="text-xs text-muted-foreground">{fmtDateTime(event.registrationDeadline)}</span>
              </span>
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5 text-sm">
            <h3 className="text-sm font-semibold">Contact</h3>
            <p className="mt-1.5 text-muted-foreground">{event.contactEmail}</p>
            {event.contactPhone && <p className="text-muted-foreground">{event.contactPhone}</p>}
            <p className="mt-2 text-xs text-muted-foreground">Organized by DRMC IT CLUB</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
