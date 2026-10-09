import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  RefreshCw,
  Timer,
  UserSearch,
} from "lucide-react";
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
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { fmtTime, fmtRelative } from "@/lib/format";
import { PageHeader } from "@/components/RequireRole";
import type { Id } from "@/convex/_generated/dataModel";

export default function LiveMode() {
  const events = useQuery(api.events.listForOrganizer);
  const [eventId, setEventId] = useState<string>("");

  const currentId = (eventId || events?.[0]?._id) as Id<"events"> | undefined;

  // Live event data — Convex subscriptions are real-time; no polling loop needed.
  const stats = useQuery(
    api.registrations.getEventRegistrationStats,
    currentId ? { eventId: currentId } : "skip",
  );
  const schedule = useQuery(
    api.events.getForOrganizer,
    currentId ? { eventId: currentId } : "skip",
  );
  const activity = useQuery(api.dashboard.organizerOverview, {});

  const setStatus = useMutation(api.events.setEventStatus);

  const event = (events ?? []).find((e) => e._id === currentId);

  const doStatus = async (status: "published" | "registration_closed" | "live" | "completed") => {
    if (!currentId) return;
    try {
      await setStatus({ eventId: currentId, status });
      toast.success(`Event is now ${status.replace("_", " ")}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change status.");
    }
  };

  const confirmed = stats?.confirmed ?? 0;
  const checkedIn = stats?.checkedIn ?? 0;
  const attPct = confirmed ? Math.round((checkedIn / confirmed) * 100) : 0;

  return (
    <div className="space-y-6 px-4 py-7 sm:px-6">
      <PageHeader
        title="Live event mode"
        description="Big-format operational panel — updates arrive in real time via reactive subscriptions."
        actions={
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300">
            <Activity className="size-3.5" /> Live · data as of {stats ? fmtRelative(stats.asOf) : "…"}
          </Badge>
        }
      />

      {events === undefined ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-muted" />)}</div>
      ) : (events ?? []).length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon"><Timer className="size-5" /></EmptyMedia>
          <EmptyTitle>No events to monitor</EmptyTitle>
          <EmptyDescription>Create and publish an event first.</EmptyDescription>
        </Empty>
      ) : (
        <>
          <div className="max-w-xs">
            <Select value={currentId ?? ""} onValueChange={setEventId}>
              <SelectTrigger aria-label="Event" className="w-full"><SelectValue placeholder="Choose an event" /></SelectTrigger>
              <SelectContent>
                {(events ?? []).map((e) => <SelectItem key={e._id} value={e._id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {currentId && (
            <>
              {/* Big numbers */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <BigStat label="Confirmed" value={confirmed} tone="text-foreground" />
                <BigStat label="Checked in" value={checkedIn} tone="text-emerald-600 dark:text-emerald-400" />
                <BigStat label="Attendance" value={`${attPct}%`} tone="text-primary" />
                <BigStat label="Pending approvals" value={stats?.pending ?? 0} tone={stats && stats.pending > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"} />
              </div>

              {/* Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Session status — {event?.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void doStatus("published")} disabled={event?.status === "published"}>
                    Open registration
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void doStatus("registration_closed")} disabled={event?.status === "registration_closed"}>
                    Close registration
                  </Button>
                  <Button size="sm" onClick={() => void doStatus("live")} disabled={event?.status === "live"}>
                    Start event (live)
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => void doStatus("completed")} disabled={event?.status === "completed"}>
                    End event
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="ml-auto">
                    <a href="/organizer/checkin"><UserSearch className="mr-1 size-3.5" /> Check-in desk</a>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <a href="/organizer/announcements"><Megaphone className="mr-1 size-3.5" /> Announcement</a>
                  </Button>
                </CardContent>
              </Card>

              {/* Schedule + activity */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(schedule?.event.schedule ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No schedule items configured for this event.</p>
                    ) : (
                      (schedule?.event.schedule ?? []).map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{s.title}</p>
                            {s.description && <p className="truncate text-xs text-muted-foreground">{s.description}</p>}
                          </div>
                          <span className="shrink-0 text-sm tabular text-muted-foreground">{s.time}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="size-4 text-amber-500" /> Recent activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-72 space-y-1.5 overflow-y-auto">
                    {(activity?.activity ?? []).slice(0, 12).map((a) => (
                      <div key={a._id} className="flex items-center gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-sm">
                        <CheckCircle2 className="size-3.5 shrink-0 text-primary/70" />
                        <span className="min-w-0 flex-1 truncate">{a.message}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmtTime(a.createdAt)}</span>
                      </div>
                    ))}
                    {(activity?.activity ?? []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <RefreshCw className="size-3" aria-hidden />
        Numbers are computed directly from live database subscriptions — counts are only shown once reflected here.
      </p>
    </div>
  );
}

function BigStat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`font-display text-4xl font-bold tabular ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
