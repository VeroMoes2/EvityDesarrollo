import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Declare Calendly types for TypeScript
declare global {
  interface Window {
    Calendly: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: {
          name?: string;
          email?: string;
        };
        utm?: Record<string, string>;
      }) => void;
    };
  }
}

export default function ScheduleAppointment() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Calendly CSS
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    
    // Handle script load
    script.onload = () => {
      try {
        const calendlyElement = document.getElementById('calendly-inline-widget');
        if (calendlyElement && window.Calendly) {
          window.Calendly.initInlineWidget({
            url: 'https://calendly.com/elena-evity/30min',
            parentElement: calendlyElement,
            prefill: {
              name: `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim(),
              email: (user as any)?.email || "",
            },
          });
          setIsLoading(false);
        } else {
          setError("No se pudo cargar el widget de Calendly");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error initializing Calendly:", err);
        setError("Error al inicializar Calendly");
        setIsLoading(false);
      }
    };

    // Handle script error
    script.onerror = () => {
      setError("No se pudo cargar el script de Calendly");
      setIsLoading(false);
    };

    document.body.appendChild(script);

    // Cleanup script on unmount
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [user]);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/perfil")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Agendar entrevista : Mi primer contacto</h1>
          <p className="text-muted-foreground">
            Selecciona el mejor horario para tu consulta
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando calendario...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Por favor, intenta recargar la página o contacta con soporte.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendly Widget */}
        <div 
          id="calendly-inline-widget" 
          style={{ minWidth: '320px', height: '700px', display: isLoading ? 'none' : 'block' }}
          data-testid="calendly-widget"
        ></div>
      </div>
    </div>
  );
}
