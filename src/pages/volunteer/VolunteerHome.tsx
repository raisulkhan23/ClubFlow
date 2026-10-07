import { CalendarDays, CheckCircle2, Clock, Megaphone, ScanLine, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VolunteerHome() {

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Volunteer home</h1>
        <p className="mt-1 text-muted-foreground">
          Your tasks and upcoming shifts at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shifts this week</p>
                <Badge variant="secondary" className="text-lg font-bold">3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-500/10 p-3">
                <Clock className="size-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins handled</p>
                <Badge variant="secondary" className="text-lg font-bold">12</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <CalendarDays className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Events this month</p>
                <Badge variant="secondary" className="text-lg font-bold">2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4" />
              Your upcoming shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Shift schedules appear here when organizers assign you to events.
            </p>
            <div className="mt-3 rounded-lg border border-dashed p-4 text-center">
              <CalendarDays className="size-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">No shifts assigned yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check back with the organizer for scheduling.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="size-4" />
              Recent announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Announcements will appear here for the events you're helping with.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <a href="/volunteer/checkin">
            <ScanLine className="mr-2 size-4" />
            Open check-in
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/volunteer/participants">
            <Users className="mr-2 size-4" />
            View participants
          </a>
        </Button>
      </div>
    </div>
  );
}
