import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, UserCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import type { Id } from "@/convex/_generated/dataModel";

const ROLES = [
  { value: "coordinator", label: "Coordinator" },
  { value: "checkin", label: "Check-in staff" },
  { value: "registration_desk", label: "Registration desk" },
  { value: "tech_support", label: "Tech support" },
  { value: "general", label: "General" },
] as const;

export default function Volunteers() {
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("general");
  const [error, setError] = useState("");

  const volunteers = useQuery(api.volunteers.list);
  const events = useQuery(api.events.listForOrganizer);
  const add = useMutation(api.volunteers.add);
  const update = useMutation(api.volunteers.update);
  const remove = useMutation(api.volunteers.remove);

  const active = (volunteers ?? []).filter((v) => v.status === "active");
  const inactive = (volunteers ?? []).filter((v) => v.status !== "active");

  const handleCreate = async () => {
    if (!email.trim()) return;
    try {
      await add({
        email: email.trim(),
        role: role as "coordinator" | "checkin" | "registration_desk" | "tech_support" | "general",
        eventIds: (events ?? []).filter((e) => ["published", "live", "registration_closed"].includes(e.status)).map((e) => e._id),
      });
      setCreateOpen(false);
      setEmail("");
      setRole("general");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add volunteer.");
    }
  };

  const handleToggle = async (id: string, current: string) => {
    await update({ id: id as Id<"volunteers">, status: current === "active" ? "inactive" : "active" });
  };

  const handleRemove = async (id: string) => {
    await remove({ id: id as Id<"volunteers"> });
  };

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Volunteers</h1>
          <p className="mt-1 text-muted-foreground">
            People who help run your events behind the scenes.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add volunteer
        </Button>
      </div>

      {createOpen && (
        <Card className="animate-in fade-in zoom-in-95">
          <CardHeader>
            <CardTitle className="text-base">New volunteer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vol-email">Email (must have a ClubFlow account)</Label>
                <Input
                  id="vol-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.org"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vol-role">Role</Label>
                <select
                  id="vol-role"
                  className="rounded-md border bg-background px-3 py-2 text-sm w-full"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!email.trim()}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {volunteers === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : volunteers.length === 0 ? (
        <Empty>
          <EmptyTitle>No volunteers yet</EmptyTitle>
          <EmptyDescription>
            Add volunteers by email — they must already have a ClubFlow account. Volunteers get a simplified view for check-in and participant lookup.
          </EmptyDescription>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add your first volunteer
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="size-4" />
                Active ({active.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {active.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No active volunteers yet.
                </div>
              ) : (
                active.map((v) => (
                  <div key={v._id} className="rounded-lg border bg-muted/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" />
                            {v.email}
                          </span>
                          {v.eventTitles.length > 0 && (
                            <span>· {v.eventTitles.length} event{v.eventTitles.length > 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {v.role.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Added {fmtDate(v.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => handleToggle(v._id, v.status)}
                      >
                        Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => handleRemove(v._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inactive ({inactive.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inactive.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  All volunteers are active.
                </div>
              ) : (
                inactive.map((v) => (
                  <div key={v._id} className="rounded-lg border border-border/40 bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-muted-foreground">{v.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" />
                            {v.email}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 capitalize">
                        {v.role.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleToggle(v._id, v.status)}
                      >
                        <UserCheck className="mr-1 size-3.5" />
                        Re-activate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => handleRemove(v._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
