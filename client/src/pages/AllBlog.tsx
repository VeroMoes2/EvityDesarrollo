import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AllBlog() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back-home"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>
        
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