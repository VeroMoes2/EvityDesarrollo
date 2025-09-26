// LS-98: Password reset page with secure token validation
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

type ResetPasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // LS-98: Password reset validation schema with strong requirements - moved inside component to access t()
  const resetPasswordSchema = z.object({
    newPassword: z.string()
      .min(8, t('resetPassword.passwordMin'))
      .max(100, t('resetPassword.passwordMax'))
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t('resetPassword.passwordInvalid')),
    confirmPassword: z.string()
      .min(1, t('resetPassword.confirmRequired')),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('resetPassword.passwordMismatch'),
    path: ["confirmPassword"],
  });

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      toast({
        variant: "destructive",
        title: t('resetPassword.noTokenTitle'),
        description: t('resetPassword.noTokenDescription'),
      });
      setLocation("/forgot-password");
      return;
    }
    
    setToken(tokenParam);
  }, [toast, setLocation]);

  // LS-98: Reset password mutation with token validation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      if (!token) {
        throw new Error(t('resetPassword.invalidToken'));
      }
      
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }
      
      return result;
    },
    onSuccess: (data) => {
      setPasswordReset(true);
      toast({
        title: t('resetPassword.successTitle'),
        description: t('resetPassword.successDescription'),
      });
    },
    onError: (error: any) => {
      console.error("Reset password error:", error);
      
      const errorMessage = error.message || t('resetPassword.defaultError');
      
      // Handle token expired/invalid errors  
      if (errorMessage.includes("Token inválido") || errorMessage.includes("expirado") || 
          errorMessage.includes("Invalid token") || errorMessage.includes("expired")) {
        toast({
          variant: "destructive",
          title: t('resetPassword.tokenExpiredTitle'),
          description: t('resetPassword.tokenExpiredDescription'),
        });
        setLocation("/forgot-password");
        return;
      }
      
      if (error.field) {
        form.setError(error.field as keyof ResetPasswordForm, {
          type: "server",
          message: errorMessage,
        });
      } else {
        toast({
          variant: "destructive",
          title: t('resetPassword.errorTitle'),
          description: errorMessage,
        });
      }
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <CardTitle className="text-2xl font-bold">
              {t('resetPassword.passwordUpdatedTitle')}
            </CardTitle>
            <CardDescription>
              {t('resetPassword.passwordUpdatedDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" data-testid="link-login">
              <Button className="w-full">
                {t('resetPassword.goToLogin')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {t('common.loading')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Link href="/login" data-testid="link-back-login">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('resetPassword.back')}
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            <Lock className="h-6 w-6 mx-auto mb-2" />
            {t('resetPassword.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('resetPassword.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('resetPassword.newPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={t('resetPassword.newPasswordPlaceholder')}
                          data-testid="input-newPassword"
                          autoComplete="new-password"
                          autoFocus
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('resetPassword.confirmPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                          data-testid="input-confirmPassword"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirmPassword"
                        >
                          {showConfirmPassword ? (
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

              <Button
                type="submit"
                className="w-full"
                disabled={resetPasswordMutation.isPending}
                data-testid="button-reset-password"
              >
                {resetPasswordMutation.isPending ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('resetPassword.rememberPassword')}{" "}
              <Link href="/login" data-testid="link-login">
                <Button variant="ghost" className="p-0 h-auto">
                  {t('resetPassword.loginHere')}
                </Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}