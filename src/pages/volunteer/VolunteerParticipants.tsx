import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import type { Id } from "@/convex/_generated/dataModel";

const STATUS_TEXT: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const BADGE_CLASS: Record<string, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-rose-500/10 text-rose-700 border-rose-200",
};

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

  const registrations = (regs?.registrations ?? []) as RegRow[];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return registrations;
    return registrations.filter(
      (r) =>
        r.participantName.toLowerCase().includes(s) ||
        r.registrationId.toLowerCase().includes(s),
    );
  }, [registrations, search]);

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
        <p className="mt-1 text-muted-foreground">
          {assignedEvent ? assignedEvent.eventTitle : "Attendees registered for your event."}
        </p>
      </div>

      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or registration ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
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
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {filtered.map((r) => (
                <li key={r.registrationId} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {r.participantName}
                      {r.teamName && (
                        <span className="ml-2 text-xs text-muted-foreground">({r.teamName})</span>
                      )}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{r.registrationId}</span>
                      {r.checkedInAt ? (
                        <span className="text-indigo-600">Checked in {fmtDate(r.checkedInAt)}</span>
                      ) : (
                        <span>Registered {fmtDate(r.createdAt)}</span>
                      )}
                    </div>
                  </div>
                  {r.checkedInAt ? (
                    <Badge className="bg-indigo-500/10 text-indigo-700 border-indigo-200 shrink-0">
                      ✓ Checked in
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={`${BADGE_CLASS[r.status] ?? ""} shrink-0`}>
                      {STATUS_TEXT[r.status] ?? r.status}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
