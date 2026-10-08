import { AppShell, type NavItem } from "@/components/AppShell";
import { Home, ScanLine, Users, Megaphone } from "lucide-react";
import { Outlet } from "react-router";

export default function VolunteerLayout() {
  const nav: NavItem[] = [
    { to: "/volunteer", label: "Home", icon: Home, end: true },
    { to: "/volunteer/checkin", label: "Check-in", icon: ScanLine },
    { to: "/volunteer/participants", label: "Participants", icon: Users },
    { to: "/volunteer/announcements", label: "Announcements", icon: Megaphone },
  ];

  return (
    <AppShell nav={nav} variant="volunteer" title="Volunteer">
      <Outlet />
    </AppShell>
  );
}
