import { useConfluenceData } from "@/hooks/useConfluenceData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Dna, Shield, Microscope, Activity } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/image_1758350191302.png";
import CalculatorSection from "@/components/CalculatorSection";

export default function Landing() {
  const { data, isLoading } = useConfluenceData();

  const features = [
    {
      icon: Heart,
      title: "Salud Cardiovascular",
      description: "Análisis completo de tu sistema cardiovascular con las últimas tecnologías"
    },
    {
      icon: Brain,
      title: "Función Cognitiva",
      description: "Evaluación de memoria, concentración y rendimiento cerebral"
    },
    {
      icon: Dna,
      title: "Genética Personalizada",
      description: "Análisis genético para una medicina verdaderamente personalizada"
    },
    {
      icon: Shield,
      title: "Prevención Avanzada",
      description: "Detecta riesgos antes de que se conviertan en problemas"
    },
    {
      icon: Microscope,
      title: "Laboratorios Especializados",
      description: "Estudios de laboratorio de vanguardia para longevidad"
    },
    {
      icon: Activity,
      title: "Monitoreo Continuo",
      description: "Seguimiento personalizado de tu progreso hacia una vida más larga"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center relative" 
           style={{
             backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`
           }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`
          }}
        />
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold text-white mb-6" data-testid="text-hero-title">
            {data?.companyName || 'Evity'}
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto" data-testid="text-hero-mission">
            {data?.mission || 'Transformar la forma en que las personas envejecen, proporcionando herramientas científicas y personalizadas para vivir vidas más largas, saludables y plenas.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground px-8 py-3 text-lg"
                data-testid="button-login"
              >
                Acceder a mi Perfil
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-3 text-lg bg-white/10 border-white/30 text-white backdrop-blur-sm"
                data-testid="button-register"
              >
                Crear Cuenta
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/70">
            Inicia sesión o crea una cuenta para cargar tus estudios y laboratorios
          </p>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            ¿Por qué elegir Evity?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate bg-card" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <feature.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-xl text-card-foreground">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section - Available for all users */}
      <CalculatorSection />

      {/* Vision Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Nuestra Visión</h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto" data-testid="text-vision">
            {data?.vision || 'Ayudarte a vivir más y a vivir mejor'}
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Comienza tu Viaje hacia la Longevidad
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Accede a tu perfil personal y carga tus estudios médicos para recibir análisis personalizados
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground px-8 py-3 text-lg"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login-cta"
            >
              Iniciar Sesión
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-3 text-lg"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-register-cta"
            >
              Crear Cuenta
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}