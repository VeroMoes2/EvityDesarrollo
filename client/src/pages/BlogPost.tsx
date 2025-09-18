import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const [, setLocation] = useLocation();
  
  const postTitle = params?.slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Post";
  
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
              {postTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Este artículo sobre longevidad y bienestar está en desarrollo. 
              En esta sección se mostraría el contenido completo del artículo 
              extraído de la base de conocimiento de Evity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}