import type { LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  PieChart,
  QrCode,
  ScanLine,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleHome } from "@/components/RequireRole";

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
      { to: "/organizer/volunteers", label: "Volunteers", icon: QrCode },
      { to: "/organizer/analytics", label: "Analytics", icon: PieChart },
      { to: "/organizer/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function OrganizerLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = (
    <nav className="flex-1 space-y-5 overflow-y-auto p-3">
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-1">
          {group.heading && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 text-primary",
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
    <nav className="flex items-center justify-around border-b bg-background/95 px-2 py-2 backdrop-blur lg:hidden">
      {groups
        .flatMap((g) => g.items)
        .map((item) => {
          const active = location.pathname === item.to || (item.to !== "/organizer" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium text-muted-foreground",
                active && "text-primary",
              )}
            >
              <item.icon className="size-5" />
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
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar px-0 py-5 lg:flex">
          <div className="mb-5 flex items-center px-5">
            <Link to="/" className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              <span className="font-semibold">Organizer Portal</span>
            </Link>
          </div>
          {links}
          <div className="border-t p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const home = roleHome(user?.role ?? "participant");
                navigate(`/${home}`);
              }}
            >
              <FolderOpen className="size-4" /> Back to home
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
