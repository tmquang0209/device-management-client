"use client";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/shared/hooks/use-auth";

export default function LogoutPage() {
  const { user, logout } = useAuth();
  if (user) {
    logout();
  }
  return <Loading key={"logout"} size={40} />;
}
