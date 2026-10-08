import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CalendarDays, CheckCircle2, Clock, Megaphone, ScanLine, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { fmtRelative, fmtDateTime } from "@/lib/format";
import { motion } from "framer-motion";

export default function VolunteerHome() {
  const [tab, setTab] = useState<"shifts" | "announcements">("shifts");

  const assignments = useQuery(api.volunteers.myAssignments);
  const announcements = useQuery(api.volunteers.myAnnouncements);
  const registrations = useQuery(
    api.registrations.listForVolunteer,
    assignments?.[0] ? { eventId: assignments[0].eventId as never } : "skip",
  );

  const activeAssignments = (assignments ?? []).filter((a) =>
    ["live", "published", "registration_closed"].includes(a.eventStatus),
  );

  const primaryEvent = activeAssignments[0];

  const regs = (registrations ?? {}).registrations ?? [];
  const checkedIn = regs.filter((r) => r.checkedInAt != null).length;
  const remaining = regs.length - checkedIn;

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Volunteer home</h1>
        <p className="mt-1 text-muted-foreground">
          Your tasks and upcoming shifts at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-emerald-500/10 p-3">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active events</p>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {activeAssignments.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <Clock className="size-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {primaryEvent ? "Checked in" : "No event"}
                  </p>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {primaryEvent ? `${checkedIn}` : "—"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <CalendarDays className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {primaryEvent ? `${remaining}` : "—"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex gap-1">
        <Button
          variant={tab === "shifts" ? "default" : "ghost"}
          size="sm"
          className="text-xs"
          onClick={() => setTab("shifts")}
        >
          <CalendarDays className="mr-1 size-3.5" />
          Shifts
        </Button>
        <Button
          variant={tab === "announcements" ? "default" : "ghost"}
          size="sm"
          className="text-xs"
          onClick={() => setTab("announcements")}
        >
          <Megaphone className="mr-1 size-3.5" />
          Announcements
        </Button>
      </div>

      {tab === "shifts" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4" />
                Your upcoming shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAssignments.length === 0 ? (
                <Empty className="py-6">
                  <EmptyMedia variant="icon">
                    <CalendarDays className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No active shifts</EmptyTitle>
                  <EmptyDescription>
                    You don't have any active events assigned right now.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="space-y-3">
                  {activeAssignments.map((a) => {
                    const startAt = a.startAt ? new Date(a.startAt) : null;
                    return (
                      <motion.div
                        key={a.eventId}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border bg-muted/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{a.eventTitle}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="size-3" />
                                {startAt ? fmtDateTime(a.startAt) : "No start time set"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {a.venue}
                              </span>
                            </div>
                            <Badge variant="secondary" className="mt-2 inline-block capitalize">
                              {a.volunteerRole.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {checkedIn} / {regs.length} checked in
                            </p>
                            <Button asChild size="sm" className="mt-2">
                              <a href="/volunteer/checkin">Start scanning</a>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ScanLine className="size-4" />
                Quick actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <a href="/volunteer/checkin">
                  <ScanLine className="mr-2 size-4" />
                  Open check-in
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/volunteer/participants">
                  <Users className="mr-2 size-4" />
                  View participants
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="size-4" />
              Recent announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements === undefined ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/50" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <Megaphone className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No announcements yet</EmptyTitle>
                <EmptyDescription>
                  Organizers will post updates here for the events you're helping with.
                </EmptyDescription>
              </Empty>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 8).map((a) => (
                  <motion.div
                    key={a._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Badge
                          variant="secondary"
                          className={
                            a.priority === "urgent"
                              ? "bg-rose-500/10 text-rose-700"
                              : a.priority === "important"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : ""
                          }
                        >
                          {a.priority}
                        </Badge>
                        <p className="mt-2 font-semibold">{a.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                          {a.message}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {a.eventTitle} · {fmtRelative(a.createdAt)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />
    </div>
  );
}
