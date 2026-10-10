import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORIES } from "@/convex/schema";
import { PageHeader, StatusBadge, EmptyState } from "@/components/RequireRole";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { CalendarDays, MapPin, Search, Users, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { fmtDayChip, fmtTimeRange } from "@/lib/format";
import {
  FEST,
  FEST_DAY_KEYS,
  FEST_DATES,
  FEST_SCHEDULE,
  entryWindow,
  dhakaDayKey,
  festDayKeyOf,
  festDayLabel,
  festDayNumber,
  seriesSessions,
  type FestDayKey,
  type ScheduleEntry,
  seriesKeyOf,
} from "@/lib/fest-schedule";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


/** Badge copy for entries that are not competitive. */
const KIND_BADGE: Record<string, { label: string; className: string }> = {
  ceremony: { label: "Ceremony", className: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300" },
  break: { label: "Break", className: "border-border bg-muted text-muted-foreground" },
};

export default function Events() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("upcoming");
  const [day, setDay] = useState<string>("all");

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const events = useQuery(api.events.listPublic, {
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    sort: sort as "upcoming" | "newest" | "popular",
    day: day !== "all" ? day : undefined,
    limit: 200,
  });

  const festStatus = useQuery(api.festSeed.festScheduleStatus);
  const festReady = festStatus ? festStatus.matches : false;

  /** How many official sessions each fest competition has, taken only from the
   * authoritative schedule sheet. This intentionally does not read DB titles for
   * the "runs N days" chip, because the displayed schedule must stay faithful even
   * if legacy rows drift from the official sheet. */
  const seriesSize = useMemo(() => {
    const m = new Map<string, number>();
    if (!events) return m;
    for (const e of events) {
      if (!e.festKey) continue;
      let found = false;
      for (const s of Object.values(FEST_SCHEDULE) as ScheduleEntry[]) {
        if (s.title === e.title && String(festDayKeyOf(entryWindow(s).startAt.getTime())) === String(festDayKeyOf(e.startAt))) {
          found = true;
          break;
        }
      }
      if (!found) continue;
      const n = seriesSessions(seriesSessionsOf(e.title)).length;
      if (n > 1) m.set(e.slug, n);
    }
    return m;
  }, [events]);
  void seriesSize;

  const grouped = useMemo(() => {
    const buckets = new Map<string, NonNullable<typeof events>>();
    for (const e of events ?? []) {
      const key = dhakaDayKey(e.startAt);
      const list = buckets.get(key) ?? [];
      list.push(e);
      buckets.set(key, list);
    }
    for (const list of buckets.values()) {
      list.sort((a, b) => a.startAt - b.startAt || a.title.localeCompare(b.title));
    }
    // Fest days first (in fest order), then any other day chronologically.
    return [...buckets.entries()].sort(([a], [b]) => {
      const ai = FEST_DAY_KEYS.indexOf(a as FestDayKey);
      const bi = FEST_DAY_KEYS.indexOf(b as FestDayKey);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [events]);

  /** Counts per fest day, so the selector can show real session totals. */
  const perDayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events ?? []) {
      const key = festDayKeyOf(e.startAt);
      if (!key) continue;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  const filtered = search.trim().length > 0 || category !== "all" || day !== "all";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="ClubFlow home">
            <Logo markClass="size-7" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/fests">Festivals</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/verify">Verify certificate</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/dashboard">My dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <PageHeader
          eyebrow={FEST.scheduleTitle}
          title={FEST.name}
          description={`${FEST.institution} · presented by ${FEST.clubName}. Browse all three days of the fest — several competitions run in parallel, and times are Bangladesh Standard Time (UTC+06:00).`}
        />

        {/* Day selector — every fest day, with its real session count */}
        <div className="mt-6 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <DayChip
            active={day === "all"}
            onClick={() => setDay("all")}
            label="All days"
            sub="8–10 Oct"
            count={Object.values(perDayCounts).reduce((s, n) => s + n, 0)}
          />
          {FEST_DAY_KEYS.map((key, i) => (
            <DayChip
              key={key}
              active={day === key}
              onClick={() => setDay(key)}
              label={`Day ${festDayNumber(key as FestDayKey)}`}
              sub={fmtDayChip(new Date(`${FEST_DATES[key]}T09:00:00+06:00`).getTime())}
              count={perDayCounts[key] ?? 0}
            />
          ))}
        </div>

        {!festReady && (
          <div className="mt-4 flex max-w-2xl items-center gap-2 overflow-hidden rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <Loader2 className="size-3.5 animate-spin shrink-0 text-amber-500" aria-hidden="true" />
            <div className="min-w-0 overflow-hidden">
              <span className="block truncate">
                The full DRMC Tech Carnival 2026 schedule is still being seeded under the hood. Filter lists will update automatically when it is ready.
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search the schedule…"
              className="h-9 pl-8"
              aria-label="Search events"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-full sm:w-40" aria-label="Sort events">
              <SelectValue placeholder="Soonest first" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Soonest first</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {events === undefined ? (
          <div className="mt-8 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<Search />}
              title="Nothing matches those filters"
              description="Try another day, category or search term — the full schedule covers all three fest days."
              action={
                filtered ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchInput("");
                      setCategory("all");
                      setDay("all");
                    }}
                  >
                    Reset filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {grouped.map(([dayKey, entries]) => {
              const isFestDay = FEST_DAY_KEYS.includes(dayKey as FestDayKey);
              return (
                <section key={dayKey}>
                  <div className="flex items-baseline justify-between gap-3 border-b pb-2">
                    <h2 className="font-display text-sm font-semibold tracking-tight">
                      {isFestDay ? `Day ${festDayNumber(dayKey as FestDayKey)} · ${festDayLabel(dayKey as FestDayKey)}` : festDayLabel(dayKey as FestDayKey)}
                    </h2>
                    <span className="shrink-0 text-xs text-muted-foreground tabular">
                      {entries.length} session{entries.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <ul className="divide-y divide-border">
                    {entries.map((e) => {
                      const series = e.festKey ? seriesSessions(seriesSessionsOf(e.title)).length : 0;
                      const kindBadge = KIND_BADGE[e.kind ?? ""];
                      const seatsLeft = e.capacity - e.confirmedCount;
                      return (
                        <li key={e._id}>
                          <Link
                            to={`/events/${e.slug}`}
                            className="group grid grid-cols-[minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-3 transition-colors hover:bg-muted/40 sm:grid-cols-[128px_minmax(0,1fr)_auto]"
                          >
                            {/* Authoritative 12-hour range, always in Asia/Dhaka */}
                            <span className="text-xs text-muted-foreground tabular sm:pt-0.5">
                              {fmtTimeRange(e.startAt, e.endAt)}
                            </span>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate text-sm font-medium group-hover:text-primary">
                                  {e.title}
                                </span>
                                {kindBadge && (
                                  <span
                                    className={cn(
                                      "shrink-0 rounded border px-1.5 py-px text-[10px] font-medium",
                                      kindBadge.className,
                                    )}
                                  >
                                    {kindBadge.label}
                                  </span>
                                )}
                                {series > 1 && (
                                  <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                                    Runs {series} days
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span>{e.category}</span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="size-3" aria-hidden="true" />
                                  {e.venue}
                                </span>
                                {e.kind === "competition" && e.capacity > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <Users className="size-3" aria-hidden="true" />
                                    {seatsLeft > 0
                                      ? `${seatsLeft} of ${e.capacity} seats left`
                                      : `${e.confirmedCount}/${e.capacity} registered`}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="sm:pt-0.5">
                              {e.kind === "competition" ? (
                                <StatusBadge status={e.state} dot={e.state === "live"} />
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  {e.kind === "break" ? "Schedule block" : "Open to all"}
                                </span>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}          <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {FEST.name} · {FEST.scheduleTitle} · times shown in {FEST.timeZone}
        </p>
      </main>
    </div>
  );
}

/** A hidden helper so TS accepts searchable titles against the schedule. */
function seriesSessionsOf(title: string): Parameters<typeof seriesSessions>[0] | undefined {
  const entry = (Object.values(FEST_SCHEDULE) as ScheduleEntry[]).find(
    (s) => seriesKeyOf(s.title) === seriesKeyOf(title),
  );
  return entry as Parameters<typeof seriesSessions>[0];
}

function DayChip({
  active,
  onClick,
  label,
  sub,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 flex-col items-start rounded-md border px-3 py-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/40 bg-primary/10"
          : "border-border hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "text-xs font-medium",
          active ? "text-primary" : "text-foreground",
        )}
      >
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground tabular">
        {sub} · {count}
      </span>
    </button>
  );
}
