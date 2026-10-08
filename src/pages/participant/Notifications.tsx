import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ParticipantShell } from "./ParticipantShell";
import { EmptyState, PageHeader } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { fmtRelative } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  announcement: "📣 Announcement",
  registration: "🎟️ Registration",
  result: "🏆 Results",
  certificate: "🏅 Certificate",
  system: "🔔 System",
};

export default function Notifications() {
  const rows = useQuery(api.notifications.list);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);
  const unread = rows?.filter((n) => !n.readAt).length ?? 0;

  return (
    <ParticipantShell>
      <PageHeader
        title="Notifications"
        description="Announcements and updates from your events."
        actions={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={() => void markAllRead({})}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {rows === undefined ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Bell className="size-5" />}
            title="No notifications yet"
            description="Event announcements and registration updates will land here."
            action={<Button asChild><Link to="/events">Browse events</Link></Button>}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {rows.map((n) => (
            <div
              key={n._id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                !n.readAt ? "border-primary/30 bg-primary/[0.04]" : "bg-card",
              )}
              onClick={() => {
                if (!n.readAt) void markRead({ id: n._id });
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{n.title}</p>
                <span className="text-xs text-muted-foreground">{TYPE_LABEL[n.type] ?? n.type}</span>
                {!n.readAt && <span className="size-1.5 rounded-full bg-primary" aria-label="unread" />}
                <span className="ml-auto text-xs text-muted-foreground">{fmtRelative(n.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              {n.link && (
                <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-primary">
                  <Link to={n.link}>Open →</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </ParticipantShell>
  );
}
