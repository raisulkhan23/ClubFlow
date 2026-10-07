import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ParticipantShell } from "./ParticipantShell";
import { EmptyState, PageHeader, StatusBadge } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, FileDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";
import { generateCertificatePdf } from "@/lib/certificate-pdf";

export default function MyCertificates() {
  const certs = useQuery(api.certificates.myCertificates);
  const [busyId, setBusyId] = useState<string | null>(null);

  const download = async (c: { certificateId: string; achievement: string; issuedAt: number; eventTitle: string; participantName?: string }) => {
    setBusyId(c.certificateId);
    try {
      await generateCertificatePdf({
        clubName: "DRMC Tech Club",
        eventTitle: c.eventTitle,
        participantName: c.participantName ?? "Participant",
        achievement: c.achievement,
        dateLabel: fmtDate(c.issuedAt),
        certificateId: c.certificateId,
        verifyUrl: `${window.location.origin}/verify/${c.certificateId}`,
      });
      toast.success("Certificate downloaded");
    } catch {
      toast.error("Could not generate the PDF. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ParticipantShell>
      <PageHeader
        title="Certificates"
        description="Download your certificates or verify them publicly."
      />

      {certs === undefined ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Award className="size-5" />}
            title="No certificates yet"
            description="When an organizer issues certificates for an event you attended, they appear here as downloadable PDFs."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {certs.map((c) => (
            <div key={c.certificateId} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold">{c.achievement}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.eventTitle}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{c.certificateId}</p>
                </div>
                <StatusBadge status={c.type} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Issued {fmtDate(c.issuedAt)}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => void download(c)} disabled={busyId === c.certificateId}>
                  <FileDown className="size-4" /> {busyId === c.certificateId ? "Generating…" : "Download PDF"}
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/verify/${c.certificateId}`}>Verify</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ParticipantShell>
  );
}
