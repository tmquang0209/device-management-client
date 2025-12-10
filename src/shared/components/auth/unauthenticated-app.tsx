'use client';

import { LoginForm } from '@/shared/components/admin/auth/login-form';

export function UnauthenticatedApp() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground mt-2">
              Enter your credentials to access the admin dashboard
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}