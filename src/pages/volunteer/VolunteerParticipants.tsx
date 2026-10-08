import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusBadge } from "@/components/RequireRole";
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import type { Id } from "@/convex/_generated/dataModel";

type RegRow = {
  registrationId: string;
  participantName: string;
  type: string;
  teamName?: string;
  status: string;
  checkedInAt?: number;
  createdAt: number;
};

export default function VolunteerParticipants() {
  const [search, setSearch] = useState("");

  const assignments = useQuery(api.volunteers.myAssignments);
  const assignedEvent = (assignments ?? []).find(
    (a) => a.eventStatus === "live" || a.eventStatus === "published",
  );
  const regs = useQuery(
    api.registrations.listForVolunteer,
    assignedEvent ? { eventId: assignedEvent.eventId as Id<"events"> } : "skip",
  );

  const filtered = useMemo(() => {
    const registrations = (regs?.registrations ?? []) as RegRow[];
    const s = search.trim().toLowerCase();
    if (!s) return registrations;
    return registrations.filter(
      (r) =>
        r.participantName.toLowerCase().includes(s) ||
        r.registrationId.toLowerCase().includes(s),
    );
  }, [regs, search]);

  return (
    <div className="space-y-6 px-4 py-7 sm:px-6">
      <PageHeader
        title="Participants"
        description={
          assignedEvent ? assignedEvent.eventTitle : "Attendees registered for your event."
        }
      />

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search by name or registration ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search participants"
          className="h-9 pl-8"
        />
      </div>

      {regs === undefined ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Users className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No participants found</EmptyTitle>
          <EmptyDescription>
            {search
              ? "Try adjusting your search."
              : assignedEvent
              ? "Attendees will appear once they register."
              : "You haven't been assigned to any active events yet."}
          </EmptyDescription>
        </Empty>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
          {filtered.map((r) => (
            <li
              key={r.registrationId}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {r.participantName}
                  {r.teamName && (
                    <span className="ml-2 text-xs text-muted-foreground">({r.teamName})</span>
                  )}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{r.registrationId}</span>
                  <span>
                    {r.checkedInAt
                      ? `Checked in ${fmtDate(r.checkedInAt)}`
                      : `Registered ${fmtDate(r.createdAt)}`}
                  </span>
                </div>
              </div>
              <StatusBadge
                status={r.checkedInAt ? "checked_in" : r.status}
                dot
                className="shrink-0"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
