import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Video, FileText } from "lucide-react";
import yogaImage from "@assets/generated_images/Seniors_yoga_outdoors_983aaba4.png";
import dietImage from "@assets/generated_images/Healthy_diet_spread_92eea712.png";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResourcesSection() {
  const { data: confluenceData, isLoading, error } = useConfluenceData();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  const resources = [
    {
      type: t('blog.guide'),
      icon: BookOpen,
      title: "Los 7 Pilares de la Longevidad",
      description: "Una guía completa sobre los fundamentos científicos para vivir más años con calidad de vida.",
      image: yogaImage,
      readTime: "15 min",
      category: t('blog.fundamentals')
    },
    {
      type: t('blog.video'),
      icon: Video,
      title: "Nutrición para la Longevidad",
      description: "Descubre qué alimentos y patrones dietéticos han demostrado extender la vida saludable.",
      image: dietImage,
      readTime: "12 min",
      category: t('blog.nutrition')
    },
    {
      type: t('blog.article'),
      icon: FileText,
      title: "Ejercicio Anti-Envejecimiento",
      description: "Los tipos de ejercicio más efectivos para mantener la vitalidad y prevenir el envejecimiento.",
      image: yogaImage,
      readTime: "8 min",
      category: t('blog.exercise')
    }
  ];
  
  const handleResourceClick = (resourceTitle: string) => {
    const slug = resourceTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    setLocation(`/recurso/${slug}`);
  };

  const companyName = confluenceData?.companyName || "Evity";

  return (
    <section id="blog" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('blog.title')} {companyName}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {confluenceData?.mission || t('blog.defaultMission')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <Card 
              key={index} 
              className="overflow-hidden cursor-pointer transition-all duration-300"
              onClick={() => handleResourceClick(resource.title)}
              data-testid={`resource-card-${index}`}
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={resource.image} 
                  alt={resource.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                    <resource.icon className="w-3 h-3 mr-1" />
                    {resource.type}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-black/50 text-white text-xs">
                    {resource.readTime}
                  </span>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">{resource.category}</span>
                </div>
                <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {resource.description}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid={`button-read-more-${index}`}
                >
                  Leer más
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => setLocation("/recursos")}
            data-testid="button-view-all-resources"
          >
            Ver Todos los Recursos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          {isLoading && (
            <div className="mt-6">
              <div className="inline-flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-900/20 rounded-full border border-gray-200 dark:border-gray-800">
                <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                  Sincronizando con Confluence...
                </span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-6">
              <div className="inline-flex items-center px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-full border border-orange-200 dark:border-orange-800">
                <span className="text-orange-800 dark:text-orange-200 text-sm font-medium">
                  Contenido estático (sin conexión a Confluence)
                </span>
              </div>
            </div>
          )}
          
          {confluenceData && !error && (
            <div className="mt-6">
              <div className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                <span className="text-green-800 dark:text-green-200 text-sm font-medium">
                  Contenido especializado en longevidad
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}