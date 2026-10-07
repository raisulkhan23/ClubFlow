import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScanLine, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import { QrScannerPanel } from "@/components/QrScannerPanel";
import { useState, useCallback, useEffect } from "react";

export default function VolunteerCheckIn() {
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const checkIn = useMutation(api.registrations.checkIn);
  const [checkedIn, setCheckedIn] = useState<
    Array<{ _id: string; participantName: string; email?: string; checkedInAt: number }>
  >([]);
  const [confirmed, setConfirmed] = useState<
    Array<{ _id: string; participantName: string; email?: string }>
  >([]);

  const handleScan = useCallback(
    async (payload: { code?: string; email?: string; name?: string }) => {
      if (payload.code || payload.email) {
        await checkIn({
          code: payload.code,
          email: payload.email,
          name: payload.name,
        });
        setJustCheckedIn(true);
        setTimeout(() => setJustCheckedIn(false), 2500);
      }
    },
    [checkIn],
  );

  // Keep a small local list so the checked-in panel behaves like a live view.
  // The real source of truth is the Convex query on the organizer side.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCheckedIn((prev) =>
        prev.map((c) => ({ ...c, checkedInAt: Date.now() })).sort((a, b) => b.checkedInAt - a.checkedInAt),
      );
    }, 5_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
          <p className="mt-1 text-muted-foreground">
            Scan attendee QR codes to mark them as present.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">QR scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <QrScannerPanel
                onScan={handleScan}
                placeholder="Point your camera at the attendee's ticket QR…"
              />
            </CardContent>
          </Card>

          {justCheckedIn && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" />
              <span>Attendee checked in.</span>
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checked in</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[480px] overflow-y-auto">
              {checkedIn.length === 0 ? (
                <Empty className="py-6">
                  <EmptyTitle>No check-ins yet</EmptyTitle>
                  <EmptyDescription>
                    Attendees will appear here once scanned.
                  </EmptyDescription>
                </Empty>
              ) : (
                <ul className="space-y-2">
                  {checkedIn.map((r) => (
                    <li
                      key={r._id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/50 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{r.participantName}</p>
                        {r.email && (
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {r.email}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 shrink-0">
                        {fmtDate(r.checkedInAt)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {confirmed.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Confirmed (not checked in)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[200px] overflow-y-auto space-y-1 text-sm">
                  {confirmed.map((r) => (
                    <div
                      key={r._id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-1.5 text-muted-foreground truncate"
                    >
                      <span>{r.participantName}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
