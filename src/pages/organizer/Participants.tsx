import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Download, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import { useState, useMemo } from "react";
import type { Id } from "@/convex/_generated/dataModel";

type RegRow = {
  _id: string;
  eventId: string;
  eventTitle: string;
  eventStatus: string;
  registrationId: string;
  status: string;
  type: string;
  teamName?: string | null;
  checkedInAt?: number | null;
  certificateId?: string | null;
  createdAt: number;
  participantName: string;
  participantEmail: string;
};

const STATUS_FILTER = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
  { value: "checked_in", label: "Checked in" },
];

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-rose-500/10 text-rose-600",
  checked_in: "bg-indigo-500/10 text-indigo-600",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  rejected: "Rejected",
  checked_in: "Checked in",
};

export default function Participants() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventIdParam = urlParams.get("eventId");
  const [eventFilter, setEventFilter] = useState<string | null>(
    eventIdParam ?? null,
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const events = useQuery(api.events.listForOrganizer);
  const allRegistrations = useQuery(api.registrations.listAllForOrganizer);

  const rows = useMemo<RegRow[]>(() => {
    const list = (allRegistrations ?? []) as RegRow[];
    let filtered = list;

    // Event filter takes priority when set
    if (eventFilter) {
      filtered = filtered.filter((r) => r.eventId === eventFilter);
    }

    if (statusFilter === "checked_in") {
      filtered = filtered.filter(
        (r) => r.status === "confirmed" && r.checkedInAt != null,
      );
    } else if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.participantName.toLowerCase().includes(s) ||
          (r.participantEmail ?? "").toLowerCase().includes(s),
      );
    }

    return filtered;
  }, [allRegistrations, eventFilter, statusFilter, search]);

  const canExport =
    (events ?? []).length > 0 &&
    typeof Blob !== "undefined" &&
    typeof URL !== "undefined";

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage registrations across your events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canExport && (allRegistrations?.length ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const csv = [
                  ["Name", "Email", "Status", "Event", "Registered", "Checked in"].join(","),
                  ...rows.map((r) => [
                    r.participantName,
                    r.participantEmail ?? "",
                    r.status,
                    r.eventTitle ?? "",
                    r.createdAt ? new Date(r.createdAt).toISOString() : "",
                    r.checkedInAt ? new Date(r.checkedInAt).toISOString() : "",
                  ].join(",")),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `participants-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={eventFilter ?? "all"}
          onValueChange={(v) => setEventFilter(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {(events ?? []).map((e) => (
              <SelectItem key={e._id} value={e._id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Users className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No participants found</EmptyTitle>
          <EmptyDescription>
            {search || statusFilter !== "all" || eventFilter
              ? "Try adjusting your filters."
              : "Registrations will appear here once attendees sign up."}
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="rounded-lg border bg-table">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[180px]">Participant</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
                <TableHead className="w-[160px]">Event</TableHead>
                <TableHead className="w-[130px]">Registered</TableHead>
                <TableHead className="w-[120px]">Checked in</TableHead>
                <TableHead className="w-[110px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{r.participantName}</span>
                      {r.participantEmail && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {r.participantEmail}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_COLOR[r.status] ?? ""}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.eventTitle ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.createdAt ? fmtDate(r.createdAt) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.checkedInAt ? fmtDate(r.checkedInAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <a href={`/dashboard/registrations/${r._id}`}>Details</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
