import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Megaphone,
  Plus,
  ScanLine,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  Metric,
  MetricStrip,
  SectionHeader,
  StatusBadge,
  EmptyState,
} from "@/components/RequireRole";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

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

const ACTIVITY_ICON: Record<string, typeof Bell> = {
  registration: UserPlus,
  checkin: CheckCircle2,
  announcement: Megaphone,
  result: Trophy,
};

function AttentionRow({
  icon: Icon,
  text,
  to,
}: {
  icon: typeof AlertCircle;
  text: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors hover:bg-muted/60"
    >
      <Icon className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <ArrowRight
        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

export default function OrganizerOverview() {
  const { user } = useAuth();
  const data = useQuery(api.dashboard.organizerOverview) as Overview | undefined;
  // Captured once per mount so render stays pure while day math stays accurate.
  const [now] = useState(() => Date.now());

  const firstName = user?.name ? user.name.split(" ")[0] : "organizer";
  const today = new Date(now).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const needsAttention: Array<{ icon: typeof AlertCircle; text: string; to: string }> = [];
  if (data) {
    const { stats, upcoming } = data;
    if (stats.pendingApprovals > 0) {
      const n = stats.pendingApprovals;
      needsAttention.push({
        icon: AlertCircle,
        text: `${n} registration${n === 1 ? "" : "s"} awaiting approval`,
        to: "/organizer/participants",
      });
    }
    if (stats.overdueTasks > 0) {
      const n = stats.overdueTasks;
      needsAttention.push({
        icon: Clock,
        text: `${n} task${n === 1 ? "" : "s"} past their deadline`,
        to: "/organizer/tasks",
      });
    }
    for (const e of upcoming.slice(0, 3)) {
      const pct = e.capacity ? Math.round((e.confirmedCount / e.capacity) * 100) : 0;
      if (pct >= 87 && e.status === "published") {
        needsAttention.push({
          icon: Users,
          text: `${e.title} is ${pct}% full`,
          to: `/organizer/events/${e._id}`,
        });
      }
      const daysTo = Math.round((e.startAt - now) / 86_400_000);
      if (daysTo >= 0 && daysTo <= 1 && ["published", "registration_closed"].includes(e.status)) {
        needsAttention.push({
          icon: CalendarDays,
          text: `${e.title} starts ${daysTo === 0 ? "today" : "tomorrow"}`,
          to: "/organizer/checkin",
        });
      }
    }
  }

  const stats = data?.stats;
  const series = data?.series.slice(-21) ?? [];
  const maxDay = Math.max(...series.map((d) => d.count), 1);
  const maxByEvent = Math.max(...(data?.byEvent.map((e) => e.count) ?? [0]), 1);

  // First run: no events at all. Show guidance instead of an empty dashboard.
  const isFirstRun = data !== undefined && data.stats.totalEvents === 0;

  return (
    <div className="space-y-7 px-4 py-7 sm:px-6">
      <PageHeader
        eyebrow={today}
        title={`${greeting()}, ${firstName}`}
        description="Your events, registrations and outstanding work in one place."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/organizer/checkin">
                <ScanLine className="size-4" />
                Open check-in
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/organizer/events/new">
                <Plus className="size-4" />
                Create event
              </Link>
            </Button>
          </>
        }
      />

      {data === undefined ? (
        <div className="space-y-4">
          <div className="h-[86px] animate-pulse rounded-lg bg-muted/40" />
          <div className="h-56 animate-pulse rounded-lg bg-muted/30" />
        </div>
      ) : isFirstRun ? (
        <EmptyState
          icon={<CalendarDays />}
          title="No events yet"
          description="Create your first event, open registration, and ClubFlow will track registrations, check-ins and certificates for you."
          action={
            <Button asChild>
              <Link to="/organizer/events/new">
                <Plus className="size-4" />
                Create your first event
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Operational figures */}
          <MetricStrip columns={5}>
            <Metric
              label="Active events"
              value={stats!.activeEvents}
              hint={`${stats!.totalEvents} total`}
            />
            <Metric
              label="New today"
              value={stats!.todayRegistrations}
              hint="registrations"
              tone={stats!.todayRegistrations > 0 ? "primary" : "default"}
            />
            <Metric
              label="Confirmed"
              value={stats!.totalRegistrations.toLocaleString()}
              hint="all events"
            />
            <Metric
              label="Attendance"
              value={`${stats!.attendanceRate}%`}
              hint="checked in vs confirmed"
              tone={stats!.attendanceRate >= 70 ? "success" : "default"}
            />
            <Metric
              label="Open tasks"
              value={stats!.pendingTasks}
              hint={stats!.overdueTasks > 0 ? `${stats!.overdueTasks} overdue` : "on schedule"}
              tone={stats!.overdueTasks > 0 ? "danger" : "default"}
            />
          </MetricStrip>

          {/* Needs attention — informational, not a decorative card */}
          {needsAttention.length > 0 && (
            <section className="overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/[0.04]">
              <div className="flex items-center gap-2 border-b border-amber-500/20 px-3.5 py-2.5">
                <AlertCircle className="size-4 text-amber-500" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Needs attention</h2>
                <span className="ml-auto rounded border border-amber-500/30 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 tabular dark:text-amber-300">
                  {needsAttention.length}
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {needsAttention.slice(0, 4).map((n, i) => (
                  <AttentionRow key={i} icon={n.icon} text={n.text} to={n.to} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming events + open tasks */}
          <div className="grid gap-x-8 gap-y-7 lg:grid-cols-[1.6fr_1fr]">
            <section className="space-y-2">
              <SectionHeader
                title="Upcoming events"
                description="Registration progress and what happens next"
                actions={
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                    <Link to="/organizer/events">
                      All events <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                }
              />
              {data.upcoming.length === 0 ? (
                <p className="px-1 py-6 text-sm text-muted-foreground">
                  No upcoming events scheduled.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.upcoming.slice(0, 5).map((e) => {
                    const pct = e.capacity
                      ? Math.min(100, Math.round((e.confirmedCount / e.capacity) * 100))
                      : 0;
                    return (
                      <li key={e._id}>
                        <Link
                          to={`/organizer/events/${e._id}`}
                          className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-3 transition-colors hover:bg-muted/40"
                        >
                          <div className="col-start-1 flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-medium">{e.title}</span>
                            <StatusBadge status={e.status} className="shrink-0" />
                          </div>
                          <span className="col-start-2 row-start-1 text-xs text-muted-foreground tabular">
                            {fmtDateTime(e.startAt)}
                          </span>
                          <div className="col-span-2 flex items-center gap-3">
                            <div className="h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  pct >= 90 ? "bg-amber-500" : "bg-primary",
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground tabular">
                              {e.confirmedCount}/{e.capacity} · {pct}%
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <SectionHeader
                title="Open tasks"
                description="Deadlines across your events"
                actions={
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                    <Link to="/organizer/tasks">
                      Manage <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                }
              />
              {data.openTasksList.length === 0 ? (
                <p className="px-1 py-6 text-sm text-muted-foreground">
                  All caught up — no open tasks.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {data.openTasksList.slice(0, 5).map((t) => (
                    <li
                      key={t._id}
                      className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2"
                    >
                      <ClipboardList
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                      {t.deadline && (
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular">
                          {fmtDate(t.deadline)}
                        </span>
                      )}
                      <StatusBadge status={t.priority} className="shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Registration activity + recent activity */}
          <div className="grid gap-x-8 gap-y-7 lg:grid-cols-[1.6fr_1fr]">
            <section className="space-y-2">
              <SectionHeader
                title="Registration pace"
                description={`Last 3 weeks · busiest day ${maxDay} registration${maxDay === 1 ? "" : "s"}`}
              />
              <div className="flex h-[104px] items-end gap-[3px] pt-1">
                {series.map((d, i) => (
                  <div
                    key={i}
                    className="group relative flex-1 rounded-t-sm bg-primary/45 transition-colors hover:bg-primary"
                    style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}px` }}
                    title={`${d.day}: ${d.count}`}
                  />
                ))}
              </div>
              <div className="flex justify-between border-t pt-1.5 text-[11px] text-muted-foreground">
                <span>{series[0]?.day}</span>
                <span>{series[series.length - 1]?.day}</span>
              </div>
            </section>

            <section className="space-y-2">
              <SectionHeader title="Recent activity" />
              {data.activity.length === 0 ? (
                <p className="px-1 py-6 text-sm text-muted-foreground">
                  Activity appears here as people register and check in.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {data.activity.slice(0, 6).map((a) => {
                    const Icon = ACTIVITY_ICON[a.type] ?? Bell;
                    return (
                      <li key={a._id} className="flex items-start gap-2.5">
                        <Icon
                          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm">{a.message}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {fmtDateTime(a.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Per-event registration volume — only when there is something to compare */}
          {data.byEvent.length > 1 && (
            <section className="space-y-2">
              <SectionHeader
                title="Registrations by event"
                description="Compare how your events are performing"
              />
              <ul className="space-y-2">
                {data.byEvent.slice(0, 6).map((e) => (
                  <li key={e.title} className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">{e.title}</span>
                    <div className="h-1.5 w-32 shrink-0 overflow-hidden rounded-full bg-muted sm:w-56">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${(e.count / maxByEvent) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular">
                      {e.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Secondary operations, kept out of the way of the numbers above */}
          <section className="space-y-2">
            <SectionHeader title="Jump straight in" />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/organizer/events/new">
                  <Plus className="size-4" /> New event
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/organizer/announcements">
                  <Megaphone className="size-4" /> Announcement
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/organizer/volunteers">
                  <UserPlus className="size-4" /> Add volunteer
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/organizer/results">
                  <Trophy className="size-4" /> Results &amp; awards
                </Link>
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
