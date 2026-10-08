import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Plus, CheckCircle2, Clock, Calendar, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { fmtDate } from "@/lib/format";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const TABS = [
  { key: "todo", label: "To do", color: "bg-muted text-muted-foreground" },
  { key: "in_progress", label: "In progress", color: "bg-amber-500/10 text-amber-600" },
  { key: "done", label: "Done", color: "bg-emerald-500/10 text-emerald-600" },
] as const;

export default function Tasks() {
  // Captured once per mount so render stays pure while overdue checks stay accurate.
  const [now] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<string>("todo");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState("");
  const [filterEvent, setFilterEvent] = useState<string | null>(null);

  const tasks = useQuery(api.tasks.list);
  const events = useQuery(api.events.listForOrganizer);
  const updateTask = useMutation(api.tasks.update);
  const createTask = useMutation(api.tasks.create);
  const removeTask = useMutation(api.tasks.remove);

  const filtered =
    (tasks ?? []).filter((t) => {
      if (filterEvent && t.eventId !== filterEvent) return false;
      return activeTab === "all" || t.status === activeTab;
    });

  const handleCreate = async () => {
    if (!title.trim()) return;
    const due = dueAt ? Number(new Date(dueAt).getTime()) : undefined;      await createTask({
      title,
      description: description.trim() || undefined,
      assigneeId: (assignee ?? undefined) as Id<"users"> | undefined,
      eventId: (filterEvent ?? undefined) as Id<"events"> | undefined,
      deadline: due,
      priority: "medium",
    });
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    setAssignee(null);
    setDueAt("");
    window.location.reload();
  };

  const handleStatusChange = async (id: string, status: "todo" | "in_progress" | "done") => {
    await updateTask({ id: id as Id<"tasks">, status });
    window.location.reload();
  };

  const handleRemove = async (id: string) => {
    await removeTask({ id: id as Id<"tasks"> });
    window.location.reload();
  };

  const overdue =
    (tasks ?? [])
      .filter((t) => t.status !== "done" && t.deadline && t.deadline < now)
      .length;

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-[1.375rem]">Tasks</h1>
        <p className="mt-1 text-muted-foreground">
          Assign and track work across your events.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={filterEvent ?? "all"}
          onChange={(e) => setFilterEvent(e.target.value === "all" ? null : e.target.value)}
        >
          <option value="all">All events</option>
          {(events ?? []).map((e) => (
            <option key={e._id} value={e._id}>
              {e.title}
            </option>
          ))}
        </select>
        {overdue > 0 && (
          <Badge variant="destructive" className="text-xs">
            {overdue} overdue
          </Badge>
        )}
      </div>

      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? `${tab.color} ring-1 ring-inset ring-current/20`
                : "hover:bg-muted text-muted-foreground"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveTab("all")}>
            All
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-3.5" />
            Add
          </Button>
        </div>
      </div>

      {createOpen && (
        <Card className="animate-in fade-in zoom-in-95">
          <CardHeader>
            <CardTitle className="text-base">New task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Set up sound check for main stage"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes…"
                rows={3}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Assignee</label>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={assignee ?? ""}
                  onChange={(e) => setAssignee(e.target.value || null)}
                >
                  <option value="">Unassigned</option>
                  {[
                    { id: "u1", name: "You" },
                    { id: "u2", name: "Alice organizer" },
                    { id: "u3", name: "Bob volunteer" },
                  ].map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Due date</label>
                <input
                  type="date"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!title.trim()}>
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Empty>
          <EmptyTitle>No tasks here</EmptyTitle>
          <EmptyDescription>
            {activeTab === "done"
              ? "No completed tasks yet."
              : "Create a task to get started."}
          </EmptyDescription>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add task
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => {
              const rank = { done: 2, todo: 0, in_progress: 1 } as const;
              return (rank[b.status] ?? 0) - (rank[a.status] ?? 0);
            })
            .map((task) => {
              const tabColor = TABS.find((t) => t.key === task.status)?.color ?? "";
              return (
                <Card key={task._id} className="animate-in fade-in">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={tabColor}>{task.status}</Badge>
                          {task.deadline && task.status !== "done" && task.deadline < now && (
                            <Badge variant="destructive" className="font-normal text-xs">
                              <Clock className="mr-1 size-3" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mt-1">{task.title}</CardTitle>
                        {task.description && (
                          <CardDescription className="mt-0.5">{task.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {task.status === "todo" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground"
                                onClick={() => handleStatusChange(task._id, "todo")}
                              >
                                <Clock className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reopen</TooltipContent>
                          </Tooltip>
                        )}
                        {task.status === "in_progress" && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground"
                                  onClick={() => handleStatusChange(task._id, "done")}
                                >
                                  <CheckCircle2 className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mark done</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground"
                                  onClick={() => handleStatusChange(task._id, "todo")}
                                >
                                  <Clock className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move to to do</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        {task.status === "done" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground"
                                onClick={() => handleStatusChange(task._id, "in_progress")}
                              >
                                <Clock className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reopen</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => handleRemove(task._id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {task.deadline && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          {fmtDate(task.deadline)}
                        </span>
                      )}
                      {task.assigneeName && (
                        <span className="flex items-center gap-1.5">
                          <User className="size-3.5" />
                          {task.assigneeName}
                        </span>
                      )}
                      {task.eventId && (
                        <Badge variant="outline" className="text-xs">
                          {events?.find((e) => e._id === task.eventId)?.title ?? "Event"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      <Separator />
    </div>
  );
}
