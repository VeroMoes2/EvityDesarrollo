import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { useNavigation } from "@/contexts/NavigationContext";
import { useEffect } from "react";

export default function AllBlog() {
  const { pushState } = useNavigation();
  
  // Track current page state for navigation context
  useEffect(() => {
    pushState({
      menuSection: 'blog'
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
            Blog de Longevidad
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Artículos, investigación y recursos sobre longevidad y bienestar
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Contenido en Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Esta sección mostraría todos los artículos del blog de Evity 
              organizados por categorías y fechas, con funcionalidad de búsqueda 
              y filtrado integrada con el contenido de Confluence.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}