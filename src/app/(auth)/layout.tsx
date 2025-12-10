"use client";

import { useAuthRedirect } from "@/shared/hooks/use-auth-redirect";
import type React from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useAuthRedirect();
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      {children}
    </div>
  );
}
