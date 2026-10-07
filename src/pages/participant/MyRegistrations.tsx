import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ParticipantShell } from "./ParticipantShell";
import { CoverArt, EmptyState, PageHeader, StatusBadge } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Ticket } from "lucide-react";
import { Link } from "react-router";
import { fmtDate } from "@/lib/format";

export default function MyRegistrations() {
  const regs = useQuery(api.registrations.myRegistrations);

  return (
    <ParticipantShell>
      <PageHeader
        title="My Registrations"
        description="Every event you've signed up for, with live status."
        actions={
          <Button asChild variant="outline">
            <Link to="/events">Browse events</Link>
          </Button>
        }
      />

      {regs === undefined ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : regs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Ticket className="size-5" />}
            title="No registrations yet"
            description="Registrations will appear here when you sign up for an event."
            action={<Button asChild><Link to="/events">Find an event</Link></Button>}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {regs.map((r) => (
            <Link
              key={r._id}
              to={`/dashboard/registrations/${r._id}`}
              className="group flex overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
            >
              <CoverArt theme={r.event.coverTheme} className="w-20 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold group-hover:text-primary">{r.event.title}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" /> {fmtDate(r.event.startAt)} · {r.event.venue}
                  </p>
                  {r.teamName && <p className="mt-0.5 text-xs text-primary">Team: {r.teamName}</p>}
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-muted-foreground">{r.registrationId}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {r.certificateId && (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        🏅 Certificate
                      </span>
                    )}
                    <StatusBadge status={r.checkedInAt ? "checked_in" : r.status} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ParticipantShell>
  );
}
