import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Resource() {
  const [, params] = useRoute("/recurso/:slug");
  const [, setLocation] = useLocation();
  
  const resourceTitle = params?.slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Recurso";
  
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
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              {resourceTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Este recurso sobre longevidad está en desarrollo. 
              Aquí se mostraría información detallada sobre este recurso 
              específico basado en la investigación y metodología de Evity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}