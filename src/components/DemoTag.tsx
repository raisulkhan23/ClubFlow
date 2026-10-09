import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

type RoleLabel = "administrator" | "organizer" | "volunteer" | "participant";

function roleLabel(role: string | undefined): RoleLabel | null {
  switch (role) {
    case "super_admin":
      return "administrator";
    case "organizer":
      return "organizer";
    case "volunteer":
      return "volunteer";
    case "participant":
      return "participant";
    default:
      return null;
  }
}

/**
 * Compact "this build is a demo" note that lives inside page headers and
 * footers. It used to be a floating overlay, which covered the logo and the
 * registration buttons underneath it, so it now only renders inline.
 */
export function DemoNote({ className }: { className?: string }) {
  const { user, signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const role = roleLabel(user?.role);

  return (
    <span
      className={
        "inline-flex max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] leading-tight font-medium text-primary " +
        (className ?? "")
      }
      title="This site is a demo and is not published properly yet."
    >
      <span className="size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
      <span className="truncate">Demo preview{role ? ` · ${role}` : ""}</span>
      {role && (
        <button
          type="button"
          disabled={leaving}
          className="shrink-0 underline underline-offset-2 transition-colors hover:no-underline focus-visible:outline-none"
          onClick={() => {
            setLeaving(true);
            void signOut();
          }}
        >
          {leaving ? "…" : "Leave"}
        </button>
      )}
    </span>
  );
}

/** One-line reminder used in page footers. */
export function DemoFooterNote() {
  return (
    <p className="text-[10px] leading-snug text-muted-foreground/80">
      This site is a demo build for the 9th DRMC International Tech Carnival 2026 — it is not
      published properly yet and all data shown is sample data.
    </p>
  );
}
