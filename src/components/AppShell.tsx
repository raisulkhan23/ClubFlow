import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABEL, roleHome, type AppRole } from "@/components/RequireRole";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number;
};

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-primary/12 text-primary hover:text-primary",
            )
          }
        >
          <item.icon className="size-4 shrink-0" />
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground tabular">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role ?? "participant") as AppRole;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials(user?.name)}
          </span>
          <span className="hidden max-w-32 truncate text-sm md:inline">{user?.name ?? "Account"}</span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground md:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium">{user?.name ?? "Signed in"}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user?.email ?? "Demo session"}</p>
          <Badge variant="outline" className="mt-1.5 border-primary/30 text-primary">
            {ROLE_LABEL[role]}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
          <UserRound className="size-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const unread = useQuery(api.notifications.unreadCount) ?? 0;
  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
      <Link to="/dashboard/notifications">
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground tabular">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}

/** Organizer global search with debounced server query. */
function GlobalSearch() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(q.trim()), 250);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  const results = useQuery(
    api.dashboard.globalSearch,
    debounced.length >= 2 ? { q: debounced } : "skip",
  );
  const hasResults =
    results && (results.events.length > 0 || results.registrations.length > 0 || results.certificates.length > 0);

  return (
    <div className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Search events, registrations…"
        className="w-64 pl-9 lg:w-80"
        aria-label="Global search"
      />
      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-96 overflow-auto rounded-xl border bg-popover p-2 shadow-lg">
          {!hasResults && (
            <p className="p-3 text-center text-xs text-muted-foreground">No matches found.</p>
          )}
          {results?.events.length ? (
            <>
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Events</p>
              {results.events.map((e) => (
                <Link
                  key={e._id}
                  to={`/organizer/events/${e._id}`}
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  {e.title}
                </Link>
              ))}
            </>
          ) : null}
          {results?.registrations.length ? (
            <>
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Registrations</p>
              {results.registrations.map((r) => (
                <Link
                  key={r._id}
                  to={`/organizer/participants?q=${encodeURIComponent(r.registrationId)}`}
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-mono text-xs">{r.registrationId}</span>
                  <span className="ml-2 text-muted-foreground">{r.participantName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">· {r.eventTitle}</span>
                </Link>
              ))}
            </>
          ) : null}
          {results?.certificates.length ? (
            <>
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Certificates</p>
              {results.certificates.map((c) => (
                <Link
                  key={c.certificateId}
                  to={`/verify/${c.certificateId}`}
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-mono text-xs">{c.certificateId}</span>
                  <span className="ml-2 text-muted-foreground">{c.participantName}</span>
                </Link>
              ))}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function AppShell({
  nav,
  variant,
  title,
}: {
  nav: NavItem[];
  variant: "organizer" | "participant" | "volunteer";
  title: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const markAllRead = useMutation(api.notifications.markAllRead);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1440px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-5 lg:flex">
          <Link to="/" className="mb-6 flex items-center px-2" aria-label="ClubFlow home">
            <Logo />
          </Link>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            {title}
          </p>
          <div className="flex-1 overflow-y-auto">
            <NavLinks items={nav} />
          </div>
          <div className="border-t pt-3">
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <UserRound className="size-3.5" /> Account & profile
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Link to="/" className="mb-6 mt-1 flex items-center px-2">
                  <Logo />
                </Link>
                <NavLinks items={nav} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link to="/" className="lg:hidden" aria-label="ClubFlow home">
              <Logo markClass="size-7" showWordmark={false} />
            </Link>

            {variant === "organizer" && <GlobalSearch />}
            <div className="ml-auto flex items-center gap-1">
              {variant === "organizer" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden gap-2 sm:inline-flex"
                  onClick={() => void markAllRead({})}
                  asChild
                >
                  <Link to="/organizer/announcements">Broadcasts</Link>
                </Button>
              ) : (
                <NotificationBell />
              )}
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
