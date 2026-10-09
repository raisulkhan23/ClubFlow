import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { COVER_THEMES } from "@/lib/event-state";

export type AppRole = "super_admin" | "organizer" | "volunteer" | "participant";

/** Smallest UI primitives shared by the participant dashboard and fest pages. */
export function CoverArt({
  theme,
  title,
  children,
  className,
}: {
  theme?: number;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/40 text-white",
        className ?? "",
      )}
    >
      {theme != null && (
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.25)), " + COVER_THEMES[theme % COVER_THEMES.length],
          }}
        />
      )}
      {children ? (
        <div className="relative z-10 flex h-full items-end p-5 sm:p-8">{children}</div>
      ) : (
        <div className="relative z-10 flex h-full items-end p-4">
          {title && (
            <h3 className="max-w-full overflow-hidden text-lg font-semibold leading-tight">
              {title}
            </h3>
          )}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      )}
      {actions && <div className="mt-3">{actions}</div>}
    </div>
  );
}

export function StatusBadge({
  status,
  dot = false,
}: {
  status?: string;
  dot?: boolean;
}) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "border-primary/30 bg-primary/10 text-primary" },
    almost_full: { label: "Almost full", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
    full: { label: "Full", className: "border-border bg-muted text-muted-foreground" },
    registration_closed: { label: "Registration closed", className: "border-border bg-muted text-muted-foreground" },
    live: { label: "Happening now", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    completed: { label: "Completed", className: "border-border bg-muted text-muted-foreground" },
    archived: { label: "Archived", className: "border-border bg-muted text-muted-foreground" },
    draft: { label: "Draft", className: "border-border bg-muted text-muted-foreground" },
    pending: { label: "Pending", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
    confirmed: { label: "Confirmed", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    cancelled: { label: "Cancelled", className: "border-destructive/30 bg-destructive/10 text-destructive" },
    rejected: { label: "Rejected", className: "border-destructive/30 bg-destructive/10 text-destructive" },
    done: { label: "Done", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    in_progress: { label: "In progress", className: "border-primary/30 bg-primary/10 text-primary" },
    todo: { label: "To do", className: "border-border bg-muted text-muted-foreground" },
    urgent: { label: "Urgent", className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300" },
    important: { label: "Important", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
    normal: { label: "Normal", className: "border-border bg-muted text-muted-foreground" },
    participant: { label: "Participant", className: "border-border bg-muted text-muted-foreground" },
  };
  const entry = status != null ? map[status] : null;
  if (!entry) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        entry.className,
      )}
    >
      {dot && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current opacity-60" />}
      {entry.label}
    </span>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "primary" | "default";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">
        {label} {hint && <span className="text-muted-foreground/70">· {hint}</span>}
      </p>
    </div>
  );
}

export function MetricStrip({ columns, children }: { columns?: number; children?: ReactNode }) {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-xl border bg-card p-4",
        columns == null ? "grid-cols-1" : `grid-cols-1 sm:grid-cols-${columns}`,
      )}
    >
      {children}
    </div>
  );
}

export const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super Admin",
  organizer: "Organizer",
  volunteer: "Volunteer",
  participant: "Participant",
};

