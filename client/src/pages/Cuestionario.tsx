import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Calculator
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestionOption {
  text: string;
  points: number;
}

interface Question {
  id: string;
  section: string;
  question: string;
  type: "select" | "weight-height";
  options?: QuestionOption[];
  required: boolean;
}

const QUESTIONS: Question[] = [
  // Sección: Actividad física y sedentarismo
  {
    id: "1",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántos días por semana realiza actividad física moderada o vigorosa (correr, nadar, caminar rápido, baile)?",
    type: "select",
    options: [
      { text: "5-7 días/semana", points: 5 },
      { text: "3-4 días/semana", points: 3 },
      { text: "1-2 días/semana", points: 0 },
      { text: "<1 día/semana", points: -3 },
      { text: "Nada o totalmente sedentario", points: -5 },
    ],
    required: true,
  },
  {
    id: "2",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántos minutos dedica en promedio a cada sesión?",
    type: "select",
    options: [
      { text: "≥ 60 min/sesión", points: 5 },
      { text: "30–59 min/sesión", points: 3 },
      { text: "15–29 min/sesión", points: 0 },
      { text: "< 15 min/sesión", points: -3 },
      { text: "Sin sesiones estructuradas", points: -5 },
    ],
    required: true,
  },
  {
    id: "3",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántas horas al día pasa sentado/a o inactivo/a?",
    type: "select",
    options: [
      { text: "< 4 horas/día", points: 5 },
      { text: "4–6 horas/día", points: 3 },
      { text: "6–8 horas/día", points: 0 },
      { text: "> 8 horas/día sin pausas activas", points: -3 },
      { text: "> 10 horas/día sedentario", points: -5 },
    ],
    required: true,
  },
  // Sección: Dieta y nutrición
  {
    id: "4",
    section: "Dieta y nutrición",
    question: "¿Cuántas porciones de frutas y verduras consume al día?",
    type: "select",
    options: [
      { text: "≥ 5 porciones al día", points: 5 },
      { text: "3–4 porciones al día", points: 3 },
      { text: "2 porciones al día", points: 0 },
      { text: "1 porción al día", points: -3 },
      { text: "Rara vez o nunca come frutas/verduras", points: -5 },
    ],
    required: true,
  },
  {
    id: "5",
    section: "Dieta y nutrición",
    question: "¿Con qué frecuencia come alimentos ultraprocesados o bebe refrescos/azucaradas?",
    type: "select",
    options: [
      { text: "Casi nunca o < 1 vez por semana", points: 5 },
      { text: "1-2 veces por semana", points: 3 },
      { text: "3-4 veces por semana", points: 0 },
      { text: "≥ 1 vez al día", points: -3 },
      { text: "Varias veces al día (refrescos o comida rápida frecuente)", points: -5 },
    ],
    required: true,
  },
  {
    id: "6",
    section: "Dieta y nutrición",
    question: "¿Qué tipo de grasa utiliza habitualmente para cocinar (aceite de oliva, vegetal, mantequilla, manteca)?",
    type: "select",
    options: [
      { text: "Aceite de oliva extra virgen o aguacate como grasa principal", points: 5 },
      { text: "Aceites vegetales no refinados (canola, maíz, girasol) sin manteca o margarina", points: 3 },
      { text: "Mezcla entre aceites vegetales y mantequilla", points: 0 },
      { text: "Mantequilla, margarina o crema diariamente", points: -3 },
      { text: "Manteca o grasas animales como grasa principal", points: -5 },
    ],
    required: true,
  },
  // Sección: Peso e índice de masa corporal
  {
    id: "7",
    section: "Peso e índice de masa corporal",
    question: "¿Cuál es su peso y estatura actual?",
    type: "weight-height",
    required: true,
  },
  {
    id: "8",
    section: "Peso e índice de masa corporal",
    question: "¿Ha tenido cambios significativos de peso en el último año?",
    type: "select",
    options: [
      { text: "No, peso estable (±2 kg)", points: 5 },
      { text: "Cambio leve (±3–5 kg)", points: 3 },
      { text: "Cambio moderado (±6–10 kg)", points: 0 },
      { text: "Cambio importante (>10 kg)", points: -3 },
      { text: "Fluctuaciones recurrentes o pérdida no intencionada", points: -5 },
    ],
    required: true,
  },
];

function calculateBMI(weight: number, height: number): number {
  // height in meters, weight in kg
  return weight / (height * height);
}

function getBMIPoints(bmi: number): number {
  if (bmi >= 18.5 && bmi <= 24.9) return 5;
  if (bmi >= 25 && bmi <= 26.9) return 3;
  if (bmi >= 27 && bmi <= 29.9) return 0;
  if (bmi >= 30 && bmi <= 34.9) return -3;
  return -5; // BMI >= 35
}

