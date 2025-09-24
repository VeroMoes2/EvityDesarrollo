// LS-98: Login page with email/password authentication
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createNotifications } from "@/lib/notifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

// LS-98: Login validation schema - will be created inside component to access t() function

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const notifications = createNotifications(t);

  // Create schema inside component to access t() for translations
  const loginSchema = z.object({
    email: z.string()
      .email(t('login.invalidEmail'))
      .min(1, t('login.emailRequired')),
    password: z.string()
      .min(1, t('login.passwordRequired')),
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // LS-98: Login mutation with proper error handling and CSRF token handling
  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      // LS-108: Use apiRequest helper that automatically handles CSRF tokens
      const response = await apiRequest("POST", "/api/login", data);
      return await response.json();
    },
    onSuccess: async (data) => {
      notifications.success.login();
      
      // Refetch auth state and wait for it to complete before redirecting
      // This prevents the brief 404 flash that occurs during query invalidation
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      
      // Redirect to home page after successful authentication and auth state refresh
      setLocation("/");
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      
      const errorMessage = error.message || t('notifications.error.loginDesc');
      
      // LS-98: Specific error messages for better UX
      if (error.field) {
        form.setError(error.field as keyof LoginForm, {
          type: "server",
          message: errorMessage,
        });
      } else {
        // Clear form errors and show toast for general errors
        form.clearErrors();
        notifications.error.loginFailed(errorMessage);
      }
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Link href="/" data-testid="link-back-home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('login.back')}
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            <LogIn className="h-6 w-6 mx-auto mb-2" />
            {t('login.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.email')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('login.email')}
                        data-testid="input-email"
                        autoComplete="email"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={t('login.password')}
                          data-testid="input-password"
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Forgot password link */}
              <div className="flex justify-end">
                <Link href="/forgot-password" data-testid="link-forgot-password">
                  <Button variant="ghost" className="px-0 text-sm">
                    {t('login.forgotPassword')}
                  </Button>
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? t('login.loggingIn') : t('login.loginButton')}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('login.noAccount')}{" "}
              <Link href="/register" data-testid="link-register">
                <Button variant="ghost" className="p-0 h-auto">
                  {t('login.signUpHere')}
                </Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}