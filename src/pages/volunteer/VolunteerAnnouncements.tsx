import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Megaphone, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";

export default function VolunteerAnnouncements() {
  const [announcements] = useQuery(api.announcements.list);

  const active = (announcements ?? []).filter((a) => a.published);
  const unread = active.filter((a) => !a.read).length;

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="mt-1 text-muted-foreground">
          Updates from organizers for your events.
        </p>
      </div>

      {unread > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-3">
            <Bell className="size-4 text-amber-500" />
            <p className="text-sm">
              <span className="font-medium">{unread}</span> new announcement{unread === 1 ? "" : "s"} ready to read.
            </p>
          </CardContent>
        </Card>
      )}

      {active.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Megaphone className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No announcements yet</EmptyTitle>
          <EmptyDescription>
            Organizers will post updates here about schedule changes, reminders, and results.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-3">
          {active.map((a) => (
            <Card key={a._id} className="animate-in fade-in">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          a.priority === "urgent"
                            ? "bg-rose-500/10 text-rose-700"
                            : a.priority === "high"
                            ? "bg-amber-500/10 text-amber-700"
                            : ""
                        }
                      >
                        {a.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {a.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-1">{a.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {a.message}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{fmtDate(a.createdAt)}</span>
                  <span>{a.views ?? 0} views</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
