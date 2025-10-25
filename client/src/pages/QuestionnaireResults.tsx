import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Sparkles, 
  Calendar,
  ArrowRight,
  Home
} from "lucide-react";

export default function QuestionnaireResults() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: questionnaireData, isLoading } = useQuery({
    queryKey: ["/api/questionnaire"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  const questionnaire = (questionnaireData as any)?.questionnaire;
  
  // Check if questionnaire is completed (handles both boolean and string values)
  const isCompleted = questionnaire?.isCompleted === "true" || questionnaire?.isCompleted === true;
  
  if (!questionnaire || !isCompleted) {
    navigate("/cuestionario");
    return null;
  }

  const longevityPoints = questionnaire.longevityPoints || "0";
  const healthStatus = questionnaire.healthStatus || "";

  const getStatusColor = (points: string) => {
    const numPoints = parseInt(points) / 2; // Convert back to base points
    if (numPoints >= 40) return "text-green-600 dark:text-green-400";
    if (numPoints >= 30) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getStatusBgColor = (points: string) => {
    const numPoints = parseInt(points) / 2;
    if (numPoints >= 40) return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
    if (numPoints >= 30) return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
    return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" data-testid="icon-success" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ¡Cuestionario completado!
            </h1>
            <p className="text-lg text-muted-foreground">
              Has concluido exitosamente tu evaluación de salud
            </p>
          </div>
        </div>

        {/* Results Card */}
        <Card className={`border-2 ${getStatusBgColor(longevityPoints)}`}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Tus resultados</CardTitle>
            <CardDescription>
              Basado en tus respuestas, aquí está tu perfil de longevidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Longevity Points */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className={`h-8 w-8 ${getStatusColor(longevityPoints)}`} />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Puntos de Longevidad
                </h2>
              </div>
              <div className={`text-6xl font-bold ${getStatusColor(longevityPoints)}`} data-testid="text-final-points">
                {longevityPoints}
              </div>
              <p className="text-sm text-muted-foreground">de 100 puntos posibles</p>
            </div>

            {/* Health Status Legend */}
            {healthStatus && (
              <div className="pt-4 border-t">
                <div className="bg-background/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
                    Estado de Salud
                  </p>
                  <p className={`text-center text-base font-medium capitalize ${getStatusColor(longevityPoints)}`} data-testid="text-final-health-status">
                    {healthStatus}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivational Call to Action */}
        <Card className="bg-primary border-0 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-white text-center whitespace-nowrap">
              ¡Da el siguiente paso y únete a la comunidad de Evity para aumentar tus puntos de longevidad!
            </p>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Schedule Appointment */}
          <Card className="hover-elevate cursor-pointer" onClick={() => navigate("/agendar-cita")} data-testid="card-schedule">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Agendar Cita</CardTitle>
                  <CardDescription className="text-sm">
                    Consulta con un médico
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" data-testid="button-schedule">
                Agendar ahora
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* View Profile */}
          <Card className="hover-elevate cursor-pointer" onClick={() => navigate("/perfil")} data-testid="card-profile">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Ver mi Perfil</CardTitle>
                  <CardDescription className="text-sm">
                    Gestiona tus documentos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" data-testid="button-profile">
                Ir al perfil
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Estos resultados están disponibles en tu perfil. Puedes compartirlos con tu médico durante la consulta para obtener recomendaciones personalizadas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
