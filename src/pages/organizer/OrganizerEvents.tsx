import { useQuery } from "convex/react";
import { useState, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusBadge, EmptyState } from "@/components/RequireRole";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { displayClubName, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicEvent } from "@/convex/events";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Open" },
  { value: "registration_closed", label: "Closed" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
];

const SORTS = [
  { value: "soonest", label: "Soonest first" },
  { value: "latest", label: "Latest first" },
  { value: "registrations", label: "Most registrations" },
];

export default function OrganizerEvents() {
  const events = useQuery(api.events.listForOrganizer);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("soonest");

  const list = useMemo<PublicEvent[]>(() => events ?? [], [events]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const e of list) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = list.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        displayClubName(e.clubName).toLowerCase().includes(q) ||
        (e.shortDescription ?? "").toLowerCase().includes(q)
      );
    });
    return [...rows].sort((a, b) => {
      if (sort === "registrations") return b.confirmedCount - a.confirmedCount;
      if (sort === "latest") return b.startAt - a.startAt;
      return a.startAt - b.startAt;
    });
  }, [list, statusFilter, query, sort]);

  const filteredBySearch = query.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="space-y-6 px-4 py-7 sm:px-6">
      <PageHeader
        title="Events"
        description="Every event you run, with registrations and status at a glance."
        actions={
          <Button asChild size="sm">
            <Link to="/organizer/events/new">
              <Plus className="size-4" />
              New event
            </Link>
          </Button>
        }
      />

      {events === undefined ? (
        <div className="space-y-2">
          <div className="h-9 w-full animate-pulse rounded-md bg-muted/40" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-muted/30" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Plus />}
          title="No events yet"
          description="Create your first event to start accepting registrations, issuing QR tickets and checking people in."
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
          {/* Toolbar: status is a segmented filter, not a generic dropdown */}
          <div className="space-y-3">
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
              {STATUS_TABS.map((t) => {
                const active = statusFilter === t.value;
                const count = counts[t.value] ?? 0;
                if (t.value !== "all" && count === 0) return null;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setStatusFilter(t.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {t.label}
                    <span
                      className={cn(
                        "rounded px-1 text-[11px] tabular",
                        active ? "bg-background/20" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events…"
                  aria-label="Search events"
                  className="h-9 pl-8"
                />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-full sm:w-[190px]" aria-label="Sort events">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground sm:ml-auto">
                {filtered.length} of {list.length}
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No events match"
              description="Try a different search term or status filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-9 pl-4">Event</TableHead>
                    <TableHead className="h-9 w-[110px]">Status</TableHead>
                    <TableHead className="h-9 w-[130px]">Starts</TableHead>
                    <TableHead className="h-9 w-[150px]">Confirmed</TableHead>
                    <TableHead className="h-9 w-[120px] text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => {
                    const pct = e.capacity
                      ? Math.min(100, Math.round((e.confirmedCount / e.capacity) * 100))
                      : 0;
                    return (
                      <TableRow key={e._id} className="group">
                        <TableCell className="py-2.5 pl-4 align-middle">
                          <Link
                            to={`/organizer/events/${e._id}`}
                            className="block min-w-0 max-w-[420px]"
                          >
                            <span className="block truncate text-sm font-medium group-hover:text-primary">
                              {e.title}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {displayClubName(e.clubName)}
                              {e.shortDescription ? ` · ${e.shortDescription}` : ""}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge status={e.status} dot />
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground tabular whitespace-nowrap">
                          {fmtDate(e.startAt)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs tabular whitespace-nowrap">
                              {e.confirmedCount}/{e.capacity}
                            </span>
                            <div className="h-1 w-14 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  pct >= 95 ? "bg-amber-500" : "bg-primary",
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                              <Link to={`/organizer/participants?eventId=${e._id}`}>
                                Participants
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                              <Link to={`/organizer/events/${e._id}`}>Open</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredBySearch && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Filters applied.{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                Reset
              </button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
