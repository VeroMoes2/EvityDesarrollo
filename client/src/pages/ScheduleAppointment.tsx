import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";

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

  useEffect(() => {
    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize Calendly widget once script loads
    script.onload = () => {
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
      }
    };

    // Cleanup script on unmount
    return () => {
      document.body.removeChild(script);
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
          <h1 className="text-3xl font-bold">Agendar Cita Médica</h1>
          <p className="text-muted-foreground">
            Selecciona el mejor horario para tu consulta
          </p>
        </div>

        {/* Calendly Widget */}
        <div 
          id="calendly-inline-widget" 
          style={{ minWidth: '320px', height: '700px' }}
          data-testid="calendly-widget"
        ></div>
      </div>
    </div>
  );
}
