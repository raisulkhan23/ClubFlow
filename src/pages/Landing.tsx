import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Logo } from "@/components/Logo";
import { CoverArt, StatusBadge } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { roleHome, type AppRole } from "@/components/RequireRole";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  Megaphone,
  QrCode,
  ScanLine,
  Trophy,
} from "lucide-react";
import { Link } from "react-router";
import { fmtDate } from "@/lib/format";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="min-w-[40%] flex-1 sm:min-w-0">
      <p className="font-display text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Smart registration",
    body: "Build custom registration forms with 10+ field types, conditional questions and team rules — no more Google Forms stitched to spreadsheets.",
  },
  {
    icon: ScanLine,
    title: "QR check-in",
    body: "Every registration gets a unique QR ticket. Volunteers scan at the door — duplicates and fakes are caught instantly.",
  },
  {
    icon: BarChart3,
    title: "Live analytics",
    body: "Registration growth, attendance rate, event popularity and form responses — all computed from your real data.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    body: "Reach all participants, only checked-in attendees, or pending entries — with in-app notifications and priorities.",
  },
  {
    icon: Trophy,
    title: "Results & winners",
    body: "Record podiums with scores and remarks, then publish to the public event page in one click.",
  },
  {
    icon: BadgeCheck,
    title: "Verifiable certificates",
    body: "Generate PDF certificates with unique IDs. Anyone can verify them at clubflow /verify — no fake claims.",
  },
];

const COMPARE = [
  ["Form creation is disconnected from the event", "Event + registration form are one system"],
  ["Responses live in messy spreadsheets", "A structured participant database with status & search"],
  ["Attendance tracked on paper", "Registration QR → scan → attendance, live"],
  ["Communication scattered across WhatsApp", "Event announcements with priorities & audiences"],
  ["Results & certificates assembled manually", "Results, PDF certificates and public verification built in"],
  ["Zero insight after the fest", "Live operational analytics on real records"],
];

export default function Landing() {
  // Make sure demo data exists before anyone browses (idempotent server-side).
  const ensureSeeded = useMutation(api.seed.ensureSeeded);
  useEffect(() => {
    void ensureSeeded({}).catch(() => {
      /* seeding is best-effort; the page still renders */
    });
  }, [ensureSeeded]);

  const stats = useQuery(api.events.publicStats);
  const events = useQuery(api.events.listPublic, { sort: "upcoming", limit: 3 });
  const { isAuthenticated, user } = useAuth();
  const dashboardHref = isAuthenticated ? roleHome(user?.role as AppRole) : "/auth?returnTo=%2Forganizer";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient grid */}
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-x-0 top-0 h-[560px]" aria-hidden="true" />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="ClubFlow home"><Logo /></Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <Link to="/events" className="hover:text-foreground">Events</Link>
            <Link to="/verify" className="hover:text-foreground">Verify certificate</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to={dashboardHref}>Organizer Dashboard</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/events">Explore Events</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:pt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <CalendarCheck2 className="size-3.5" />
            Built for the 9th DRMC International Tech Carnival 2026
          </span>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            Your entire fest.
            <br />
            <span className="text-gradient-lime">One smart platform.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Create events, collect registrations, manage participants, run check-ins, publish results, and
            understand your fest — without juggling Google Forms and spreadsheets.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link to="/events">
                Explore Events
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={dashboardHref}>Organizer Dashboard</Link>
            </Button>
          </div>
        </motion.div>

        {/* Real stat strip — a plain divided band, not a floating glass card */}
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-6 border-y border-border py-5">
          <Stat value={stats?.events ?? "—"} label="Public events" />
          <Stat value={stats?.upcoming ?? "—"} label="Upcoming" />
          <Stat value={stats?.registrations ?? "—"} label="Registrations" />
          <Stat value={stats?.clubs ?? "—"} label="Clubs" />
          <Stat value={stats !== undefined ? `${stats.attendanceRate}%` : "—"} label="Avg. attendance" />
        </div>
      </section>

      {/* Upcoming events — real data */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Upcoming events</h2>
            <p className="mt-1 text-sm text-muted-foreground">Live from the platform — register in seconds.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/events">View all <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events === undefined &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl border bg-muted/40" />
            ))}
          {events?.map((e) => (
            <Link
              key={e._id}
              to={`/events/${e.slug}`}
              className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <CoverArt theme={e.coverTheme} title={e.title} className="h-28">
                <div className="flex items-start justify-between p-3">
                  <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white">{e.category}</span>
                  <StatusBadge status={e.state} dot={e.state === "live"} />
                </div>
              </CoverArt>
              <div className="p-4">
                <h3 className="font-display font-semibold group-hover:text-primary">{e.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{fmtDate(e.startAt)} · {e.venue}</p>
                <p className="mt-2 text-xs text-muted-foreground">{e.confirmedCount}/{e.capacity} registered · by {e.clubName}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t bg-card/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">How ClubFlow works</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            One pipeline replaces the stack of forms, sheets, group chats and paper lists.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
            {["Event", "Registration", "QR ticket", "Check-in", "Attendance", "Results", "Certificate", "Verify"].map(
              (label, i, arr) => (
                <span key={label} className="flex items-center gap-3">
                  <span className="flex items-baseline gap-2 border-t-2 border-primary/50 pt-2.5 text-sm font-medium">
                    <span className="font-mono text-[11px] text-muted-foreground">0{i + 1}</span>
                    {label}
                  </span>
                  {i < arr.length - 1 && (
                    <ArrowRight className="hidden size-3.5 text-muted-foreground/50 sm:block" aria-hidden="true" />
                  )}
                </span>
              ),
            )}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            Publish an event with its own custom form → participants register and get a QR ticket →
            volunteers scan at the door → you publish winners and hand out verifiable certificates —
            then every number on your dashboard updates itself.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Everything a club actually needs
        </h2>
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-t border-border pt-4">
              <div className="flex items-center gap-2.5">
                <f.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{f.title}</h3>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t bg-card/40">
        <div className="mx-auto w-full max-w-4xl px-4 py-16">
          <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
            The end of the Google Forms era
          </h2>
          <div className="mt-8 overflow-hidden rounded-xl border">
            <div className="grid grid-cols-2 text-sm">
              <div className="border-b bg-muted/60 p-3 font-semibold text-muted-foreground">With Google Forms + Sheets + WhatsApp</div>
              <div className="border-b border-l bg-primary/[0.06] p-3 font-semibold text-primary">With ClubFlow</div>
              {COMPARE.map(([before, after]) => (
                <div key={before} className="col-span-2 grid grid-cols-2">
                  <div className="border-b p-3 text-muted-foreground">{before}</div>
                  <div className="border-b border-l p-3">{after}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="rounded-lg border bg-card px-6 py-12 text-center sm:px-10">
          <QrCode className="mx-auto size-7 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Run your next event on ClubFlow
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Explore a live event, register with a real QR ticket, or open the organizer demo and watch the
            whole pipeline work end to end.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/events">Explore Events</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth">Try the demo</Link></Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo markClass="size-6" />
          <p>An in-house event operations platform.</p>
          <div className="flex gap-4">
            <Link to="/events" className="hover:text-foreground">Events</Link>
            <Link to="/verify" className="hover:text-foreground">Verify</Link>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
