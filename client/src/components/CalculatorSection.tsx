import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Calculator, TrendingUp, Heart, Activity, MessageCircle } from "lucide-react";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLocation } from "wouter";

export default function CalculatorSection() {
  const { data: confluenceData, isLoading, error } = useConfluenceData();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    exercise: "",
    smoking: "",
    diet: ""
  });
  const [result, setResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const companyName = confluenceData?.companyName || "Evity";

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateLifeExpectancy = () => {
    // todo: remove mock functionality - replace with real calculation
    let baseExpectancy = 80;
    
    // Age factor
    const age = parseInt(formData.age);
    if (age < 30) baseExpectancy += 2;
    else if (age > 60) baseExpectancy -= 1;
    
    // Gender factor
    if (formData.gender === "female") baseExpectancy += 3;
    
    // Exercise factor
    if (formData.exercise === "daily") baseExpectancy += 4;
    else if (formData.exercise === "weekly") baseExpectancy += 2;
    
    // Smoking factor
    if (formData.smoking === "current") baseExpectancy -= 8;
    else if (formData.smoking === "former") baseExpectancy -= 2;
    
    // Diet factor
    if (formData.diet === "mediterranean") baseExpectancy += 3;
    else if (formData.diet === "balanced") baseExpectancy += 1;
    
    setResult(Math.max(baseExpectancy, 70));
    setShowResult(true);
    console.log("Life expectancy calculated:", baseExpectancy);
  };

  const isFormComplete = formData.age && formData.gender && formData.exercise && formData.smoking && formData.diet;

  return (
    <section id="calculadora" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Calculadora {companyName}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {confluenceData?.mission || "Descubre tu expectativa de vida basada en tu estilo de vida actual y obtén recomendaciones personalizadas para mejorarla."}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Ingresa tus Datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Ej: 35"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    data-testid="input-age"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Selecciona tu género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercise">Frecuencia de Ejercicio</Label>
                  <Select value={formData.exercise} onValueChange={(value) => handleInputChange("exercise", value)}>
                    <SelectTrigger data-testid="select-exercise">
                      <SelectValue placeholder="¿Con qué frecuencia haces ejercicio?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">3-5 veces por semana</SelectItem>
                      <SelectItem value="occasionally">Ocasionalmente</SelectItem>
                      <SelectItem value="never">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smoking">Hábito de Fumar</Label>
                  <Select value={formData.smoking} onValueChange={(value) => handleInputChange("smoking", value)}>
                    <SelectTrigger data-testid="select-smoking">
                      <SelectValue placeholder="¿Fumas o has fumado?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca he fumado</SelectItem>
                      <SelectItem value="former">Ex-fumador</SelectItem>
                      <SelectItem value="current">Fumador actual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diet">Tipo de Dieta</Label>
                  <Select value={formData.diet} onValueChange={(value) => handleInputChange("diet", value)}>
                    <SelectTrigger data-testid="select-diet">
                      <SelectValue placeholder="¿Cómo describes tu dieta?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mediterranean">Mediterránea</SelectItem>
                      <SelectItem value="balanced">Balanceada</SelectItem>
                      <SelectItem value="western">Occidental típica</SelectItem>
                      <SelectItem value="poor">Poco saludable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  onClick={calculateLifeExpectancy}
                  disabled={!isFormComplete}
                  data-testid="button-calculate"
                >
                  Calcular mi Longevidad
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tus Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showResult && result ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2" data-testid="result-age">
                        {result} años
                      </div>
                      <p className="text-muted-foreground">Expectativa de vida estimada</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Salud Cardiovascular</span>
                        </div>
                        <div className="text-sm font-medium">85%</div>
                      </div>
                      <Progress value={85} className="h-2" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Nivel de Actividad</span>
                        </div>
                        <div className="text-sm font-medium">70%</div>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>

                    <div className="bg-primary/10 p-4 rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">Recomendaciones Principales:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Incrementa tu actividad física a 150 min/semana</li>
                        <li>• Adopta una dieta rica en antioxidantes</li>
                        <li>• Mejora la calidad de tu sueño</li>
                        <li>• Practica técnicas de manejo del estrés</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => console.log("Get detailed plan clicked")} // todo: remove mock functionality
                        data-testid="button-detailed-plan"
                      >
                        Obtener Plan Personalizado
                      </Button>
                      
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => navigate('/contacto')}
                        data-testid="button-contact-specialist"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contactar Especialista
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Completa el formulario para conocer tu expectativa de vida y recibir 
                      recomendaciones personalizadas.
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
                Configurando calculadora con datos de {companyName}...
              </span>
            </div>
          )}
          
          {error && (
            <div className="inline-flex items-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-full border border-yellow-200 dark:border-yellow-800">
              <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                Calculadora usando algoritmos predeterminados
              </span>
            </div>
          )}
          
          {confluenceData && !error && (
            <div className="inline-flex items-center px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
              <span className="text-purple-800 dark:text-purple-200 text-sm font-medium">
                Contenido personalizado para {companyName}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}