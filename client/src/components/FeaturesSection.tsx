import { Card, CardContent } from "@/components/ui/card";
import { Brain, Heart, Activity, Shield, Users, Lightbulb } from "lucide-react";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLanguage } from "@/contexts/LanguageContext";


export default function FeaturesSection() {
  const { data: confluenceData, isLoading, error } = useConfluenceData();
  const { t } = useLanguage();
  
  const companyName = confluenceData?.companyName || "Evity";
  
  const features = [
    {
      icon: Brain,
      title: t('features.cognitiveHealth'),
      description: t('features.cognitiveDesc')
    },
    {
      icon: Heart,
      title: t('features.cardiovascularHealth'),
      description: t('features.cardiovascularDesc')
    },
    {
      icon: Activity,
      title: t('features.metabolicOptimization'),
      description: t('features.metabolicDesc')
    },
    {
      icon: Shield,
      title: t('features.advancedPrevention'),
      description: t('features.preventionDesc')
    },
    {
      icon: Users,
      title: t('features.activeCommunity'),
      description: t('features.communityDesc')
    },
    {
      icon: Lightbulb,
      title: t('features.continuousResearch'),
      description: t('features.researchDesc')
    }
  ];
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('features.title')} {companyName}?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="hover-elevate border-card-border bg-card transition-all duration-300"
              data-testid={`feature-card-${index}`}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}