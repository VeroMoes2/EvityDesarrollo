import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { useNavigation } from "@/contexts/NavigationContext";
import { useEffect } from "react";

export default function AllResources() {
  const { pushState } = useNavigation();
  
  // Track current page state for navigation context
  useEffect(() => {
    pushState({
      menuSection: 'recursos'
    });
  }, [pushState]);
  
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <BackButton 
          variant="ghost" 
          className="mb-6"
          fallbackPath="/"
        >
          Volver al inicio
        </BackButton>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Recursos de Longevidad
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Guías, calculadoras y herramientas para optimizar tu longevidad
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Contenido en Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Esta sección mostraría todos los recursos de Evity organizados 
              por categorías, incluyendo guías descargables, calculadoras 
              interactivas y herramientas personalizadas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}