import { useAuthStore } from '@/shared/store/auth.store';
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const publicRoutes = ["/", "/login", "/register"];

export const useAuthRedirect = (redirectIfAuthenticatedTo: string = "/dashboard") => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname);

    if (user) {
      // If authenticated and trying to access a public route, redirect to dashboard
      if (isPublicRoute) {
        router.replace(redirectIfAuthenticatedTo);
      }
    } else if (!isPublicRoute) {
      // If not authenticated and trying to access a protected route, redirect to login
      router.replace("/login");
    }
  }, [user, pathname, router, redirectIfAuthenticatedTo]);

  return { user };
};