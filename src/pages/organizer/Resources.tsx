import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Boxes, CalendarClock, Plus, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/RequireRole";
import { fmtDate, fmtDateTime } from "@/lib/format";
import type { Id } from "@/convex/_generated/dataModel";

const CATEGORY_LABEL: Record<string, string> = {
  venue: "Venue",
  equipment: "Equipment",
  furniture: "Furniture",
  tech: "Tech",
};

export default function Resources() {
  const resources = useQuery(api.resources.listResources);
  const reservations = useQuery(api.resources.listReservations);
  const events = useQuery(api.events.listForOrganizer);

  const addResource = useMutation(api.resources.addResource);
  const removeResource = useMutation(api.resources.removeResource);
  const reserve = useMutation(api.resources.reserve);
  const cancelReservation = useMutation(api.resources.cancelReservation);
  const markReturned = useMutation(api.resources.markReturned);

  const [addOpen, setAddOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "equipment",
    location: "",
    quantity: "1",
    exclusive: false,
    condition: "",
  });
  const [booking, setBooking] = useState({
    eventId: "none",
    quantity: "1",
    date: "",
    startTime: "",
    endTime: "",
    note: "",
  });

  const doAdd = async () => {
    setBusy("add");
    try {
      await addResource({
        name: form.name,
        category: form.category as "venue" | "equipment" | "furniture" | "tech",
        location: form.location || undefined,
        quantity: Number(form.quantity) || 1,
        exclusive: form.exclusive,
        condition: form.condition || undefined,
      });
      toast.success("Resource added to your club's catalog.");
      setAddOpen(false);
      setForm({ name: "", category: "equipment", location: "", quantity: "1", exclusive: false, condition: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add resource.");
    } finally {
      setBusy(null);
    }
  };

  const doBook = async () => {
    if (!bookOpen) return;
    if (!booking.date || !booking.startTime || !booking.endTime) {
      toast.error("Pick a date, start time and end time.");
      return;
    }
    setBusy("book");
    try {
      const startAt = new Date(`${booking.date}T${booking.startTime}`).getTime();
      const endAt = new Date(`${booking.date}T${booking.endTime}`).getTime();
      await reserve({
        resourceId: bookOpen as Id<"resources">,
        eventId: booking.eventId === "none" ? undefined : (booking.eventId as Id<"events">),
        quantity: Number(booking.quantity) || 1,
        startAt,
        endAt,
        note: booking.note || undefined,
      });
      toast.success("Reservation confirmed.");
      setBookOpen(null);
      setBooking({ eventId: "none", quantity: "1", date: "", startTime: "", endTime: "", note: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reservation failed.");
    } finally {
      setBusy(null);
    }
  };

  const active = (reservations ?? []).filter((r) => r.status === "confirmed" || r.status === "pending");
  const past = (reservations ?? []).filter((r) => r.status === "returned" || r.status === "cancelled");

  return (
    <div className="space-y-6 px-4 py-7 sm:px-6">
      <PageHeader
        title="Resources"
        description="Rooms, equipment and supplies your club controls — with conflict-checked reservations."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add resource
          </Button>
        }
      />

      {/* Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="size-4" /> Catalog ({resources?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resources === undefined ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
          ) : resources.length === 0 ? (
            <Empty className="py-6">
              <EmptyMedia variant="icon"><Boxes className="size-5" /></EmptyMedia>
              <EmptyTitle>No resources yet</EmptyTitle>
              <EmptyDescription>Add venues or equipment so organizers can reserve them for events.</EmptyDescription>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-table">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="py-2 pl-4 font-medium">
                        {r.name}
                        {r.exclusive && (
                          <Badge variant="outline" className="ml-2 border-amber-500/30 text-[10px] text-amber-600 dark:text-amber-300">
                            exclusive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{CATEGORY_LABEL[r.category]}</TableCell>
                      <TableCell className="text-muted-foreground">{r.location ?? "—"}</TableCell>
                      <TableCell className="tabular">{r.quantity}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setBookOpen(r._id); setBooking((b) => ({ ...b, quantity: "1" })); }}>
                            <CalendarClock className="size-3.5" /> Reserve
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="text-destructive"
                            disabled={busy === `rm-${r._id}`}
                            onClick={async () => {
                              if (!confirm(`Deactivate ${r.name}? It will disappear until re-added.`)) return;
                              setBusy(`rm-${r._id}`);
                              try { await removeResource({ id: r._id as Id<"resources"> }); toast.success("Resource deactivated."); }
                              catch (err) { toast.error(err instanceof Error ? err.message : "Failed."); }
                              finally { setBusy(null); }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active reservations ({active.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <Empty className="py-6">
              <EmptyMedia variant="icon"><CalendarClock className="size-5" /></EmptyMedia>
              <EmptyTitle>No active reservations</EmptyTitle>
              <EmptyDescription>Reserve a resource above — overlapping exclusive bookings are rejected server-side.</EmptyDescription>
            </Empty>
          ) : (
            <ul className="space-y-2">
              {active.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.resourceName}
                      <span className="ml-2 text-xs text-muted-foreground">×{r.quantity}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDateTime(r.startAt)} → {fmtDate(r.endAt)}
                      {r.eventTitle ? ` · for ${r.eventTitle}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm" variant="outline"
                      disabled={busy === `ret-${r._id}`}
                      onClick={async () => {
                        setBusy(`ret-${r._id}`);
                        try { await markReturned({ id: r._id as Id<"reservations"> }); toast.success("Marked returned."); }
                        catch (err) { toast.error(err instanceof Error ? err.message : "Failed."); }
                        finally { setBusy(null); }
                      }}
                    >
                      <Undo2 className="size-3.5" /> Returned
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="text-destructive"
                      disabled={busy === `cx-${r._id}`}
                      onClick={async () => {
                        if (!confirm("Cancel this reservation?")) return;
                        setBusy(`cx-${r._id}`);
                        try { await cancelReservation({ id: r._id as Id<"reservations"> }); toast.success("Cancelled."); }
                        catch (err) { toast.error(err instanceof Error ? err.message : "Failed."); }
                        finally { setBusy(null); }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {past.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              History: {past.length} completed/cancelled reservation{past.length === 1 ? "" : "s"}.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add resource dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="res-name">Name</Label>
              <Input id="res-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Auditorium A / Projector #3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-qty">Quantity</Label>
                <Input id="res-qty" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-loc">Location (optional)</Label>
              <Input id="res-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Level 3, East wing" />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Exclusive</p>
                <p className="text-xs text-muted-foreground">Venues/stages — one booking per slot, conflicts rejected.</p>
              </div>
              <Switch checked={form.exclusive} onCheckedChange={(v) => setForm({ ...form, exclusive: v, quantity: v ? "1" : form.quantity })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-cond">Condition / notes (optional)</Label>
              <Input id="res-cond" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="e.g. HDMI port flaky" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => void doAdd()} disabled={busy === "add" || form.name.trim().length < 2}>
              {busy === "add" ? "Adding…" : "Add resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book dialog */}
      <Dialog open={!!bookOpen} onOpenChange={(o) => !o && setBookOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reserve resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Link to event (optional)</Label>
              <Select value={booking.eventId} onValueChange={(v) => setBooking({ ...booking, eventId: v })}>
                <SelectTrigger><SelectValue placeholder="No event" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {(events ?? []).map((e) => <SelectItem key={e._id} value={e._id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bk-date">Date</Label>
                <Input id="bk-date" type="date" value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-start">Start</Label>
                <Input id="bk-start" type="time" value={booking.startTime} onChange={(e) => setBooking({ ...booking, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-end">End</Label>
                <Input id="bk-end" type="time" value={booking.endTime} onChange={(e) => setBooking({ ...booking, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-qty">Quantity</Label>
              <Input id="bk-qty" type="number" min={1} value={booking.quantity} onChange={(e) => setBooking({ ...booking, quantity: e.target.value })} />
              <p className="text-xs text-muted-foreground">Exclusive resources allow only 1 booking per slot — conflicts are rejected on the server.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-note">Note (optional)</Label>
              <Input id="bk-note" value={booking.note} onChange={(e) => setBooking({ ...booking, note: e.target.value })} placeholder="e.g. Pickup after setup" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookOpen(null)}>Cancel</Button>
            <Button onClick={() => void doBook()} disabled={busy === "book"}>
              {busy === "book" ? "Booking…" : "Confirm reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
