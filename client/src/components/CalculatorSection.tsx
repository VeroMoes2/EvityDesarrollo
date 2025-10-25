import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Calculator, TrendingUp, Heart, MessageCircle, Sparkles, History, Calendar as CalendarIcon } from "lucide-react";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CalculationHistory {
  date: string;
  score: number;
  interpretation: string;
}

export default function CalculatorSection() {
  const { data: confluenceData, isLoading, error } = useConfluenceData();
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    exercise: "",
    diet: "",
    weight: "",
    height: "",
    smokingDrinking: "",
    sleepWellbeing: ""
  });
  const [result, setResult] = useState<{ score: number; interpretation: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([]);
  
  const companyName = confluenceData?.companyName || "Evity";

  // Load calculation history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('longevityCalculationHistory');
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory) as CalculationHistory[];
        setCalculationHistory(history);
      } catch (error) {
        console.error('Error loading calculation history:', error);
      }
    }
  }, []);

  // Save calculation to history
  const saveToHistory = (score: number, interpretation: string) => {
    const newCalculation: CalculationHistory = {
      date: new Date().toISOString(),
      score,
      interpretation,
    };
    
    const updatedHistory = [newCalculation, ...calculationHistory].slice(0, 10); // Keep only last 10
    setCalculationHistory(updatedHistory);
    localStorage.setItem('longevityCalculationHistory', JSON.stringify(updatedHistory));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getBMIPoints = (bmi: number): number => {
    if (bmi >= 18.5 && bmi <= 24.9) return 5;
    if (bmi >= 25 && bmi <= 26.9) return 4;
    if (bmi >= 27 && bmi <= 29.9) return 3;
    if (bmi >= 30 && bmi <= 34.9) return 2;
    return 1; // BMI >= 35
  };

  const getInterpretation = (score: number): string => {
    if (score >= 84 && score <= 100) {
      return "Estilo de vida óptimo: actividad física frecuente, dieta rica en alimentos frescos, peso saludable, sin tabaco ni alcohol excesivo, sueño reparador y estabilidad emocional.";
    } else if (score >= 64 && score <= 83) {
      return "Buen control de los pilares básicos, aunque con áreas por optimizar (p. ej. dieta o sueño). Mantiene hábitos protectores pero con riesgo metabólico leve.";
    } else if (score >= 44 && score <= 63) {
      return "Conductas mixtas: ejercicio ocasional, dieta inconsistente o sobrepeso leve. Muestra factores de riesgo compensados parcialmente.";
    } else if (score >= 24 && score <= 43) {
      return "Estilo de vida predominantemente sedentario o dieta poco saludable. Posible sobrepeso, consumo frecuente de alcohol o alteración del sueño.";
    } else {
      return "Acumulación de múltiples factores de riesgo (obesidad, tabaco, sedentarismo, dieta procesada, insomnio o depresión). Perfil biológico asociado a envejecimiento acelerado.";
    }
  };

  const calculateLongevityScore = () => {
    let totalScore = 0;

    // Question 1: Exercise (5 options)
    const exerciseScores: Record<string, number> = {
      "5-7": 5,
      "3-4": 4,
      "1-2": 3,
      "<1": 2,
      "none": 1
    };
    totalScore += exerciseScores[formData.exercise] || 0;

    // Question 2: Diet (5 options)
    const dietScores: Record<string, number> = {
      "excellent": 5,
      "good": 4,
      "mixed": 3,
      "poor": 2,
      "very-poor": 1
    };
    totalScore += dietScores[formData.diet] || 0;

    // Question 3: BMI from weight and height
    if (formData.weight && formData.height) {
      const weight = parseFloat(formData.weight);
      const height = parseFloat(formData.height);
      if (!isNaN(weight) && !isNaN(height) && weight >= 20 && weight <= 300 && height >= 100 && height <= 250) {
        const bmi = calculateBMI(weight, height);
        totalScore += getBMIPoints(bmi);
      }
    }

    // Question 4: Smoking and drinking (5 options)
    const smokingDrinkingScores: Record<string, number> = {
      "none": 5,
      "ex-smoker-low": 4,
      "ex-smoker-moderate": 3,
      "occasional": 2,
      "active": 1
    };
    totalScore += smokingDrinkingScores[formData.smokingDrinking] || 0;

    // Question 5: Sleep and wellbeing (5 options)
    const sleepScores: Record<string, number> = {
      "excellent": 5,
      "good": 4,
      "irregular": 3,
      "poor": 2,
      "very-poor": 1
    };
    totalScore += sleepScores[formData.sleepWellbeing] || 0;

    // Convert from 5-25 scale to 0-100 scale
    // Formula: ((totalScore - 5) / 20) × 100
    const finalScore = Math.round(((totalScore - 5) / 20) * 100);
    const interpretation = getInterpretation(finalScore);
    setResult({ score: finalScore, interpretation });
    setShowResult(true);
    
    // Save to history
    saveToHistory(finalScore, interpretation);
  };

  const isFormComplete = formData.exercise && formData.diet && formData.weight && formData.height && formData.smokingDrinking && formData.sleepWellbeing;

  const getScoreColor = (score: number) => {
    if (score >= 84) return "text-green-600 dark:text-green-400";
    if (score >= 64) return "text-blue-600 dark:text-blue-400";
    if (score >= 44) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 24) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 84) return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
    if (score >= 64) return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
    if (score >= 44) return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
    if (score >= 24) return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800";
    return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
  };

  return (
    <section id="calculadora" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('miniCalc.title')} - {companyName}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('miniCalc.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  {t('miniCalc.completeForm')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question 1: Exercise */}
                <div className="space-y-2">
                  <Label htmlFor="exercise">1. ¿Cuántos días por semana realiza al menos 30 minutos de actividad moderada o vigorosa?</Label>
                  <Select value={formData.exercise} onValueChange={(value) => handleInputChange("exercise", value)}>
                    <SelectTrigger data-testid="select-exercise">
                      <SelectValue placeholder={t('miniCalc.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-7">5-7 días/semana</SelectItem>
                      <SelectItem value="3-4">3-4 días/semana</SelectItem>
                      <SelectItem value="1-2">1-2 días/semana</SelectItem>
                      <SelectItem value="<1">&lt; 1 día/semana</SelectItem>
                      <SelectItem value="none">Ningún día o totalmente inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question 2: Diet */}
                <div className="space-y-2">
                  <Label htmlFor="diet">2. ¿Su dieta habitual incluye frutas, verduras, legumbres, pescado y evita ultraprocesados y bebidas azucaradas?</Label>
                  <Select value={formData.diet} onValueChange={(value) => handleInputChange("diet", value)}>
                    <SelectTrigger data-testid="select-diet">
                      <SelectValue placeholder={t('miniCalc.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Rica en frutas, verduras, legumbres y aceite de oliva; sin ultraprocesados</SelectItem>
                      <SelectItem value="good">Incluye frutas y verduras diarias, ocasionalmente alimentos procesados</SelectItem>
                      <SelectItem value="mixed">Mezcla equilibrada entre alimentos frescos y procesados</SelectItem>
                      <SelectItem value="poor">Alta en azúcar, carnes procesadas o frituras frecuentes</SelectItem>
                      <SelectItem value="very-poor">Predominantemente ultraprocesada y baja en vegetales o comida rápida frecuente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question 3: Weight and Height */}
                <div className="space-y-2">
                  <Label>3. ¿Cuál es su peso y estatura actual?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">{t('miniCalc.weight')}</Label>
                      <Input
                        id="weight"
                        type="number"
                        placeholder="70"
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        data-testid="input-weight"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">{t('miniCalc.height')}</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="170"
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        data-testid="input-height"
                      />
                    </div>
                  </div>
                </div>

                {/* Question 4: Smoking and Drinking */}
                <div className="space-y-2">
                  <Label htmlFor="smoking-drinking">4. ¿Fuma o bebe con frecuencia?</Label>
                  <Select value={formData.smokingDrinking} onValueChange={(value) => handleInputChange("smokingDrinking", value)}>
                    <SelectTrigger data-testid="select-smoking-drinking">
                      <SelectValue placeholder={t('miniCalc.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No fumo ni bebo, o ≤ 1 bebida a la semana</SelectItem>
                      <SelectItem value="ex-smoker-low">Exfumador &gt; 10 años o bajo consumo (≤ 7 bebidas/sem)</SelectItem>
                      <SelectItem value="ex-smoker-moderate">Exfumador reciente o consumo moderado (≈ 1 bebida/día)</SelectItem>
                      <SelectItem value="occasional">Fumador ocasional o &gt; 7 bebidas por semana</SelectItem>
                      <SelectItem value="active">Fumador activo o episodios de "binge drinking"</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question 5: Sleep and Wellbeing */}
                <div className="space-y-2">
                  <Label htmlFor="sleep">5. ¿Cómo describiría su sueño y su bienestar emocional general?</Label>
                  <Select value={formData.sleepWellbeing} onValueChange={(value) => handleInputChange("sleepWellbeing", value)}>
                    <SelectTrigger data-testid="select-sleep">
                      <SelectValue placeholder={t('miniCalc.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Duermo 7–8 h, ánimo estable, bajo estrés</SelectItem>
                      <SelectItem value="good">Duermo 6–7 h, estrés leve u ocasional</SelectItem>
                      <SelectItem value="irregular">Sueño irregular o ánimo variable</SelectItem>
                      <SelectItem value="poor">Duerme &lt; 6 h o estrés frecuente</SelectItem>
                      <SelectItem value="very-poor">Insomnio o ansiedad/depresión persistentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  onClick={calculateLongevityScore}
                  disabled={!isFormComplete}
                  data-testid="button-calculate"
                >
                  {t('miniCalc.calculateButton')}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('miniCalc.yourResult')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showResult && result ? (
                  <div className="space-y-6">
                    <div className={`p-6 rounded-lg border-2 ${getScoreBgColor(result.score)}`}>
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Sparkles className={`h-6 w-6 ${getScoreColor(result.score)}`} />
                          <span className="text-sm font-medium text-muted-foreground">Tu Puntuación</span>
                        </div>
                        <div className={`text-5xl font-bold ${getScoreColor(result.score)}`} data-testid="result-score">
                          {result.score}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">de 100 puntos</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        Interpretación
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid="result-interpretation">
                        {result.interpretation}
                      </p>
                    </div>

                    <div className="bg-primary p-4 rounded-lg shadow-lg">
                      <p className="text-base font-semibold text-white text-center">
                        ¡Da el siguiente paso y únete a la comunidad de Evity para aumentar tus puntos de longevidad!
                      </p>
                    </div>

                    {/* Calculation History */}
                    {calculationHistory.length > 1 && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" />
                          Historial de Cálculos
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {calculationHistory.slice(1).map((calc, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                              data-testid={`history-item-${index}`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {format(new Date(calc.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(calc.date), "h:mm a", { locale: es })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${getScoreColor(calc.score)}`}>
                                  {calc.score}
                                </div>
                                <p className="text-xs text-muted-foreground">puntos</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => navigate('/contacto')}
                        data-testid="button-contact-specialist"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contactar a un especialista
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setShowResult(false);
                          setFormData({
                            exercise: "",
                            diet: "",
                            weight: "",
                            height: "",
                            smokingDrinking: "",
                            sleepWellbeing: ""
                          });
                        }}
                        data-testid="button-reset"
                      >
                        Calcular de nuevo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t('miniCalc.emptyMessage')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="mt-12 text-center">
          {isLoading && (
            <div className="inline-flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-900/20 rounded-full border border-gray-200 dark:border-gray-800">
              <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                Configurando cálculo personalizado para {companyName}...
              </span>
            </div>
          )}
          
          {error && (
            <div className="inline-flex items-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-full border border-yellow-200 dark:border-yellow-800">
              <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                Usando algoritmo de longevidad estándar
              </span>
            </div>
          )}
          
          {confluenceData && !error && (
            <div className="inline-flex items-center px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
              <span className="text-purple-800 dark:text-purple-200 text-sm font-medium">
                {t('miniCalc.customizedBy')} {companyName}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
