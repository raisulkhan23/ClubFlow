import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, ScanLine, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { QrScannerPanel } from "@/components/QrScannerPanel";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

type ScanRow = { _id: string; participantName: string; checkedInAt?: number | null };

const INITIAL_SCAN = {
  found: false as const,
  name: "" as string,
  status: "confirmed" as string,
  checkedInAt: null as number | null,
};

export default function CheckInPage() {
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const [manualName, setManualName] = useState("");
  const [scanResult, setScanResult] =
    useState<typeof INITIAL_SCAN | { found: boolean; name: string; status: string; checkedInAt: number | null }>(
      INITIAL_SCAN,
    );
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const scannedRef = useRef<Set<string>>(new Set());
  const [lastManual, setLastManual] = useState<string | null>(null);

  const events = useQuery(api.events.listForOrganizer);
  const activeEvent = events?.find(
    (e) => e.status === "live" || e.status === "published",
  );

  const registrations = useQuery(
    api.registrations.listForEvent,
    activeEvent
      ? { eventId: activeEvent._id as Id<"events"> }
      : "skip",
  );

  const checkedIn: ScanRow[] = (registrations ?? [])
    .filter((r) => r.checkedInAt != null)
    .map((r) => ({ _id: r._id, participantName: r.participantName, checkedInAt: r.checkedInAt ?? null }));
  const confirmed = (registrations ?? [])
    .filter((r) => r.status === "confirmed" && r.checkedInAt == null);

  const checkIn = useMutation(api.registrations.checkIn);

  useEffect(() => {
    if (events && events.length === 0) {
      setMode("search");
    }
  }, [events]);

  const handleScan = useCallback(
    (text: string) => {
      setScanResult(INITIAL_SCAN);
      const cleaned = text.trim();
      if (!cleaned) return;

      const match = (registrations ?? []).find((r) =>
        r.participantName.toLowerCase().includes(cleaned.toLowerCase()),
      );

      if (!match) {
        setScanResult({ found: false, name: cleaned, status: "rejected", checkedInAt: null });
        setTimeout(() => setScanResult(INITIAL_SCAN), 3000);
        return;
      }

      setScanResult({
        found: true,
        name: match.participantName,
        status: match.checkedInAt != null ? "checked_in" : match.status,
        checkedInAt: match.checkedInAt ? Number(match.checkedInAt) : null,
      });

      if (match.checkedInAt != null) {
        setTimeout(() => setScanResult(INITIAL_SCAN), 3000);
        return;
      }

      if (match.status === "cancelled" || match.status === "rejected" || match.status === "pending") {
        setTimeout(() => setScanResult(INITIAL_SCAN), 3000);
        return;
      }

      if (!scannedRef.current.has(match._id)) {
        scannedRef.current.add(match._id);
        setJustCheckedIn(true);
        setTimeout(() => {
          setJustCheckedIn(false);
          setScanResult(INITIAL_SCAN);
        }, 2500);
      }
    },
    [registrations],
  );

  const handleManual = useCallback(() => {
    if (!manualName.trim()) return;
    const key = manualName.toLowerCase();
    if (lastManual === key) return;
    setLastManual(key);
    setScanResult(INITIAL_SCAN);
    const match = (registrations ?? []).find((r) =>
      r.participantName.toLowerCase().includes(key),
    );
    if (!match) {
      setScanResult({ found: false, name: manualName, status: "rejected", checkedInAt: null });
      setTimeout(() => setScanResult(INITIAL_SCAN), 3000);
      return;
    }
    setScanResult({
      found: true,
      name: match.participantName,
      status: match.checkedInAt != null ? "checked_in" : match.status,
      checkedInAt: match.checkedInAt ? Number(match.checkedInAt) : null,
    });
    if (match.checkedInAt != null) {
      setTimeout(() => setScanResult(INITIAL_SCAN), 2000);
      return;
    }
    if (match.status === "cancelled" || match.status === "rejected" || match.status === "pending") {
      setTimeout(() => setScanResult(INITIAL_SCAN), 2000);
      return;
    }
    if (!scannedRef.current.has(match._id)) {
      scannedRef.current.add(match._id);
      setJustCheckedIn(true);
      setTimeout(() => {
        setJustCheckedIn(false);
        setScanResult(INITIAL_SCAN);
      }, 2500);
    }
  }, [manualName, registrations, lastManual]);

  const handleServerCheckIn = useCallback(
    async (code: string) => {
      if (!activeEvent) return;
      try {
        const result = await checkIn({
          code: code.trim(),
          eventId: activeEvent._id as Id<"events">,
        });
        if (result.outcome === "checked_in") {
          toast.success(`✓ ${result.participantName} checked in`);
          setJustCheckedIn(true);
          setTimeout(() => setJustCheckedIn(false), 2500);
          setScanResult(INITIAL_SCAN);
        } else if (result.outcome === "already_checked_in") {
          toast.warning(`${result.participantName} was already checked in`);
          setScanResult({
            found: true,
            name: result.participantName,
            status: "checked_in",
            checkedInAt: result.checkedInAt,
          });
          setTimeout(() => setScanResult(INITIAL_SCAN), 2500);
        } else if (result.outcome === "pending") {
          toast.warning(`${result.participantName} is still pending approval`);
          setScanResult({
            found: true,
            name: result.participantName,
            status: "pending",
            checkedInAt: null,
          });
          setTimeout(() => setScanResult(INITIAL_SCAN), 3000);
        } else {
          toast.error(result.reason);
          setScanResult({ found: false, name: code, status: "rejected", checkedInAt: null });
          setTimeout(() => setScanResult(INITIAL_SCAN), 3000);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Check-in failed.");
      }
    },
    [activeEvent, checkIn],
  );

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
        <p className="mt-1 text-muted-foreground">
          Scan QR codes or search by name to check attendees in.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Scanner + controls */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Check-in entry</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant={mode === "scan" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setMode("scan")}
                >
                  <ScanLine className="mr-1 size-3.5" />
                  Scan
                </Button>
                <Button
                  variant={mode === "search" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setMode("search")}
                >
                  <UserSearch className="mr-1 size-3.5" />
                  Search
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mode === "scan" ? (
                <QrScannerPanel
                  eventId={activeEvent?._id as Id<"events">}
                  onCheckedIn={() => setJustCheckedIn(true)}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by name or email…"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleManual();
                        }
                      }}
                    />
                    <Button onClick={handleManual} disabled={!manualName.trim()}>
                      Search
                    </Button>
                  </div>
                  {scanResult.found && (
                    <div
                      className={`rounded-lg border p-3 ${
                        scanResult.status === "checked_in"
                          ? "bg-emerald-500/10 border-emerald-200"
                          : scanResult.status === "rejected" || scanResult.status === "cancelled" || scanResult.status === "pending"
                          ? "bg-muted/50 border-border"
                          : "bg-primary/10 border-primary/20"
                      }`}
                    >
                      <p className="text-sm font-medium">{scanResult.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={
                            scanResult.status === "checked_in"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                              : scanResult.status === "rejected" || scanResult.status === "cancelled"
                              ? "border-muted text-muted-foreground"
                              : scanResult.status === "pending"
                              ? "border-amber-300 text-amber-700"
                              : ""
                          }
                        >
                          {scanResult.status === "checked_in"
                            ? "Checked in"
                            : scanResult.status === "rejected"
                            ? "Rejected"
                            : scanResult.status === "cancelled"
                            ? "Cancelled"
                            : scanResult.status === "pending"
                            ? "Pending"
                            : "Confirmed"}
                        </Badge>
                        {scanResult.checkedInAt && (
                          <span className="text-muted-foreground">
                            {fmtDate(scanResult.checkedInAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {justCheckedIn && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 animate-[border-pulse_1.5s_ease-in-out]">
              <CheckCircle2 className="size-4" />
              <span>Checked in successfully.</span>
            </div>
          )}
        </div>

        {/* Live list */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checked in</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[420px] overflow-y-auto space-y-2">
              {checkedIn.length === 0 ? (
                <Empty className="py-6">
                  <EmptyTitle>No one checked in yet</EmptyTitle>
                  <EmptyDescription>
                    Attendees will appear here once they're checked in.
                  </EmptyDescription>
                </Empty>
              ) : (
                checkedIn.map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{r.participantName}</p>
                      {registrations?.find((g) => g._id === r._id)?.participantEmail && (
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {(registrations ?? []).find((g) => g._id === r._id)?.participantEmail}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 shrink-0">
                      {r.checkedInAt ? fmtDateTime(r.checkedInAt) : "—"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {confirmed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Confirmed (not checked in)</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[220px] overflow-y-auto">
                <div className="space-y-1 text-sm">
                  {confirmed.map((r) => (
                    <div
                      key={r._id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-1.5 text-muted-foreground"
                    >
                      <span className="truncate">{r.participantName}</span>
                      <span className="text-xs">{fmtDateTime(r.createdAt ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator className="my-6" />
    </div>
  );
}
