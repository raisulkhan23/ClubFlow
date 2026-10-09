import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Link, useParams } from "react-router";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { CoverArt, EmptyState, PageHeader, StatusBadge } from "@/components/RequireRole";
import { displayClubName, fmtDate, fmtTimeRange } from "@/lib/format";
import { EVENT_STATUS_LABEL, registrationState } from "@/lib/event-state";

export default function FestDetails() {
  const { slug = "" } = useParams();
  const data = useQuery(api.fests.getPublicBySlug, { slug });
  // Captured once per mount so render stays pure.
  const [now] = useState(() => Date.now());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="ClubFlow home"><Logo markClass="size-7" /></Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/fests">Festivals</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/events">All events</Link></Button>
            <Button asChild size="sm"><Link to="/dashboard">My dashboard</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {data === undefined ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : data === null ? (
          <EmptyState
            icon={<CalendarDays />}
            title="Festival not found"
            description="This festival either does not exist or has not been published by the organization yet."
            action={<Button asChild size="sm"><Link to="/fests">Back to festivals</Link></Button>}
          />
        ) : (
          <>
            {/* Breadcrumb: Organization / Fest */}
            <p className="text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">{displayClubName(data.organization.name)}</Link>
              <span className="mx-1.5">/</span>
              <Link to="/fests" className="hover:text-foreground">Festivals</Link>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">{data.fest.name}</span>
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border bg-card">
              <CoverArt theme={data.fest.bannerTheme} className="h-32 w-full" />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-bold tracking-tight">{data.fest.name}</h1>
                  <StatusBadge status={data.fest.status === "published" ? "live" : "draft"} />
                  {data.fest.isDemo && (
                    <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                      Demonstration data
                    </Badge>
                  )}
                </div>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{data.fest.description}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {fmtDate(data.fest.startAt)} – {fmtDate(data.fest.endAt)}
                  </span>
                  {data.fest.venue && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden /> {data.fest.venue}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" aria-hidden />
                    {data.events.length} event{data.events.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            <PageHeader
              title="Events in this festival"
              description="Select an event to read its details and register on this site."
            />

            {data.events.length === 0 ? (
              <EmptyState
                icon={<CalendarDays />}
                title="No published events yet"
                description="Organizers are still adding the events for this festival. Check back soon."
                action={<Button asChild size="sm" variant="outline"><Link to="/events">Browse all events</Link></Button>}
              />
            ) : (
              <ul className="mt-4 divide-y divide-border rounded-xl border bg-card">
                {data.events.map((e) => {
                  // Public list has no confirmed counts; treat capacity as unknown
                  // here and let the event page show exact availability.
                  const state = registrationState(
                    { status: e.status, capacity: e.capacity, registrationDeadline: e.registrationDeadline },
                    0,
                  );
                  const closed = state !== "open" && state !== "almost_full";
                  return (
                    <li key={e._id}>
                      <Link
                        to={`/events/${e.slug}`}
                        className="group flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium group-hover:text-primary">{e.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{e.category}</span>
                            <span>{fmtTimeRange(e.startAt, e.endAt)}</span>
                            <span>{e.venue}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded border px-1.5 py-px text-[10px] ${
                              closed
                                ? "border-border bg-muted text-muted-foreground"
                                : "border-primary/30 bg-primary/10 text-primary"
                            }`}
                          >
                            {closed ? EVENT_STATUS_LABEL[state] ?? "Closed" : "Registration open"}
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              Deadline note: registration deadlines are enforced by the server on submit
              {data.events.some((e) => e.registrationDeadline < now)
                ? " — some events above have already closed."
                : "."}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
