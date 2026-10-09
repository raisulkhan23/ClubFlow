import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ParticipantShell } from "./ParticipantShell";
import {
  CoverArt,
  EmptyState,
  PageHeader,
  Metric,
  MetricStrip,
  StatusBadge,
} from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router";
import { countdown, fmtDate, fmtRelative } from "@/lib/format";

export default function ParticipantOverview() {
  const data = useQuery(api.dashboard.participantOverview);

  return (
    <ParticipantShell>
      <PageHeader
        title="Welcome back"
        description="Your registrations, announcements and certificates — all in one place."
        actions={
          <Button asChild>
            <Link to="/events">Browse events</Link>
          </Button>
        }
      />

      {data === undefined ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <MetricStrip columns={3}>
              <Metric label="Active" value={data.totalRegistrations} hint="registrations" />
              <Metric label="Certificates" value={data.certificates} hint="available" />
              <Metric
                label="Unread"
                value={data.unread}
                hint="notifications"
                tone={data.unread > 0 ? "primary" : "default"}
              />
            </MetricStrip>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Upcoming */}
            <section>
              <h2 className="font-display text-sm font-semibold tracking-tight">Upcoming registrations</h2>
              <div className="mt-3 space-y-2">
                {data.upcoming.length === 0 && (
                  <EmptyState
                    icon={<CalendarDays />}
                    title="No upcoming events yet"
                    description="When you register for an event, it shows up here with your QR ticket."
                    action={<Button asChild><Link to="/events">Find an event</Link></Button>}
                  />
                )}
                {data.upcoming.map((r) => (
                  <Link
                    key={r._id}
                    to={`/dashboard/registrations/${r._id}`}
                    className="group flex overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/40"
                  >
                    <CoverArt theme={r.event.coverTheme} className="w-24 shrink-0" />
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-semibold group-hover:text-primary">{r.event.title}</h3>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" /> {fmtDate(r.event.startAt)} · {countdown(r.event.startAt)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" /> {r.event.venue}
                      </p>
                      {r.teamName && <p className="mt-1 text-xs text-primary">Team: {r.teamName}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Announcements */}
            <section>
              <h2 className="font-display text-sm font-semibold tracking-tight">Announcements</h2>
              <div className="mt-3 space-y-2">
                {data.announcements.length === 0 && (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Announcements from your events will appear here.
                  </p>
                )}
                {data.announcements.map((a) => (
                  <div key={a._id} className="rounded-lg border bg-card p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <StatusBadge status={a.priority} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {a.eventTitle} · {fmtRelative(a.publishedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </ParticipantShell>
  );
}
