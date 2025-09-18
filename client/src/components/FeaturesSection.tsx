import { Card, CardContent } from "@/components/ui/card";
import { Brain, Heart, Activity, Shield, Users, Lightbulb } from "lucide-react";
import { useConfluenceData } from "@/hooks/useConfluenceData";

const features = [
  {
    icon: Brain,
    title: "Salud Cognitiva",
    description: "Ejercicios y estrategias respaldadas por la ciencia para mantener tu mente aguda y prevenir el deterioro cognitivo."
  },
  {
    icon: Heart,
    title: "Salud Cardiovascular",
    description: "Protocolos personalizados para fortalecer tu corazón y sistema circulatorio, basados en tu perfil único."
  },
  {
    icon: Activity,
    title: "Optimización Metabólica",
    description: "Herramientas para mejorar tu metabolismo, aumentar la energía y mantener un peso saludable."
  },
  {
    icon: Shield,
    title: "Prevención Avanzada",
    description: "Estrategias proactivas de salud para prevenir enfermedades antes de que aparezcan."
  },
  {
    icon: Users,
    title: "Comunidad Activa",
    description: "Únete a miles de personas comprometidas con la longevidad y comparte tu viaje hacia una vida más plena."
  },
  {
    icon: Lightbulb,
    title: "Investigación Continua",
    description: "Acceso a los últimos descubrimientos en ciencia de la longevidad y medicina antienvejecimiento."
  }
];

export default function FeaturesSection() {
  const { data: confluenceData, isLoading, error } = useConfluenceData();
  
  const companyName = confluenceData?.companyName || "Evity";
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            ¿Por Qué Elegir {companyName}?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Nuestra plataforma combina ciencia de vanguardia con herramientas prácticas para ayudarte a vivir una vida más larga, saludable y plena.
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

        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-primary/10 rounded-full">
            <span className="text-primary font-medium">
              🏆 Respaldado por más de 500 estudios científicos
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}