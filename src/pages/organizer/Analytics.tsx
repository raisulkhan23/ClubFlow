import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  Metric,
  MetricStrip,
  SectionHeader,
  EmptyState,
} from "@/components/RequireRole";
import type { Id } from "@/convex/_generated/dataModel";
import { BarChart3, CalendarDays } from "lucide-react";

const STATUS_ROWS = [
  { key: "confirmed", label: "Confirmed", color: "bg-primary" },
  { key: "pending", label: "Pending", color: "bg-amber-500" },
  { key: "checked_in", label: "Checked in", color: "bg-emerald-500" },
  { key: "cancelled", label: "Cancelled", color: "bg-muted-foreground/40" },
  { key: "rejected", label: "Rejected", color: "bg-rose-500" },
];

export default function Analytics() {
  const events = useQuery(api.events.listForOrganizer);
  // Only the explicit user choice is state; the default is derived from the
  // query so the first event is selected without a setState-in-effect pass.
  const [pickedEventId, setPickedEventId] = useState<string | null>(null);
  const selectedEventId =
    pickedEventId && events?.some((e) => e._id === pickedEventId)
      ? pickedEventId
      : (events?.[0]?._id ?? null);

  const analytics = useQuery(
    api.events.getEventAnalytics,
    selectedEventId ? { eventId: selectedEventId as Id<"events"> } : "skip",
  );

  const selectedEvent = events?.find((e) => e._id === selectedEventId);

  return (
    <div className="space-y-6 px-4 py-7 sm:px-6">
      <PageHeader
        title="Analytics"
        description="Registration trends, attendance and form response breakdowns for a single event."
        actions={
          <Select
            value={selectedEventId ?? ""}
            onValueChange={(v) => setPickedEventId(v)}
          >
            <SelectTrigger className="w-[220px] sm:w-[260px]" aria-label="Choose an event">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {(events ?? []).map((e) => (
                <SelectItem key={e._id} value={e._id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {events !== undefined && events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="No events to analyse yet"
          description="Once you publish an event and registrations start arriving, its registration trends and form responses appear here."
        />
      ) : !selectedEventId ? (
        <EmptyState
          icon={<BarChart3 />}
          title="Choose an event"
          description="Pick one of your events above to see its registration trend, attendance and per-field response breakdown."
        />
      ) : !analytics ? (
        <div className="space-y-4">
          <div className="h-[86px] animate-pulse rounded-lg bg-muted/40" />
          <div className="h-56 animate-pulse rounded-lg bg-muted/30" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">{selectedEvent?.title}</span>
            </p>
          </div>

          <MetricStrip columns={4}>
            <Metric label="Registrations" value={analytics.totals.registrations} />
            <Metric label="Confirmed" value={analytics.totals.confirmed} />
            <Metric
              label="Attendance rate"
              value={`${analytics.totals.attendanceRate}%`}
              hint="checked in vs confirmed"
              tone={analytics.totals.attendanceRate >= 70 ? "success" : "default"}
            />
            <Metric
              label="Confirmation rate"
              value={`${analytics.totals.conversion}%`}
              hint="confirmed vs total entries"
            />
          </MetricStrip>

          <section className="space-y-2">
            <SectionHeader
              title="Daily registrations"
              description={`Last 30 days · ${analytics.series.reduce((s, d) => s + d.count, 0)} confirmed registrations`}
            />
            <BarChart data={analytics.series} height={160} />
          </section>

          <div className="grid gap-x-8 gap-y-7 lg:grid-cols-[1fr_1.4fr]">
            <section className="space-y-3">
              <SectionHeader
                title="Status breakdown"
                description="Where every entry currently sits"
              />
              <div className="space-y-2.5">
                {STATUS_ROWS.map((row) => {
                  const count = (analytics.totals as Record<string, number>)[row.key] ?? 0;
                  const pct = analytics.totals.registrations
                    ? Math.round((count / analytics.totals.registrations) * 100)
                    : 0;
                  return (
                    <div key={row.key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="tabular">
                          {count} <span className="text-muted-foreground">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {analytics.distributions.length > 0 && (
              <section className="space-y-3">
                <SectionHeader
                  title="Form response breakdown"
                  description="How participants answered your registration form"
                />
                <div className="space-y-5">
                  {analytics.distributions.map((dist) => (
                    <div key={dist.fieldId} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate text-sm font-medium">{dist.label}</h3>
                        <span className="shrink-0 text-xs text-muted-foreground tabular">
                          {dist.total} responses
                        </span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        {dist.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-32 shrink-0 truncate text-muted-foreground">
                              {item.label}
                            </span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary/70"
                                style={{ width: `${Math.min(100, item.pct)}%` }}
                              />
                            </div>
                            <span className="w-8 shrink-0 text-right text-xs text-muted-foreground tabular">
                              {item.count}
                            </span>
                            <span className="w-9 shrink-0 text-right text-xs tabular">
                              {item.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Vertical bars with a shared baseline. Each bar's height is a percentage of the
 * container, so the chart never overflows its frame regardless of the range.
 */
function BarChart({
  data,
  height = 160,
}: {
  data: Array<{ day: string; count: number }>;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
        style={{ height }}
      >
        No registrations in this period yet.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div
        className="flex items-end gap-[2px] rounded-lg border bg-card px-3 pt-3 pb-2"
        style={{ height: height + 20 }}
        role="img"
        aria-label={`Daily registrations over the last ${data.length} days. Peak ${max} in a single day, ${total} total.`}
      >
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-primary/50 transition-colors hover:bg-primary"
            style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
            title={`${d.day}: ${d.count} confirmed`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0]?.day}</span>
        <span>peak {max}/day</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}