/** Auth + role guard for protected routes. */
export function RequireRole({
  children,
  allowed,
  title,
  description,
}: {
  children: ReactNode;
  allowed: AppRole[];
  title?: string;
  description?: string;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  const role = (user?.role ?? "participant") as AppRole;
  if (allowed.length > 0 && !allowed.includes(role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15">
                <ShieldAlert className="size-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">{title ?? "No access to this area"}</CardTitle>
            <CardDescription>
              {description ??
                `This page is for ${allowed.map((r) => ROLE_LABEL[r]).join(" / ")} accounts.`}{" "}
              You're signed in as {ROLE_LABEL[role]}.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Head to your own workspace — everything there is tuned to your role.
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to={roleHome(role)}>Go to my workspace</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return children;
}

export function roleHome(role: AppRole | undefined): string {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "organizer":
      return "/organizer";
    case "volunteer":
      return "/volunteer";
    default:
      return "/dashboard";
  }
}

/** Redirect component used at /dashboard — sends staff roles to their workspaces. */
export function WorkspaceEntry({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = (user?.role ?? "participant") as AppRole;
  if (role === "organizer" || role === "super_admin") return <Navigate to="/organizer" replace />;
  if (role === "volunteer") return <Navigate to="/volunteer" replace />;
  return children;
}

// ── Small shared display components ──────────────────────────────────────────

const BADGE_STYLES: Record<string, string> = {
  // registration statuses
  confirmed: "border-primary/30 bg-primary/10 text-primary",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  checked_in: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  // event statuses
  draft: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  published: "border-primary/30 bg-primary/10 text-primary",
  registration_closed: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  live: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  completed: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  archived: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  // registration state
  open: "border-primary/30 bg-primary/10 text-primary",
  almost_full: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  full: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  closed: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  // announcements / tasks / results
  normal: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  important: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  urgent: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  todo: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  in_progress: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  done: "border-primary/30 bg-primary/10 text-primary",
  low: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  high: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  winner: "border-primary/40 bg-primary/10 text-primary",
  runner_up: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  second_runner_up: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  special: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  participation: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};

const BADGE_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  rejected: "Rejected",
  checked_in: "Checked in",
  draft: "Draft",
  published: "Registration Open",
  registration_closed: "Registration Closed",
  live: "Live",
  completed: "Completed",
  archived: "Archived",
  open: "Open",
  almost_full: "Almost Full",
  full: "Full",
  closed: "Closed",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  runner_up: "Runner-up",
  second_runner_up: "2nd Runner-up",
};

export function StatusBadge({
  status,
  label,
  className,
  dot,
}: {
  status?: string;
  label?: string;
  className?: string;
  dot?: boolean;
}) {
  const style = BADGE_STYLES[status ?? ""] ?? "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        style,
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {label ?? BADGE_LABEL[status ?? ""] ?? status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? status ?? ""}
    </span>
  );
}

export function CoverArt({
  theme,
  title,
  className,
  children,
}: {
  theme?: number;
  title?: string;
  className?: string;
  children?: ReactNode;
}) {
  const t =
    theme != null
      ? COVER_THEMES[theme % COVER_THEMES.length] ?? COVER_THEMES[0]
      : null;
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={
        t
          ? { background: `linear-gradient(130deg, ${t.from} 0%, ${t.to} 90%)` }
          : undefined
      }
    >
      {t && (
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.35) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      )}
      {t && (
        <div
          className="absolute -right-10 -top-16 size-48 rounded-full opacity-25 blur-2xl"
          style={{ background: t.accent }}
        />
      )}
      {title && (
        <span className="absolute bottom-3 left-4 font-display text-5xl font-bold text-white/15 select-none">
          {title.slice(0, 1).toUpperCase()}
        </span>
      )}
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-xl font-bold tracking-tight text-balance sm:text-[1.375rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * A single figure inside a metric strip. Deliberately flat: the strip already
 * provides the container, so nesting this in its own card would be noise.
 */
export function Metric({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary" | "warning" | "danger" | "success";
  className?: string;
}) {
  const toneClass: Record<string, string> = {
    default: "",
    primary: "text-primary",
    warning: "text-amber-600 dark:text-amber-300",
    danger: "text-red-600 dark:text-red-300",
    success: "text-emerald-600 dark:text-emerald-300",
  };
  return (
    <div
      className={cn(
        "min-w-0 rounded-md bg-card px-4 py-3.5 ring-1 ring-border lg:rounded-none lg:ring-0",
        className,
      )}
    >
      <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-display text-2xl leading-none font-semibold tabular",
          toneClass[tone],
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Section heading used across dashboards: a title row separated by a hairline
 * instead of wrapping every block in its own card.
 */
export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b pb-2">
      <div className="min-w-0">
        <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Lightweight, layout-stable loading state (no skeleton flash). */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        tone === "primary" ? "border-primary/25 bg-primary/[0.05]" : "bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {icon && <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl leading-none font-semibold tabular">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * A flat band of related figures. Wrapped tiles on small screens, a single
 * divided strip on large screens — deliberately not a row of separate cards.
 */
export function MetricStrip({
  columns = 5,
  children,
}: {
  columns?: number;
  children: ReactNode;
}) {
  const lgCols: Record<number, string> = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  };
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 lg:gap-0 lg:divide-x lg:divide-border lg:overflow-hidden lg:rounded-lg lg:border lg:bg-card",
        lgCols[columns] ?? "lg:grid-cols-5",
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground [&>svg]:size-4.5">
          {icon}
        </div>
      )}
      <p className="font-display text-sm font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Lock className="size-3" /> Locked
    </span>
  );
}
