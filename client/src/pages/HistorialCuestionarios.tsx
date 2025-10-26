import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuestionnaireResult } from "@shared/schema";
import { 
  ArrowLeft, 
  Calendar,
  TrendingUp,
  History,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

export default function HistorialCuestionarios() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ["/api/questionnaire-results/history"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Acceso restringido</CardTitle>
            <CardDescription>
              Debes iniciar sesión para ver tu historial de cuestionarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")} className="w-full" data-testid="button-login">
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-400">Cargando historial...</p>
        </div>
      </div>
    );
  }

  const results = (historyData && typeof historyData === 'object' && 'results' in historyData ? historyData.results : []) as QuestionnaireResult[];

  const getHealthStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes("excelente")) return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700";
    if (normalizedStatus.includes("bueno") || normalizedStatus.includes("buena")) return "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700";
    if (normalizedStatus.includes("regular")) return "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
    if (normalizedStatus.includes("atención")) return "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Historial de Cuestionarios</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/perfil")}
            data-testid="button-back-profile"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al perfil
          </Button>
        </div>

        {results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <h3 className="text-lg font-semibold mb-2">No hay cuestionarios completados</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Completa tu primer cuestionario para comenzar a rastrear tu progreso de longevidad.
              </p>
              <Button onClick={() => navigate("/cuestionario")} data-testid="button-start-first">
                Comenzar cuestionario
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Total de evaluaciones completadas</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sigue completando cuestionarios para rastrear tu progreso
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-primary">{results.length}</div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {results.map((result, index) => {
                const completedDate = new Date(result.completedAt);
                const isExpanded = expandedId === result.id;
                const answers = result.answers as Record<string, any>;
                
                return (
                  <Card key={result.id} data-testid={`questionnaire-history-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">
                              Cuestionario #{results.length - index}
                            </CardTitle>
                            {index === 0 && (
                              <Badge variant="default" className="text-xs">
                                Más reciente
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Completado el {completedDate.toLocaleDateString('es-MX', { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {result.longevityPoints}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs capitalize ${getHealthStatusColor(result.healthStatus)}`}
                          >
                            {result.healthStatus}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setExpandedId(isExpanded ? null : result.id)}
                        data-testid={`button-toggle-details-${index}`}
                      >
                        {isExpanded ? "Ocultar detalles" : "Ver detalles"}
                        <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </Button>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Respuestas del cuestionario:</h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {Object.entries(answers).map(([key, value]) => {
                              let displayValue = value as string;
                              if (key.endsWith('_weight') || key.endsWith('_height')) {
                                return null;
                              }
                              
                              // Check if this is question 7 (weight/height)
                              if (key === "7") {
                                const weight = answers["7_weight"];
                                const height = answers["7_height"];
                                displayValue = weight && height ? `Peso: ${weight} kg, Estatura: ${height} cm` : "No respondida";
                              }
                              
                              return (
                                <div key={key} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Pregunta {key}:</span>{" "}
                                  <span className="text-gray-600 dark:text-gray-400">{displayValue}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
