// Minimal backdrop banner that should appear everywhere (any page).
// Not used by default — primary injection is <DemoTag> inside main.tsx.
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function DemoTagBannerWrapper({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const role = (user?.role ?? undefined);
  const roleLabel = role === "super_admin" ? "administrator" : role ?? "session";

  return (
    <div className="fixed top-2 left-2 right-2 z-50 sm:top-4">
      <div
        className="max-w-sm overflow-hidden rounded-md border border-primary/30 bg-primary/10 px-3 py-2 shadow-sm backdrop-blur"
        data-demo
        aria-label="Demo banner"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-primary">
            Demo
            <span className="ml-1.5 opacity-70">·</span>
            <span className="opacity-80">{roleLabel}</span>
          </p>
          {role && (
            <button
              className="text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none"
              onClick={() => void signOut()}
            >
              Leave demo
            </button>
          )}
        </div>
        {role && (
          <p className="mt-1 text-[10px] text-foreground/60">
            Demonstration session — real registrations are disabled.
          </p>
        )}
      </div>
    </div>
  );
}
