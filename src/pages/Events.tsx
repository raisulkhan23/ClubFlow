import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORIES } from "@/convex/schema";
import { CoverArt, EmptyState, StatusBadge } from "@/components/RequireRole";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fmtDateTime } from "@/lib/format";

export default function Events() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("upcoming");

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const events = useQuery(api.events.listPublic, {
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    sort: sort as "upcoming" | "newest" | "popular",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-base font-bold">
            Club<span className="text-primary">Flow</span>
          </Link>
          <div className="flex items-center gap-2">
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
          title="Explore events"
          description="Fests, contests and workshops hosted on ClubFlow — register in seconds."
        />

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search events…"
              className="pl-9"
              aria-label="Search events"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by category">
              <SelectValue />
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
            <SelectTrigger className="w-full sm:w-40" aria-label="Sort events">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Soonest first</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {events === undefined ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border">
                <Skeleton className="h-32 w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<Search className="size-5" />}
              title="No events match your filters"
              description="Try a different search term or category — new events are published regularly."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const seatsLeft = Math.max(0, e.capacity - e.confirmedCount);
              return (
                <Link
                  key={e._id}
                  to={`/events/${e.slug}`}
                  className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <CoverArt theme={e.coverTheme} title={e.title} className="h-32">
                    <div className="flex items-start justify-between p-3">
                      <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                        {e.category}
                      </span>
                      <StatusBadge status={e.state} dot={e.state === "live"} />
                    </div>
                  </CoverArt>
                  <div className="p-4">
                    <h3 className="font-display font-semibold leading-snug group-hover:text-primary">
                      {e.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">by DRMC IT CLUB</p>
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 shrink-0" /> {fmtDateTime(e.startAt)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" /> {e.venue}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Users className="size-3.5 shrink-0" />
                        {seatsLeft > 0 ? `${seatsLeft} seats left · ${e.confirmedCount}/${e.capacity}` : `${e.confirmedCount}/${e.capacity} seats`}
                      </p>
                    </div>
                    {e.teamEvent && (
                      <p className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Team event · {e.minTeamSize}–{e.maxTeamSize} members
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
