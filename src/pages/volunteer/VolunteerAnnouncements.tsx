import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";

type Announcement = {
  _id: string;
  title: string;
  message: string;
  priority: string;
  published: boolean;
  createdAt: number;
};

export default function VolunteerAnnouncements() {
  const announcements = useQuery(api.volunteers.myAnnouncements) as Announcement[] | undefined;

  const active = (announcements ?? []).filter((a) => a.published);

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="mt-1 text-muted-foreground">
          Updates from organizers for your events.
        </p>
      </div>

      {announcements === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : active.length === 0 ? (
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
                            : a.priority === "important"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : ""
                        }
                      >
                        {a.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-1">{a.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                      {a.message}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">{fmtDate(a.createdAt)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
