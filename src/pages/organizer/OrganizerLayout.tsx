import type { LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { LogoDropdown } from "@/components/LogoDropdown";
import {
  CalendarDays,
  Globe,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  PieChart,
  ScanLine,
  Settings,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavEntry = { to: string; label: string; icon: LucideIcon };
type NavGroup = { heading?: string; items: NavEntry[] };

const groups: NavGroup[] = [
  {
    items: [{ to: "/organizer", label: "Overview", icon: LayoutDashboard }],
  },
  {
    heading: "Event operations",
    items: [
      { to: "/organizer/events", label: "Events", icon: CalendarDays },
      { to: "/organizer/participants", label: "Participants", icon: Users },
      { to: "/organizer/checkin", label: "Check-in", icon: ScanLine },
    ],
  },
  {
    heading: "Event content",
    items: [
      { to: "/organizer/announcements", label: "Announcements", icon: Megaphone },
      { to: "/organizer/results", label: "Results & awards", icon: Trophy },
      { to: "/organizer/tasks", label: "Tasks", icon: ListTodo },
    ],
  },
  {
    heading: "Team & insights",
    items: [
      { to: "/organizer/volunteers", label: "Volunteers", icon: UserCog },
      { to: "/organizer/analytics", label: "Analytics", icon: PieChart },
      { to: "/organizer/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function OrganizerLayout() {
  const location = useLocation();

  const links = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-1" aria-label="Organizer">
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-0.5">
          {group.heading && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
              {group.heading}
            </p>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/organizer"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive &&
                    "bg-muted font-medium text-foreground shadow-[inset_2px_0_0_0_var(--primary)]",
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  const mobileBar = (
    <nav
      className="flex gap-1 overflow-x-auto border-b bg-background px-2 py-1.5 lg:hidden"
      aria-label="Organizer mobile"
    >
      {groups
        .flatMap((g) => g.items)
        .map((item) => {
          const active = location.pathname === item.to || (item.to !== "/organizer" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-[58px] flex-1 flex-col items-center gap-0.5 rounded-md px-1.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors",
                active && "bg-muted text-foreground",
              )}
            >
              <item.icon className={cn("size-4", active && "text-primary")} />
              {item.label}
            </NavLink>
          );
        })}
    </nav>
  );

  return (
    <div className="flex h-screen flex-col">
      {mobileBar}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar py-5 lg:flex">
          <div className="mb-4 flex items-center px-5">
            <Link to="/" aria-label="ClubFlow home">
              <Logo markClass="size-7" />
            </Link>
          </div>
          {links}
          <div className="mt-auto flex items-center gap-1 border-t px-3 pt-3">
            <LogoDropdown />
            <Button
              asChild
              variant="ghost"
              className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/">
                <Globe className="size-4" /> Public site
              </Link>
            </Button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
