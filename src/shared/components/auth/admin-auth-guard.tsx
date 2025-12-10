"use client";

import { useAuth } from "@/shared/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminAuthGuardProps {
  readonly children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      router.push('/login');
      return;
    }

    // Optionally check if user has admin role
    // if (user && !user.roles?.includes('admin')) {
    //   router.push('/unauthorized');
    //   return;
    // }
  }, [isAuthenticated, user, router]);

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // User is authenticated, render the admin content
  return <>{children}</>;
}