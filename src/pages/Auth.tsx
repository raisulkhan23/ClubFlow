import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Logo } from "@/components/Logo";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowRight, BadgeCheck, CalendarCheck2, ClipboardList, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

type DemoRole = "super_admin" | "organizer" | "volunteer" | "participant";

const DEMO_ROLES: Array<{ role: DemoRole; label: string; description: string; icon: typeof ShieldCheck }> = [
  { role: "organizer", label: "Organizer Demo", description: "Run events, forms, check-ins, results & certificates", icon: CalendarCheck2 },
  { role: "volunteer", label: "Volunteer Demo", description: "Scan QR check-ins at assigned events", icon: ClipboardList },
  { role: "participant", label: "Participant Demo", description: "Register for events and get your QR ticket", icon: BadgeCheck },
  { role: "super_admin", label: "Super Admin Demo", description: "Platform-wide overview of clubs & events", icon: ShieldCheck },
];

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const claimDemoRole = useMutation(api.accounts.claimDemoRole);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  const festStatus = useQuery(api.festSeed.festScheduleStatus);
  const festReady = festStatus ? festStatus.matches : false;

  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoBusy, setDemoBusy] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleDemoLogin = async (role: DemoRole) => {
    setDemoBusy(role);
    setError(null);
    try {
      await signIn("anonymous");
      await claimDemoRole({ role });
      toast.success("Demo session started");
      navigate(redirect);
    } catch (err) {
      console.error("Demo login error:", err);
      setError(err instanceof Error ? err.message : "Demo login failed. Please try again.");
      setDemoBusy(null);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="flex-1 px-4 py-10">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_400px]">
          {/* Left: brand + demo login */}
          <div>
            <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Logo />
            </button>
            <h1 className="mt-8 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Run your entire fest
              <br />
              <span className="text-gradient-lime">from one place.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Sign in with email to keep your registrations safe across devices — or jump straight into a demo to see ClubFlow from any role.
            </p>

            {!festReady && (
              <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
                <p className="flex items-start gap-2">
                  <Loader2 className="mt-0.5 shrink-0 size-3.5 animate-spin text-amber-500" aria-hidden="true" />
                  <span>The real DRMC Tech Carnival 2026 schedule is still being seeded. Demo login will do that automatically once it is ready.</span>
                </p>
              </div>
            )}

            <div className="mt-4 rounded-xl border bg-card/60 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Try the demo · no signup needed
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {DEMO_ROLES.map((d) => (
                  <button
                    key={d.role}
                    onClick={() => void handleDemoLogin(d.role)}
                    disabled={demoBusy !== null || isLoading}
                    className="group rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <d.icon className="size-4 text-primary" />
                      <span className="text-sm font-semibold">
                        {demoBusy === d.role ? "Signing in…" : d.label}
                      </span>
                      {demoBusy === d.role && <Loader2 className="ml-auto size-3.5 animate-spin text-primary" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: email OTP card */}
          <Card className="pb-0 shadow-md">
            {step === "signIn" ? (
              <>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Sign in</CardTitle>
                  <CardDescription>
                    Enter your email to log in or create an account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleEmailSubmit}>
                  <CardContent>
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="email"
                          placeholder="name@example.com"
                          type="email"
                          className="pl-9"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <Button type="submit" variant="outline" size="icon" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                    <p className="mt-4 text-xs text-muted-foreground">
                      We'll email you a one-time code. New here? This creates your account as a participant.
                    </p>
                  </CardContent>
                </form>
              </>
            ) : (
              <>
                <CardHeader className="mt-4 text-center">
                  <CardTitle>Check your email</CardTitle>
                  <CardDescription>We've sent a code to {step.email}</CardDescription>
                </CardHeader>
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pb-4">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (e.target as HTMLElement).closest("form");
                            form?.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Didn't receive a code?{" "}
                      <Button variant="link" className="h-auto p-0" onClick={() => setStep("signIn")}>
                        Try again
                      </Button>
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                        </>
                      ) : (
                        <>
                          Verify code <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setStep("signIn")} disabled={isLoading} className="w-full">
                      Use different email
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}
            <div className="rounded-b-lg border-t bg-muted px-6 py-4 text-center text-xs text-muted-foreground">
              Secured by{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-primary"
              >
                freebuff.com
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
