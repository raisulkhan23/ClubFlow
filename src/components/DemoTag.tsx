import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

type RoleLabel = "administrator" | "organizer" | "volunteer" | "participant" | "demo session";

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
 * Small, unobtrusive notice that this build is an unreleased demo. Anchored to
 * the bottom of the viewport so it never covers the logo or the nav.
 */
export function DemoTag() {
  const { user, signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const role = roleLabel(user?.role);

  return (
    <div className="fixed bottom-2 left-2 right-2 z-50 sm:bottom-4 sm:left-auto sm:right-4 sm:w-auto">
      <div
        role="note"
        className="max-w-xs overflow-hidden rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[10px] leading-snug shadow-sm backdrop-blur"
      >
        <p className="flex items-center gap-1 text-[11px] font-semibold text-primary">
          Demo preview
          {role && (
            <>
              <span className="opacity-60">·</span>
              <span className="font-medium opacity-80">{role}</span>
            </>
          )}
        </p>
        <p className="mt-0.5 text-foreground/60">
          {role
            ? "Sample data only — this site is a demo and hasn't been released yet."
            : "This site is a demo and is not published properly yet. Everything you see is sample data."}
        </p>
        {role && (
          <button
            type="button"
            disabled={leaving}
            className="mt-1 text-primary underline underline-offset-2 transition-colors hover:no-underline focus-visible:outline-none"
            onClick={() => {
              setLeaving(true);
              void signOut();
            }}
          >
            {leaving ? "Signing out…" : "Leave demo"}
          </button>
        )}
      </div>
    </div>
  );
}
