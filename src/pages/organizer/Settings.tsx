import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User, Mail, Phone, Globe, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";

export default function Settings() {
  const [section, setSection] = useState<"profile" | "notifications" | "visibility">("profile");

  const currentUser = useQuery(api.users.getCurrent);
  const [club, setClub] = useState({
    name: "",
    slug: "",
    contactEmail: "",
    contactPhone: "",
    bio: "",
    location: "",
    isOpenToRegistrations: true,
    supportsCertificates: true,
  });

  const [isDirty, setIsDirty] = useState(false);
  const updateClub = useMutation(api.clubs.update);

  const handleSave = async () => {
    await updateClub({
      clubId: club._id,
      name: club.name,
      contactEmail: club.contactEmail,
      contactPhone: club.contactPhone ?? undefined,
      bio: club.bio ?? undefined,
      location: club.location ?? undefined,
      isOpenToRegistrations: club.isOpenToRegistrations,
      supportsCertificates: club.supportsCertificates,
    });
    setIsDirty(false);
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
                  onChange={(e) => { club.name = e.target.value; setIsDirty(true); }}
                  placeholder="DRMC Tech Club"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="club-slug">Members-only slug</Label>
                <Input
                  id="club-slug"
                  value={club.slug}
                  onChange={(e) => { club.slug = e.target.value; setIsDirty(true); }}
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
                type="email"
                value={club.contactEmail}
                onChange={(e) => { club.contactEmail = e.target.value; setIsDirty(true); }}
                placeholder="events@drmc.org"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Contact phone</Label>
              <Input
                id="contact-phone"
                value={club.contactPhone}
                onChange={(e) => { club.contactPhone = e.target.value; setIsDirty(true); }}
                placeholder="+1 555 000 0000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={club.location}
                onChange={(e) => { club.location = e.target.value; setIsDirty(true); }}
                placeholder="Downtown campus, Building C"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">About your club</Label>
              <Textarea
                id="bio"
                value={club.bio}
                onChange={(e) => { club.bio = e.target.value; setIsDirty(true); }}
                placeholder="We host tech events, hackathons, and weekly workshops for students…"
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="open-to-registrations" className="text-sm">Open to new registrations</Label>
                <Switch
                  id="open-to-registrations"
                  checked={club.isOpenToRegistrations}
                  onCheckedChange={(v) => { club.isOpenToRegistrations = v; setIsDirty(true); }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="supports-certificates" className="text-sm">Issue certificates</Label>
                <Switch
                  id="supports-certificates"
                  checked={club.supportsCertificates}
                  onCheckedChange={(v) => { club.supportsCertificates = v; setIsDirty(true); }}
                />
              </div>
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
        <span>Last updated {fmtDate(Date.now())}</span>
        <span>Organizer portal v1.0</span>
      </div>
    </div>
  );
}
