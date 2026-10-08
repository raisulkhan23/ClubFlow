import QrScanner from "qr-scanner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, CameraOff, CheckCircle2, CircleAlert, Clock, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fmtTime } from "@/lib/format";

type ScanEntry = {
  key: string;
  outcome: "checked_in" | "already_checked_in" | "invalid" | "pending";
  participantName: string;
  registrationId: string;
  at: number;
  reason?: string;
};

const OUTCOME_STYLE: Record<ScanEntry["outcome"], { label: string; className: string; icon: typeof CheckCircle2 }> = {
  checked_in: { label: "Checked in", className: "text-primary", icon: CheckCircle2 },
  already_checked_in: { label: "Already checked in", className: "text-amber-600 dark:text-amber-300", icon: Clock },
  pending: { label: "Pending approval", className: "text-sky-600 dark:text-sky-300", icon: CircleAlert },
  invalid: { label: "Invalid registration", className: "text-red-600 dark:text-red-300", icon: XCircle },
};

/**
 * Real QR check-in: camera scanning via qr-scanner plus a manual
 * registration-ID fallback. Every scan is verified server-side.
 */
export function QrScannerPanel({
  eventId,
  onCheckedIn,
}: {
  eventId?: Id<"events">;
  onCheckedIn?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<ScanEntry[]>([]);
  const checkIn = useMutation(api.registrations.checkIn);

  const handleResult = useCallback(
    async (code: string) => {
      const clean = code.trim().toUpperCase();
      if (!clean) return;
      const now = Date.now();
      if (lastScanRef.current.code === clean && now - lastScanRef.current.at < 3000) return;
      lastScanRef.current = { code: clean, at: now };
      setBusy(true);
      try {
        const result = await checkIn({ code: clean, ...(eventId ? { eventId } : {}) });
        const outcome = result.outcome;
        setRecent((prev) =>
          [
            {
              key: `${clean}-${now}`,
              outcome,
              participantName: "participantName" in result ? result.participantName : "",
              registrationId: "registrationId" in result ? result.registrationId : clean,
              at: now,
              reason: "reason" in result ? result.reason : undefined,
            },
            ...prev,
          ].slice(0, 8),
        );
        if (outcome === "checked_in") {
          toast.success(`✓ ${result.participantName} checked in`);
          onCheckedIn?.();
        } else if (outcome === "already_checked_in") {
          toast.warning(`${result.participantName} was already checked in`);
        } else if (outcome === "pending") {
          toast.warning(`${result.participantName} is still pending approval`);
        } else {
          toast.error(result.reason);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Check-in failed. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [checkIn, eventId, onCheckedIn],
  );

  useEffect(() => {
    if (!scanning || !videoRef.current) return;
    let scanner: QrScanner | null = null;
    try {
      scanner = new QrScanner(
        videoRef.current,
        (result) => {
          void handleResult(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
          maxScansPerSecond: 6,
        },
      );
      scannerRef.current = scanner;
      scanner
        .start()
        .then(() => setCamError(null))
        .catch((err: unknown) => {
          setCamError(
            err instanceof Error && err.name === "NotAllowedError"
              ? "Camera permission was blocked. Allow camera access, or use the manual check-in below."
              : "No camera available in this browser. Use the manual check-in below.",
          );
          setScanning(false);
        });
    } catch {
      // Defer state updates out of the synchronous effect body.
      queueMicrotask(() => {
        setCamError("Camera could not be started here. Use the manual check-in below.");
        setScanning(false);
      });
    }
    return () => {
      scanner?.stop();
      scanner?.destroy();
      scannerRef.current = null;
    };
  }, [scanning, handleResult]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border bg-black/60">
          <video
            ref={videoRef}
            className={cn("aspect-video w-full object-cover", !scanning && "opacity-40")}
            muted
            playsInline
          />
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Camera className="size-8 text-muted-foreground" />
              <p className="max-w-xs text-sm text-muted-foreground">
                Point the camera at a participant's QR ticket to check them in.
              </p>
              <Button onClick={() => setScanning(true)} disabled={busy}>
                <Camera className="size-4" /> Start scanner
              </Button>
            </div>
          )}
          {scanning && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-3 top-3"
              onClick={() => setScanning(false)}
            >
              <CameraOff className="size-4" /> Stop
            </Button>
          )}
        </div>
        {camError && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {camError}
          </p>
        )}

        <form
          className="rounded-xl border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!manual.trim()) return;
            void handleResult(manual);
            setManual("");
          }}
        >
          <Label htmlFor="manual-code" className="text-sm">
            Manual check-in
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Type or paste a registration ID (e.g. CLF-2026-000123).
          </p>
          <div className="mt-2 flex gap-2">
            <Input
              id="manual-code"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="CLF-2026-000123"
              className="font-mono"
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !manual.trim()}>
              <Search className="size-4" /> Check in
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">Recent scans</p>
        <p className="mt-1 text-xs text-muted-foreground">The last 8 scans from this device.</p>
        <div className="mt-3 space-y-2">
          {recent.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No scans yet. Checked-in participants will appear here.
            </p>
          )}
          {recent.map((entry) => {
            const style = OUTCOME_STYLE[entry.outcome];
            const Icon = style.icon;
            return (
              <div key={entry.key} className="flex items-start gap-3 rounded-lg border p-3">
                <Icon className={cn("mt-0.5 size-4 shrink-0", style.className)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.participantName || "Unknown participant"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{entry.registrationId}</p>
                  {entry.reason && <p className="mt-0.5 text-xs text-muted-foreground">{entry.reason}</p>}
                </div>
                <div className="text-right">
                  <p className={cn("text-xs font-medium", style.className)}>{style.label}</p>
                  <p className="text-xs text-muted-foreground">{fmtTime(entry.at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
