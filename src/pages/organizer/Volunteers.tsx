import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, UserCheck, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import type { Id } from "@/convex/_generated/dataModel";

const ROLES = ["Coordinator", "Check-in staff", "Stage crew", "Runner", "Photographer", "General"];

export default function Volunteers() {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("General");
  const [note, setNote] = useState("");
  const [revoked, setRevoked] = useState("");

  const volunteers = useQuery(api.volunteers.list);
  const create = useMutation(api.volunteers.create);
  const toggleActive = useMutation(api.volunteers.toggleActive);
  const remove = useMutation(api.volunteers.remove);

  const active = (volunteers ?? []).filter((v) => v.active);
  const inactive = (volunteers ?? []).filter((v) => !v.active);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) return;
    await create({
      name,
      email,
      phone: phone.trim() || undefined,
      role,
      note: note.trim() || undefined,
    });
    setCreateOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setRole("General");
    setNote("");
    window.location.reload();
  };

  const handleToggle = async (id: string) => {
    await toggleActive({ volunteerId: id });
    window.location.reload();
  };

  const handleRemove = async (id: string) => {
    await remove({ volunteerId: id });
    window.location.reload();
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
        <Button asChild onClick={() => setCreateOpen(true)}>
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
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.org"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone (optional)</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Note</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Prefers late shifts…"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!name.trim() || !email.trim()}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div
                  key={v._id}
                  className="rounded-lg border bg-muted/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{v.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {v.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" />
                            {v.email}
                          </span>
                        )}
                        {v.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" />
                            {v.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {v.role}
                    </Badge>
                  </div>
                  {v.note && <p className="mt-1.5 text-xs text-muted-foreground">{v.note}</p>}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Joined {fmtDate(v.createdAt)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => handleToggle(v._id)}
                    >
                      Deactivate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
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
                <div
                  key={v._id}
                  className="rounded-lg border border-border/40 bg-muted/30 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-muted-foreground">{v.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {v.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" />
                            {v.email}
                          </span>
                        )}
                        {v.role && (
                          <Badge variant="outline" className="text-xs">
                            {v.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleToggle(v._id)}
                    >
                      <UserCheck className="mr-1 size-3.5" />
                      Re-activate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
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

      <div className="text-sm text-muted-foreground">
        {active.length} active · {inactive.length} inactive ·{" "}
        {registrations?.length ?? 0} check-in shifts filled.
      </div>
    </div>
  );
}
