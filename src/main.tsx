import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireRole, WorkspaceEntry } from "@/components/RequireRole";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";


import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/participant/ParticipantOverview.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Events = lazy(() => import("./pages/Events.tsx"));
const EventDetails = lazy(() => import("./pages/EventDetails.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const Verify = lazy(() => import("./pages/Verify.tsx"));
const MyRegistrations = lazy(() => import("./pages/participant/MyRegistrations.tsx"));
const RegistrationDetail = lazy(() => import("./pages/participant/RegistrationDetail.tsx"));
const Notifications = lazy(() => import("./pages/participant/Notifications.tsx"));
const MyCertificates = lazy(() => import("./pages/participant/MyCertificates.tsx"));
const Profile = lazy(() => import("./pages/participant/Profile.tsx"));
const OrganizerLayout = lazy(() => import("./pages/organizer/OrganizerLayout"));
const OrganizerOverview = lazy(() => import("./pages/organizer/OrganizerOverview.tsx"));
const OrganizerEvents = lazy(() => import("./pages/organizer/OrganizerEvents.tsx"));
const EventEditor = lazy(() => import("./pages/organizer/EventEditor.tsx"));
const Participants = lazy(() => import("./pages/organizer/Participants.tsx"));
const CheckInPage = lazy(() => import("./pages/organizer/CheckInPage.tsx"));
const Announcements = lazy(() => import("./pages/organizer/Announcements.tsx"));
const Results = lazy(() => import("./pages/organizer/Results.tsx"));
const Tasks = lazy(() => import("./pages/organizer/Tasks.tsx"));
const Volunteers = lazy(() => import("./pages/organizer/Volunteers.tsx"));
const Analytics = lazy(() => import("./pages/organizer/Analytics.tsx"));
const Settings = lazy(() => import("./pages/organizer/Settings.tsx"));
const Resources = lazy(() => import("./pages/organizer/Resources.tsx"));
const OrganizerFests = lazy(() => import("./pages/organizer/Fests.tsx"));
const Fests = lazy(() => import("./pages/Fests.tsx"));
const FestDetails = lazy(() => import("./pages/FestDetails.tsx"));
const Feedback = lazy(() => import("./pages/organizer/Feedback.tsx"));
const LiveMode = lazy(() => import("./pages/organizer/LiveMode.tsx"));
const VolunteerLayout = lazy(() => import("./pages/volunteer/VolunteerLayout.tsx"));
const VolunteerHome = lazy(() => import("./pages/volunteer/VolunteerHome.tsx"));
const VolunteerCheckIn = lazy(() => import("./pages/volunteer/VolunteerCheckIn.tsx"));
const VolunteerParticipants = lazy(() => import("./pages/volunteer/VolunteerParticipants.tsx"));
const VolunteerAnnouncements = lazy(() => import("./pages/volunteer/VolunteerAnnouncements.tsx"));
const Admin = lazy(() => import("./pages/admin/Admin.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading…</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/fests" element={<Fests />} />
              <Route path="/fests/:slug" element={<FestDetails />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetails />} />
              <Route
                path="/events/:slug/register"
                element={
                  <RequireAuth redirectImmediately>
                    <Register />
                  </RequireAuth>
                }
              />
              <Route path="/verify" element={<Verify />} />
              <Route path="/verify/:certificateId" element={<Verify />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />

              {/* Participant area */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <WorkspaceEntry>
                      <Dashboard />
                    </WorkspaceEntry>
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/registrations"
                element={
                  <RequireAuth>
                    <MyRegistrations />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/registrations/:id"
                element={
                  <RequireAuth>
                    <RegistrationDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/notifications"
                element={
                  <RequireAuth>
                    <Notifications />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/certificates"
                element={
                  <RequireAuth>
                    <MyCertificates />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />

              {/* Organizer area */}
              <Route
                element={
                  <RequireRole allowed={["organizer", "super_admin"]}>
                    <OrganizerLayout />
                  </RequireRole>
                }
              >
                <Route path="/organizer" element={<OrganizerOverview />} />
                <Route path="/organizer/fests" element={<OrganizerFests />} />
                <Route path="/organizer/events" element={<OrganizerEvents />} />
                <Route path="/organizer/events/new" element={<EventEditor />} />
                <Route path="/organizer/events/:eventId" element={<EventEditor />} />
                <Route path="/organizer/participants" element={<Participants />} />
                <Route path="/organizer/checkin" element={<CheckInPage />} />
                <Route path="/organizer/announcements" element={<Announcements />} />
                <Route path="/organizer/results" element={<Results />} />
                <Route path="/organizer/tasks" element={<Tasks />} />
                <Route path="/organizer/volunteers" element={<Volunteers />} />
                <Route path="/organizer/analytics" element={<Analytics />} />
                <Route path="/organizer/resources" element={<Resources />} />
                <Route path="/organizer/feedback" element={<Feedback />} />
                <Route path="/organizer/live" element={<LiveMode />} />
                <Route path="/organizer/settings" element={<Settings />} />
              </Route>

              {/* Volunteer area */}
              <Route
                element={
                  <RequireRole allowed={["volunteer"]}>
                    <VolunteerLayout />
                  </RequireRole>
                }
              >
                <Route path="/volunteer" element={<VolunteerHome />} />
                <Route path="/volunteer/checkin" element={<VolunteerCheckIn />} />
                <Route path="/volunteer/participants" element={<VolunteerParticipants />} />
                <Route path="/volunteer/announcements" element={<VolunteerAnnouncements />} />
              </Route>

              {/* Super admin */}
              <Route
                path="/admin"
                element={
                  <RequireRole allowed={["super_admin"]}>
                    <Admin />
                  </RequireRole>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
