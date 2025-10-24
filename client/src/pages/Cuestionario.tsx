import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardCheck, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle2,
  Pause,
  Play
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUESTIONS = [
  {
    id: "1",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántos días por semana realiza actividad física moderada o vigorosa (correr, nadar, caminar rápido, baile)?",
    type: "select",
    options: ["7 días", "6 días", "5 días", "4 días", "≤ 3 días"],
    required: true,
  },
  {
    id: "2",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántos minutos dedica en promedio a cada sesión?",
    type: "select",
    options: ["< 30 min", "40 min", "60 min", "90 min", "≥ 120 min"],
    required: true,
  },
  {
    id: "3",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántas horas al día pasa sentado/a o inactivo/a?",
    type: "select",
    options: ["< 2 horas", "2 horas", "4 horas", "6 horas", "≥ 8 horas"],
    required: true,
  },
  {
    id: "4",
    section: "Dieta y nutrición",
    question: "¿Cuántas porciones de frutas y verduras consume al día?",
    type: "select",
    options: [
      "≥ 5 porciones al día (≥ 3 de verdura y ≥ 2 de fruta)",
      "3–4 porciones al día",
      "2 porciones al día",
      "1 porción al día",
      "Rara vez o nunca come frutas/verduras"
    ],
    required: true,
  },
  {
    id: "5",
    section: "Dieta y nutrición",
    question: "¿Con qué frecuencia come alimentos ultraprocesados o bebe refrescos/azucaradas?",
    type: "select",
    options: [
      "Casi nunca o < 1 vez por semana",
      "1-2 veces por semana",
      "3-4 veces por semana",
      "≥ 1 vez al día",
      "Varias veces al día (refrescos o comida rápida frecuente)"
    ],
    required: true,
  },
  {
    id: "6",
    section: "Dieta y nutrición",
    question: "¿Qué tipo de grasa utiliza habitualmente para cocinar (aceite de oliva, vegetal, mantequilla, manteca)?",
    type: "select",
    options: [
      "Aceite de oliva extra virgen o aguacate como grasa principal",
      "Aceites vegetales (canola, maíz, girasol) sin manteca o margarina",
      "Mezcla entre aceites vegetales y mantequilla",
      "Mantequilla, margarina o crema diariamente",
      "Manteca o grasas animales como grasa principal"
    ],
    required: true,
  },
  {
    id: "7",
    section: "Peso e índice de masa corporal",
    question: "¿Cuál es su peso y estatura actual?",
    type: "text",
    required: true,
  },
  {
    id: "8",
    section: "Peso e índice de masa corporal",
    question: "¿Ha tenido cambios significativos de peso en el último año?",
    type: "select",
    options: [
      "No, peso estable",
      "Cambio leve (± 3-5 kg)",
      "Cambio moderado (± 6-10 kg)",
      "Fluctuaciones recurrentes o pérdida no intencionada"
    ],
    required: true,
  },
  {
    id: "9",
    section: "Tabaquismo",
    question: "¿Ha fumado alguna vez (cigarrillos, vapeo u otros)?",
    type: "select",
    options: ["Sí", "No"],
    required: true,
  },
  {
    id: "10",
    section: "Tabaquismo",
    question: "Si sí, ¿cuántos cigarrillos por día y durante cuántos años?",
    type: "text",
    required: false,
  },
  {
    id: "11",
    section: "Tabaquismo",
    question: "¿Hace cuánto tiempo dejó de fumar (si aplica)?",
    type: "select",
    options: [
      "Hace > 10 años",
      "Hace 5-10 años",
      "Hace < 5 años",
      "No he dejado de fumar"
    ],
    required: false,
  },
  {
    id: "12",
    section: "Alcohol",
    question: "¿Cuántas bebidas alcohólicas consume por semana?",
    type: "select",
    options: [
      "Ninguna o ≤1 bebida",
      "2–4 bebidas",
      "5–7 bebidas",
      "8–14 bebidas",
      "≥15 bebidas"
    ],
    required: true,
  },
  {
    id: "13",
    section: "Alcohol",
    question: "¿Suele tomar más de 4 bebidas en una ocasión?",
    type: "select",
    options: [
      "Nunca",
      "Muy rara vez (1-2 veces/año)",
      "Ocasional (mensual)",
      "Frecuente (semanal)",
      "Muy frecuente (varias veces/semana)"
    ],
    required: true,
  },
  {
    id: "14",
    section: "Alcohol",
    question: "¿Tiene días sin alcohol cada semana?",
    type: "select",
    options: ["Sí", "No"],
    required: true,
  },
  {
    id: "15",
    section: "Alcohol",
    question: "Si sí, ¿cuántos días?",
    type: "select",
    options: ["6-7 días", "4-5 días", "2-3 días", "1 día"],
    required: false,
  },
  {
    id: "16",
    section: "Sueño y descanso",
    question: "¿Cuántas horas duerme por noche en promedio?",
    type: "select",
    options: ["> 9 horas", "7-8 horas", "6-7 horas", "< 6 horas", "Muy irregular"],
    required: true,
  },
  {
    id: "17",
    section: "Sueño y descanso",
    question: "¿Tiene dificultad para conciliar o mantener el sueño?",
    type: "select",
    options: [
      "Nunca",
      "Ocasionalmente",
      "Algunas veces/semana",
      "Casi todas las noches",
      "Insomnio diagnosticado"
    ],
    required: true,
  },
  {
    id: "18",
    section: "Sueño y descanso",
    question: "¿Siente cansancio o somnolencia durante el día?",
    type: "select",
    options: [
      "Nunca",
      "Rara vez",
      "Ocasionalmente",
      "Frecuente",
      "Somnolencia diaria o apnea diagnosticada"
    ],
    required: true,
  },
  {
    id: "19",
    section: "Salud mental",
    question: "En las últimas dos semanas, ¿con qué frecuencia se ha sentido triste o sin interés en las cosas?",
    type: "select",
    options: [
      "Nunca",
      "Varios días",
      "Más de la mitad de los días",
      "Casi todos los días",
      "Todos los días"
    ],
    required: true,
  },
  {
    id: "20",
    section: "Salud mental",
    question: "¿Ha sentido ansiedad o preocupación constante que interfiere en su vida diaria?",
    type: "select",
    options: [
      "Nunca",
      "Rara vez",
      "Ocasional",
      "Frecuente",
      "Ansiedad diagnosticada"
    ],
    required: true,
  },
  {
    id: "21",
    section: "Salud mental",
    question: "¿Ha tenido pensamientos negativos o autocríticos recurrentes?",
    type: "select",
    options: ["Nunca", "Rara vez", "Ocasional", "Frecuente"],
    required: true,
  },
  {
    id: "22",
    section: "Enfermedades crónicas",
    question: "¿Le han diagnosticado diabetes, hipertensión, cardiopatía, cáncer, renal o pulmonar? Marque todas las que apliquen",
    type: "select",
    options: [
      "Ninguna",
      "Diabetes",
      "Hipertensión",
      "Enfermedad del corazón",
      "Cáncer",
      "Enfermedad de los riñones",
      "Enfermedad pulmonar"
    ],
    required: true,
  },
  {
    id: "23",
    section: "Enfermedades crónicas",
    question: "¿Toma medicamentos de forma continua?",
    type: "select",
    options: [
      "Ninguno",
      "1 medicamento preventivo",
      "2-3 medicamentos",
      "≥ 4 medicamentos"
    ],
    required: true,
  },
  {
    id: "24",
    section: "Enfermedades crónicas",
    question: "¿Sus enfermedades afectan su capacidad para mantener actividad física o vida diaria?",
    type: "select",
    options: [
      "No",
      "Leve impacto",
      "Limitación moderada",
      "Limitación frecuente",
      "Dependencia o incapacidad"
    ],
    required: true,
  },
  {
    id: "25",
    section: "Apoyo social y propósito",
    question: "¿Con qué frecuencia convive con amigos o familiares?",
    type: "select",
    options: [
      "≥ 3 veces/semana",
      "1-2 veces/semana",
      "2-3 veces/mes",
      "≤ 1 vez/mes",
      "Casi nunca"
    ],
    required: true,
  },
  {
    id: "26",
    section: "Apoyo social y propósito",
    question: "¿Participa en actividades sociales, religiosas o de voluntariado?",
    type: "select",
    options: [
      "Nunca",
      "Rara vez",
      "Esporádicamente",
      "Ocasionalmente",
      "Frecuentemente"
    ],
    required: true,
  },
  {
    id: "27",
    section: "Apoyo social y propósito",
    question: "¿Siente que su vida tiene propósito y metas significativas?",
    type: "select",
    options: ["Nunca", "Rara vez", "A veces", "Casi siempre", "Siempre"],
    required: true,
  },
  {
    id: "28",
    section: "Cognición y funcionalidad",
    question: "¿Ha notado olvidos frecuentes o lentitud mental reciente?",
    type: "select",
    options: ["Nunca", "Ocasional", "A veces", "Frecuente"],
    required: true,
  },
  {
    id: "29",
    section: "Cognición y funcionalidad",
    question: "¿Puede realizar sus actividades diarias (su higiene, comidas, finanzas) sin ayuda?",
    type: "select",
    options: [
      "Necesito ayuda siempre",
      "Necesito ayuda parcial",
      "Necesito apoyos leves ocasionales",
      "Soy completamente independiente"
    ],
    required: true,
  },
  {
    id: "30",
    section: "Cognición y funcionalidad",
    question: "¿Se orienta bien en lugares conocidos y mantiene una buena comunicación?",
    type: "select",
    options: [
      "Siempre",
      "Desorientación ocasional",
      "A veces pierdo el hilo de la conversación",
      "Frecuentemente me confundo o estoy lenta",
      "Desorientación o dificultad marcada"
    ],
    required: true,
  },
];

