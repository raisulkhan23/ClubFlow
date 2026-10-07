import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Bell, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { fmtDate } from "@/lib/format";

export default function Announcements() {
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [audience, setAudience] = useState<"all" | "checked_in" | "pending">("all");
  const [publishNow, setPublishNow] = useState(false);

  const events = useQuery(api.events.listForOrganizer);
  const allAnnouncements = useQuery(api.announcements.listForOrganizer, {});
  const create = useMutation(api.announcements.create);
  const setPublished = useMutation(api.announcements.setPublished);
  const remove = useMutation(api.announcements.remove);

  const activeEvent =
    events?.find((e) => e.status === "live" || e.status === "published");

  const cancelCreate = () => {
    setCreateOpen(false);
    setTitle("");
    setMessage("");
    setPriority("normal");
    setAudience("all");
    setPublishNow(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim() || !activeEvent) return;
    const { id } = await create({
      eventId: activeEvent._id as Id<"events">,
      title: title.trim(),
      message: message.trim(),
      priority,
      audience,
      publishNow,
    });
    setCreateOpen(false);
    setTitle("");
    setMessage("");
    setPriority("normal");
    setAudience("all");
    setPublishNow(false);
    window.location.reload();
  };

  const handlePublish = async (id: string) => {
    await setPublished({ id: id as Id<"announcements">, published: true });
    window.location.reload();
  };

  const handleUnpublish = async (id: string) => {
    await setPublished({ id: id as Id<"announcements">, published: false });
    window.location.reload();
  };

  const handleRemove = async (id: string) => {
    await remove({ id: id as Id<"announcements"> });
    window.location.reload();
  };

  const related =
    allAnnouncements?.filter((a) =>
      activeEvent ? a.eventId === activeEvent._id : !a.eventId,
    ) ?? [];

  const shown = related.filter(
    (a) => (a.published ?? true),
  );

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-muted-foreground">
            Share updates with attendees across your events.
          </p>
        </div>
        <Button asChild onClick={() => setCreateOpen(true)} disabled={!activeEvent}>
          <Plus className="mr-2 size-4" />
          New announcement
        </Button>
      </div>

      {createOpen && (
        <Card className="animate-in fade-in zoom-in-95">
          <CardHeader>
            <CardTitle className="text-base">New announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Wake up — registration closes at midnight"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-message">Message</Label>
              <Textarea
                id="ann-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Body of the announcement…"
                rows={4}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Priority</Label>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm w-full"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "normal" | "important" | "urgent")}
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Audience</Label>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm w-full"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as "all" | "checked_in" | "pending")}
                >
                  <option value="all">All confirmed</option>
                  <option value="checked_in">Checked in only</option>
                  <option value="pending">Pending only</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-muted bg-background"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                />
                <span className="text-sm">Publish now</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                Attached to: {activeEvent ? activeEvent.title : "—"}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={cancelCreate}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!title.trim() || !message.trim()}>
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {shown.length === 0 ? (
        <Empty>
          <EmptyTitle>No announcements yet</EmptyTitle>
          <EmptyDescription>
            Create one to notify attendees about schedule changes, reminders, or results.
          </EmptyDescription>
          <EmptyContent>
            <Button asChild onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create announcement
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-4">
          {shown.map((a) => (
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
                            ? "bg-amber-500/10 text-amber-700"
                            : ""
                        }
                      >
                        {a.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {a.published ? "Published" : "Draft"}
                      </Badge>
                      {a.eventId && (
                        <Badge variant="outline" className="text-xs">
                          {events?.find((e) => e._id === a.eventId)?.title ?? "All events"}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-1">{a.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {a.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtDate(a.createdAt)} · by {a.createdBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {a.published ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => handleUnpublish(a._id)}
                          >
                            <EyeOff className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Unpublish</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePublish(a._id)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Publish</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => handleRemove(a._id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {a.published ? (
                      <>
                        Published · {fmtDate(a.publishedAt ?? a.createdAt)}
                      </>
                    ) : (
                      <>Draft · not visible to attendees</>
                    )}
                  </span>
                  <span>{a._creationTime ? "—" : "—"}
                    </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />
    </div>
  );
}
