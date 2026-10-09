import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageHeader } from "@/components/RequireRole";
import { fmtDate } from "@/lib/format";
import type { Id } from "@/convex/_generated/dataModel";

export default function Feedback() {
  const events = useQuery(api.events.listForOrganizer);
  const [eventId, setEventId] = useState<string>("");

  const currentId = (eventId || events?.[0]?._id) as Id<"events"> | undefined;
  const summary = useQuery(
    api.feedback.summarize,
    currentId ? { eventId: currentId } : "skip",
  );

  const bars = useMemo(() => {
    if (!summary) return [];
    const b = summary.breakdown;
    const max = Math.max(1, ...Object.values(b));
    return [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: b[s] ?? 0, pct: Math.round(((b[s] ?? 0) / max) * 100) }));
  }, [summary]);

  return (
    <div className="space-y-6 px-4 py-7 sm:px-6">
      <PageHeader
        title="Event feedback"
        description="Aggregated ratings from participants — anonymous responses contain no identity data by design."
      />

      <div className="max-w-xs">
        <Select
          value={currentId ?? ""}
          onValueChange={setEventId}
        >
          <SelectTrigger aria-label="Event to review" className="w-full">
            <SelectValue placeholder="Choose an event" />
          </SelectTrigger>
          <SelectContent>
            {(events ?? []).map((e) => (
              <SelectItem key={e._id} value={e._id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!currentId ? (
        <Empty>
          <EmptyMedia variant="icon"><Star className="size-5" /></EmptyMedia>
          <EmptyTitle>No events yet</EmptyTitle>
          <EmptyDescription>Create an event first — feedback appears here once participants respond.</EmptyDescription>
        </Empty>
      ) : summary === undefined ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
      ) : summary.count === 0 ? (
        <Empty>
          <EmptyMedia variant="icon"><Star className="size-5" /></EmptyMedia>
          <EmptyTitle>No feedback yet</EmptyTitle>
          <EmptyDescription>
            Checked-in participants can rate this event from their dashboard after the session.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <p className="font-display text-4xl font-bold tabular">{summary.average}</p>
                <div className="pb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`size-4 ${s <= Math.round(summary.average) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{summary.count} response{summary.count === 1 ? "" : "s"}</p>
                </div>
              </div>
              {(summary.venueAverage > 0 || summary.orgAverage > 0) && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  {summary.venueAverage > 0 && <p>Venue rating: <span className="font-medium text-foreground tabular">{summary.venueAverage}</span>/5</p>}
                  {summary.orgAverage > 0 && <p>Organization rating: <span className="font-medium text-foreground tabular">{summary.orgAverage}</span>/5</p>}
                </div>
              )}
              <div className="space-y-1.5">
                {bars.map((b) => (
                  <div key={b.stars} className="flex items-center gap-2">
                    <span className="w-6 text-right text-xs tabular">{b.stars}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                      <div className="h-full rounded bg-amber-400" style={{ width: `${b.pct}%` }} />
                    </div>
                    <span className="w-6 text-xs tabular text-muted-foreground">{b.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Individual responses</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[520px] space-y-3 overflow-y-auto">
              {summary.detail.map((f) => (
                <div key={f._id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{f.participantName}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(f.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`size-3.5 ${s <= f.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                      ))}
                    </div>
                  </div>
                  {/* Suggestions from anonymous feedback are shown without any identity — none exists. */}
                  {f.suggestion && <p className="mt-2 text-sm text-muted-foreground">“{f.suggestion}”</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
