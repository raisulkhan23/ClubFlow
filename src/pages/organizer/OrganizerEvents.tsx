import { useQuery, useState, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import type { PublicEvent } from "@/convex/events";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
];

export default function OrganizerEvents() {
  const events = useQuery(api.events.listForOrganizer);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo<PublicEvent[]>(() => {
    const list = events ?? [];
    if (statusFilter === "all") return list;
    return list.filter((e) => e.status === statusFilter);
  }, [events, statusFilter]);

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="mt-1 text-muted-foreground">Manage your club's events.</p>
        </div>
        <Button asChild>
          <a href="/organizer/events/new">
            <Plus className="mr-2 size-4" />
            New event
          </a>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyTitle>No events here</EmptyTitle>
          <EmptyDescription>
            {statusFilter === "all"
              ? "You haven't created any events yet."
              : `No ${statusFilter} events found.`}
          </EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <a href="/organizer/events/new">Create your first event</a>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e: PublicEvent) => (
            <Card key={e._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="shrink-0">
                    {e.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {fmtDate(e.startAt)}
                  </span>
                </div>
                <CardTitle className="text-lg mt-1 line-clamp-1">{e.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {e.shortDescription}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{e.clubName}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{e.confirmedCount} confirmed</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{e.capacity.toLocaleString()} cap.</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <a href={`/organizer/events/${e._id}`}>Edit</a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <a href={`/organizer/participants?eventId=${e._id}`}>
                      Participants
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
