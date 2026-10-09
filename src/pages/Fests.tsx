import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { ArrowRight, CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { PageHeader, EmptyState, CoverArt } from "@/components/RequireRole";
import { fmtDate } from "@/lib/format";
import { FEST } from "@/lib/fest-schedule";

export default function Fests() {
  const data = useQuery(api.fests.directory);
  const [search, setSearch] = useState("");

  const fests = useMemo(() => {
    const list = data?.fests ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.venue ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const org = data?.organization;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="ClubFlow home"><Logo markClass="size-7" /></Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/events">All events</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/verify">Verify certificate</Link></Button>
            <Button asChild size="sm"><Link to="/dashboard">My dashboard</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <p className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{org?.name ?? FEST.clubName}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">Festivals</span>
        </p>

        <PageHeader
          eyebrow="Festival directory"
          title={org?.name ? `${org.name} festivals` : "Festivals"}
          description="Pick a festival to see its events and register. Every event belongs to exactly one festival in the organization."
        />

        <div className="relative mt-5 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search festivals…"
            className="h-9 pl-8"
            aria-label="Search festivals"
          />
        </div>

        {data === undefined ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 w-full" />)}
          </div>
        ) : fests.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<CalendarDays />}
              title={search ? "No festivals match that search" : "No published festivals yet"}
              description={
                search
                  ? "Try a different name or clear the search."
                  : "Organizers publish festivals from the organizer workspace — once a festival is published it appears here."
              }
              action={
                search ? (
                  <Button variant="outline" size="sm" onClick={() => setSearch("")}>Clear search</Button>
                ) : (
                  <Button asChild size="sm"><Link to="/events">Browse all events</Link></Button>
                )
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fests.map((f) => (
              <Link
                key={f._id}
                to={`/fests/${f.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CoverArt theme={f.bannerTheme} className="h-24 w-full" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-sm font-semibold group-hover:text-primary">{f.name}</h2>
                    {f.isDemo && (
                      <Badge variant="outline" className="shrink-0 border-border text-[10px] text-muted-foreground">
                        Demo data
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{f.description}</p>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {fmtDate(f.startAt)} – {fmtDate(f.endAt)}
                    </p>
                    {f.venue && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden /> {f.venue}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      {f.eventCount} event{f.eventCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    View festival <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
