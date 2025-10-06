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
    section: "Datos generales",
    question: "Nombre completo:",
    type: "text",
    required: true,
  },
  {
    id: "2",
    section: "Datos generales",
    question: "Fecha de nacimiento (edad actual):",
    type: "date",
    required: true,
  },
  {
    id: "3",
    section: "Datos generales",
    question: "Sexo / género:",
    type: "select",
    options: ["Masculino", "Femenino", "Otro", "Prefiero no decir"],
    required: true,
  },
  {
    id: "4",
    section: "Datos generales",
    question: "Ocupación y nivel de actividad física:",
    type: "textarea",
    required: true,
  },
  {
    id: "5",
    section: "Datos generales",
    question: "Estado civil / tipo de red de apoyo:",
    type: "textarea",
    required: true,
  },
  {
    id: "6",
    section: "Motivo de consulta y antecedentes",
    question: "¿Cuál es el motivo principal de tu consulta o seguimiento?",
    type: "textarea",
    required: true,
  },
  {
    id: "7",
    section: "Motivo de consulta y antecedentes",
    question: "¿Desde cuándo presentas los síntomas o situación actual?",
    type: "textarea",
    required: true,
  },
  {
    id: "8",
    section: "Motivo de consulta y antecedentes",
    question: "¿Has tenido diagnósticos médicos previos importantes? (Ej. diabetes, hipertensión, depresión, etc.)",
    type: "textarea",
    required: true,
  },
  {
    id: "9",
    section: "Motivo de consulta y antecedentes",
    question: "¿Tomas actualmente algún medicamento o suplemento? (Nombre, dosis, frecuencia)",
    type: "textarea",
    required: true,
  },
  {
    id: "10",
    section: "Motivo de consulta y antecedentes",
    question: "¿Tienes alergias conocidas? (Medicamentos, alimentos, medioambiente, etc.)",
    type: "textarea",
    required: true,
  },
  {
    id: "11",
    section: "Antecedentes personales y familiares",
    question: "¿Hay antecedentes familiares de enfermedades importantes? (Ej. cáncer, enfermedades cardíacas, mentales, metabólicas)",
    type: "textarea",
    required: true,
  },
  {
    id: "12",
    section: "Antecedentes personales y familiares",
    question: "¿Has tenido cirugías, hospitalizaciones o accidentes relevantes?",
    type: "textarea",
    required: true,
  },
  {
    id: "13",
    section: "Antecedentes personales y familiares",
    question: "¿Consumes alcohol, tabaco o alguna otra sustancia? (Frecuencia y cantidad)",
    type: "textarea",
    required: true,
  },
  {
    id: "14",
    section: "Antecedentes personales y familiares",
    question: "¿Cómo describirías tu patrón de sueño? (Horas por noche, calidad, dificultades)",
    type: "textarea",
    required: true,
  },
  {
    id: "15",
    section: "Antecedentes personales y familiares",
    question: "¿Cómo describirías tu alimentación actual? (Regularidad, tipo de alimentos, restricciones)",
    type: "textarea",
    required: true,
  },
  {
    id: "16",
    section: "Estado emocional y estilo de vida",
    question: "¿Cómo calificarías tu nivel de estrés actual? (Bajo / Medio / Alto)",
    type: "select",
    options: ["Bajo", "Medio", "Alto"],
    required: true,
  },
  {
    id: "17",
    section: "Estado emocional y estilo de vida",
    question: "¿Qué estrategias usas para manejar el estrés?",
    type: "textarea",
    required: true,
  },
  {
    id: "18",
    section: "Estado emocional y estilo de vida",
    question: "¿Cómo describirías tu estado de ánimo en las últimas semanas?",
    type: "textarea",
    required: true,
  },
  {
    id: "19",
    section: "Estado emocional y estilo de vida",
    question: "¿Cuentas con una red de apoyo emocional o social?",
    type: "textarea",
    required: true,
  },
  {
    id: "20",
    section: "Estado emocional y estilo de vida",
    question: "¿Hay algo más que consideres importante compartir sobre tu salud o bienestar actual?",
    type: "textarea",
    required: false,
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

    await handleSaveProgress(false);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = async () => {
    await handleSaveProgress(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
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
