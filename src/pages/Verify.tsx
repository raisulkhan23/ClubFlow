import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EmptyState, StatusBadge } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Search, ShieldX } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { displayClubName, fmtDate } from "@/lib/format";

export default function Verify() {
  const params = useParams<{ certificateId?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const certId = params.certificateId ?? "";
  const result = useQuery(
    api.certificates.verify,
    certId.trim().length >= 6 ? { certificateId: certId } : "skip",
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-base font-bold">
            Club<span className="text-primary">Flow</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Verify a certificate</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a certificate ID to confirm it was genuinely issued on ClubFlow.
          </p>
        </div>

        <form
          className="mx-auto mt-6 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) navigate(`/verify/${input.trim().toUpperCase()}`);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="CLF-CERT-000001"
            className="font-mono"
            aria-label="Certificate ID"
          />
          <Button type="submit" disabled={input.trim().length < 6}>
            <Search className="size-4" /> Verify
          </Button>
        </form>

        {certId && (
          <div className="mx-auto mt-8 max-w-lg">
            {result === undefined ? (
              <div className="animate-pulse rounded-xl border p-8 text-center text-sm text-muted-foreground">
                Checking certificate…
              </div>
            ) : result === null ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
                <ShieldX className="mx-auto size-10 text-red-500" />
                <h2 className="mt-3 font-display text-lg font-bold">Certificate not found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-mono">{certId.toUpperCase()}</span> doesn't match any certificate issued on ClubFlow.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-8">
                <div className="flex items-center justify-center gap-2">
                  <BadgeCheck className="size-6 text-primary" />
                  <h2 className="font-display text-lg font-bold text-primary">Verified — genuine certificate</h2>
                </div>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Certificate ID</dt>
                    <dd className="font-mono">{result.certificateId}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Awarded to</dt>
                    <dd className="font-semibold">{result.participantName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Achievement</dt>
                    <dd className="text-right font-medium">{result.achievement}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd><StatusBadge status={result.type} /></dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Issued by</dt>
                    <dd className="font-medium">{displayClubName(result.clubName)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Issued on</dt>
                    <dd>{fmtDate(result.issuedAt)}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}

        {!certId && (
          <div className="mx-auto mt-10 max-w-lg">
            <EmptyState
              title="No certificate entered yet"
              description="Certificates issued through ClubFlow carry a unique ID like CLF-CERT-000001 — it's printed on the PDF."
            />
          </div>
        )}
      </main>
    </div>
  );
}
