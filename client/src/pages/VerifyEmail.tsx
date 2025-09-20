// LS-99: Email verification page for account activation
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Mail, ArrowLeft } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>("");
  const [verificationComplete, setVerificationComplete] = useState(false);
  const { toast } = useToast();

  // Extract token from URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      // Auto-verify if token is present
      verifyEmailMutation.mutate({ token: tokenParam });
    }
  }, []);

  const verifyEmailMutation = useMutation({
    mutationFn: async (data: { token: string }) => {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }
      
      return result;
    },
    onSuccess: (data) => {
      setVerificationComplete(true);
      toast({
        title: "¡Email verificado!",
        description: data.message || "Tu cuenta ha sido activada exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error("Email verification error:", error);
      
      const errorMessage = error.message || "Error verificando el email";
      
      toast({
        variant: "destructive",
        title: "Error de verificación",
        description: errorMessage,
      });
    },
  });

  const handleGoToLogin = () => {
    setLocation("/login");
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Link href="/" data-testid="link-back-home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            <Mail className="h-6 w-6 mx-auto mb-2" />
            Verificación de Email
          </CardTitle>
          <CardDescription className="text-center">
            Activando tu cuenta de Evity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {verifyEmailMutation.isPending && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">
                Verificando tu email...
              </p>
            </div>
          )}

          {verifyEmailMutation.isError && (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-destructive">
                  Verificación fallida
                </h3>
                <p className="text-muted-foreground">
                  El enlace de verificación es inválido o ha expirado.
                </p>
                <div className="flex flex-col gap-2 pt-4">
                  <Button 
                    onClick={handleGoHome}
                    variant="outline"
                    className="w-full"
                    data-testid="button-go-home"
                  >
                    Ir al inicio
                  </Button>
                  <Button 
                    onClick={handleGoToLogin}
                    className="w-full"
                    data-testid="button-go-login"
                  >
                    Ir a iniciar sesión
                  </Button>
                </div>
              </div>
            </div>
          )}

          {verificationComplete && verifyEmailMutation.isSuccess && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-600">
                  ¡Email verificado exitosamente!
                </h3>
                <p className="text-muted-foreground">
                  Tu cuenta de Evity está ahora activada. Puedes iniciar sesión para acceder a tu perfil personal.
                </p>
                <div className="flex flex-col gap-2 pt-4">
                  <Button 
                    onClick={handleGoToLogin}
                    className="w-full"
                    data-testid="button-login-after-verification"
                  >
                    Iniciar sesión
                  </Button>
                  <Button 
                    onClick={handleGoHome}
                    variant="outline"
                    className="w-full"
                    data-testid="button-home-after-verification"
                  >
                    Ir al inicio
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!token && !verifyEmailMutation.isPending && !verifyEmailMutation.isError && !verificationComplete && (
            <div className="text-center space-y-4">
              <Mail className="h-16 w-16 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Enlace de verificación requerido
                </h3>
                <p className="text-muted-foreground">
                  Para verificar tu email, necesitas hacer clic en el enlace que enviamos a tu correo electrónico.
                </p>
                <Button 
                  onClick={handleGoHome}
                  variant="outline"
                  className="w-full"
                  data-testid="button-go-home-no-token"
                >
                  Volver al inicio
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}