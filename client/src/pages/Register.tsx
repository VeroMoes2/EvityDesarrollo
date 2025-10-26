// LS-98: Registration page with complete user information form
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff, UserPlus, ArrowLeft, Phone } from "lucide-react";
import { Link, useLocation } from "wouter";
import { phoneNumberSchema } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { createNotifications } from "@/lib/notifications";

// LS-98: Registration validation schema - will be created inside component to access t()
// Type will be created inside component

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender?: string;
  dateOfBirth?: string;
  phoneNumber: string;
};

export default function Register() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const notifications = createNotifications(t);

  // Create schema inside component to access t() for translations
  const registerSchema = z.object({
    firstName: z.string()
      .min(2, t('register.firstNameMin'))
      .max(50, t('register.firstNameMax'))
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, t('register.firstNameInvalid')),
    lastName: z.string()
      .min(2, t('register.lastNameMin'))
      .max(50, t('register.lastNameMax'))
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, t('register.lastNameInvalid')),
    email: z.string()
      .email(t('register.invalidEmail'))
      .min(1, t('register.emailRequired'))
      .max(100, t('register.emailMax')),
    password: z.string()
      .min(8, t('register.passwordMin'))
      .max(100, t('register.passwordMax'))
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t('register.passwordInvalid')),
    confirmPassword: z.string()
      .min(1, t('register.confirmRequired')),
    gender: z.enum(["masculino", "femenino", "otro", ""], {
      errorMap: () => ({ message: t('register.genderInvalid') })
    }).optional(),
    dateOfBirth: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t('register.invalidDateFormat'))
      .optional()
      .refine((date) => {
        if (!date) return true;
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18 && age <= 120;
      }, t('register.minimumAge')),
    phoneNumber: phoneNumberSchema,
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('register.passwordMismatch'),
    path: ["confirmPassword"],
  });

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "",
      dateOfBirth: "",
      phoneNumber: "", // LS-110: Phone number default value
    },
  });

  // LS-98: Registration mutation with proper CSRF protection
  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterForm, 'confirmPassword'>) => {
      const response = await apiRequest("POST", "/api/register", data);
      return await response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: t('register.successToast'),
        description: t('register.successToastDesc'),
      });
      
      // Refetch auth state and wait for it to complete before redirecting
      // This prevents any timing issues during auth state refresh
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      
      // Redirect to questionnaire after successful registration
      setLocation("/cuestionario");
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      
      const errorMessage = error.message || t('register.errorDuringToast');
      
      // Handle specific field errors
      if (error.field) {
        form.setError(error.field as keyof RegisterForm, {
          type: "server",
          message: errorMessage,
        });
      } else {
        toast({
          variant: "destructive",
          title: t('register.errorToast'),
          description: errorMessage,
        });
      }
    },
  });

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Link href="/" data-testid="link-back-home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('register.backButton')}
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            <UserPlus className="h-6 w-6 mx-auto mb-2" />
            {t('register.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('register.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.firstNameLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('register.firstNamePlaceholder')}
                          data-testid="input-firstName"
                          autoComplete="given-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.lastNameLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('register.lastNamePlaceholder')}
                          data-testid="input-lastName"
                          autoComplete="family-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('register.emailPlaceholder')}
                        data-testid="input-email"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gender and Date of Birth fields */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.genderLabel')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue placeholder={t('register.genderPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masculino">{t('register.genderMale')}</SelectItem>
                          <SelectItem value="femenino">{t('register.genderFemale')}</SelectItem>
                          <SelectItem value="otro">{t('register.genderOther')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.dateOfBirthLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-date-of-birth"
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* LS-110: Phone number field */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.phoneLabel')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="tel"
                          placeholder={t('register.phonePlaceholder')}
                          data-testid="input-phone-number"
                          autoComplete="tel"
                        />
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password fields - side by side */}
              <div className={`grid gap-3 ${form.watch("password") ? "grid-cols-2" : "grid-cols-1"}`}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.passwordLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={t('register.passwordPlaceholder')}
                            data-testid="input-password"
                            autoComplete="new-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("password") && (
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('register.confirmPasswordLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder={t('register.confirmPasswordPlaceholder')}
                              data-testid="input-confirmPassword"
                              autoComplete="new-password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              data-testid="button-toggle-confirmPassword"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? t('register.registering') : t('register.registerButton')}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('register.haveAccount')}{" "}
              <Link href="/login" data-testid="link-login">
                <Button variant="ghost" className="p-0 h-auto">
                  {t('register.loginHere')}
                </Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}