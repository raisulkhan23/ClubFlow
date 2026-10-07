import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";
import type { PublicEvent } from "@/convex/events";

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-500/10 text-amber-600",
  done: "bg-emerald-500/10 text-emerald-600",
};

export default function OrganizerOverview() {
  const { user } = useAuth();
  const events = useQuery(api.events.listForOrganizer);
  const pendingTasks = useQuery(api.tasks.list);

  const total = events?.length ?? 0;
  const upcoming = events?.filter(
    (e) => new Date(e.startAt) > new Date() && e.status === "published",
  ).length ?? 0;
  const live = events?.filter((e) => e.status === "live").length ?? 0;
  const recent = (events ?? [])
    .filter((e) => e.status === "completed")
    .slice(0, 3);

  const tasks = (pendingTasks ?? []).filter((t) => t.status !== "done");
  const doneThisWeek =
    (pendingTasks ?? []).filter(
      (t) => t.status === "done" && t.updatedAt > Date.now() - 7 * 86400000,
    ).length ?? 0;

  return (
    <div className="space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Good day, {user?.name ? user.name.split(" ")[0] : "organizer"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <CalendarDays className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total events</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming published</p>
                <p className="text-2xl font-bold">{upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-500/10 p-3">
                <Clock className="size-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Live now</p>
                <p className="text-2xl font-bold">{live}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-indigo-500/10 p-3">
                <Users className="size-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks done this week</p>
                <p className="text-2xl font-bold">{doneThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-rose-500" />
              <CardTitle className="text-base">Pending tasks</CardTitle>
              <Badge variant="secondary" className="ml-auto">
                {tasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasks.slice(0, 6).map((t) => (
                <li
                  key={t._id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                >
                  <Clock className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.deadline ? `${fmtDate(t.deadline)} · ` : ""}
                      {t.assigneeName ?? "Unassigned"}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[t.status] ?? ""}>
                    {t.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent completed events</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed events yet.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((e: PublicEvent) => (
                  <li
                    key={e._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {e.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmtDate(e.endAt)} · {e.confirmedCount} attended
                      </p>
                    </div>
                    <Badge variant="secondary">{e.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/organizer/events/new">Create event</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/organizer/participants">View participants</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/organizer/checkin">Open check-in</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground">
        {total} events organized across your club.
      </div>
    </div>
  );
}
