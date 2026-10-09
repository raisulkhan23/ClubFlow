import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ParticipantShell } from "./ParticipantShell";
import { PageHeader, roleLabel } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const updateProfile = useMutation(api.accounts.updateProfile);
  // Local edits win over the loaded profile — no effect needed to sync.
  const [localName, setLocalName] = useState<string | null>(null);
  const [localPhone, setLocalPhone] = useState<string | null>(null);
  const name = localName ?? user?.name ?? "";
  const phone = localPhone ?? user?.phone ?? "";
  const setName = setLocalName;
  const setPhone = setLocalPhone;
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ParticipantShell>
      <PageHeader title="Profile" description="How organizers and check-in staff see you." />

      <div className="mt-6 max-w-lg space-y-5 rounded-xl border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email ?? "Demo session (no email)"} disabled />
          <p className="text-xs text-muted-foreground">
            {user?.email ? "Your sign-in email — managed by your authentication method." : "Signed in via a demo session."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" />
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Role: {roleLabel(user?.role)}
          </Badge>
          <Button onClick={() => void save()} disabled={saving || name.trim().length < 2}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </ParticipantShell>
  );
}
