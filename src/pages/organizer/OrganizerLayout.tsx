import type { LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  LayoutDashboard,
  ListTodo,
  MapPin,
  Megaphone,
  People,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleHome } from "@/components/RequireRole";

const items: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard/tasks", label: "Tasks", icon: ListTodo },
  { to: "/dashboard/events", label: "Events", icon: MapPin },
  { to: "/dashboard/participants", label: "Participants", icon: People },
  { to: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function OrganizerLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-64 shrink-0 border-r bg-muted/40 lg:flex lg:flex-col lg:border-r lg:bg-transparent">
          <div className="flex h-14 items-center border-b px-4 lg:h-[72px] lg:border-b lg:bg-transparent">
            <Link to="/" className="flex items-center gap-2">
              <LayoutDashboard className="size-5" />
              <span className="font-semibold">Organizer</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => {
                  // Keep stale state fresh after mutations by reloading the data layer.
                  window.location.reload();
                }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive && "bg-muted text-foreground",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t p-3 lg:border-t lg:bg-transparent">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                const home = roleHome(user?.role ?? "participant");
                navigate(`/${home}`);
              }}
            >
              <FolderOpen className="size-4" /> Back to home
            </Button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
