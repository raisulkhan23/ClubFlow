import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Megaphone,
  Plus,
  ScanLine,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { fmtDate, fmtDateTime } from "@/lib/format";
import type { Id } from "@/convex/_generated/dataModel";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Open",
  registration_closed: "Closed",
  live: "Live",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-500/10 text-emerald-700",
  registration_closed: "bg-amber-500/10 text-amber-700",
  live: "bg-rose-500/10 text-rose-700",
  completed: "bg-indigo-500/10 text-indigo-700",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type Overview = {
  stats: {
    totalEvents: number;
    activeEvents: number;
    totalRegistrations: number;
    todayRegistrations: number;
    attendanceRate: number;
    pendingTasks: number;
    overdueTasks: number;
    pendingApprovals: number;
    certificates: number;
  };
  series: Array<{ day: string; count: number }>;
  byEvent: Array<{ title: string; count: number }>;
  upcoming: Array<{
    _id: string;
    title: string;
    status: string;
    startAt: number;
    capacity: number;
    confirmedCount: number;
  }>;
  openTasksList: Array<{ _id: string; title: string; status: string; priority: string; deadline?: number }>;
  activity: Array<{ _id: string; type: string; message: string; createdAt: number }>;
};

export default function OrganizerOverview() {
  const { user } = useAuth();
  const data = useQuery(api.dashboard.organizerOverview) as Overview | undefined;

  const firstName = user?.name ? user.name.split(" ")[0] : "organizer";

  const needsAttention: Array<{ icon: typeof AlertCircle; tone: string; text: string; to: string }> = [];
  if (data) {
    const { stats, upcoming } = data;
    if (stats.pendingApprovals > 0) {
      needsAttention.push({
        icon: AlertCircle,
        tone: "amber",
        text: `${stats.pendingApprovals} registration${stats.pendingApprovals === 1 ? "" : "s"} awaiting your approval`,
        to: "/organizer/participants",
      });
    }
    if (stats.overdueTasks > 0) {
      needsAttention.push({
        icon: Clock,
        tone: "rose",
        text: `${stats.overdueTasks} task${stats.overdueTasks === 1 ? "" : "s"} overdue`,
        to: "/organizer/tasks",
      });
    }
    for (const e of upcoming.slice(0, 3)) {
      const pct = e.capacity ? Math.round((e.confirmedCount / e.capacity) * 100) : 0;
      if (pct >= 87 && e.status === "published") {
        needsAttention.push({
          icon: Users,
          tone: "indigo",
          text: `${e.title}: ${pct}% of seats filled`,
          to: `/organizer/events/${e._id}`,
        });
      }
      const daysTo = Math.round((e.startAt - Date.now()) / 86_400_000);
      if (daysTo >= 0 && daysTo <= 1 && ["published", "registration_closed"].includes(e.status)) {
        needsAttention.push({
          icon: CalendarDays,
          tone: "amber",
          text: `${e.title} starts ${daysTo === 0 ? "today" : "tomorrow"}`,
          to: "/organizer/checkin",
        });
      }
    }
  }

  const stats = data?.stats;
  const maxDay = data ? Math.max(...data.series.map((d) => d.count), 1) : 1;

  return (
    <div className="space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening with your events today.
          </p>
        </div>
        <Button asChild>
          <a href="/organizer/events/new">
            <Plus className="mr-2 size-4" />
            Create event
          </a>
        </Button>
      </div>

      {data === undefined ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
        </>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <CalendarDays className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registrations today</p>
                    <p className="text-2xl font-bold">{stats!.todayRegistrations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-emerald-500/10 p-3">
                    <Users className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total confirmed</p>
                    <p className="text-2xl font-bold">{stats!.totalRegistrations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-indigo-500/10 p-3">
                    <CheckCircle2 className="size-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance rate</p>
                    <p className="text-2xl font-bold">{stats!.attendanceRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-amber-500/10 p-3">
                    <ClipboardList className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending tasks</p>
                    <p className="text-2xl font-bold">{stats!.pendingTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Needs attention — only when there is something to act on */}
          {needsAttention.length > 0 && (
            <Card className="border-amber-200/60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-500" />
                  <CardTitle className="text-base">Needs attention</CardTitle>
                  <Badge variant="secondary" className="ml-auto">{needsAttention.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {needsAttention.slice(0, 5).map((n, i) => (
                  <a
                    key={i}
                    href={n.to}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60"
                  >
                    <n.icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{n.text}</span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Registration activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Registration activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-[140px] items-end gap-[3px]">
                  {data.series.slice(-21).map((d, i) => (
                    <div key={i} className="group relative flex-1">
                      <div
                        className="w-full rounded-t bg-primary/70 transition-all"
                        style={{ height: `${Math.max(3, (d.count / maxDay) * 120)}px` }}
                        title={`${d.day}: ${d.count}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Last 3 weeks · peak {maxDay} in a day
                </p>
              </CardContent>
            </Card>

            {/* Upcoming events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.upcoming.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-6 text-center">
                    <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
                    <Button asChild variant="link" size="sm" className="mt-1">
                      <a href="/organizer/events/new">Create your first event</a>
                    </Button>
                  </div>
                ) : (
                  data.upcoming.map((e) => {
                    const pct = e.capacity ? Math.min(100, Math.round((e.confirmedCount / e.capacity) * 100)) : 0;
                    return (
                      <a
                        key={e._id}
                        href={`/organizer/events/${e._id}`}
                        className="block rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{e.title}</p>
                          <Badge className={`${STATUS_COLOR[e.status] ?? ""} shrink-0 text-[11px]`}>
                            {STATUS_LABEL[e.status] ?? e.status}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{fmtDateTime(e.startAt)}</span>
                          <span>{e.confirmedCount}/{e.capacity} · {pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                        </div>
                      </a>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-4" />
                  <CardTitle className="text-base">Tasks requiring attention</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {data.openTasksList.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    All caught up — no open tasks. 🎉
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.openTasksList.map((t) => (
                      <li key={t._id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                        <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                        <p className="min-w-0 flex-1 truncate text-sm">{t.title}</p>
                        {t.deadline && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">{fmtDate(t.deadline)}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild variant="ghost" size="sm" className="mt-2">
                  <a href="/organizer/tasks">
                    Manage tasks <ArrowRight className="ml-1 size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent activity</CardTitle>
              </CardHeader>
              <CardContent>
                {data.activity.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    Activity will appear here as people register and check in.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.activity.slice(0, 6).map((a) => (
                      <li key={a._id} className="flex items-start gap-3 text-sm">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/50" />
                        <div className="min-w-0">
                          <p className="truncate">{a.message}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(a.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/organizer/events/new"><Plus className="mr-2 size-4" />Create event</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/organizer/checkin"><ScanLine className="mr-2 size-4" />Open check-in</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/organizer/announcements"><Megaphone className="mr-2 size-4" />New announcement</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/organizer/volunteers"><UserPlus className="mr-2 size-4" />Add volunteer</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/organizer/tasks"><ClipboardList className="mr-2 size-4" />Create task</a>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
