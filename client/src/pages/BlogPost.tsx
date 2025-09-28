import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { useNavigation } from "@/contexts/NavigationContext";
import { useEffect } from "react";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const { pushState } = useNavigation();
  
  const postTitle = params?.slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Post";
  
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
          fallbackPath="/blog"
        >
          Volver
        </BackButton>
        
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