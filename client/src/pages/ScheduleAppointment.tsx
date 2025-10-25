import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";

export default function ScheduleAppointment() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Build Calendly URL with user prefill data
  const calendlyUrl = useMemo(() => {
    const baseUrl = 'https://calendly.com/elena-evity/30min';
    const params = new URLSearchParams();
    
    if (user) {
      const firstName = (user as any)?.firstName || '';
      const lastName = (user as any)?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) {
        params.append('name', fullName);
      }
      if ((user as any)?.email) {
        params.append('email', (user as any).email);
      }
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
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

        {/* Calendly iFrame */}
        <div className="w-full rounded-lg overflow-hidden border border-border bg-card shadow-sm">
          <iframe
            src={calendlyUrl}
            width="100%"
            height="700"
            frameBorder="0"
            title="Calendly - Agendar Cita"
            data-testid="calendly-iframe"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
