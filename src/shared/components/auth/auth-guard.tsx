"use client";

import { Loading } from "@/components/ui/loading";
import { SidebarProvider } from "@/shared/context/sidebar.context";
import { useAuthInitialization } from "@/shared/hooks/use-auth";
import { Suspense } from "react";

// This is your "AuthenticatedApp" - the main app when user is logged in
interface AuthenticatedAppProps {
  readonly children: React.ReactNode;
}

export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SidebarProvider>
        <main>{children}</main>
      </SidebarProvider>
    </Suspense>
  );
}

// Login/Unauthenticated state component
export function UnauthenticatedApp({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}

// Auth Guard component that wraps your app content
interface AuthGuardProps {
  readonly children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated } = useAuthInitialization();

  // Show loading while checking authentication on server-side
  if (user === null && typeof window === "undefined") {
    return <Loading />;
  }

  // User is authenticated - show the full admin app
  if (isAuthenticated && user) {
    return <AuthenticatedApp>{children}</AuthenticatedApp>;
  }

  // User is not authenticated - show login/public pages
  return <UnauthenticatedApp>{children}</UnauthenticatedApp>;
}