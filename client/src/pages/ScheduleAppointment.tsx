import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, ExternalLink, Clock, User } from "lucide-react";

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

  const openCalendly = () => {
    window.open(calendlyUrl, '_blank', 'noopener,noreferrer');
  };

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

        {/* Calendly Info Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Duración de la consulta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">30 minutos</p>
              <p className="text-sm text-muted-foreground mt-2">
                Primera consulta para conocer tus objetivos de salud y longevidad
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Información pre-cargada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Tu información ya está lista:</p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Nombre:</span> {(user as any)?.firstName} {(user as any)?.lastName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {(user as any)?.email}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                Haz clic en el botón para abrir el calendario y seleccionar tu horario preferido
              </p>
              <Button 
                size="lg" 
                className="gap-2"
                onClick={openCalendly}
                data-testid="button-open-calendly"
              >
                <Calendar className="h-5 w-5" />
                Abrir Calendario de Citas
                <ExternalLink className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Se abrirá en una nueva pestaña
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What to expect */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>¿Qué esperar de tu primera consulta?</CardTitle>
            <CardDescription>
              Te prepararemos para una experiencia productiva
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="rounded-full bg-primary/10 p-2 h-fit">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <p className="font-medium">Evaluación inicial</p>
                <p className="text-sm text-muted-foreground">
                  Revisaremos tu estado de salud actual y objetivos de longevidad
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-full bg-primary/10 p-2 h-fit">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <p className="font-medium">Plan personalizado</p>
                <p className="text-sm text-muted-foreground">
                  Crearemos un plan de acción adaptado a tus necesidades
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-full bg-primary/10 p-2 h-fit">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <p className="font-medium">Próximos pasos</p>
                <p className="text-sm text-muted-foreground">
                  Te guiaremos en tu camino hacia una vida más larga y saludable
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