export default function Cuestionario() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: questionnaireData, isLoading: isLoadingQuestionnaire } = useQuery({
    queryKey: ["/api/questionnaire"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists && 'questionnaire' in questionnaireData && questionnaireData.questionnaire) {
      const savedAnswers = (questionnaireData.questionnaire as any).answers || {};
      setAnswers(savedAnswers);
      
      const savedQuestion = (questionnaireData.questionnaire as any).currentQuestion;
      if (savedQuestion) {
        const questionIndex = QUESTIONS.findIndex(q => q.id === savedQuestion);
        if (questionIndex !== -1) {
          setCurrentQuestionIndex(questionIndex);
        }
      }
    }
  }, [questionnaireData]);

  const saveProgressMutation = useMutation({
    mutationFn: async (data: { answers: Record<string, any>; currentQuestion: string; isCompleted?: string }) => {
      return await apiRequest("POST", "/api/questionnaire", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire"] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { answers: Record<string, any>; currentQuestion: string; isCompleted?: string }) => {
      return await apiRequest("PUT", "/api/questionnaire", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire"] });
    },
  });

  const handleSaveProgress = async (showToast = true) => {
    setIsSaving(true);
    try {
      const currentQuestion = QUESTIONS[currentQuestionIndex];
      const data = {
        answers,
        currentQuestion: currentQuestion.id,
        isCompleted: "false",
      };

      if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
        await updateProgressMutation.mutateAsync(data);
      } else {
        await saveProgressMutation.mutateAsync(data);
      }

      if (showToast) {
        toast({
          title: "Progreso guardado",
          description: "Tus respuestas han sido guardadas correctamente.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseAndExit = async () => {
    await handleSaveProgress(false);
    toast({
      title: "Cuestionario pausado",
      description: "Puedes continuar más tarde desde donde lo dejaste.",
    });
    navigate("/perfil");
  };

  const handleNext = async () => {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];

    if (currentQuestion.required && (!currentAnswer || currentAnswer.trim() === "")) {
      toast({
        title: "Campo requerido",
        description: "Por favor responde esta pregunta antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const previousIndex = currentQuestionIndex;
      setCurrentQuestionIndex(nextIndex);
      
      setIsSaving(true);
      try {
        const nextQuestion = QUESTIONS[nextIndex];
        const data = {
          answers,
          currentQuestion: nextQuestion.id,
          isCompleted: "false",
        };

        if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
          await updateProgressMutation.mutateAsync(data);
        } else {
          await saveProgressMutation.mutateAsync(data);
        }
      } catch (error) {
        setCurrentQuestionIndex(previousIndex);
        toast({
          title: "Error",
          description: "No se pudo guardar el progreso.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const previousIndex = currentQuestionIndex;
      setCurrentQuestionIndex(prevIndex);
      
      setIsSaving(true);
      try {
        const prevQuestion = QUESTIONS[prevIndex];
        const data = {
          answers,
          currentQuestion: prevQuestion.id,
          isCompleted: "false",
        };

        if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
          await updateProgressMutation.mutateAsync(data);
        } else {
          await saveProgressMutation.mutateAsync(data);
        }
      } catch (error) {
        setCurrentQuestionIndex(previousIndex);
        toast({
          title: "Error",
          description: "No se pudo guardar el progreso.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleComplete = async () => {
    const unansweredRequired = QUESTIONS.filter(
      q => q.required && (!answers[q.id] || answers[q.id].trim() === "")
    );

    if (unansweredRequired.length > 0) {
      toast({
        title: "Cuestionario incompleto",
        description: `Faltan ${unansweredRequired.length} pregunta(s) requerida(s).`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        answers,
        currentQuestion: QUESTIONS[QUESTIONS.length - 1].id,
        isCompleted: "true",
      };

      if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
        await updateProgressMutation.mutateAsync(data);
      } else {
        await saveProgressMutation.mutateAsync(data);
      }

      toast({
        title: "¡Cuestionario completado!",
        description: "Tu historial clínico ha sido guardado exitosamente.",
      });

      navigate("/perfil");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar el cuestionario.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingQuestionnaire) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cuestionario...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  const currentSection = currentQuestion.section;

  const renderQuestionInput = () => {
    const value = answers[currentQuestion.id] || "";

    switch (currentQuestion.type) {
      case "text":
        return (
          <Input
            data-testid={`input-question-${currentQuestion.id}`}
            value={value}
            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
            placeholder="Tu respuesta..."
            className="text-base"
          />
        );
      
      case "date":
        return (
          <Input
            data-testid={`input-question-${currentQuestion.id}`}
            type="date"
            value={value}
            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
            className="text-base"
          />
        );
      
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val) => setAnswers({ ...answers, [currentQuestion.id]: val })}
          >
            <SelectTrigger data-testid={`select-question-${currentQuestion.id}`} className="text-base">
              <SelectValue placeholder="Selecciona una opción..." />
            </SelectTrigger>
            <SelectContent>
              {currentQuestion.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "textarea":
        return (
          <Textarea
            data-testid={`textarea-question-${currentQuestion.id}`}
            value={value}
            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
            placeholder="Tu respuesta..."
            rows={4}
            className="text-base resize-none"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Historial Clínico</h1>
              <p className="text-muted-foreground">Cuestionario Base</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Pregunta {currentQuestionIndex + 1} de {QUESTIONS.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% completado</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-questionnaire" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardDescription>{currentSection}</CardDescription>
                <CardTitle className="text-xl">
                  {currentQuestion.id}. {currentQuestion.question}
                  {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseAndExit}
                disabled={isSaving}
                data-testid="button-pause-questionnaire"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor={`question-${currentQuestion.id}`}>
                {currentQuestion.required ? "Respuesta requerida" : "Respuesta opcional"}
              </Label>
              {renderQuestionInput()}
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || isSaving}
                data-testid="button-previous-question"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleSaveProgress(true)}
                disabled={isSaving}
                data-testid="button-save-progress"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>

              {currentQuestionIndex < QUESTIONS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isSaving}
                  data-testid="button-next-question"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isSaving}
                  data-testid="button-complete-questionnaire"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Puedes pausar el cuestionario en cualquier momento y continuar más tarde.
          </p>
        </div>
      </div>
    </div>
  );
}
