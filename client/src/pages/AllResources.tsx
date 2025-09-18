import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AllResources() {
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