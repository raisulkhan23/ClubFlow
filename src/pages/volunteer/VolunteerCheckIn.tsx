import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScanLine, CheckCircle2, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import { QrScannerPanel } from "@/components/QrScannerPanel";
import type { Id } from "@/convex/_generated/dataModel";

type ScanRow = { registrationId: string; participantName: string; checkedInAt?: number };
type RegRow = {
  registrationId: string;
  participantName: string;
  status: string;
  checkedInAt?: number;
};

export default function VolunteerCheckIn() {
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const checkIn = useMutation(api.registrations.checkIn);
  const [lastCheckedIn, setLastCheckedIn] = useState<ScanRow[]>([]);

  const assignments = useQuery(api.volunteers.myAssignments);
  const assignedEvent = (assignments ?? []).find(
    (a) => a.eventStatus === "live" || a.eventStatus === "published",
  );
  const regs = useQuery(
    api.registrations.listForVolunteer,
    assignedEvent ? { eventId: assignedEvent.eventId as Id<"events"> } : "skip",
  );

  const registrations = (regs?.registrations ?? []) as RegRow[];
  const checkedInList = registrations.filter((r) => r.checkedInAt != null);
  const pendingList = registrations.filter(
    (r) => r.status === "confirmed" && r.checkedInAt == null,
  );

  const doCheckIn = async (code: string) => {
    try {
      const res = await checkIn({ code: code.trim() });
      if (res.outcome === "checked_in" || res.outcome === "already_checked_in") {
        setResult({ ok: true, message: `${res.participantName} checked in.` });
        setLastCheckedIn((prev) =>
          [
            {
              registrationId: res.registrationId,
              participantName: res.participantName,
              checkedInAt: "checkedInAt" in res ? res.checkedInAt : Date.now(),
            },
            ...prev.filter((p) => p.registrationId !== res.registrationId),
          ].slice(0, 20),
        );
      } else {
        setResult({
          ok: false,
          message: "outcome" in res && "reason" in res ? res.reason ?? "Check-in failed." : "Check-in pending approval.",
        });
      }
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Check-in failed.",
      });
    }
    setTimeout(() => setResult(null), 3000);
  };

  const handleManual = () => {
    if (!manualCode.trim()) return;
    doCheckIn(manualCode);
    setManualCode("");
  };

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-[1.375rem]">Check-in</h1>
          <p className="mt-1 text-muted-foreground">
            {assignedEvent ? assignedEvent.eventTitle : "Scan attendee QR codes or search by ID."}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={mode === "scan" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("scan")}
          >
            <ScanLine className="mr-1 size-3.5" />
            Scan
          </Button>
          <Button
            variant={mode === "search" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("search")}
          >
            <UserSearch className="mr-1 size-3.5" />
            Search
          </Button>
        </div>
      </div>

      {result && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-rose-200 bg-rose-500/10 text-rose-700"
          }`}
        >
          {result.ok ? <CheckCircle2 className="size-4" /> : <span>✕</span>}
          <span>{result.message}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {mode === "scan" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">QR scanner</CardTitle>
              </CardHeader>
              <CardContent>
                <QrScannerPanel
                  eventId={assignedEvent ? (assignedEvent.eventId as Id<"events">) : undefined}
                  onCheckedIn={() => setResult({ ok: true, message: "Checked in." })}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manual check-in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Registration ID, e.g. CLF-2026-0042"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleManual();
                      }
                    }}
                  />
                  <Button onClick={handleManual} disabled={!manualCode.trim()}>
                    Check in
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the registration ID printed on the participant's ticket.
                </p>
              </CardContent>
            </Card>
          )}

          {lastCheckedIn.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lastCheckedIn.map((r) => (
                  <div
                    key={r.registrationId}
                    className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{r.participantName}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.registrationId}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Checked in ({checkedInList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[360px] overflow-y-auto">
              {checkedInList.length === 0 ? (
                <Empty className="py-6">
                  <EmptyTitle>No check-ins yet</EmptyTitle>
                  <EmptyDescription>Attendees will appear here once scanned.</EmptyDescription>
                </Empty>
              ) : (
                <ul className="space-y-2">
                  {checkedInList.map((r) => (
                    <li
                      key={r.registrationId}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium truncate">{r.participantName}</span>
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
                        {fmtDate(r.checkedInAt ?? 0)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {pendingList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Awaiting ({pendingList.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[200px] overflow-y-auto space-y-1 text-sm">
                {pendingList.map((r) => (
                  <div
                    key={r.registrationId}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-1.5 text-muted-foreground"
                  >
                    <span className="truncate">{r.participantName}</span>
                    <span className="font-mono text-xs shrink-0">{r.registrationId}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
