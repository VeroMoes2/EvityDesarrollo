import { useConfluenceData } from "@/hooks/useConfluenceData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Dna, Shield, Microscope, Activity } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          {data?.companyName || 'Evity'}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          {data?.mission || 'Transformamos la forma en que las personas envejecen, proporcionando herramientas científicas y personalizadas para vivir vidas más largas, saludables y plenas.'}
        </p>
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          onClick={() => window.location.href = '/api/login'}
          data-testid="button-login"
        >
          Acceder a mi Perfil
        </Button>
        <p className="mt-4 text-sm text-gray-500">
          Inicia sesión para cargar tus estudios y laboratorios
        </p>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          ¿Por qué elegir Evity?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate border-gray-200" data-testid={`card-feature-${index}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Visión</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto" data-testid="text-vision">
            {data?.vision || 'Ser la plataforma líder mundial en longevidad, democratizando el acceso a los últimos avances científicos para que cada persona pueda alcanzar su máximo potencial de salud y bienestar.'}
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Comienza tu Viaje hacia la Longevidad
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Accede a tu perfil personal y carga tus estudios médicos para recibir análisis personalizados
        </p>
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          onClick={() => window.location.href = '/api/login'}
          data-testid="button-login-cta"
        >
          Iniciar Sesión
        </Button>
      </section>
    </div>
  );
}