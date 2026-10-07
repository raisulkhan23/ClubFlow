import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";


const STATUS_TEXT: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  checked_in: "Checked in",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const BADGE_CLASS: Record<string, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  checked_in: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-rose-500/10 text-rose-700 border-rose-200",
};

export default function VolunteerParticipants() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Volunteers see participants for events they're assigned to.
  // Since assignment lookup requires a backend query we don't have yet,
  // we show a friendly placeholder. Connect to listForVolunteer(eventId)
  // once the volunteer has an active assignment.
  const registrations = null;

  const filtered = useMemo(() => {
    return [];
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
        <p className="mt-1 text-muted-foreground">
          Attendees registered for your event.
        </p>
      </div>

      {activeEvent && <Badge variant="secondary">{activeEvent.title}</Badge>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="checked_in">Checked in</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Users className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No participants found</EmptyTitle>
          <EmptyDescription>
            {search || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "Attendees will appear once they register."}
          </EmptyDescription>
        </Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {filtered.map((r) => (
                <li
                  key={r._id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-medium">{r.participantName}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {r.email && <span>{r.email}</span>}
                      {r.status !== "checked_in" && r.createdAt && (
                        <span className="text-muted-foreground/70">
                          Registered {fmtDate(r.createdAt)}
                        </span>
                      )}
                      {r.checkedInAt && (
                        <span className="text-indigo-600">
                          Checked in {fmtDate(r.checkedInAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={BADGE_CLASS[r.status] ?? ""}
                  >
                    {STATUS_TEXT[r.status] ?? r.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
