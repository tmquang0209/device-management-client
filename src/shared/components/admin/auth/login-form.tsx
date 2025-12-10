import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/shared/data/api";
import { useAuth } from "@/shared/hooks/use-auth";
import { IBasicUser, IResponse } from "@/shared/interfaces";
import {
  LoginFormValues,
  loginSchema,
} from "@/shared/schema/admin/login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Lock, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function LoginForm() {
  const { setUser } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await api.post<IResponse<IBasicUser>>(
        "/auth/login",
        data,
      );
      return response;
    },
    onSuccess: (res) => {
      setUser(res.data);
      toast.success(res.message);
      // Redirect to dashboard after successful login
      router.push("/dashboard");
    },
    onError: (err: string) => {
      toast.error(err);
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    mutate(data);
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="mb-8 text-center">
          <div className="bg-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
            <Shield className="text-primary-foreground h-6 w-6" />
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-semibold text-balance">
            System Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to access the admin panel
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@example.com"
                          leftIcon={<Mail className="h-4 w-4" />}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          leftIcon={<Lock className="h-4 w-4" />}
                          showPasswordToggle={true}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            {/* Additional Info */}
            <div className="border-border mt-6 border-t pt-6">
              <p className="text-muted-foreground text-center text-xs">
                Protected by enterprise-grade security
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          Need help? Contact your system administrator
        </p>
      </div>
    </div>
  );
}
