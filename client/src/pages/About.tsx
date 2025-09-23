import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Target, Users, ArrowRight, Mail, AlertCircle } from "lucide-react";
import { useConfluenceData } from "@/hooks/useConfluenceData";


export default function About() {
  // Fetch real company information from Confluence
  const { data: companyInfo, isLoading, error } = useConfluenceData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-muted-foreground">
              Cargando información de la empresa...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error al cargar información</h3>
                <p className="text-muted-foreground">
                  No se pudo cargar la información de la empresa. Por favor, inténtalo más tarde.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">
              No hay información disponible.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4" data-testid="page-badge">
            Acerca de Nosotros
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6" data-testid="page-title">
            Conoce a {companyInfo.companyName}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed" data-testid="page-subtitle">
            {companyInfo.valueProposition}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Mission */}
          <Card className="hover-elevate" data-testid="mission-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground">
                Nuestra Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg leading-relaxed text-center" data-testid="mission-text">
                {companyInfo.mission}
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="hover-elevate" data-testid="vision-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground">
                Nuestra Visión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg leading-relaxed text-center" data-testid="vision-text">
                {companyInfo.vision}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        {companyInfo.team && companyInfo.team.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-3xl font-bold text-card-foreground" data-testid="team-title">
                  Nuestro Equipo
                </h2>
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="team-subtitle">
                Conoce a los expertos que están revolucionando el futuro de la longevidad y el bienestar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companyInfo.team.map((member: any) => (
                <Card key={member.id} className="hover-elevate" data-testid={`card-team-member-${member.id}`}>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-semibold text-card-foreground" data-testid={`text-team-name-${member.id}`}>
                      {member.name}
                    </CardTitle>
                    <CardDescription className="font-medium text-primary" data-testid={`text-team-role-${member.id}`}>
                      {member.role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`mailto:${member.email}`, '_blank')}
                        data-testid={`button-team-email-${member.id}`}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Contactar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-primary text-primary-foreground hover-elevate max-w-2xl mx-auto" data-testid="cta-card">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4" data-testid="cta-title">
                ¿Listo para transformar tu longevidad?
              </h3>
              <p className="text-primary-foreground/80 mb-6 text-lg" data-testid="cta-description">
                Únete a nuestra comunidad y comienza tu viaje hacia una vida más larga y saludable
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => window.location.href = '/register'}
                  data-testid="cta-register"
                >
                  Registrarse Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  onClick={() => window.location.href = '/contacto'}
                  data-testid="cta-contact"
                >
                  Contáctanos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}