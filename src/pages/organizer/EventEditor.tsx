import { useState, useCallback } from "react";
import { useParams } from "react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { EventInput } from "@/convex/events";
import type { FormField } from "@/convex/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Layout,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  RotateCcw,
  Copy,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormFieldEditorProps {
  field: FormField;
  index: number;
  onUpdate: (i: number, f: FormField) => void;
  onRemove: (i: number) => void;
}

function FieldTypeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const types = ["text", "email", "phone", "number", "textarea", "select", "radio", "checkbox", "multiselect"];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {types.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OptionEditor({
  options,
  onChange,
  onAdd,
  onRemove,
}: {
  options: string[];
  onChange: (v: string[]) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs">
            {o}
            <button
              className="cursor-pointer rounded-full p-0.5 hover:bg-background transition-colors"
              onClick={() => onRemove(i)}
              aria-label={`Remove option ${o}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={options[options.length - 1] ?? ""}
          placeholder="Add option…"
          className="w-[160px] text-xs"
          onChange={(e) => onChange([...options.slice(0, -1), e.target.value])}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button size="sm" variant="ghost" className="text-xs" onClick={onAdd}>
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}

const X = "✕";

export default function EventEditor() {
  const { eventId } = useParams<{ eventId: string }>();
  const isNew = !eventId;
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const event = useQuery(
    isNew ? null : api.events.getForOrganizer,
    isNew ? {} : { eventId: eventId! },
  );
  const eventData = event ?? null;

  const updateFormFields = useMutation(api.events.updateFormFields);
  const createEvent = useMutation(api.events.createEvent);
  const updateEvent = useMutation(api.events.updateEvent);
  const setStatus = useMutation(api.events.setEventStatus);
  const duplicate = useMutation(api.events.duplicateEvent);

  const [formFields, setFormFields] = useState<FormField[]>(
    (eventData?.event?.formFields ?? []) as FormField[],
  );

  const addField = useCallback(() => {
    const id = `f_${Date.now()}`;
    setFormFields((prev) => [
      ...prev,
      { id, type: "text", label: "New field", description: "", required: false },
    ]);
  }, []);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const saveDraft = useCallback(async (input: EventInput) => {
    setSaving(true);
    try {
      if (isNew) {
        const { eventId } = await createEvent({ input });
        window.location.href = `/organizer/events/${eventId}`;
        return;
      }
      await updateEvent({ eventId: eventId!, input });
      toast.success("Draft saved");
    } finally {
      setSaving(false);
    }
  }, [isNew, createEvent, updateEvent, eventId]);

  const handlePublish = useCallback(
    async (status: "published" | "registration_closed" | "live") => {
      if (!eventId) return;
      setSubmitting(true);
      try {
        await setStatus({ eventId, status });
        toast.success(`Event ${status}`);
      } finally {
        setSubmitting(false);
      }
    },
    [eventId, setStatus],
  );

  const handleDuplicate = useCallback(async () => {
    if (!eventId) return;
    const { eventId: newId } = await duplicate({ eventId });
    window.location.href = `/organizer/events/${newId}`;
  }, [duplicate, eventId]);

  const [form, setForm] = useState<EventInput>(() => {
    if (!eventData?.event) return defaultForm();
    const e = eventData.event;
    return {
      title: e.title,
      category: e.category,
      shortDescription: e.shortDescription,
      description: e.description,
      startAt: e.startAt,
      endAt: e.endAt,
      venue: e.venue,
      capacity: e.capacity,
      registrationDeadline: e.registrationDeadline,
      teamEvent: e.teamEvent,
      minTeamSize: e.minTeamSize,
      maxTeamSize: e.maxTeamSize,
      requiresApproval: e.requiresApproval,
      contactEmail: e.contactEmail,
      contactPhone: e.contactPhone ?? undefined,
      prizes: e.prizes ?? undefined,
      eligibility: e.eligibility ?? undefined,
      rules: e.rules ?? undefined,
      coverTheme: e.coverTheme ?? 0,
      faq: e.faq ?? [],
      schedule: e.schedule ?? [],
    };
  });

  function defaultForm(): EventInput {
    return {
      title: "",
      category: "Technology",
      shortDescription: "",
      description: "",
      startAt: Date.now() + 86400000 * 7,
      endAt: Date.now() + 86400000 * 7 + 7200000,
      venue: "",
      capacity: 200,
      registrationDeadline: Date.now() + 86400000 * 6,
      teamEvent: false,
      requiresApproval: false,
      contactEmail: "",
    };
  }

  const coverThemes = [
    { value: 0, label: "Clean white", gradient: "from-slate-50 to-slate-100" },
    { value: 1, label: "Deep navy", gradient: "from-slate-900 to-slate-800" },
    { value: 2, label: "Forest", gradient: "from-emerald-900 to-emerald-700" },
    { value: 3, label: "Coral", gradient: "from-rose-600 to-rose-400" },
  ];

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? "Create event" : "Edit event"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isNew
            ? "Set up a new event for your club."
            : `${event?.event?.title ?? "Event"} — make your changes.`}
        </p>
      </div>

      {/* Live preview of cover */}
      <div
        className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${coverThemes.find((t) => t.value === form.coverTheme)?.gradient ?? "from-slate-50 to-slate-100"} p-8 text-foreground shadow`}
      >
        <div className="relative z-10">
          <Badge variant="secondary" className="mb-2">
            {form.category}
          </Badge>
          <h2 className="text-2xl font-bold">{form.title || "Your event title"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {form.shortDescription || "Add a short description that appears here."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Event title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="DRMC Tech Carnival 2025"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as EventInput["category"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Technology", "Robotics", "Design", "Gaming", "Business", "Cultural"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shortDescription">Short description</Label>
              <Textarea
                id="shortDescription"
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                placeholder="One-liner shown in cards and lists."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Full description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Marke the stage, build the future — join the DRMC Tech Carnival…"
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule, teams, contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timing, capacity & contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startAt">Start date & time</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={fmtDateTime(form.startAt)}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: new Date(e.target.value).getTime() }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endAt">End date & time</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={fmtDateTime(form.endAt)}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: new Date(e.target.value).getTime() }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={100000}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="registrationDeadline">Registration deadline</Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  value={fmtDateTime(form.registrationDeadline)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, registrationDeadline: new Date(e.target.value).getTime() }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                placeholder="Main Auditorium, DRMC"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="teamEvent"
                checked={form.teamEvent}
                onCheckedChange={(v) => setForm((f) => ({ ...f, teamEvent: v }))}
              />
              <Label htmlFor="teamEvent" className="font-normal cursor-pointer">
                Team event
              </Label>
            </div>

            {form.teamEvent && (
              <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in slide-in-from-right-2 duration-200">
                <div className="space-y-1.5">
                  <Label htmlFor="minTeamSize">Min team size</Label>
                  <Input
                    id="minTeamSize"
                    type="number"
                    min={2}
                    max={50}
                    value={form.minTeamSize ?? 2}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minTeamSize: parseInt(e.target.value, 10) || 2,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxTeamSize">Max team size</Label>
                  <Input
                    id="maxTeamSize"
                    type="number"
                    min={2}
                    max={50}
                    value={form.maxTeamSize ?? 4}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxTeamSize: parseInt(e.target.value, 10) || 2,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="events@club.org"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">Contact phone</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value || undefined }))}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requiresApproval"
                checked={form.requiresApproval}
                onCheckedChange={(v) => setForm((f) => ({ ...f, requiresApproval: v }))}
              />
              <Label htmlFor="requiresApproval" className="font-normal cursor-pointer">
                Require manual approval
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Rules, prizes, eligibility */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rules, prizes & eligibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prizes">Prizes</Label>
                <Textarea
                  id="prizes"
                  value={form.prizes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, prizes: e.target.value || undefined }))}
                  placeholder="1st: $500 · 2nd: $250 · 3rd: $100"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eligibility">Eligibility</Label>
                <Textarea
                  id="eligibility"
                  value={form.eligibility ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, eligibility: e.target.value || undefined }))}
                  placeholder="Open to all DRMC students…"
                  rows={3}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rules">Rules</Label>
              <Textarea
                id="rules"
                value={form.rules ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value || undefined }))}
                placeholder="No external devices during the hackathon…"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {form.schedule?.map((s, i) => (
                <div key={s.id} className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => setForm((f) => {
                        const next = [...(f.schedule ?? [])];
                        next.splice(i, 1);
                        return { ...f, schedule: next };
                      })}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                    <span className="flex-1 font-medium">{s.title}</span>
                    <span className="text-sm text-muted-foreground">{s.time}</span>
                  </div>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => {
                setForm((f) => ({
                  ...f,
                  schedule: [
                    ...(f.schedule ?? []),
                    { id: `s_${Date.now()}`, title: "New item", time: "" },
                  ],
                }));
              }}>
                <Plus className="mr-2 size-4" />
                Add schedule item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {form.faq?.map((q, i) => (
                <div key={i} className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => setForm((f) => {
                        const next = [...(f.faq ?? [])];
                        next.splice(i, 1);
                        return { ...f, faq: next };
                      })}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                    <span className="flex-1 text-sm font-medium">{q.q || "Question"}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{q.a || "Answer"}</p>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => {
                setForm((f) => ({
                  ...f,
                  faq: [...(f.faq ?? []), { q: "", a: "" }],
                }));
              }}>
                <Plus className="mr-2 size-4" />
                Add FAQ item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registration form builder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Registration form</CardTitle>
            <CardDescription>
              Fields attendees fill out when registering. At least one field is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formFields.map((f, i) => (
                <div
                  key={f.id}
                  className="rounded-lg border bg-muted/50 p-3"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => removeField(i)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                    <span className="flex-1 text-sm font-medium">{f.label}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {f.type}
                    </Badge>
                    {f.required && (
                      <Badge variant="destructive" className="shrink-0">required</Badge>
                    )}
                    <button
                      className="cursor-pointer rounded p-1 hover:bg-background transition-colors shrink-0"
                      onClick={() => toggleExpand(`f_${f.id}`)}
                      aria-label="Toggle options"
                    >
                      {expanded[`f_${f.id}`] ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </button>
                  </div>

                  {expanded[`f_${f.id}`] && (
                    <div className="mt-3 space-y-3 animate-in fade-in slide-in slide-in-from-top-1 duration-200">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={f.id}>Label</Label>
                          <Input
                            id={f.id}
                            value={f.label}
                            onChange={(e) => updateField(i, { ...f, label: e.target.value })}
                            placeholder="Full name"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`${f.id}-type`}>Type</Label>
                          <FieldTypeSelect
                            value={f.type}
                            onChange={(v) => updateField(i, { ...f, type: v })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${f.id}-desc`}>Description (optional)</Label>
                        <Input
                          id={`${f.id}-desc`}
                          value={f.description ?? ""}
                          onChange={(e) =>
                            updateField(i, { ...f, description: e.target.value || undefined })
                          }
                          placeholder="Help text shown below the field"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${f.id}-req`}
                          checked={f.required}
                          onCheckedChange={(v) => updateField(i, { ...f, required: v })}
                        />
                        <Label htmlFor={`${f.id}-req`} className="font-normal cursor-pointer">
                          Required
                        </Label>
                      </div>
                      {["select", "radio", "checkbox", "multiselect"].includes(f.type) && (
                        <div className="space-y-1">
                          <Label>Options</Label>
                          <OptionEditor
                            options={f.options ?? []}
                            onChange={(opts) => updateOptions(i, opts)}
                            onAdd={() => addOption(i)}
                            onRemove={(idx) => removeOption(i, idx)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addField}>
                <Plus className="mr-2 size-4" />
                Add field
              </Button>
              <div className="text-xs text-muted-foreground">
                Choosing <strong>publish</strong> keeps your current fields. Edit them later.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover theme & actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cover theme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-4">
              {coverThemes.map((t) => (
                <button
                  key={t.value}
                  className={`flex h-20 items-end justify-center gap-2 rounded-lg border-2 bg-gradient-to-br ${t.gradient} p-3 text-sm font-medium shadow transition-colors ${
                    form.coverTheme === t.value
                      ? "border-foreground"
                      : "border-transparent hover:border-white/40"
                  }`}
                  onClick={() => setForm((f) => ({ ...f, coverTheme: t.value }))}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status + save */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Publish status</CardTitle>
            {event?.event && (
              <CardDescription>
                Last updated {fmtDate(event.event.updatedAt)} · Status:{" "}
                <Badge variant="secondary">{event.event.status}</Badge>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {isNew ?
              (
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!form.title.trim() || !form.shortDescription.trim()) {
                      toast.error("Please fill in the title and short description.");
                      return;
                    }
                    setSaving(true);
                    createEvent({ input: form as EventInput })
                      .then(({ eventId }) => {
                        window.location.href = `/organizer/events/${eventId}`;
                      })
                      .finally(() => setSaving(false));
                  }}
                  disabled={saving}
                >
                  <Save className="mr-2 size-4" />
                  Create draft
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => saveDraft(form)}
                    disabled={saving}
                  >
                    <Save className="mr-2 size-4" />
                    Save draft
                  </Button>
                  {form.status !== "published" && (
                    <Button
                      className="flex-1"
                      onClick={() => handlePublish("published")}
                      disabled={submitting}
                    >
                      <Send className="mr-2 size-4" />
                      Publish
                    </Button>
                  )}
                  {form.status !== "registration_closed" && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handlePublish("registration_closed")}
                      disabled={submitting}
                    >
                      <Eye className="mr-2 size-4" />
                      Close registration
                    </Button>
                  )}
                  {form.status !== "live" && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handlePublish("live")}
                      disabled={submitting}
                    >
                      <Send className="mr-2 size-4" />
                      Mark live
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={handleDuplicate}
                    disabled={submitting}
                  >
                    <Copy className="mr-2 size-4" />
                    Duplicate
                  </Button>
                </>
              )
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
