import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export default function Admin() {
  const [mode, setMode] = useState<"organizers" | "platform">("organizers");
  const [search, setSearch] = useState("");
  const setRole = useMutation(api.clubs.setUserRole);
  const deleteClub = useMutation(api.clubs.deleteClub);
  const [busyId, setBusyId] = useState<string | null>(null);

  const organizers = useQuery(api.clubs.listOrganizers);
  const platformData = useQuery(api.clubs.listAll);

  const filtered =
    organizers?.filter(
      (u) =>
        !search.trim() ||
        u.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        u.email.toLowerCase().includes(search.trim().toLowerCase()),
    ) ?? [];

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-[1.375rem]">Admin</h1>
        <p className="mt-1 text-muted-foreground">
          Manage organizers and view platform-wide statistics.
        </p>
      </div>

      <div className="flex gap-1">
        {(["organizers", "platform"] as const).map((m) => (
          <button
            key={m}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground"
            }`}
            onClick={() => setMode(m)}
          >
            {m === "organizers" && <Users className="mr-1.5 size-3.5 inline" />}
            {m === "platform" && <Globe className="mr-1.5 size-3.5 inline" />}
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {mode === "organizers" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizers</CardTitle>
            <CardDescription>
              View and manage people with organizer access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[300px]"
              />
              <Badge variant="outline" className="text-xs">
                {filtered.length} organizer{filtered.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {filtered.length === 0 ? (
              <Empty>
                <EmptyTitle>No organizers found</EmptyTitle>
                <EmptyDescription>
                  {search ? "Try a different search term." : "No organizers in the system yet."}
                </EmptyDescription>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="w-[130px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            u.role === "super_admin"
                              ? "text-rose-700 border-rose-200 bg-rose-500/10"
                              : u.role === "organizer"
                              ? "text-indigo-700 border-indigo-200 bg-indigo-500/10"
                              : u.role === "volunteer"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "text-muted-foreground"
                          }
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.clubName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground"
                          disabled={busyId === u._id}
                          onClick={async () => {
                            if (!confirm(`Demote ${u.name} to participant? Their dashboard role will change immediately.`)) return;
                            setBusyId(u._id);
                            try {
                              await setRole({ userId: u._id as never, role: "participant" });
                              toast.success(`${u.name} is now a participant.`);
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Could not update role.");
                            } finally {
                              setBusyId(null);
                            }
                          }}
                        >
                          {busyId === u._id ? "Saving…" : "Demote"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {mode === "platform" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4" />
              Platform overview
            </CardTitle>
            <CardDescription>
              High-level stats across the whole platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {platformData ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Clubs</p>
                    <p className="text-2xl font-bold">{platformData.platform.clubs}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Events</p>
                    <p className="text-2xl font-bold">{platformData.platform.events}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Published events</p>
                    <p className="text-2xl font-bold">{platformData.platform.publishedEvents}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">{platformData.platform.users}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Registrations</p>
                    <p className="text-2xl font-bold">{platformData.platform.registrations}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Checked in</p>
                    <p className="text-2xl font-bold">{platformData.platform.checkedIn}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h2 className="text-sm font-medium">Clubs</h2>
                  {platformData.clubs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No clubs yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Club</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Events</TableHead>
                          <TableHead>Confirmed</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead className="w-[130px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {platformData.clubs.map((c) => (
                          <TableRow key={c._id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {c.slug}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{c.eventCount}</TableCell>
                            <TableCell className="text-muted-foreground">{c.registrationCount}</TableCell>
                            <TableCell className="text-muted-foreground">{c.memberCount}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground"
                                disabled={busyId === c._id}
                                onClick={async () => {
                                  if (!confirm(`Remove ${c.name}? Only clubs without any events can be removed.`)) return;
                                  setBusyId(c._id);
                                  try {
                                    await deleteClub({ clubId: c._id as never });
                                    toast.success(`${c.name} was removed.`);
                                  } catch (err) {
                                    toast.error(err instanceof Error ? err.message : "Could not remove club.");
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                              >
                                {busyId === c._id ? "Removing…" : "Remove"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            ) : (
              <Empty>
                <EmptyTitle>Loading…</EmptyTitle>
                <EmptyDescription>Platform stats are loading.</EmptyDescription>
              </Empty>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />
    </div>
  );
}
