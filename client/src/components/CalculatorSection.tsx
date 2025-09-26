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
import { useLanguage } from "@/contexts/LanguageContext";

export default function CalculatorSection() {
  const { data: confluenceData, isLoading, error } = useConfluenceData();
  const [, navigate] = useLocation();
  const { t } = useLanguage();
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
            {t('calculator.title')} {companyName}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {confluenceData?.mission || t('calculator.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  {t('calculator.formTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="age">{t('calculator.age')}</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder={t('calculator.agePlaceholder')}
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    data-testid="input-age"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">{t('calculator.gender')}</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder={t('calculator.gender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('calculator.male')}</SelectItem>
                      <SelectItem value="female">{t('calculator.female')}</SelectItem>
                      <SelectItem value="other">{t('calculator.genderOther')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercise">{t('calculator.exercise')}</Label>
                  <Select value={formData.exercise} onValueChange={(value) => handleInputChange("exercise", value)}>
                    <SelectTrigger data-testid="select-exercise">
                      <SelectValue placeholder={t('calculator.exercise')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('calculator.exerciseDaily')}</SelectItem>
                      <SelectItem value="weekly">{t('calculator.exerciseWeekly')}</SelectItem>
                      <SelectItem value="occasionally">{t('calculator.exerciseOccasional')}</SelectItem>
                      <SelectItem value="never">{t('calculator.exerciseNever')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smoking">{t('calculator.smoking')}</Label>
                  <Select value={formData.smoking} onValueChange={(value) => handleInputChange("smoking", value)}>
                    <SelectTrigger data-testid="select-smoking">
                      <SelectValue placeholder={t('calculator.smoking')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">{t('calculator.smokingNever')}</SelectItem>
                      <SelectItem value="former">{t('calculator.smokingFormer')}</SelectItem>
                      <SelectItem value="current">{t('calculator.smokingCurrent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diet">{t('calculator.diet')}</Label>
                  <Select value={formData.diet} onValueChange={(value) => handleInputChange("diet", value)}>
                    <SelectTrigger data-testid="select-diet">
                      <SelectValue placeholder={t('calculator.dietPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mediterranean">{t('calculator.dietMediterranean')}</SelectItem>
                      <SelectItem value="balanced">{t('calculator.dietBalanced')}</SelectItem>
                      <SelectItem value="western">{t('calculator.dietWestern')}</SelectItem>
                      <SelectItem value="poor">{t('calculator.dietPoor')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  onClick={calculateLifeExpectancy}
                  disabled={!isFormComplete}
                  data-testid="button-calculate"
                >
                  {t('calculator.buttonText')}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('calculator.resultsTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showResult && result ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2" data-testid="result-age">
                        {result} {t('calculator.years')}
                      </div>
                      <p className="text-muted-foreground">{t('calculator.lifeExpectancy')}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm">{t('calculator.cardiovascularHealth')}</span>
                        </div>
                        <div className="text-sm font-medium">85%</div>
                      </div>
                      <Progress value={85} className="h-2" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{t('calculator.activityLevel')}</span>
                        </div>
                        <div className="text-sm font-medium">70%</div>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>

                    <div className="bg-primary/10 p-4 rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">{t('calculator.mainRecommendations')}</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• {t('calculator.recommendation1')}</li>
                        <li>• {t('calculator.recommendation2')}</li>
                        <li>• {t('calculator.recommendation3')}</li>
                        <li>• {t('calculator.recommendation4')}</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => console.log("Get detailed plan clicked")} // todo: remove mock functionality
                        data-testid="button-detailed-plan"
                      >
                        {t('calculator.getPersonalizedPlan')}
                      </Button>
                      
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => navigate('/contacto')}
                        data-testid="button-contact-specialist"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {t('calculator.contactSpecialist')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t('calculator.emptyStateMessage')}
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
                {t('calculator.configuringStatus').replace('{company}', companyName)}
              </span>
            </div>
          )}
          
          {error && (
            <div className="inline-flex items-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-full border border-yellow-200 dark:border-yellow-800">
              <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                {t('calculator.defaultAlgorithmStatus')}
              </span>
            </div>
          )}
          
          {confluenceData && !error && (
            <div className="inline-flex items-center px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
              <span className="text-purple-800 dark:text-purple-200 text-sm font-medium">
                {t('calculator.personalizedStatus').replace('{company}', companyName)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}