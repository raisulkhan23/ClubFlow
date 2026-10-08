import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Award,
  BadgeCheck,
  FileDown,
  Loader2,
  Plus,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

type Tab = "results" | "certificates";

const MEDALS = ["🥇", "🥈", "🥉", "🏅"];

export default function Results() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventIdParam = urlParams.get("eventId");
  const [tab, setTab] = useState<Tab>("results");
  const [eventId, setEventId] = useState<string | null>(eventIdParam);
  const [busy, setBusy] = useState(false);

  // Add-result form
  const [name, setName] = useState("");
  const [position, setPosition] = useState("1");
  const [label, setLabel] = useState("Winner");
  const [score, setScore] = useState("");

  const events = useQuery(api.events.listForOrganizer);
  const selected = useMemo(
    () => events?.find((e) => e._id === eventId) ?? events?.[0] ?? null,
    [events, eventId],
  );
  const activeId = (selected?._id ?? null) as Id<"events"> | null;

  const results = useQuery(
    api.results.listForOrganizer,
    activeId ? { eventId: activeId } : "skip",
  );
  const certs = useQuery(
    api.certificates.listForEvent,
    activeId ? { eventId: activeId } : "skip",
  );

  const addResult = useMutation(api.results.add);
  const removeResult = useMutation(api.results.remove);
  const publishResult = useMutation(api.results.setPublished);
  const issueCerts = useMutation(api.certificates.issueForEvent);

  const pending = results?.filter((r) => !r.published) ?? [];
  const published = results?.filter((r) => r.published) ?? [];

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () =>
    run(async () => {
      if (!activeId) return;
      await addResult({
        eventId: activeId,
        participantName: name.trim(),
        position: Number(position),
        positionLabel: label.trim() || "Result",
        score: score ? Number(score) : undefined,
      });
      setName("");
      setScore("");
    }, "Result added (draft)");

  const handleIssueCerts = () =>
    run(async () => {
      if (!activeId) return;
      const res = (await issueCerts({ eventId: activeId })) as { issued: number };
      toast.success(`${res.issued} certificate${res.issued === 1 ? "" : "s"} issued`);
    }, "Certificates processed");

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results & certificates</h1>
          <p className="mt-1 text-muted-foreground">
            Record placements, publish them live, and issue certificates from real records.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
          <Button
            variant={tab === "results" ? "default" : "ghost"}
            size="sm"
            className="text-xs"
            onClick={() => setTab("results")}
          >
            <Trophy className="mr-1 size-3.5" /> Results
          </Button>
          <Button
            variant={tab === "certificates" ? "default" : "ghost"}
            size="sm"
            className="text-xs"
            onClick={() => setTab("certificates")}
          >
            <Award className="mr-1 size-3.5" /> Certificates
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selected?._id ?? ""}
          onValueChange={(v) => setEventId(v)}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Choose an event" />
          </SelectTrigger>
          <SelectContent>
            {(events ?? []).map((e) => (
              <SelectItem key={e._id} value={e._id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <Badge variant="outline" className="capitalize">
            {selected.status.replace("_", " ")}
          </Badge>
        )}
      </div>

      {!selected ? (
        <Empty>
          <EmptyTitle>No events yet</EmptyTitle>
          <EmptyDescription>Create an event first — results belong to events.</EmptyDescription>
        </Empty>
      ) : tab === "results" ? (
        <>
          {/* Add result */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add placement</CardTitle>
              <CardDescription>
                Drafts stay private until you publish them on the event page.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="res-name">Participant / team</Label>
                <Input
                  id="res-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Team Quantum"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-pos">Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger id="res-pos">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-label">Label</Label>
                <Input
                  id="res-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Winner"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-score">Score</Label>
                <Input
                  id="res-score"
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="94"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAdd} disabled={busy || name.trim().length < 2}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Published */}
          <section>
            <h2 className="font-display text-lg font-semibold">
              Published ({published.length})
            </h2>
            <div className="mt-3 space-y-2">
              {published.length === 0 ? (
                <Empty className="py-8">
                  <EmptyTitle>Nothing published yet</EmptyTitle>
                  <EmptyDescription>
                    Add placements below, then publish them to show on the public event page.
                  </EmptyDescription>
                </Empty>
              ) : (
                published.map((r, i) => (
                  <div
                    key={r._id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
                  >
                    <span className="text-2xl">{MEDALS[Math.min(i, 3)]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{r.participantName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.positionLabel}
                        {r.score !== undefined ? ` · ${r.score} pts` : ""}
                        {r.remarks ? ` · ${r.remarks}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      Published
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => publishResult({ id: r._id, published: false }),
                          "Result unpublished",
                        )
                      }
                    >
                      Unpublish
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600"
                      disabled={busy}
                      onClick={() =>
                        run(() => removeResult({ id: r._id }), "Result removed")
                      }
                    >
                      Delete
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Drafts */}
          <section>
            <h2 className="font-display text-lg font-semibold">
              Drafts ({pending.length})
            </h2>
            <div className="mt-3 space-y-2">
              {pending.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No draft results.
                </p>
              ) : (
                pending.map((r) => (
                  <div
                    key={r._id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-4"
                  >
                    <span className="w-6 text-center text-lg">{r.position}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{r.participantName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.positionLabel}
                        {r.score !== undefined ? ` · ${r.score} pts` : ""}
                      </p>
                    </div>
                    <Badge variant="outline">Draft</Badge>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => publishResult({ id: r._id, published: true }),
                          "Results published 🎉",
                        )
                      }
                    >
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600"
                      disabled={busy}
                      onClick={() =>
                        run(() => removeResult({ id: r._id }), "Result removed")
                      }
                    >
                      Delete
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issue certificates</CardTitle>
              <CardDescription>
                Participation certificates for everyone checked in, podium certificates from
                published results. Safe to re-run — existing certificates are never duplicated.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button onClick={handleIssueCerts} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                Generate all
              </Button>
              <p className="text-xs text-muted-foreground">
                {(certs?.length ?? 0)} issued so far for {selected.title}.
              </p>
            </CardContent>
          </Card>

          {certs === undefined ? (
            <div className="h-40 animate-pulse rounded-xl bg-muted/50" />
          ) : certs.length === 0 ? (
            <Empty>
              <EmptyTitle>No certificates yet</EmptyTitle>
              <EmptyDescription>
                Run &quot;Generate all&quot; after the event to issue verifiable certificates.
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {certs.map((c) => (
                <div key={c.certificateId} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.participantName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.achievement}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {c.certificateId}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {c.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Issued {fmtDate(c.issuedAt)}
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                    <a href={`/verify/${c.certificateId}`}>
                      <FileDown className="size-3.5" /> Verify page
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
