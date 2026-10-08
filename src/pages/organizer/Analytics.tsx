import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import type { Id } from "@/convex/_generated/dataModel";
import {
  BarChart3,
  Users,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function Analytics() {
  const events = useQuery(api.events.listForOrganizer);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events?.[0]?._id as string | null,
  );

  const analytics = useQuery(
    api.events.getEventAnalytics,
    selectedEventId ? { eventId: selectedEventId as Id<"events"> } : "skip",
  );

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Registration trends and form response breakdowns.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selectedEventId ?? "all"}
          onValueChange={(v) => setSelectedEventId(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Choose an event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {(events ?? []).map((e) => (
              <SelectItem key={e._id} value={e._id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedEventId ? (
        <Empty>
          <EmptyTitle>Pick an event</EmptyTitle>
          <EmptyDescription>
            Select an event above to see registration trends and form analytics.
          </EmptyDescription>
          <EmptyContent>
            <Badge variant="outline" className="text-xs">
              Aggregate stats coming soon
            </Badge>
          </EmptyContent>
        </Empty>
      ) : !analytics ? (
        <Empty>
          <EmptyTitle>No data yet</EmptyTitle>
          <EmptyDescription>
            Analytics will appear once registrations start coming in.
          </EmptyDescription>
        </Empty>
      ) : (
        <>
          {/* Headline metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registrations</p>
                    <p className="text-2xl font-bold">{analytics.totals.registrations}</p>
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
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                    <p className="text-2xl font-bold">{analytics.totals.confirmed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-amber-500/10 p-3">
                    <CalendarDays className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance rate</p>
                    <p className="text-2xl font-bold">{analytics.totals.attendanceRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-indigo-500/10 p-3">
                    <TrendingUp className="size-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion</p>
                    <p className="text-2xl font-bold">{analytics.totals.conversion}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Registration series */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="size-4" />
                  Daily registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <BarChart
                    data={analytics.series}
                    height={180}
                    className="w-full"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Last 30 days · {analytics.series.reduce((s, d) => s + d.count, 0)} confirmed registrations total
                </p>
              </CardContent>
            </Card>

            {/* Status breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: "confirmed", label: "Confirmed", color: "bg-emerald-500" },
                    { key: "pending", label: "Pending", color: "bg-amber-500" },
                    { key: "cancelled", label: "Cancelled", color: "bg-muted" },
                    { key: "rejected", label: "Rejected", color: "bg-rose-500" },
                    { key: "checked_in", label: "Checked in", color: "bg-indigo-500" },
                  ].map((row) => {
                    const count = (analytics.totals as Record<string, number>)[row.key] ?? 0;
                    const pct = analytics.totals.registrations
                      ? Math.round((count / analytics.totals.registrations) * 100)
                      : 0;
                    return (
                      <div key={row.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-medium">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${row.color} transition-all duration-500`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Form distributions */}
            {analytics.distributions.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Form response breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {analytics.distributions.map((dist) => (
                      <div key={dist.fieldId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="font-normal">
                            {dist.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {dist.total} responses
                          </span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          {dist.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-3">
                              <span className="truncate max-w-[160px]">{item.label}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary/60 transition-all duration-500"
                                    style={{ width: `${Math.min(100, item.pct)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {item.count}
                                </span>
                                <span className="text-xs font-medium w-10 text-right">
                                  {item.pct}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BarChart({
  data,
  height,
  className,
}: {
  data: Array<{ day: string; count: number }>;
  height: number;
  className?: string;
}) {
  if (!data.length) {
    return (
      <div className={className} style={{ height }}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No registration data yet
        </div>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const bars = data.map((d, i) => {
    return (
      <div key={i} className="flex items-end gap-0.5" style={{ height }}>
        <div className="flex-1 flex items-end justify-end px-0.5">
          <div
            className="rounded-t bg-primary/70 transition-all duration-300"
            style={{ height: `${Math.max(2, (d.count / max) * 100)}%`, width: "100%" }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground w-7 text-right select-none">
          {d.day}
        </span>
      </div>
    );
  });

  return <div className={className} style={{ height }}>{bars}</div>;
}
