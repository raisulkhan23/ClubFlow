import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User, Globe, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

export default function Settings() {
  const [section, setSection] = useState<"profile" | "notifications" | "visibility">("profile");

  const myClub = useQuery(api.clubs.getMyClub);
  const updateMyClub = useMutation(api.clubs.updateMyClub);
  // Captured once so the footer stays pure across renders.
  const [now] = useState(() => Date.now());

  // Local edits win over server values; untouched inputs show the loaded club.
  const [localClub, setLocalClub] = useState<{
    name: string;
    slug: string;
    contactEmail: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const club = localClub ?? {
    name: myClub?.name ?? "",
    slug: myClub?.slug ?? "",
    contactEmail: myClub?.contactEmail ?? "",
  };

  const updateClub = (patch: Partial<typeof club>) => {
    setLocalClub({ ...club, ...patch });
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateMyClub({
        name: club.name,
        contactEmail: club.contactEmail,
      });
      setIsDirty(false);
      setLocalClub(null);
      toast.success("Club profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes.");
    }
  };

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your club profile, communication, and visibility.
        </p>
      </div>

      <div className="flex gap-1">
        {(["profile", "notifications", "visibility"] as const).map((s) => (
          <button
            key={s}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              section === s
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground"
            }`}
            onClick={() => setSection(s)}
          >
            {s === "profile" && <User className="mr-1.5 size-3.5 inline" />}
            {s === "notifications" && <Bell className="mr-1.5 size-3.5 inline" />}
            {s === "visibility" && <Globe className="mr-1.5 size-3.5 inline" />}
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile */}
      {section === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Club profile</CardTitle>
            <CardDescription>
              This is what attendees see when they browse your events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="club-name">Club name</Label>
                <Input
                  id="club-name"
                  value={club.name}
                  onChange={(e) => updateClub({ name: e.target.value })}
                  placeholder="DRMC IT CLUB"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="club-slug">Members-only slug</Label>
                <Input
                  id="club-slug"
                  value={club.slug}
                  disabled
                  onChange={(e) => updateClub({ slug: e.target.value })}
                  placeholder="drmc-tech-club"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs like <span className="font-mono">/events?club={club.slug}</span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Contact email</Label>
              <Input
                id="contact-email"
                type="email"                  value={club.contactEmail}
                  onChange={(e) => updateClub({ contactEmail: e.target.value })}
                placeholder="events@drmc.org"
              />
            </div>

            {isDirty && (
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDirty(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save changes</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {section === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>
              Choose which events trigger email or in-app alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: "new_reg", label: "New registration", desc: "When someone signs up for your event" },
              { id: "approval", label: "Registration approval needed", desc: "When an attendee needs manual approval" },
              { id: "checkin", label: "Check-in activity", desc: "When an attendee checks in at the venue" },
              { id: "cancellation", label: "Cancellation", desc: "When an attendee cancels their registration" },
              { id: "certificate", label: "Certificate issued", desc: "When a certificate is generated for an attendee" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch id={item.id} defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Visibility */}
      {section === "visibility" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visibility</CardTitle>
            <CardDescription>
              Control how your events appear to the public.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Public event listing</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your published events appear on the public /events page.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Private events</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Draft events stay hidden until you publish them.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-end">
              <Badge variant="outline" className="text-xs">
                Public pages are cached for 60 seconds
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Last updated {fmtDate(now)}</span>
        <span>Organizer portal v1.0</span>
      </div>
    </div>
  );
}
