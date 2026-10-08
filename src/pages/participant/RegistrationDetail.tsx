import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ParticipantShell } from "./ParticipantShell";
import { EmptyState, StatusBadge } from "@/components/RequireRole";
import { QrCode } from "@/components/QrCode";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, CalendarDays, Copy, FileDown, MapPin, QrCode as QrIcon } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { generateCertificatePdf } from "@/lib/certificate-pdf";

export default function RegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useQuery(api.registrations.getMyRegistration, id ? { id: id as never } : "skip");
  const cancel = useMutation(api.registrations.cancelRegistration);
  const [cancelling, setCancelling] = useState(false);

  if (data === undefined) {
    return (
      <ParticipantShell>
        <Skeleton className="h-96" />
      </ParticipantShell>
    );
  }

  if (!data) {
    return (
      <ParticipantShell>
        <EmptyState
          title="Registration not found"
          description="This registration doesn't exist or belongs to another account."
          action={<Button asChild><Link to="/dashboard/registrations">My registrations</Link></Button>}
        />
      </ParticipantShell>
    );
  }

  const { registration, event, clubName, certificate, participantName } = data;

  const downloadCertificate = async () => {
    if (!certificate) return;
    try {
      await generateCertificatePdf({
        clubName,
        eventTitle: event.title,
        participantName,
        achievement: certificate.achievement,
        dateLabel: fmtDate(certificate.issuedAt),
        certificateId: certificate.certificateId,
        verifyUrl: `${window.location.origin}/verify/${certificate.certificateId}`,
      });
      toast.success("Certificate downloaded");
    } catch {
      toast.error("Could not generate the PDF. Please try again.");
    }
  };

  return (
    <ParticipantShell>
      <Link to="/dashboard/registrations" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> My registrations
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{event.title}</h1>
              <StatusBadge status={registration.checkedInAt ? "checked_in" : registration.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{registration.registrationId}</span> · registered {fmtDate(registration.createdAt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarDays className="size-4 text-primary" /> {fmtDateTime(event.startAt)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" /> {event.venue}</span>
            </div>
          </div>

          {/* Ticket */}
          {registration.status === "confirmed" && (
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <QrIcon className="size-4 text-primary" /> Entry ticket
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Show this QR at the check-in desk. Screenshots are fine.
              </p>
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="rounded-2xl bg-white p-3">
                  <QrCode value={registration.registrationId} size={170} light="#ffffff" dark="#0c1210" />
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold">{registration.registrationId}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      void navigator.clipboard.writeText(registration.registrationId);
                      toast.success("Registration ID copied");
                    }}
                  >
                    <Copy className="size-3.5" /> Copy ID
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Team */}
          {registration.type === "team" && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-display text-base font-semibold">Team: {registration.teamName}</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">Leader</span>
                  {participantName}
                </li>
                {registration.teamMembers.map((m) => (
                  <li key={m.name} className="text-muted-foreground">
                    · {m.name}{m.email ? ` — ${m.email}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Answers */}
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-display text-base font-semibold">Registration details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {registration.answers.map((a, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">{a.label}</dt>
                  <dd className="text-right font-medium">
                    {a.type === "file" && a.value ? (
                      a.fileUrl ? (
                        <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                          View file
                        </a>
                      ) : (
                        "Attached"
                      )
                    ) : Array.isArray(a.value) ? (
                      a.value.join(", ") || "—"
                    ) : (
                      String(a.value ?? "—")
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Side actions */}
        <aside className="space-y-4">
          {certificate && (
            <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
              <p className="font-display text-base font-semibold">🏅 Certificate issued</p>
              <p className="mt-1 text-sm text-muted-foreground">{certificate.achievement}</p>
              <Button onClick={() => void downloadCertificate()} className="mt-3 w-full">
                <FileDown className="size-4" /> Download PDF
              </Button>
              <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
                <Link to={`/verify/${certificate.certificateId}`}>View verification page</Link>
              </Button>
            </div>
          )}

          <div className="rounded-xl border bg-card p-5 text-sm">
            <p className="font-semibold">Need help?</p>
            <p className="mt-1 text-muted-foreground">
              Contact the organizers at{" "}
              <a className="text-primary underline underline-offset-2" href={`mailto:${event.contactEmail}`}>
                {event.contactEmail}
              </a>
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link to={`/events/${event.slug}`}>Event page</Link>
            </Button>
          </div>

          {!registration.checkedInAt && (registration.status === "confirmed" || registration.status === "pending") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-red-600 hover:text-red-600 dark:text-red-300">
                  Cancel registration
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this registration?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your spot for {event.title} will be released. This can't be undone — you can re-register while
                    registration is open.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    disabled={cancelling}
                    onClick={async () => {
                      setCancelling(true);
                      try {
                        await cancel({ id: registration._id });
                        toast.success("Registration cancelled");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not cancel.");
                      } finally {
                        setCancelling(false);
                      }
                    }}
                  >
                    {cancelling ? "Cancelling…" : "Yes, cancel"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </aside>
      </div>
    </ParticipantShell>
  );
}