function calculateLongevityPoints(totalPoints: number): number {
  // Según el documento:
  // 10-15 puntos finales → 100 puntos de longevidad
  // 5-10 puntos finales → 80 puntos de longevidad
  // 0-5 puntos finales → 50 puntos de longevidad
  
  if (totalPoints >= 10 && totalPoints <= 15) return 100;
  if (totalPoints >= 5 && totalPoints < 10) return 80;
  if (totalPoints >= 0 && totalPoints < 5) return 50;
  
  // Para valores fuera de rango
  if (totalPoints > 15) return 100; // Mejor puntuación posible
  return 50; // Para puntos negativos, dar la puntuación mínima
}

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
    mutationFn: async (data: { answers: Record<string, any>; currentQuestion: string; isCompleted?: string; longevityPoints?: string }) => {
      return await apiRequest("POST", "/api/questionnaire", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire"] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { answers: Record<string, any>; currentQuestion: string; isCompleted?: string; longevityPoints?: string }) => {
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
    
    // Validar respuesta requerida
    if (currentQuestion.required) {
      if (currentQuestion.type === "weight-height") {
        const weight = answers[`${currentQuestion.id}_weight`];
        const height = answers[`${currentQuestion.id}_height`];
        if (!weight || !height || weight.trim() === "" || height.trim() === "") {
          toast({
            title: "Campo requerido",
            description: "Por favor ingresa tu peso y estatura.",
            variant: "destructive",
          });
          return;
        }
      } else {
        const currentAnswer = answers[currentQuestion.id];
        if (!currentAnswer || currentAnswer.trim() === "") {
          toast({
            title: "Campo requerido",
            description: "Por favor responde esta pregunta antes de continuar.",
            variant: "destructive",
          });
          return;
        }
      }
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

  const calculateTotalPoints = (): { totalPoints: number; longevityPoints: number } => {
    let totalPoints = 0;
    let questionCount = 0;

    // Sección 1: Actividad física (preguntas 1-3)
    let section1Points = 0;
    let section1Count = 0;
    for (let i = 1; i <= 3; i++) {
      const answer = answers[i.toString()];
      if (answer) {
        const question = QUESTIONS.find(q => q.id === i.toString());
        const option = question?.options?.find(opt => opt.text === answer);
        if (option) {
          section1Points += option.points;
          section1Count++;
        }
      }
    }
    if (section1Count > 0) {
      totalPoints += section1Points / section1Count;
    }

    // Sección 2: Dieta y nutrición (preguntas 4-6)
    let section2Points = 0;
    let section2Count = 0;
    for (let i = 4; i <= 6; i++) {
      const answer = answers[i.toString()];
      if (answer) {
        const question = QUESTIONS.find(q => q.id === i.toString());
        const option = question?.options?.find(opt => opt.text === answer);
        if (option) {
          section2Points += option.points;
          section2Count++;
        }
      }
    }
    if (section2Count > 0) {
      totalPoints += section2Points / section2Count;
    }

    // Sección 3: Peso e IMC (preguntas 7-8)
    let section3Points = 0;
    let section3Count = 0;
    
    // Pregunta 7: Calcular IMC
    const weight = parseFloat(answers["7_weight"]);
    const height = parseFloat(answers["7_height"]) / 100; // convertir cm a metros
    if (!isNaN(weight) && !isNaN(height) && height > 0) {
      const bmi = calculateBMI(weight, height);
      const bmiPoints = getBMIPoints(bmi);
      section3Points += bmiPoints;
      section3Count++;
    }
    
    // Pregunta 8: Cambios de peso
    const answer8 = answers["8"];
    if (answer8) {
      const question = QUESTIONS.find(q => q.id === "8");
      const option = question?.options?.find(opt => opt.text === answer8);
      if (option) {
        section3Points += option.points;
        section3Count++;
      }
    }
    
    if (section3Count > 0) {
      totalPoints += section3Points / section3Count;
    }

    const longevityPoints = calculateLongevityPoints(totalPoints);
    
    return { totalPoints, longevityPoints };
  };

  const handleComplete = async () => {
    // Validar todas las preguntas requeridas
    for (const question of QUESTIONS) {
      if (question.required) {
        if (question.type === "weight-height") {
          const weight = answers[`${question.id}_weight`];
          const height = answers[`${question.id}_height`];
          if (!weight || !height || weight.trim() === "" || height.trim() === "") {
            toast({
              title: "Cuestionario incompleto",
              description: `Por favor completa la pregunta ${question.id}: ${question.question}`,
              variant: "destructive",
            });
            return;
          }
        } else {
          const answer = answers[question.id];
          if (!answer || answer.trim() === "") {
            toast({
              title: "Cuestionario incompleto",
              description: `Por favor completa la pregunta ${question.id}: ${question.question}`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    setIsSaving(true);
    try {
      const { totalPoints, longevityPoints } = calculateTotalPoints();
      
      const data = {
        answers,
        currentQuestion: QUESTIONS[QUESTIONS.length - 1].id,
        isCompleted: "true",
        longevityPoints: longevityPoints.toString(),
      };

      if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
        await updateProgressMutation.mutateAsync(data);
      } else {
        await saveProgressMutation.mutateAsync(data);
      }

      toast({
        title: "¡Cuestionario completado!",
        description: `Tus puntos de longevidad: ${longevityPoints}`,
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
    if (currentQuestion.type === "weight-height") {
      const weight = answers[`${currentQuestion.id}_weight`] || "";
      const height = answers[`${currentQuestion.id}_height`] || "";
      
      // Calcular IMC si ambos campos tienen valores
      let bmiDisplay = null;
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);
      if (!isNaN(weightNum) && !isNaN(heightNum) && heightNum > 0) {
        const bmi = calculateBMI(weightNum, heightNum / 100);
        bmiDisplay = (
          <div className="mt-4 p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Tu IMC: <span className="text-primary font-bold">{bmi.toFixed(1)}</span>
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                data-testid={`input-question-${currentQuestion.id}-weight`}
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setAnswers({ ...answers, [`${currentQuestion.id}_weight`]: e.target.value })}
                placeholder="70.5"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Estatura (cm)</Label>
              <Input
                id="height"
                data-testid={`input-question-${currentQuestion.id}-height`}
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setAnswers({ ...answers, [`${currentQuestion.id}_height`]: e.target.value })}
                placeholder="170"
                className="text-base"
              />
            </div>
          </div>
          {bmiDisplay}
        </div>
      );
    }
    
    if (currentQuestion.type === "select") {
      const value = answers[currentQuestion.id] || "";
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
              <SelectItem key={option.text} value={option.text}>
                {option.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Longevidad</h1>
              <p className="text-muted-foreground">Conócete mejor</p>
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
