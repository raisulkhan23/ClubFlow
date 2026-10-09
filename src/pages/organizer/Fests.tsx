import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { CalendarDays, ExternalLink, Link2, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageHeader, StatusBadge } from "@/components/RequireRole";
import { fmtDate } from "@/lib/format";
import type { Id } from "@/convex/_generated/dataModel";

export default function OrganizerFests() {
  const fests = useQuery(api.fests.listForOrganizer);
  const createFest = useMutation(api.fests.createFest);
  const setFestStatus = useMutation(api.fests.setFestStatus);
  const ensureRulebookFests = useMutation(api.fests.ensureRulebookFests);

  const allEvents = useQuery(api.events.listForOrganizer);
  const attachEventToFest = useMutation(api.fests.attachEventToFest);
  const [attachFor, setAttachFor] = useState<Id<"fests"> | null>(null);
  const [attachEventId, setAttachEventId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", venue: "", start: "", end: "" });

  const doCreate = async () => {
    setBusy("create");
    try {
      if (!form.start || !form.end) throw new Error("Pick a start and end date for the festival.");
      const startAt = new Date(`${form.start}T09:00`).getTime();
      const endAt = new Date(`${form.end}T18:00`).getTime();
      const { slug } = await createFest({
        name: form.name,
        description: form.description,
        venue: form.venue || undefined,
        startAt,
        endAt,
        status: published ? "published" : "draft",
      });
      toast.success(`Festival created (${slug}).`);
      setOpen(false);
      setForm({ name: "", description: "", venue: "", start: "", end: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create festival.");
    } finally {
      setBusy(null);
    }
  };

  const doBootstrap = async () => {
    setBusy("bootstrap");
    try {
      const res = await ensureRulebookFests({});
      toast.success(
        res.created.length > 0
          ? `Rulebook festivals ready: ${res.created.join(", ")}.`
          : "Rulebook festivals already exist — nothing to add.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set up festivals.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 px-4 py-7 sm:px-6">
      <PageHeader
        title="Festivals"
        description="Organization → Festival → Event → Registration. Every event belongs to one festival."
        actions={
          <>
            <Button variant="outline" onClick={() => void doBootstrap()} disabled={busy === "bootstrap"}>
              <Wand2 className="size-4" />
              {busy === "bootstrap" ? "Setting up…" : "Set up rulebook festivals"}
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New festival
            </Button>
          </>
        }
      />

      {fests === undefined ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded bg-muted" />)}</div>
      ) : fests.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon"><CalendarDays className="size-5" /></EmptyMedia>
          <EmptyTitle>No festivals yet</EmptyTitle>
          <EmptyDescription>
            Create your first festival, or load the rulebook demonstration festivals and attach events to them.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {fests.map((f) => (
            <Card key={f._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {f.name}
                    {f.isDemo && (
                      <Badge variant="outline" className="ml-2 border-border text-[10px] text-muted-foreground">
                        demo
                      </Badge>
                    )}
                  </CardTitle>
                  <StatusBadge status={f.status === "published" ? "live" : "draft"} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">{f.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden /> {fmtDate(f.startAt)} – {fmtDate(f.endAt)}
                  </span>
                  <span>
                    {f.publishedEventCount} published / {f.eventCount} event{f.eventCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={f.status === "published" ? "outline" : "default"}
                    disabled={busy === f._id}
                    onClick={async () => {
                      setBusy(f._id);
                      try {
                        await setFestStatus({
                          id: f._id as Id<"fests">,
                          status: f.status === "published" ? "draft" : "published",
                        });
                        toast.success(f.status === "published" ? "Festival unpublished." : "Festival published.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not update festival.");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {f.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAttachFor(f._id as Id<"fests">)}>
                    <Link2 className="size-3.5" /> Attach event
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/organizer/events?festId=${f._id}`}>
                      <ExternalLink className="size-3.5" /> Manage events
                    </a>
                  </Button>
                  {f.status === "published" && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/fests/${f.slug}`} target="_blank" rel="noreferrer">View public page</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Attach an existing event to a festival (creates the required link) */}
      <Dialog open={!!attachFor} onOpenChange={(o) => !o && setAttachFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Attach an event to this festival</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Event</Label>
            <select
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              value={attachEventId}
              onChange={(e) => setAttachEventId(e.target.value)}
              aria-label="Event to attach"
            >
              <option value="">Choose an event…</option>
              {(allEvents ?? []).map((e) => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              This sets the event's parent festival — the public event page then shows the
              organization → festival → event breadcrumb.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachFor(null)}>Cancel</Button>
            <Button
              disabled={!attachEventId || busy === "attach"}
              onClick={async () => {
                if (!attachFor || !attachEventId) return;
                setBusy("attach");
                try {
                  await attachEventToFest({
                    festId: attachFor,
                    eventId: attachEventId as Id<"events">,
                  });
                  toast.success("Event attached to the festival.");
                  setAttachFor(null);
                  setAttachEventId("");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not attach the event.");
                } finally {
                  setBusy(null);
                }
              }}
            >
              {busy === "attach" ? "Attaching…" : "Attach event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New festival</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fest-name">Name</Label>
              <Input id="fest-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Winter Tech Fest 2026" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fest-desc">Description</Label>
              <Input id="fest-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this festival is about" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fest-venue">Venue (optional)</Label>
              <Input id="fest-venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. DRMC Campus" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fest-start">Starts</Label>
                <Input id="fest-start" type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fest-end">Ends</Label>
                <Input id="fest-end" type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Publish immediately</p>
                <p className="text-xs text-muted-foreground">
                  Requires at least one published event under the festival.
                </p>
              </div>
              <Switch checked={published} onCheckedChange={setPublished} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void doCreate()} disabled={busy === "create" || form.name.trim().length < 3 || form.description.trim().length < 10}>
              {busy === "create" ? "Creating…" : "Create festival"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
