import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, CalendarCheck2, Home, Award, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/events", label: "Discover", icon: CalendarCheck2, end: false },
  { to: "/dashboard/registrations", label: "My Registrations", icon: CalendarCheck2, end: false },
  { to: "/dashboard/certificates", label: "Certificates", icon: Award, end: false },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell, end: false },
  { to: "/dashboard/profile", label: "Profile", icon: UserRound, end: false },
];

export function ParticipantShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const unread = useQuery(api.notifications.unreadCount) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
          <Link to="/" aria-label="ClubFlow home"><Logo markClass="size-7" /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Participant">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    isActive && "bg-primary/10 font-medium text-primary hover:text-primary",
                  )
                }
              >
                {item.label}
                {item.label === "Notifications" && unread > 0 && (
                  <span className="absolute right-1 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2 md:hidden" aria-label="Participant mobile">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground",
                  isActive && "bg-primary/10 font-medium text-primary",
                )
              }
            >
              <item.icon className="size-3.5" /> {item.label}
              {item.label === "Notifications" && unread > 0 && (
                <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  {unread > 9 ? "9" : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
