import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DynamicFormFields, type FieldValues } from "@/components/DynamicFormFields";
import { QrCode } from "@/components/QrCode";
import { CoverArt, EmptyState, StatusBadge } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, PartyPopper, Plus, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";

type TeamMember = { name: string; email: string };

export default function Register() {
  const { slug } = useParams<{ slug: string }>();
  const data = useQuery(api.events.getPublicBySlug, slug ? { slug } : "skip");
  const myRegs = useQuery(api.registrations.myRegistrations);
  const register = useMutation(api.registrations.register);

  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([{ name: "", email: "" }]);
  const [values, setValues] = useState<FieldValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ registrationId: string; status: string } | null>(null);

  const event = data?.event;
  const visibleFields = useMemo(
    () => (event?.formFields ?? []).filter((f) => !f.dependsOn || values[f.dependsOn.fieldId] === f.dependsOn.value),
    [event, values],
  );

  if (data === undefined || myRegs === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Skeleton className="h-96 w-full max-w-xl" />
      </main>
    );
  }

  if (!event || !data.club) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <EmptyState
          title="Event not found"
          description="This event doesn't exist or isn't open for registration."
          action={<Button asChild><Link to="/events">Browse events</Link></Button>}
        />
      </main>
    );
  }

  const already = myRegs.find((r) => r.event.slug === event.slug && r.status !== "cancelled");
  if (already) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-primary" />
          <h1 className="mt-3 font-display text-xl font-bold">You're already registered</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registration <span className="font-mono">{already.registrationId}</span> for {event.title} ({already.status}).
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to={`/dashboard/registrations/${already._id}`}>View my registration</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to={`/events/${event.slug}`}>Back to event</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (event.state !== "open" && event.state !== "almost_full") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <EmptyState
          title={event.state === "full" ? "This event is full" : "Registration is closed"}
          description={`Registration for ${event.title} is no longer accepting entries.`}
          action={<Button asChild><Link to={`/events/${event.slug}`}>Back to event</Link></Button>}
        />
      </main>
    );
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of visibleFields) {
      const v = values[f.id];
      const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
      if (f.required && empty) errs[f.id] = "This field is required.";
    }
    if (event.teamEvent) {
      if (teamName.trim().length < 2) errs._team = "Enter a team name.";
      const filled = members.filter((m) => m.name.trim());
      if (1 + filled.length < (event.minTeamSize ?? 2))
        errs._team = `Teams need at least ${event.minTeamSize} members (including you).`;
      if (1 + filled.length > (event.maxTeamSize ?? 4))
        errs._team = `Teams can have at most ${event.maxTeamSize} members (including you).`;
      for (const m of members) {
        if (m.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
          errs._team = "One of the team member emails is invalid.";
          break;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please complete the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const cleanedMembers = members
        .filter((m) => m.name.trim())
        .map((m) => ({ name: m.name.trim(), email: m.email.trim() || undefined }));
      const result = await register({
        eventId: event._id,
        ...(event.teamEvent ? { teamName: teamName.trim(), teamMembers: cleanedMembers } : {}),
        answers: Object.entries(values)
          .filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
          .map(([fieldId, v]) => ({ fieldId, value: v })),
      });
      setSuccess(result);
      toast.success("Registration successful 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
            <PartyPopper className="mx-auto size-12 text-primary" />
            <h1 className="mt-4 font-display text-2xl font-bold">Registration successful!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {success.status === "pending"
                ? "Your registration is under review. You'll be notified once it's approved."
                : "You're all set. Show this QR at the check-in desk."}
            </p>

            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <QrCode value={success.registrationId} size={190} />
              </div>
              <button
                className="group flex items-center gap-2 rounded-lg border bg-muted px-4 py-2 font-mono text-sm"
                onClick={() => {
                  void navigator.clipboard.writeText(success.registrationId);
                  toast.success("Registration ID copied");
                }}
              >
                {success.registrationId}
                <Copy className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </button>
              <p className="text-xs text-muted-foreground">
                Keep this ID safe — you'll need it for check-in and support.
              </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
              <div className="rounded-lg border p-3">
                <dt className="text-xs text-muted-foreground">Event</dt>
                <dd className="mt-0.5 font-medium">{event.title}</dd>
              </div>
              <div className="rounded-lg border p-3">
                <dt className="text-xs text-muted-foreground">Date</dt>
                <dd className="mt-0.5 font-medium">{fmtDate(event.startAt)}</dd>
              </div>
              <div className="rounded-lg border p-3">
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="mt-0.5"><StatusBadge status={success.status} /></dd>
              </div>
              <div className="rounded-lg border p-3">
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className="mt-0.5 font-medium">{event.teamEvent ? `Team · ${teamName}` : "Individual"}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to="/dashboard/registrations">My registrations</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/events">Explore more events</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const steps = event.teamEvent ? ["Team", "Details", "Review"] : ["Details", "Review"];
  const stepIdx = event.teamEvent ? step : step - 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link to={`/events/${event.slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to event
          </Link>
          <span className="text-xs text-muted-foreground">
            Step {Math.min(stepIdx + 2, steps.length + 1)} of {steps.length + 1}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Event summary */}
        <CoverArt theme={event.coverTheme} className="h-20 rounded-xl">
          <div className="flex h-full items-center justify-between px-4">
            <div>
              <h1 className="font-display text-lg font-bold text-white">{event.title}</h1>
              <p className="text-xs text-white/70">{fmtDate(event.startAt)} · {event.venue}</p>
            </div>
            <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs text-white">{event.category}</span>
          </div>
        </CoverArt>

        {/* Stepper */}
        <ol className="mt-6 flex items-center gap-2 text-xs">
          {["Register", ...steps].map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={
                  i <= step
                    ? "flex size-6 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
                    : "flex size-6 items-center justify-center rounded-full border bg-muted text-muted-foreground"
                }
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={i <= step ? "font-medium" : "text-muted-foreground"}>{label}</span>
              {i < steps.length && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        {/* Step: Team */}
        {step === 0 && event.teamEvent && (
          <section className="mt-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Create your team</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You're the team leader. Add {event.minTeamSize}–{event.maxTeamSize} members including yourself.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Neon Coders"
              />
              {errors._team && <p className="text-xs text-red-600 dark:text-red-300">{errors._team}</p>}
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <UserRound className="size-4 text-primary" /> You (team leader)
              </p>
            </div>
            {members.map((m, i) => (
              <div key={i} className="grid gap-2 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1">
                  <Label htmlFor={`member-name-${i}`}>Member {i + 2} name</Label>
                  <Input
                    id={`member-name-${i}`}
                    value={m.name}
                    onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`member-email-${i}`}>Email (optional)</Label>
                  <Input
                    id={`member-email-${i}`}
                    type="email"
                    value={m.email}
                    onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))}
                    placeholder="member@example.com"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-1 self-start text-muted-foreground hover:text-red-500"
                  aria-label={`Remove member ${i + 2}`}
                  onClick={() => setMembers(members.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {members.length + 1 < (event.maxTeamSize ?? 4) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setMembers([...members, { name: "", email: "" }])}
              >
                <Plus className="size-4" /> Add member
              </Button>
            )}
          </section>
        )}

        {/* Step: Details form */}
        {(step === (event.teamEvent ? 1 : 0)) && (
          <section className="mt-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Registration details</h2>
            <div className="rounded-xl border bg-card p-5">
              <DynamicFormFields
                fields={event.formFields}
                values={values}
                errors={errors}
                onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v }))}
              />
            </div>
          </section>
        )}

        {/* Step: Review */}
        {(step === (event.teamEvent ? 2 : 1)) && (
          <section className="mt-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Review & confirm</h2>
            <div className="rounded-xl border bg-card p-5 text-sm">
              {event.teamEvent && (
                <p className="mb-3 border-b pb-3">
                  <span className="text-muted-foreground">Team: </span>
                  <span className="font-semibold">{teamName}</span>
                  <span className="text-muted-foreground"> · {members.filter((m) => m.name.trim()).length + 1} members</span>
                </p>
              )}
              <dl className="space-y-2">
                {visibleFields.map((f) => (
                  <div key={f.id} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted-foreground">{f.label}</dt>
                    <dd className="text-right font-medium">
                      {Array.isArray(values[f.id])
                        ? (values[f.id] as string[]).join(", ") || "—"
                        : f.type === "file"
                          ? values[f.id]
                            ? "Attached"
                            : "—"
                          : (values[f.id] as string) || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
              {event.requiresApproval && (
                <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  This event reviews registrations manually — your spot is confirmed after approval.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Nav buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < (event.teamEvent ? 2 : 1) ? (
            <Button
              onClick={() => {
                if (event.teamEvent && step === 0) {
                  if (!validateForm()) {
                    toast.error("Complete your team details first.");
                    return;
                  }
                }
                setStep((s) => s + 1);
              }}
            >
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Submitting…" : event.requiresApproval ? "Submit for review" : "Confirm registration"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
