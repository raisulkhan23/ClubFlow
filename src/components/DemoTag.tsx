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

export function DemoTag() {
  const { user, signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const role = roleLabel(user?.role);

  return (
    <div className="fixed top-2 left-2 right-2 z-50 sm:top-4 sm:left-4 sm:right-auto sm:w-auto">
      <div
        role="note"
        className="max-w-sm overflow-hidden rounded-md border border-primary/30 bg-primary/10 px-3 py-2 shadow-sm backdrop-blur"
      >
        <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
          Demo
          <span className="opacity-70">·</span>
          <span className="opacity-80">{role ?? "session"}</span>
        </p>
        {role ? (
          <p className="mt-0.5 text-[10px] text-foreground/60">
            This is a demonstration session. Real registrations are disabled.
          </p>
        ) : (
          <p className="mt-0.5 text-[10px] text-foreground/60">
            Sign in to a role below to continue as a real user — or stay in this demo.
          </p>
        )}
        {role && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] text-foreground/50">or</span>
            <button
              type="button"
              disabled={leaving}
              className="text-primary underline underline-offset-2 transition-colors hover:no-underline focus-visible:outline-none"
              onClick={() => {
                setLeaving(true);
                void signOut();
              }}
            >
              {leaving ? "Signing out…" : "Leave demo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
