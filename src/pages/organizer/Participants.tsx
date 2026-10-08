import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Download, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusBadge } from "@/components/RequireRole";
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
} from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import { useState, useMemo } from "react";

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
    <div className="space-y-6 px-4 py-7 sm:px-6">
      <PageHeader
        title="Participants"
        description={
          rows.length > 0
            ? `${rows.length} registration${rows.length === 1 ? "" : "s"} shown${
                eventFilter ? ` for ${events?.find((e) => e._id === eventFilter)?.title ?? "this event"}` : ""
              }.`
            : "Registrations across every event you run."
        }
        actions={
          <>
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
              <Download className="size-4" />
              Export CSV
            </Button>
          )}
          </>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name or email…"
            aria-label="Search participants"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <Select
          value={eventFilter ?? "all"}
          onValueChange={(v) => setEventFilter(v === "all" ? null : v)}
        >
          <SelectTrigger className="h-9 w-full sm:w-[200px]" aria-label="Filter by event">
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
          <SelectTrigger className="h-9 w-full sm:w-[170px]" aria-label="Filter by status">
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
        <div className="overflow-hidden rounded-lg border bg-table">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-9 pl-4 w-[180px]">Participant</TableHead>
                <TableHead className="h-9 w-[120px]">Status</TableHead>
                <TableHead className="h-9 w-[160px]">Event</TableHead>
                <TableHead className="h-9 w-[110px]">Registered</TableHead>
                <TableHead className="h-9 w-[110px]">Checked in</TableHead>
                <TableHead className="h-9 w-[110px] text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="py-2.5 pl-4">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{r.participantName}</span>
                      {r.participantEmail && (
                        <span className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {r.participantEmail}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={r.checkedInAt != null ? "checked_in" : r.status} dot />
                      {r.teamName && (
                        <span className="max-w-[140px] truncate text-[11px] text-muted-foreground">
                          Team · {r.teamName}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate py-2.5 text-sm text-muted-foreground">
                    {r.eventTitle ?? "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground tabular whitespace-nowrap">
                    {r.createdAt ? fmtDate(r.createdAt) : "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground tabular whitespace-nowrap">
                    {r.checkedInAt ? fmtDate(r.checkedInAt) : "—"}
                  </TableCell>
                  <TableCell className="py-2.5 pr-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
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
